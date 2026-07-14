'use client';

import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  FileSpreadsheet,
  Loader2,
  ReceiptText,
  Scale,
  Search,
  Upload,
  Users,
} from 'lucide-react';

type InvoiceType = 'kirim' | 'chiqim';

interface ParsedInvoice {
  id: string;
  type: InvoiceType;
  invoiceNum: string;
  date: string;
  partnerInn: string;
  partnerName: string;
  amount: number;
  status: string;
}

interface PartnerBalance {
  inn: string;
  name: string;
  kirim: number;
  chiqim: number;
  balance: number;
}

interface AstatkaSummary {
  totalKirim: number;
  totalChiqim: number;
  netBalance: number;
}

interface AstatkaResponse {
  success: boolean;
  error?: string;
  summary?: AstatkaSummary;
  partners?: PartnerBalance[];
  invoices?: ParsedInvoice[];
}

type TabKey = 'partners' | 'invoices';

const numberFormat = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 });

function formatAmount(value: number): string {
  return numberFormat.format(value);
}

function formatDate(iso: string): string {
  if (!iso) return '—';
  const [yyyy, mm, dd] = iso.split('-');
  return `${dd}.${mm}.${yyyy}`;
}

function FileInput({
  label,
  hint,
  file,
  onChange,
}: {
  label: string;
  hint: string;
  file: File | null;
  onChange: (file: File | null) => void;
}) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.files?.[0] ?? null);
  };

  return (
    <label className="group flex cursor-pointer flex-col gap-2 rounded-xl border border-dashed border-slate-700 bg-slate-900/60 p-4 transition hover:border-sky-500/60 hover:bg-slate-900">
      <span className="text-sm font-medium text-slate-300">{label}</span>
      <span className="flex items-center gap-2 text-sm">
        <FileSpreadsheet className="h-5 w-5 shrink-0 text-sky-400" />
        <span className={file ? 'truncate text-slate-100' : 'text-slate-500'}>{file ? file.name : hint}</span>
      </span>
      <input type="file" accept=".xls,.xlsx" className="hidden" onChange={handleChange} />
    </label>
  );
}

function SummaryCard({
  title,
  value,
  icon,
  tone,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  tone: 'kirim' | 'chiqim' | 'net';
}) {
  const valueColor =
    tone === 'kirim'
      ? 'text-emerald-400'
      : tone === 'chiqim'
        ? 'text-rose-400'
        : value >= 0
          ? 'text-emerald-400'
          : 'text-rose-400';

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
      <div className="flex items-center gap-2 text-sm text-slate-400">
        {icon}
        {title}
      </div>
      <p className={`mt-2 truncate text-2xl font-semibold tabular-nums ${valueColor}`}>{formatAmount(value)}</p>
      <p className="mt-1 text-xs text-slate-500">so&#699;m</p>
    </div>
  );
}

function BalanceBadge({ balance }: { balance: number }) {
  if (balance === 0) {
    return <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-400">Teng</span>;
  }
  return balance > 0 ? (
    <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-xs text-rose-400">Biz qarzdormiz</span>
  ) : (
    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-400">Bizga qarzdor</span>
  );
}

