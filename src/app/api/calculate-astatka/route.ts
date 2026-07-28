import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { requireUser, type AuthError } from '@/lib/apiAuth';

export const runtime = 'nodejs';

const CONFIRMED_STATUS = 'Подтверждён';
const INVOICE_RE = /^(.+?)\s+от\s+(\d{2})\.(\d{2})\.(\d{4})\s*$/;

const COLS = {
  status: 'СТАТУС',
  invoice: 'СЧЁТ-ФАКТУРА',
  amount: 'СУММА К ОПЛАТЕ',
  id: 'ID',
  sellerInn: 'ПРОДАВЕЦ (ИНН ИЛИ ПИНФЛ)',
  sellerName: 'ПРОДАВЕЦ (НАИМЕНОВАНИЕ)',
  buyerInn: 'ПОКУПАТЕЛЬ (ИНН ИЛИ ПИНФЛ)',
  buyerName: 'ПОКУПАТЕЛЬ (НАИМЕНОВАНИЕ)',
} as const;

export type InvoiceType = 'kirim' | 'chiqim';

export interface ParsedInvoice {
  id: string;
  type: InvoiceType;
  invoiceNum: string;
  date: string;
  partnerInn: string;
  partnerName: string;
  amount: number;
  status: string;
}

export interface PartnerBalance {
  inn: string;
  name: string;
  kirim: number;
  chiqim: number;
  balance: number;
}

export interface AstatkaSummary {
  totalKirim: number;
  totalChiqim: number;
  netBalance: number;
}

export interface AstatkaResponse {
  success: boolean;
  error?: string;
  summary?: AstatkaSummary;
  partners?: PartnerBalance[];
  invoices?: ParsedInvoice[];
}

type ExcelRow = Record<string, unknown>;

function toText(value: unknown): string {
  return value === null || value === undefined ? '' : String(value).trim();
}

function toNumber(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const parsed = parseFloat(toText(value).replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseInvoiceRef(raw: string): { invoiceNum: string; date: string } {
  const match = raw.match(INVOICE_RE);
  if (!match) return { invoiceNum: raw, date: '' };
  const [, num, dd, mm, yyyy] = match;
  return { invoiceNum: num.trim(), date: `${yyyy}-${mm}-${dd}` };
}

function parseWorkbook(buffer: Buffer, type: InvoiceType): ParsedInvoice[] {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) return [];

  const rows = XLSX.utils.sheet_to_json<ExcelRow>(sheet, { defval: null });
  const innKey = type === 'kirim' ? COLS.sellerInn : COLS.buyerInn;
  const nameKey = type === 'kirim' ? COLS.sellerName : COLS.buyerName;

  const invoices: ParsedInvoice[] = [];
  rows.forEach((row, index) => {
    const status = toText(row[COLS.status]);
    if (status !== CONFIRMED_STATUS) return;

    const { invoiceNum, date } = parseInvoiceRef(toText(row[COLS.invoice]));
    invoices.push({
      id: toText(row[COLS.id]) || `${type}-${index}`,
      type,
      invoiceNum,
      date,
      partnerInn: toText(row[innKey]),
      partnerName: toText(row[nameKey]),
      amount: toNumber(row[COLS.amount]),
      status,
    });
  });
  return invoices;
}

export async function POST(
  request: NextRequest,
): Promise<NextResponse<AstatkaResponse> | AuthError> {
  const auth = await requireUser(request);
  if (!auth.ok) return auth.response;

  try {
    const formData = await request.formData();
    const received = formData.get('received');
    const sent = formData.get('sent');

    if (!(received instanceof File) && !(sent instanceof File)) {
      return NextResponse.json(
        { success: false, error: 'Kamida bitta fayl yuklang (kirim yoki chiqim)' },
        { status: 400 },
      );
    }

    const invoices: ParsedInvoice[] = [];
    if (received instanceof File) {
      invoices.push(...parseWorkbook(Buffer.from(await received.arrayBuffer()), 'kirim'));
    }
    if (sent instanceof File) {
      invoices.push(...parseWorkbook(Buffer.from(await sent.arrayBuffer()), 'chiqim'));
    }

    const partnerMap = new Map<string, PartnerBalance>();
    let totalKirim = 0;
    let totalChiqim = 0;

    for (const invoice of invoices) {
      const key = invoice.partnerInn || invoice.partnerName;
      let partner = partnerMap.get(key);
      if (!partner) {
        partner = { inn: invoice.partnerInn, name: invoice.partnerName, kirim: 0, chiqim: 0, balance: 0 };
        partnerMap.set(key, partner);
      }
      if (invoice.type === 'kirim') {
        partner.kirim += invoice.amount;
        totalKirim += invoice.amount;
      } else {
        partner.chiqim += invoice.amount;
        totalChiqim += invoice.amount;
      }
    }

    const partners = Array.from(partnerMap.values(), (p) => ({ ...p, balance: p.kirim - p.chiqim })).sort(
      (a, b) => Math.abs(b.balance) - Math.abs(a.balance),
    );

    invoices.sort((a, b) => b.date.localeCompare(a.date));

    return NextResponse.json({
      success: true,
      summary: { totalKirim, totalChiqim, netBalance: totalKirim - totalChiqim },
      partners,
      invoices,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Fayllarni qayta ishlashda xatolik' },
      { status: 500 },
    );
  }
}