export default function AstatkaPage() {
  const [receivedFile, setReceivedFile] = useState<File | null>(null);
  const [sentFile, setSentFile] = useState<File | null>(null);
  const [data, setData] = useState<AstatkaResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<TabKey>('partners');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!receivedFile && !sentFile) return;

    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      if (receivedFile) formData.append('received', receivedFile);
      if (sentFile) formData.append('sent', sentFile);

      const res = await fetch('/api/calculate-astatka', { method: 'POST', body: formData });
      const json = (await res.json()) as AstatkaResponse;
      if (!res.ok || !json.success) {
        throw new Error(json.error ?? `So‘rov xatosi (${res.status})`);
      }
      setData(json);
      setQuery('');
    } catch (err) {
      setData(null);
      setError(err instanceof Error ? err.message : 'Noma’lum xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const normalizedQuery = query.trim().toLowerCase();

  const filteredPartners = useMemo(() => {
    const partners = data?.partners ?? [];
    if (!normalizedQuery) return partners;
    return partners.filter(
      (p) => p.name.toLowerCase().includes(normalizedQuery) || p.inn.includes(normalizedQuery),
    );
  }, [data, normalizedQuery]);

  const filteredInvoices = useMemo(() => {
    const invoices = data?.invoices ?? [];
    if (!normalizedQuery) return invoices;
    return invoices.filter(
      (inv) =>
        inv.partnerName.toLowerCase().includes(normalizedQuery) ||
        inv.partnerInn.includes(normalizedQuery) ||
        inv.invoiceNum.toLowerCase().includes(normalizedQuery),
    );
  }, [data, normalizedQuery]);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header>
          <h1 className="text-3xl font-bold tracking-tight">Astatka Kalkulyatori</h1>
          <p className="mt-2 text-sm text-slate-400">
            Kirim va chiqim faktura reestrlarini yuklang — kontragentlar bo&#699;yicha qoldiq avtomatik hisoblanadi.
            Faqat <span className="text-slate-200">«Подтверждён»</span> holatidagi fakturalar inobatga olinadi.
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 shadow-xl shadow-slate-950/40"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <FileInput
              label="Kirim (qabul qilingan fakturalar)"
              hint="factura_received…xls faylini tanlang"
              file={receivedFile}
              onChange={setReceivedFile}
            />
            <FileInput
              label="Chiqim (yuborilgan fakturalar)"
              hint="factura_sent…xls faylini tanlang"
              file={sentFile}
              onChange={setSentFile}
            />
          </div>
          <button
            type="submit"
            disabled={loading || (!receivedFile && !sentFile)}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {loading ? 'Hisoblanmoqda…' : 'Hisoblash'}
          </button>
        </form>

        {error && (
          <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
            {error}
          </div>
        )}

        {data?.summary && (
          <>
            <section className="grid gap-4 sm:grid-cols-3">
              <SummaryCard
                title="Jami Kirim"
                value={data.summary.totalKirim}
                tone="kirim"
                icon={<ArrowDownCircle className="h-4 w-4 text-emerald-400" />}
              />
              <SummaryCard
                title="Jami Chiqim"
                value={data.summary.totalChiqim}
                tone="chiqim"
                icon={<ArrowUpCircle className="h-4 w-4 text-rose-400" />}
              />
              <SummaryCard
                title="Sof Balans"
                value={data.summary.netBalance}
                tone="net"
                icon={<Scale className="h-4 w-4 text-sky-400" />}
              />
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-900/50">
              <div className="flex flex-col gap-4 border-b border-slate-800 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex rounded-lg bg-slate-800/70 p-1">
                  <button
                    type="button"
                    onClick={() => setTab('partners')}
                    className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition ${
                      tab === 'partners' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Users className="h-4 w-4" />
                    Kontragentlar Balansi
                    <span className="rounded-full bg-slate-950/40 px-2 text-xs">{filteredPartners.length}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTab('invoices')}
                    className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition ${
                      tab === 'invoices' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <ReceiptText className="h-4 w-4" />
                    Barcha Fakturalar
                    <span className="rounded-full bg-slate-950/40 px-2 text-xs">{filteredInvoices.length}</span>
                  </button>
                </div>

                <div className="relative sm:w-72">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Nomi, INN yoki faktura №…"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950/60 py-2 pl-9 pr-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                {tab === 'partners' ? (
                  <table className="w-full min-w-[720px] text-sm">
                    <thead>
                      <tr className="border-b border-slate-800 text-left text-xs uppercase tracking-wide text-slate-500">
                        <th className="px-4 py-3">#</th>
                        <th className="px-4 py-3">Kontragent</th>
                        <th className="px-4 py-3">INN / PINFL</th>
                        <th className="px-4 py-3 text-right">Kirim</th>
                        <th className="px-4 py-3 text-right">Chiqim</th>
                        <th className="px-4 py-3 text-right">Balans</th>
                        <th className="px-4 py-3">Holat</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPartners.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                            Hech narsa topilmadi
                          </td>
                        </tr>
                      ) : (
                        filteredPartners.map((partner, index) => (
                          <tr
                            key={partner.inn || partner.name}
                            className="border-b border-slate-800/60 transition hover:bg-slate-800/30"
                          >
                            <td className="px-4 py-3 text-slate-500">{index + 1}</td>
                            <td className="px-4 py-3 font-medium text-slate-100">{partner.name}</td>
                            <td className="px-4 py-3 tabular-nums text-slate-400">{partner.inn}</td>
                            <td className="px-4 py-3 text-right tabular-nums text-emerald-400">
                              {formatAmount(partner.kirim)}
                            </td>
                            <td className="px-4 py-3 text-right tabular-nums text-rose-400">
                              {formatAmount(partner.chiqim)}
                            </td>
                            <td
                              className={`px-4 py-3 text-right font-semibold tabular-nums ${
                                partner.balance > 0
                                  ? 'text-rose-400'
                                  : partner.balance < 0
                                    ? 'text-emerald-400'
                                    : 'text-slate-400'
                              }`}
                            >
                              {formatAmount(Math.abs(partner.balance))}
                            </td>
                            <td className="px-4 py-3">
                              <BalanceBadge balance={partner.balance} />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                ) : (
                  <table className="w-full min-w-[820px] text-sm">
                    <thead>
                      <tr className="border-b border-slate-800 text-left text-xs uppercase tracking-wide text-slate-500">
                        <th className="px-4 py-3">Turi</th>
                        <th className="px-4 py-3">Faktura №</th>
                        <th className="px-4 py-3">Sana</th>
                        <th className="px-4 py-3">Kontragent</th>
                        <th className="px-4 py-3">INN / PINFL</th>
                        <th className="px-4 py-3 text-right">Summa</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInvoices.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                            Hech narsa topilmadi
                          </td>
                        </tr>
                      ) : (
                        filteredInvoices.map((invoice) => (
                          <tr key={invoice.id} className="border-b border-slate-800/60 transition hover:bg-slate-800/30">
                            <td className="px-4 py-3">
                              {invoice.type === 'kirim' ? (
                                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-400">
                                  Kirim
                                </span>
                              ) : (
                                <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-xs text-rose-400">
                                  Chiqim
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 font-medium text-slate-100">{invoice.invoiceNum}</td>
                            <td className="px-4 py-3 tabular-nums text-slate-400">{formatDate(invoice.date)}</td>
                            <td className="px-4 py-3 text-slate-200">{invoice.partnerName}</td>
                            <td className="px-4 py-3 tabular-nums text-slate-400">{invoice.partnerInn}</td>
                            <td className="px-4 py-3 text-right font-medium tabular-nums text-slate-100">
                              {formatAmount(invoice.amount)}
                            </td>
                            <td className="px-4 py-3 text-xs text-slate-400">{invoice.status}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
