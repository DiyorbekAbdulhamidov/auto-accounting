// ============================================================
// КИРИМ СВЕРКАСИ — Тушган пул ↔ Ёзилган фактура
// ------------------------------------------------------------
// Илгари бу `app/income-audit/page.tsx` эди — мустақил саҳифа, ўз
// корхонасиз, чиқим сверкасидан бутунлай бошқача кўринишда. Энди
// компонент: битта корхона саҳифасида чиқим билан ЁНМА-ЁН таб.
//
// Саҳифа ўрами (`data-module="in"`, сарлавҳа) ота саҳифада:
// `app/korxonalar/[id]/page.tsx`.
// ============================================================
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { collection, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { INCOME_REPORTS } from "@/lib/workspace";
import {
  newestFirst,
  stampToDate,
  summarizeIncoming,
  formatStamp,
  type ReportSummary,
} from "@/lib/reportHistory";
import ReportHistory from "@/components/reconciliation/ReportHistory";
import {
  mergeIncomingRows,
  type MergeGroup,
  type MergeSuggestion,
} from "@/lib/counterpartyMerge";
import MergeModal, { type MergeRow } from "@/components/reconciliation/MergeModal";
import {
  EMPTY_BALANCES,
  loadOpeningBalances,
  saveOpeningBalances,
  type OpeningBalances,
} from "@/lib/openingBalance";
import OpeningBalanceModal from "@/components/reconciliation/OpeningBalanceModal";
import OpenInvoices from "@/components/reconciliation/OpenInvoices";
import { buildIncomeWorkbook } from "@/lib/incomeExcel";
import { authFetch } from "@/lib/authFetch";
import { buildReconciliationActWorkbook } from "@/lib/reconciliationAct";
import { saveAs } from "file-saver";
import {
  Banknote,
  CalendarClock,
  CalendarDays,
  CalendarRange,
  ChevronDown,
  Download,
  FileText,
  Save,
  Hourglass,
  Merge,
  Receipt,
  Table2,
} from "lucide-react";
import SortHeader from "@/components/SortHeader";
import { useT } from "@/context/LanguageContext";
import QuotaWall, { type QuotaState } from "./QuotaWall";
import { buildAging, BUCKET_KEYS, type BucketKey } from "@/lib/aging";
import {
  Alert,
  Badge,
  Button,
  Card,
  Checkbox,
  Code,
  FileDrop,
  Modal,
  Num,
  NumTd,
  RowCheckbox,
  SearchInput,
  Select,
  SumStrip,
  SumCell,
  Table,
  TableFrame,
  Tabs,
  Tbody,
  Td,
  Tfoot,
  Th,
  Thead,
  Tr,
  cx,
  notify,
  tableCls,
  toneText,
  type TabItem,
  type Tone,
} from "@/components/ui";

interface PaymentRec {
  date: string | null;
  amount: number;
  doc: string;
  purpose: string;
}
interface InvoiceRec {
  date: string | null;
  number: string;
  amount: number;
}
interface MonthBucket {
  credit: number;
  factura: number;
}
interface PartyRow {
  key: string;
  inn: string;
  name: string;
  aliases: string[];
  bankCredit: number;
  facturaSent: number;
  difference: number;
  monthly: Record<string, MonthBucket>;
  payments: PaymentRec[];
  invoices: InvoiceRec[];
  /** Қўлда бирлаштирилган бўлса — қайси калитлардан йиғилгани.
   *  `src/lib/counterpartyMerge.ts` */
  mergedFrom?: string[];
}
interface IncomeResponse {
  success: boolean;
  parties: PartyRow[];
  totals: { bankCredit: number; facturaSent: number; difference: number; bankDebit: number };
  meta: {
    ownInn: string;
    ownName: string;
    bankSheets: string[];
    facturaSheets: string[];
    bankRowCount: number;
    bankCreditRaw: number;
    invoiceCount: number;
    skippedInvoices: { status: string; count: number; amount: number }[];
    byYear: { year: string; bankCredit: number; facturaSent: number; difference: number }[];
    periodFrom: string | null;
    periodTo: string | null;
    warnings: string[];
  };
}

/** Firestore'da saqlanadigan kirim hisoboti */
interface SavedIncomeReport {
  companyId: string;
  workspaceId: string;
  includePending?: boolean;
  /** Қўлда бирлаштирилган гуруҳлар. Илгари САҚЛАНМАСДИ: сақланган
   *  ҳисоботни очганда жадвал бирлашган ҳолда келарди, лекин
   *  «Бирлаштириш» ойнаси бўш кўринарди — бухгалтер ажратолмасди. */
  merges?: MergeGroup[];
  report: IncomeResponse;
  savedAt?: { toMillis: () => number; toDate: () => Date };
}

/** Firestore hujjati + o'z identifikatori (tarix ro'yxati uchun) */
type SavedIncomeDoc = SavedIncomeReport & { id: string };

const MONTH_NAMES = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
];

function periodLabel(period: string): string {
  const [y, m] = period.split("-").map(Number);
  if (!y || !m) return period;
  return `${MONTH_NAMES[m - 1] || m} ${y}`;
}

function fmt(num: number): string {
  return (num || 0).toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

// ФАРҚ = ЁЗИЛГАН ФАКТУРА − ТУШГАН ПУЛ (сальдо, `incomeParser.ts`).
//
//   > 0  фактура ёзилган, пул келмаган -> МИЖОЗ ҚАРЗДОР
//   < 0  пул келган, фактура ёзилмаган -> фактура ёзиш керак
//
// Чиқим сверкаси билан битта қоида: МУСБАТ = улар қарздор.
//
// Ранг эса ишорага эмас, НИМА ЕТИШМАЁТГАНига қараб танланади ва
// иккала сверкада ҳам бир хил:
//   `bad`  — ПУЛ етишмаяпти (қарз)
//   `warn` — ҚОҒОЗ етишмаяпти (фактура ёзиш/сўраш керак)
// Шунинг учун кирим ва чиқимда бир хил ишора ҳар хил рангда бўлиши
// мумкин — маъноси ҳар хил, ранг эса маънони кўрсатади.
function verdict(diff: number): { text: string; tone: Tone } {
  if (diff > 0.01) return { text: "Бизга қарздор", tone: "bad" };
  if (diff < -0.01) return { text: "Ҳисоб фактура ёзиш керак", tone: "warn" };
  return { text: "-", tone: "muted" };
}

/** ЯКУНИЙ рақамнинг ранги. Нол — «фарқ йўқ», яъни ЯХШИ хабар:
 *  ўша ҳолда «ok» (яшил). Илгари бу қоида фақат тепадаги катта
 *  картада бор эди — АЙНИ ШУ рақам фильтр қаторида ва жадвал остида
 *  кулранг («muted») чиқарди.
 *
 *  ҚАТОР даражасида эса `verdict` ўзгармайди: 128 та қаторнинг
 *  ярмини яшил бўяш жадвални шовқинга айлантиради, у ерда «-» етади. */
function totalTone(diff: number): Tone {
  return Math.abs(diff) <= 0.01 ? "ok" : verdict(diff).tone;
}

/** БЎШ ЖАДВАЛ ҚАТОРИ.
 *  Илгари фақат «Сверка» табида бор эди: қолган бешталари бўшлигида
 *  сарлавҳа + нол якун бўлиб турарди ва бухгалтер «файл ўқилмади»
 *  деб ўйлаши мумкин эди. Чиқим сверкасида бу аллақачон бор. */
function EmptyRow({ cols, text }: { cols: number; text: string }) {
  return (
    <tr>
      <td colSpan={cols} className="p-12 text-center text-body text-ink-3">
        {text}
      </td>
    </tr>
  );
}

type SortKey = "name" | "inn" | "credit" | "factura" | "diff";
type SortDir = "asc" | "desc";
type FilterKind = "ALL" | "DIFF" | "NO_INVOICE" | "UNPAID" | "EQUAL";
type TabKey = "RECONCILIATION" | "YEARS" | "MONTHLY" | "PAYMENTS" | "INVOICES" | "AGING";

// Қарздорлик ёши гуруҳлари
const BUCKET_LABELS: Record<BucketKey, string> = {
  d0_30: "0–30 кун",
  d31_60: "31–60 кун",
  d61_90: "61–90 кун",
  d90plus: "90+ кун",
  noDate: "Санасиз",
};

// Ёш ошгани сайин ранг «яхши»дан «ёмон»га ўтади — бухгалтер
// жадвални ўқимасдан ҳам қаерда муаммо борлигини кўради.
const BUCKET_TONES: Record<BucketKey, Tone> = {
  d0_30: "ok",
  d31_60: "warn",
  d61_90: "warn",
  d90plus: "bad",
  noDate: "muted",
};

const NO_DATE = "Санасиз";

function yearOfPeriod(period: string): string {
  return /^\d{4}-\d{2}$/.test(period) ? period.slice(0, 4) : NO_DATE;
}
function monthOfPeriod(period: string): string {
  return /^\d{4}-\d{2}$/.test(period) ? MONTH_NAMES[Number(period.slice(5, 7)) - 1] : "—";
}
function yearOfDate(iso: string | null): string {
  return iso && /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso.slice(0, 4) : "—";
}
function monthOfDate(iso: string | null): string {
  return iso && /^\d{4}-\d{2}-\d{2}$/.test(iso) ? MONTH_NAMES[Number(iso.slice(5, 7)) - 1] : "—";
}
// Фирманинг маълум йилдаги суммалари
function yearOf(p: PartyRow, year: string) {
  let credit = 0;
  let factura = 0;
  for (const [period, b] of Object.entries(p.monthly)) {
    if (yearOfPeriod(period) === year) {
      credit += b.credit;
      factura += b.factura;
    }
  }
  return { credit, factura, diff: factura - credit };
}

export default function IncomingReconciliation({
  companyId,
  companyName,
}: {
  /** Natijani QAYSI korxonaga yozish kerakligi. Ilgari bu prop YO'Q
   *  edi — shuning uchun kirim sverkasi hech narsa saqlay olmasdi. */
  companyId: string;
  companyName: string;
}) {
  const t = useT();
  // Har o'qish/yozish ish maydoniga bog'lanadi (src/lib/workspace.ts)
  const { user } = useAuth();
  const workspaceId: string | undefined = user?.workspaceId;

  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<IncomeResponse | null>(null);
  const [error, setError] = useState("");
  /** Oylik sverka safi tugagani. `null` — devor yo'q. */
  const [quotaWall, setQuotaWall] = useState<QuotaState | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  /** Ekrandagi natija saqlangan hisobotdan tiklanganmi */
  const [restoredAt, setRestoredAt] = useState<string | null>(null);
  // Saqlangan hisobotlar TARIXI. Ro'yxat tiklash so'rovi allaqachon
  // yuklab olgan snapshot'dan tuziladi — qo'shimcha o'qish YO'Q.
  const [savedDocs, setSavedDocs] = useState<SavedIncomeDoc[]>([]);
  const [activeReportId, setActiveReportId] = useState<string | null>(null);
  // Қўлда бирлаштирилган контрагентлар (`counterpartyMerge.ts`)
  const [merges, setMerges] = useState<MergeGroup[]>([]);
  const [mergeSuggestions, setMergeSuggestions] = useState<MergeSuggestion[]>([]);
  const [mergeOpen, setMergeOpen] = useState(false);

  // 📅 Boshlang'ich qoldiq — `src/lib/openingBalance.ts` ga qarang
  const [opening, setOpening] = useState<OpeningBalances>(EMPTY_BALANCES);
  const [balanceOpen, setBalanceOpen] = useState(false);
  const [savingBalances, setSavingBalances] = useState(false);
  // «Ожидает подписи партнёра» — имзоланмаган фактура одатда
  // ҳисобланмайди. Чиқим сверкасида бу тугма бор эди, кирим тарафда
  // сервер уни аллақачон қабул қиларди, лекин экранда ЙЎҚ эди.
  const [includePending, setIncludePending] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterKind, setFilterKind] = useState<FilterKind>("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("credit");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [expanded, setExpanded] = useState<string[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [tab, setTab] = useState<TabKey>("RECONCILIATION");


  // 📄 АКТ СВЕРКИ — битта фирма учун (файлда фақат жадвал бўлади)
  const [actParty, setActParty] = useState<PartyRow | null>(null);

  // ============================================================
  // SAQLANGAN HISOBOTNI TIKLASH
  // ------------------------------------------------------------
  // Chiqim tomonidagi bilan bir xil naqsh: ish maydoni filtri SHART
  // (Firestore qoidasi so'rovni hujjatlarni o'qimasdan tekshiradi,
  // filtrsiz so'rov butunlay rad etiladi), saralash esa klientda —
  // shunda `savedAt` uchun qo'shimcha indeks kerak bo'lmaydi.
  // ============================================================
  useEffect(() => {
    let alive = true;
    async function restore() {
      if (!companyId || !workspaceId) return;
      try {
        const snap = await getDocs(
          query(
            collection(db, INCOME_REPORTS),
            where("workspaceId", "==", workspaceId),
            where("companyId", "==", companyId)
          )
        );
        if (!alive || snap.empty) return;
        // Snapshot BUTUNLAY saqlanadi: tarix ro'yxati aynan shundan
        // tuziladi, ya'ni ikkinchi so'rov qilinmaydi.
        const docs = newestFirst(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as SavedIncomeReport) }))
        );
        setSavedDocs(docs);
        const latest = docs[0];
        if (!latest?.report?.parties?.length) return;
        setReport(latest.report);
        setSelectedKeys(latest.report.parties.map((x) => x.key));
        setIncludePending(latest.includePending === true);
        setMerges(latest.merges || []);
        setActiveReportId(latest.id);
        setRestoredAt(formatStamp(stampToDate(latest.savedAt)));
      } catch (err) {
        // Tiklanmasa ish TO'XTAMAYDI — foydalanuvchi faylni qayta
        // yuklay oladi. Lekin xato jim ketmasin.
        console.error("Kirim hisobotini tiklashda xatolik:", err);
      }
    }
    restore();
    return () => {
      alive = false;
    };
  }, [companyId, workspaceId]);

  // Saqlangan qoldiqlar. Xato bo'lsa ish TO'XTAMAYDI — sverka
  // qoldiqsiz ham to'g'ri hisoblanadi.
  useEffect(() => {
    let alive = true;
    async function load() {
      if (!companyId || !workspaceId) return;
      try {
        const b = await loadOpeningBalances(workspaceId, companyId, "in");
        if (alive) setOpening(b);
      } catch (err) {
        console.error("Boshlang'ich qoldiqni o'qishda xatolik:", err);
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, [companyId, workspaceId]);

  // ============================================================
  // HISOBOT TARIXI
  // ------------------------------------------------------------
  // Eski hisobotni ochish YANGI SO'ROV qilmaydi — hujjat allaqachon
  // `savedDocs` da. O'chirish esa kolleksiyaning cheksiz o'sishini
  // to'xtatadi (har «Сақлаш» yangi hujjat yaratadi).
  // ============================================================
  const history: ReportSummary[] = useMemo(
    () => savedDocs.map((d) => summarizeIncoming(d.id, d)),
    [savedDocs]
  );

  const handleOpenSaved = (id: string) => {
    const d = savedDocs.find((x) => x.id === id);
    if (!d?.report?.parties?.length) {
      notify.warn(t("Бу ҳисоботда контрагент йўқ."));
      return;
    }
    setReport(d.report);
    setSelectedKeys(d.report.parties.map((x) => x.key));
    setIncludePending(d.includePending === true);
    setMerges(d.merges || []);
    setActiveReportId(d.id);
    setRestoredAt(formatStamp(stampToDate(d.savedAt)));
  };

  const handleDeletedReport = (id: string) => {
    setSavedDocs((prev) => prev.filter((x) => x.id !== id));
    // Ekranda turgani o'chirilsa — raqamlar qoladi, lekin ular endi
    // saqlanmagan. Buni AYTISH shart, aks holda buxgalter «saqlangan»
    // deb o'ylab yuradi.
    if (activeReportId === id) {
      setActiveReportId(null);
      setRestoredAt(null);
    }
  };

  // ============================================================
  // BIRLASHTIRISH
  // ------------------------------------------------------------
  // Chiqim tomonidagi bilan bir xil naqsh: saqlangandan keyin jadval
  // DARHOL yangilanadi (klientda ham server bilan aynan bir xil
  // funksiya ishlaydi), ajratish esa faylni qayta yuklashni talab
  // qiladi va bu foydalanuvchiga AYTILADI.
  // ============================================================
  const mergeRows: MergeRow[] = useMemo(
    () =>
      (report?.parties || []).map((p) => ({
        key: p.key,
        inn: p.inn,
        name: p.name,
        turnover: p.bankCredit + p.facturaSent,
        mergedFrom: p.mergedFrom,
      })),
    [report]
  );

  const handleMerged = (group: MergeGroup) => {
    setMerges((prev) => [...prev.filter((g) => g.primary !== group.primary), group]);
    setReport((prev) =>
      prev ? { ...prev, parties: mergeIncomingRows(prev.parties, [group]) } : prev
    );
    setSelectedKeys((prev) => {
      const gone = new Set(group.members);
      const kept = prev.filter((k) => !gone.has(k));
      return prev.some((k) => gone.has(k)) ? [...new Set([...kept, group.primary])] : kept;
    });
    setMergeSuggestions((prev) =>
      prev.filter((sug) => !sug.keys.some((k) => group.members.includes(k) || k === group.primary))
    );
  };

  const handleUnmerged = (primary: string) => {
    setMerges((prev) => prev.filter((g) => g.primary !== primary));
  };

  const handleSaveBalances = async (asOf: string, balances: Record<string, number>) => {
    if (!workspaceId) {
      notify.error(t("Иш майдони аниқланмади. Тизимдан чиқиб, қайта киринг."));
      return;
    }
    setSavingBalances(true);
    try {
      const id = await saveOpeningBalances(workspaceId, companyId, "in", asOf, balances, opening.id);
      setOpening({ id, asOf, balances });
      setBalanceOpen(false);
      notify.ok(t("Бошланғич қолдиқ сақланди"));
    } catch (err) {
      console.error("Boshlang'ich qoldiqni saqlashda xatolik:", err);
      notify.error(
        t("Сақлашда хатолик юз берди."),
        err instanceof Error ? err.message : String(err)
      );
    } finally {
      setSavingBalances(false);
    }
  };

  // ============================================================
  // SAQLASH
  // ------------------------------------------------------------
  // Firestore hujjati 1 MB dan oshmaydi. `parties` ichida har
  // kontragentning to'lov va faktura RO'YXATI bor — akt sverki
  // aynan shundan tuziladi, ya'ni uni tashlab bo'lmaydi. Shuning
  // uchun hajm OLDINDAN o'lchanadi va oshsa aniq xabar beriladi
  // (Firestore'ning o'z xatosi tushunarsiz bo'lardi).
  // ============================================================
  const handleSave = async () => {
    if (!report) return;
    if (!workspaceId) {
      notify.error(t("Иш майдони аниқланмади. Тизимдан чиқиб, қайта киринг."));
      return;
    }

    const payload = {
      companyId,
      workspaceId,
      includePending,
      merges,
      report,
    };
    const bytes = new TextEncoder().encode(JSON.stringify(payload)).length;
    const LIMIT = 900_000; // 1 MB dan zaxira bilan pastda
    if (bytes > LIMIT) {
      notify.error(
        t("Ҳисобот жуда катта — сақлаб бўлмади"),
        `${Math.round(bytes / 1024)} КБ · ${t("чегара")} ${Math.round(LIMIT / 1024)} КБ. ${t("Даврни қисқартириб қайта юкланг.")}`
      );
      return;
    }

    setIsSaving(true);
    try {
      const ref = await addDoc(collection(db, INCOME_REPORTS), {
        ...payload,
        savedAt: serverTimestamp(),
      });
      // `serverTimestamp()` klientda hali BO'SH — tarix qatori sanasiz
      // chiqmasligi uchun mahalliy vaqt qo'yiladi. Sahifa qayta
      // ochilganda server sanasi keladi (farq bir necha soniya).
      const now = new Date();
      const localStamp = { toMillis: () => now.getTime(), toDate: () => now };
      setSavedDocs((prev) => newestFirst([{ id: ref.id, ...payload, savedAt: localStamp }, ...prev]));
      setActiveReportId(ref.id);
      notify.ok(t("Муваффақиятли сақланди!"));
      setRestoredAt(null);
    } catch (err) {
      console.error("Kirim hisobotini saqlashda xatolik:", err);
      notify.error(
        t("Сақлашда хатолик юз берди."),
        err instanceof Error ? err.message : String(err)
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) {
      setError(t("Камида битта файл танланг: банк кўчирмаси ва/ёки юборилган фактуралар реестри."));
      return;
    }

    setLoading(true);
    setError("");
    const formData = new FormData();
    files.forEach((f) => formData.append("files", f));
    formData.append("includePending", includePending ? "true" : "false");
    // Бирлаштириш гуруҳлари КОРХОНА даражасида сақланади — сервер
    // қайси корхона эканини билиши керак.
    formData.append("companyId", companyId);

    try {
      const res = await authFetch("/api/income-audit", { method: "POST", body: formData });
      const data = await res.json();
      // 402 — xato emas, HOLAT: oylik saf tugadi.
      if (res.status === 402 && data.quotaReached) {
        setReport(null);
        setError("");
        setQuotaWall({ used: Number(data.used) || 0, limit: data.limit ?? null, plan: String(data.plan || "free") });
        return;
      }
      setQuotaWall(null);
      if (data.success) {
        const parsed = data as IncomeResponse;
        setReport(parsed);
        setRestoredAt(null);
        setActiveReportId(null);
        setExpanded([]);
        setSelectedKeys(parsed.parties.map((p) => p.key));
        setMerges(data.merges || []);
        setMergeSuggestions(data.mergeSuggestions || []);
      } else {
        setReport(null);
        setError(data.error ? t(data.error) : t("Номаълум хатолик юз берди."));
      }
    } catch (err) {
      console.error(err);
      setError(t("Сервер билан уланишда хатолик!"));
    } finally {
      setLoading(false);
    }
  };

  const rows = useMemo(() => {
    if (!report) return [];
    const q = searchTerm.toLowerCase().trim();

    const filtered = report.parties.filter((p) => {
      if (q) {
        const hay = `${p.name} ${p.inn} ${p.aliases.join(" ")}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      switch (filterKind) {
        case "DIFF":
          return Math.abs(p.difference) > 0.01;
        case "NO_INVOICE":
          return p.bankCredit > 0 && p.facturaSent <= 0.01;
        case "UNPAID":
          return p.facturaSent > 0 && p.bankCredit <= 0.01;
        case "EQUAL":
          return Math.abs(p.difference) <= 0.01;
        default:
          return true;
      }
    });

    const dir = sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      switch (sortKey) {
        case "name":
          return dir * a.name.localeCompare(b.name, "ru");
        case "inn":
          return dir * a.inn.localeCompare(b.inn);
        case "credit":
          return dir * (a.bankCredit - b.bankCredit);
        case "factura":
          return dir * (a.facturaSent - b.facturaSent);
        case "diff":
          return dir * (a.difference - b.difference);
        default:
          return 0;
      }
    });
  }, [report, searchTerm, filterKind, sortKey, sortDir]);

  // Экспорт ва «ЖАМИ» фақат белгиланган (checkbox) қаторлардан ҳисобланади
  const displayRows = useMemo(
    () => rows.filter((p) => selectedKeys.includes(p.key)),
    [rows, selectedKeys]
  );

  const shown = useMemo(
    () =>
      displayRows.reduce(
        (acc, p) => {
          acc.credit += p.bankCredit;
          acc.factura += p.facturaSent;
          acc.diff += p.difference;
          return acc;
        },
        { credit: 0, factura: 0, diff: 0 }
      ),
    [displayRows]
  );

  // ҲАММА контрагент бўйича якун — фильтр ва птичкадан қатъи назар.
  // Чиқим сверкасида бу аллақачон бор эди: тепадаги катта рақам ҳар
  // доим ТЎЛИҚ бўлиши керак, акс ҳолда фойдаланувчи битта птичкани
  // олиб қўйиб, «сумма камайиб қолди» деб ўйлайди.
  const allTotals = useMemo(() => {
    const acc = { credit: 0, factura: 0, diff: 0, count: 0, withDiff: 0 };
    for (const p of report?.parties ?? []) {
      acc.credit += p.bankCredit;
      acc.factura += p.facturaSent;
      acc.count++;
      if (Math.abs(p.difference) > 0.01) acc.withDiff++;
    }
    acc.diff = acc.factura - acc.credit;
    return acc;
  }, [report]);

  // ⏳ ҚАРЗДОРЛИК ЁШИ — фактураларни FIFO билан тўловларга ёпиб, қолдиқни ёшга ажратади.
  //
  // ҲИСОБ САНАСИ. Илгари у фақат ТЎЛОВлардан олинарди
  // (`meta.periodTo`). Тўлов бўлмаса ёки саналари ўқилмаса қиймат
  // `null` бўлиб, `buildAging` БУГУНни оларди — яъни САҚЛАНГАН
  // ҳисоботни уч ойдан кейин очганда ўша-ўша фактуралар бошқа ёш
  // кўрсатарди ва «90+» гуруҳи ўзидан ўзи ўсарди. Энди фактура
  // саналари ҳам ҳисобга олинади: сана бор экан, натижа ҚОТАДИ.
  const agingAsOf = useMemo(() => {
    let last = report?.meta.periodTo ?? null;
    for (const p of report?.parties ?? []) {
      for (const inv of p.invoices) {
        if (inv.date && (!last || inv.date > last)) last = inv.date;
      }
    }
    return last;
  }, [report]);

  const aging = useMemo(() => buildAging(displayRows, agingAsOf), [displayRows, agingAsOf]);

  const allShownSelected = rows.length > 0 && rows.every((p) => selectedKeys.includes(p.key));

  const toggleSelection = (key: string) =>
    setSelectedKeys((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

  const toggleAll = () => {
    const keys = rows.map((p) => p.key);
    if (allShownSelected) setSelectedKeys((prev) => prev.filter((k) => !keys.includes(k)));
    else setSelectedKeys((prev) => Array.from(new Set([...prev, ...keys])));
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir(key === "name" || key === "inn" ? "asc" : "desc");
    }
  };

  const toggleExpand = (key: string) =>
    setExpanded((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

  // ---- ТАБЛАР УЧУН МАЪЛУМОТ (Excel варақлари билан бир хил) ----
  /** ЁПИЛМАГАН ФАКТУРАЛАР — ҲАММА контрагент бўйича, птичкадан
   *  ҚАТЪИ НАЗАР.
   *
   *  Илгари бу харита `aging` дан олинарди, `aging` эса фақат
   *  БЕЛГИЛАНГАН қаторлардан қурилади. Жадвал эса белгиланмаганини
   *  ҳам чизади — натижада птичкаси олинган қаторни «Очиш» босилса
   *  «✓ Ёпилмаган фактура йўқ» деган ЁЛҒОН чиқарди. Чиқим
   *  сверкасида бу тўғри эди (`openInvoicesByKey` — ҳамма қатордан).
   *
   *  `aging` ЎЗГАРМАЙДИ: тепадаги «Қарз ёши» таби ва ЖАМИ рақамлари
   *  птичкага боғлиқ бўлиб қолади. */
  const openInvoicesByKey = useMemo(() => {
    const all = buildAging(report?.parties ?? [], agingAsOf);
    return new Map(all.parties.map((x) => [x.key, x.openInvoices]));
  }, [report, agingAsOf]);

  const yearKeys = useMemo(() => (report ? report.meta.byYear.map((y) => y.year) : []), [report]);

  const monthlyRows = useMemo(
    () =>
      displayRows.flatMap((p) =>
        Object.keys(p.monthly)
          .sort()
          .map((period) => ({
            name: p.name,
            inn: p.inn,
            year: yearOfPeriod(period),
            month: monthOfPeriod(period),
            credit: p.monthly[period].credit,
            factura: p.monthly[period].factura,
            diff: p.monthly[period].factura - p.monthly[period].credit,
          }))
      ),
    [displayRows]
  );

  const paymentRows = useMemo(() => {
    const list = displayRows.flatMap((p) =>
      p.payments.map((pay) => ({
        ...pay,
        name: p.name,
        inn: p.inn,
        year: yearOfDate(pay.date),
        month: monthOfDate(pay.date),
      }))
    );
    list.sort((a, b) => (a.date || "").localeCompare(b.date || "") || a.name.localeCompare(b.name, "ru"));
    return list;
  }, [displayRows]);

  const invoiceRows = useMemo(() => {
    const list = displayRows.flatMap((p) =>
      p.invoices.map((inv) => ({
        ...inv,
        name: p.name,
        inn: p.inn,
        year: yearOfDate(inv.date),
        month: monthOfDate(inv.date),
      }))
    );
    list.sort((a, b) => (a.date || "").localeCompare(b.date || "") || a.name.localeCompare(b.name, "ru"));
    return list;
  }, [displayRows]);

  const openAct = (p: PartyRow) => setActParty(p);

  const handleActDownload = async () => {
    if (!actParty || !report) return;
    // Ўз номи: файлдан аниқланса ўша, аниқланмаса — саҳифадаги корхона.
    // Илгари захира қиймат «Бизнинг корхона» деган умумий матн эди.
    // Бошланғич қолдиқ КИРИТИЛГАН бўлса — актга ўша қиймат кетади.
    // Киритилмаган бўлса `undefined` қолади ва ҳужжат остига
    // «сальдо начальное киритилмаган» изоҳи чиқади. Иккинчи ҳолда
    // акт «нол эди» деб ЁЛҒОН айтмайди.
    const saved = opening.balances[actParty.key];
    // КИРИМ (харидор, 4010 актив): биз ёзган фактура — ДЕБЕТ,
    // келган пул — КРЕДИТ. Сальдо = фактура − пул, яъни мусбат
    // бўлса мижоз қарздор (HANDOFF 8-бўлим).
    const wb = buildReconciliationActWorkbook({
      name: actParty.name,
      inn: actParty.inn,
      debitTotal: actParty.facturaSent,
      creditTotal: actParty.bankCredit,
      debitDocs: actParty.invoices.map((i) => ({
        date: i.date,
        number: i.number,
        amount: i.amount,
      })),
      creditDocs: actParty.payments.map((p) => ({
        date: p.date,
        number: p.doc || "",
        amount: p.amount,
      })),
    }, {
      ownName: report.meta.ownName || companyName,
      openingBalance: saved === undefined ? undefined : saved,
      periodLabel:
        report.meta.periodFrom && report.meta.periodTo
          ? `${fmtDate(report.meta.periodFrom)} — ${fmtDate(report.meta.periodTo)}`
          : undefined,
    });
    const buffer = await wb.xlsx.writeBuffer();
    const safe = actParty.name.replace(/[^A-Za-zА-Яа-я0-9]+/g, "_").slice(0, 40);
    saveAs(
      new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
      `Akt_sverki_${safe}.xlsx`
    );
    setActParty(null);
  };

  /* ЭКРАНДАГИ АКТ = ЮКЛАБ ОЛИНАДИГАН АКТ.
     ------------------------------------------------------------
     `reconciliationAct.ts` да «Сальдо конечное» = бошланғич қолдиқ +
     дебет − кредит. Экрандаги ойна фақат давр ҳаракатини кўрсатарди,
     яъни қолдиқ киритилган контрагентда экран ва ҳужжат ўша қолдиққа
     фарқ қиларди (чиқим сверкасида 2026-08-19 да ўлчанган, бу ерда ҳам
     худди шу код). Иккиси энди бир манбадан ҳисобланади.

     Асосий жадвалдаги «Фарқ» ЎЗГАРМАЙДИ — қолдиқ унга қўшилмайди. */
  const actOpening = actParty ? opening.balances[actParty.key] : undefined;
  const actSaldo = (actOpening ?? 0) + (actParty?.difference ?? 0);

  // ТАБ ЁНИДАГИ СОН = ЎША ТАБДА НЕЧТА ҚАТОР ЧИЗИЛИШИ.
  // Илгари учтаси бошқа нарсани санарди: «Сверка» БЕЛГИЛАНГАНларни
  // санаб, ФИЛЬТРЛАНГАНларни чизарди (птичка олинса сон тушиб,
  // қатор жойида қоларди); «Йиллар» қатор эмас, ЙИЛ сонини;
  // «Қарз ёши» фақат қарздорларни санаб, ҳаммасини чизарди.
  const TABS: TabItem<TabKey>[] = [
    { key: "RECONCILIATION", label: t("Сверка"), icon: Table2, count: rows.length },
    { key: "YEARS", label: t("Йиллар"), icon: CalendarRange, count: displayRows.length },
    { key: "MONTHLY", label: t("Ойма-ой"), icon: CalendarDays, count: monthlyRows.length },
    { key: "PAYMENTS", label: t("Тўловлар"), icon: Banknote, count: paymentRows.length },
    { key: "INVOICES", label: t("Фактуралар"), icon: Receipt, count: invoiceRows.length },
    { key: "AGING", label: t("Қарз ёши"), icon: Hourglass, count: aging.parties.length },
  ];

  // 📈 EXCEL EXPORT — 6 варақли ҳисобот (src/lib/incomeExcel.ts)
  const handleExport = async () => {
    if (!report || displayRows.length === 0) {
      setError(t("Рўйхат бўш. Камида битта контрагентни белгиланг!"));
      return;
    }
    const today = new Date().toLocaleDateString("ru-RU");
    const years = report.meta.byYear.map((y) => y.year).filter((y) => /^\d{4}$/.test(y));
    // Ҳисоб санаси экрандагиси билан БИР ХИЛ узатилади — акс ҳолда
    // файлдаги «Қарз ёши» варағи бошқа кунга ҳисобланиб қоларди.
    const wb = buildIncomeWorkbook(report, displayRows, shown, today, agingAsOf);
    const buffer = await wb.xlsx.writeBuffer();
    const safe = companyName.replace(/[^A-Za-zА-Яа-я0-9]+/g, "_").slice(0, 40);
    saveAs(
      new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
      `Kirim_sverka_${safe}_${years.length ? years.join("_") : today}.xlsx`
    );
  };

  return (
    <div className="space-y-6">
      {/* 📤 ЮКЛАШ */}
      <Card>
        <p className="text-body text-ink-2">
          {t("Ҳисобингизга ТУШГАН пул ↔ сиз ЁЗГАН фактуралар. Банк кўчирмаси ва E-фактурадан юкланган «юборилган фактуралар» файлини бирга танланг.")}
        </p>

        <form onSubmit={handleUpload} className="mt-4 flex flex-col gap-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-stretch">
            <FileDrop
              className="w-full md:w-3/4"
              files={files}
              onFiles={setFiles}
              label={t("Банк кўчирмаси + фактура реестрини танланг")}
              hint={t(".xls, .xlsx, .csv — бир нечта файлни бирга юкласа бўлади")}
              selectedLabel={`${files.length} ${t("та файл танланди")}`}
            />
            <Button type="submit" variant="primary" loading={loading} className="md:w-1/4">
              {loading ? t("Ўқилмоқда...") : t("Ҳисоблаш")}
            </Button>
          </div>

          <Checkbox
            checked={includePending}
            onChange={setIncludePending}
            label={t("Имзо кутилаётган фактураларни ҳам ҳисоблаш")}
            hint={t("— одатда ҳисобланмайди (имзоланмаган фактура кучга кирмаган)")}
          />

          {quotaWall && <QuotaWall quota={quotaWall} />}
          {error && <Alert tone="bad">{error}</Alert>}

          {report && (
            <div className="flex flex-wrap items-center gap-2">
              {report.meta.bankSheets.map((s) => (
                <Badge key={s} tone="cash">
                  🏦 {s}
                </Badge>
              ))}
              {report.meta.facturaSheets.map((s) => (
                <Badge key={s} tone="invoice">
                  🧾 {s}
                </Badge>
              ))}
              {report.meta.ownInn !== "-" && (
                <Badge tone="muted">
                  {t("Ўз СТИР")}: {report.meta.ownInn}
                </Badge>
              )}
              {report.meta.periodFrom && (
                <Badge tone="muted">
                  {t("Давр")}: {fmtDate(report.meta.periodFrom)} — {fmtDate(report.meta.periodTo)}
                </Badge>
              )}
              {/* Экрандаги натижа ФАЙЛдан эмас, САҚЛАНГАН ҳисоботдан
                  келган бўлса — буни айтиш шарт, акс ҳолда бухгалтер
                  эски рақамни янги деб ўқийди. */}
              {restoredAt && (
                <Badge tone="info">
                  {t("Сақланган ҳисобот")}: {restoredAt}
                </Badge>
              )}
            </div>
          )}

          {report && report.meta.warnings.length > 0 && (
            <div className="space-y-1.5">
              {report.meta.warnings.map((w, i) => (
                <Alert key={i} tone="warn">
                  {t(w)}
                </Alert>
              ))}
            </div>
          )}

          {/* Сақланган ҳисоботлар. ЁПИҚ туради — жадвални бекитмайди
              ва янги мажбурий қадам қўшмайди. */}
          <ReportHistory
            kind="in"
            items={history}
            activeId={activeReportId}
            onOpen={handleOpenSaved}
            onDeleted={handleDeletedReport}
            format={fmt}
          />
        </form>
      </Card>

      {report && (
        <>
          {/* УМУМИЙ ЯКУН — чиқим сверкасидаги билан айнан бир хил уч карта */}
          <SumStrip cols={3}>
            <SumCell
              label={t("Жами тушган пул")}
              count={allTotals.credit}
              format={fmt}
              tone="cash"
            />
            <SumCell
              label={t("Жами ёзилган фактура")}
              count={allTotals.factura}
              format={fmt}
              tone="invoice"
            />
            <SumCell
              label={t("Фарқи")}
              count={allTotals.diff}
              format={fmt}
              tone={totalTone(allTotals.diff)}
              hint={
                <>
                  {allTotals.count} {t("контрагент, шундан")}{" "}
                  <b className="text-ink-2">{allTotals.withDiff}</b> {t("тасида фарқ бор")}
                </>
              }
            />
          </SumStrip>

          {/* Ҳисобга олинмаган фактуралар */}
          {report.meta.skippedInvoices.length > 0 && (
            <Card className="flex flex-wrap items-center gap-2">
              <span className="text-caption font-medium text-ink-2">{t("Ҳисобга олинмади:")}</span>
              {report.meta.skippedInvoices.map((s) => (
                <Badge key={s.status} tone="muted">
                  {t(s.status)}: {s.count} — <span className="tabular">{fmt(s.amount)}</span>
                </Badge>
              ))}
              <span className="text-caption text-ink-3">
                {t("(фақат «Тасдиқланган» фактуралар ҳисобланади)")}
              </span>
            </Card>
          )}

          {/* 🗂️ ТАБЛАР — Excel файлидаги барча варақлар шу ерда ҳам */}
          <Card padded={false}>
            <Tabs
              items={TABS}
              value={tab}
              onChange={setTab}
              actions={
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setBalanceOpen(true)}
                    disabled={!report}
                    icon={<CalendarClock className="h-3.5 w-3.5" />}
                    title={t("Файл бошланишидан ОЛДИНГИ давр қолдиғи")}
                  >
                    {t("Бошланғич қолдиқ")}
                    {Object.keys(opening.balances).length > 0 &&
                      ` (${Object.keys(opening.balances).length})`}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setMergeOpen(true)}
                    disabled={!report}
                    icon={<Merge className="h-3.5 w-3.5" />}
                    title={t("Битта фирма икки хил ёзилган бўлса — қаторларни қўшинг")}
                    className={cx(mergeSuggestions.length > 0 && "border-warn text-warn")}
                  >
                    {t("Бирлаштириш")}
                    {mergeSuggestions.length > 0 && ` (${mergeSuggestions.length})`}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleExport}
                    disabled={displayRows.length === 0}
                    icon={<Download className="h-3.5 w-3.5" />}
                  >
                    {t("Excel юклаш (6 варақ)")}
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSave}
                    disabled={!report || isSaving}
                    loading={isSaving}
                    icon={<Save className="h-3.5 w-3.5" />}
                  >
                    {isSaving ? t("Сақланмоқда...") : t("Сақлаш")}
                  </Button>
                </>
              }
            />

            {/* ҚИДИРУВ ВА ФИЛЬТР — барча табларга таъсир қилади */}
            <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center">
              <SearchInput
                placeholder={t("Контрагент номи ёки СТИР бўйича қидирув...")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                wrapClassName="w-full sm:w-80"
              />
              <Select
                aria-label={t("Фильтр")}
                value={filterKind}
                onChange={(e) => setFilterKind(e.target.value as FilterKind)}
                className="w-auto"
              >
                <option value="ALL">{t("Барчаси")} ({report.parties.length})</option>
                <option value="DIFF">{t("Фарқи борлар")}</option>
                <option value="NO_INVOICE">{t("Пул келган, фактура йўқ")}</option>
                <option value="UNPAID">{t("Фактура бор, пул келмаган")}</option>
                <option value="EQUAL">{t("Тенг бўлганлар")}</option>
              </Select>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-caption sm:ml-auto">
                <span className="text-ink-3">
                  {t("Тушган пул")}: <Num tone="cash" strong>{fmt(shown.credit)}</Num>
                </span>
                <span className="text-ink-3">
                  {t("Ёзилган фактура")}: <Num tone="invoice" strong>{fmt(shown.factura)}</Num>
                </span>
                <span className="text-ink-3">
                  {t("Фарқ")}: <Num tone={totalTone(shown.diff)} strong>{fmt(shown.diff)}</Num>
                </span>
              </div>
            </div>

            <div className="p-4">
              {tab === "RECONCILIATION" && (
                /* `maxHeight` ШАРТ. `TableFrame` да `overflow-auto` бор,
                   яъни у sticky учун «ойна» бўлиб қолади; баландлиги
                   чекланмаса ойна ҲЕЧ ҚАЧОН сурилмайди ва
                   `Thead sticky` / `Tfoot sticky` БЕКОР бўлади —
                   ўлчанган: саҳифа 972px сурилганда шапка y = −599 га
                   кетган. Қолган тўрт таб аллақачон `max-h-[70vh]`
                   билан ишлаётган эди, яъни битта экранда икки хил
                   хулқ бор эди. */
                <TableFrame className="anim-fade" maxHeight="max-h-[70vh]">
                  <Table>
                    <Thead sticky>
                      <tr>
                        <Th align="center" width="w-12" sticky>
                          <RowCheckbox
                            checked={allShownSelected}
                            onChange={toggleAll}
                            label={t("Барчасини белгилаш")}
                          />
                        </Th>
                        <Th sticky>
                          <SortHeader label={t("Фирма номлари")} k="name" activeKey={sortKey} dir={sortDir} onToggle={toggleSort} />
                        </Th>
                        <Th align="center" width="w-32" sticky>
                          <SortHeader label={t("СТИР")} k="inn" align="center" activeKey={sortKey} dir={sortDir} onToggle={toggleSort} />
                        </Th>
                        <Th align="right" width="w-44" sticky>
                          <SortHeader label={t("Тушган пул")} k="credit" align="right" activeKey={sortKey} dir={sortDir} onToggle={toggleSort} />
                        </Th>
                        <Th align="right" width="w-44" sticky>
                          <SortHeader label={t("Ёзилган фактура")} k="factura" align="right" activeKey={sortKey} dir={sortDir} onToggle={toggleSort} />
                        </Th>
                        <Th align="right" width="w-40" sticky>
                          <SortHeader label={t("Фарқи")} k="diff" align="right" activeKey={sortKey} dir={sortDir} onToggle={toggleSort} />
                        </Th>
                        <Th width="w-52" sticky>{t("Изоҳ")}</Th>
                        <Th align="center" width="w-32" sticky>{t("Ойлар")}</Th>
                      </tr>
                    </Thead>

                    <Tbody>
                      {rows.length === 0 ? (
                        <EmptyRow cols={8} text={t("Маълумот топилмади... 🕵️‍♂️")} />
                      ) : (
                        rows.map((p) => {
                          const v = verdict(p.difference);
                          const isOpen = expanded.includes(p.key);
                          const isSelected = selectedKeys.includes(p.key);
                          const periods = Object.keys(p.monthly).sort();

                          return (
                            <React.Fragment key={p.key}>
                              <Tr selected={isSelected}>
                                <Td align="center">
                                  <RowCheckbox
                                    checked={isSelected}
                                    onChange={() => toggleSelection(p.key)}
                                    label={p.name}
                                  />
                                </Td>
                                <Td main className="min-w-[260px]">
                                  <div className="font-medium">
                                    {p.name}
                                    {/* Қатор бир нечта ёзувдан йиғилган бўлса — буни
                                        АЙТИШ шарт: акс ҳолда бухгалтер файлдаги
                                        номни излаб тополмайди. */}
                                    {p.mergedFrom && p.mergedFrom.length > 1 && (
                                      <>
                                        {" "}
                                        <Badge tone="info" className="align-middle">
                                          {t("бирлаштирилган")} ({p.mergedFrom.length})
                                        </Badge>
                                      </>
                                    )}
                                  </div>
                                  {p.aliases.length > 1 && (
                                    <div className="max-w-[420px] truncate text-caption text-ink-3">
                                      {p.aliases.filter((a) => a !== p.name).join(" · ")}
                                    </div>
                                  )}
                                </Td>
                                <Td align="center">
                                  <Code>{p.inn}</Code>
                                </Td>
                                <NumTd tone="cash">{fmt(p.bankCredit)}</NumTd>
                                <NumTd tone="invoice">{fmt(p.facturaSent)}</NumTd>
                                <NumTd tone={v.tone} strong>{fmt(p.difference)}</NumTd>
                                <Td className={cx("text-caption font-medium", toneText[v.tone])}>
                                  {t(v.text)}
                                </Td>
                                <Td align="center">
                                  <div className="flex items-center justify-center gap-1.5">
                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      onClick={() => openAct(p)}
                                      title={t("Шу фирма учун Акт сверки юклаб олиш")}
                                      icon={<FileText className="h-3.5 w-3.5" />}
                                    >
                                      {t("Акт")}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant={isOpen ? "primary" : "secondary"}
                                      onClick={() => toggleExpand(p.key)}
                                    >
                                      {isOpen ? t("Ёпиш") : t("Очиш")}
                                      <ChevronDown
                                        className={cx("h-3.5 w-3.5 transition-transform", isOpen && "rotate-180")}
                                      />
                                    </Button>
                                  </div>
                                </Td>
                              </Tr>

                              {isOpen && (
                                <tr>
                                  <td colSpan={8} className="p-0">
                                    <div className="space-y-4 border-y border-line bg-surface-2 p-4">
                                      {/* ЁПИЛМАГАН ФАКТУРАЛАР — биринчи
                                          ўринда: бухгалтерга керак
                                          бўладиган нарса аслида шу. */}
                                      <OpenInvoices
                                        invoices={openInvoicesByKey.get(p.key) ?? []}
                                        format={fmt}
                                        title={t("Тўланмаган фактуралар")}
                                        emptyText={t("Ёпилмаган фактура йўқ")}
                                      />

                                      {/* Ойма-ой */}
                                      <div>
                                        <h3 className="mb-2 text-caption font-semibold text-ink-2">
                                          {t("📅 Ойма-ой")}
                                        </h3>
                                        <TableFrame>
                                          <Table>
                                            <Thead>
                                              <tr>
                                                <Th>{t("Давр")}</Th>
                                                <Th align="right">{t("Тушган пул")}</Th>
                                                <Th align="right">{t("Фактура")}</Th>
                                                <Th align="right">{t("Фарқ")}</Th>
                                              </tr>
                                            </Thead>
                                            <Tbody>
                                              {periods.length === 0 && (
                                                <EmptyRow cols={4} text={t("Ойлик маълумот йўқ")} />
                                              )}
                                              {periods.map((period) => {
                                                const b = p.monthly[period];
                                                const d = b.factura - b.credit;
                                                return (
                                                  <Tr key={period}>
                                                    <Td main>{periodLabel(period)}</Td>
                                                    <NumTd tone="cash">{fmt(b.credit)}</NumTd>
                                                    <NumTd tone="invoice">{fmt(b.factura)}</NumTd>
                                                    <NumTd tone={verdict(d).tone} strong>{fmt(d)}</NumTd>
                                                  </Tr>
                                                );
                                              })}
                                            </Tbody>
                                          </Table>
                                        </TableFrame>
                                      </div>

                                      {/* Ўтказмалар ва фактуралар */}
                                      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                                        <div className="overflow-hidden rounded-lg border border-line bg-surface">
                                          <div className="border-b border-line px-4 py-2 text-caption font-medium text-cash">
                                            {t("Банк ўтказмалари")} ({p.payments.length})
                                          </div>
                                          <div className="custom-scrollbar max-h-64 overflow-y-auto">
                                            <table className={tableCls.table}>
                                              <Tbody>
                                                {p.payments.length === 0 ? (
                                                  <tr>
                                                    <td className="p-4 text-caption text-ink-3">{t("Тўлов йўқ")}</td>
                                                  </tr>
                                                ) : (
                                                  p.payments.map((pay, i) => (
                                                    <tr key={i} className="align-top">
                                                      <Td className="w-24 whitespace-nowrap">{fmtDate(pay.date)}</Td>
                                                      <NumTd tone="cash" strong className="w-32 whitespace-nowrap">
                                                        {fmt(pay.amount)}
                                                      </NumTd>
                                                      <Td className="text-caption">{pay.purpose}</Td>
                                                    </tr>
                                                  ))
                                                )}
                                              </Tbody>
                                            </table>
                                          </div>
                                        </div>

                                        <div className="overflow-hidden rounded-lg border border-line bg-surface">
                                          <div className="border-b border-line px-4 py-2 text-caption font-medium text-invoice">
                                            {t("Ёзилган фактуралар")} ({p.invoices.length})
                                          </div>
                                          <div className="custom-scrollbar max-h-64 overflow-y-auto">
                                            <table className={tableCls.table}>
                                              <Tbody>
                                                {p.invoices.length === 0 ? (
                                                  <tr>
                                                    <td className="p-4 text-caption text-ink-3">{t("Фактура йўқ")}</td>
                                                  </tr>
                                                ) : (
                                                  p.invoices.map((inv, i) => (
                                                    <tr key={i} className="align-top">
                                                      <Td className="w-24 whitespace-nowrap">{fmtDate(inv.date)}</Td>
                                                      <NumTd tone="invoice" strong className="w-32 whitespace-nowrap">
                                                        {fmt(inv.amount)}
                                                      </NumTd>
                                                      <Td className="text-caption">{inv.number}</Td>
                                                    </tr>
                                                  ))
                                                )}
                                              </Tbody>
                                            </table>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })
                      )}
                    </Tbody>

                    {displayRows.length > 0 && (
                      <Tfoot sticky>
                        <tr>
                          <Td align="center" className="text-accent-ink">✓</Td>
                          <Td colSpan={2} align="right" className="text-caption text-ink-3">
                            {t("Жами танланганлар:")} ({displayRows.length})
                          </Td>
                          <NumTd tone="cash">{fmt(shown.credit)}</NumTd>
                          <NumTd tone="invoice">{fmt(shown.factura)}</NumTd>
                          <NumTd tone={totalTone(shown.diff)}>{fmt(shown.diff)}</NumTd>
                          <Td className={cx("text-caption", toneText[totalTone(shown.diff)])}>
                            {t(verdict(shown.diff).text)}
                          </Td>
                          <Td />
                        </tr>
                      </Tfoot>
                    )}
                  </Table>
                </TableFrame>
              )}

              {/* ===== ЙИЛЛАР ===== */}
              {tab === "YEARS" && (
                <TableFrame className="anim-fade" maxHeight="max-h-[70vh]">
                  <Table>
                    <Thead sticky>
                      <tr>
                        <Th className="sticky left-0 z-20 bg-surface-2" width="min-w-[240px]">
                          {t("Фирма номлари")}
                        </Th>
                        <Th align="center">{t("СТИР")}</Th>
                        {yearKeys.map((y) => (
                          <React.Fragment key={y}>
                            <Th align="right">{y} {t("тушган пул")}</Th>
                            <Th align="right">{y} {t("фактура")}</Th>
                            <Th align="right" className="border-r border-line">{y} {t("фарқи")}</Th>
                          </React.Fragment>
                        ))}
                        <Th align="right">{t("ЖАМИ пул")}</Th>
                        <Th align="right">{t("ЖАМИ фактура")}</Th>
                        <Th align="right">{t("ЖАМИ фарқи")}</Th>
                      </tr>
                    </Thead>
                    <Tbody>
                      {displayRows.length === 0 && (
                        <EmptyRow
                          cols={2 + yearKeys.length * 3 + 3}
                          text={t("Битта ҳам қатор белгиланмаган — «Сверка» табида контрагент танланг.")}
                        />
                      )}
                      {displayRows.map((p) => (
                        <Tr key={p.key}>
                          <Td main className="sticky left-0 bg-surface">{p.name}</Td>
                          <Td align="center" className="font-mono text-caption">{p.inn}</Td>
                          {yearKeys.map((y) => {
                            const v = yearOf(p, y);
                            return (
                              <React.Fragment key={y}>
                                <NumTd tone="cash">{fmt(v.credit)}</NumTd>
                                <NumTd tone="invoice">{fmt(v.factura)}</NumTd>
                                <NumTd tone={verdict(v.diff).tone} strong className="border-r border-line">
                                  {fmt(v.diff)}
                                </NumTd>
                              </React.Fragment>
                            );
                          })}
                          <NumTd strong>{fmt(p.bankCredit)}</NumTd>
                          <NumTd strong>{fmt(p.facturaSent)}</NumTd>
                          <NumTd tone={verdict(p.difference).tone} strong>{fmt(p.difference)}</NumTd>
                        </Tr>
                      ))}
                    </Tbody>
                    <Tfoot sticky>
                      <tr>
                        <Td className="sticky left-0 z-20 bg-surface-2 text-caption text-ink-3">{t("ЖАМИ")}</Td>
                        <Td />
                        {yearKeys.map((y) => {
                          const c = displayRows.reduce((a, p) => a + yearOf(p, y).credit, 0);
                          const fa = displayRows.reduce((a, p) => a + yearOf(p, y).factura, 0);
                          return (
                            <React.Fragment key={y}>
                              <NumTd>{fmt(c)}</NumTd>
                              <NumTd>{fmt(fa)}</NumTd>
                              <NumTd tone={verdict(fa - c).tone} className="border-r border-line">
                                {fmt(fa - c)}
                              </NumTd>
                            </React.Fragment>
                          );
                        })}
                        <NumTd>{fmt(shown.credit)}</NumTd>
                        <NumTd>{fmt(shown.factura)}</NumTd>
                        <NumTd tone={totalTone(shown.diff)}>{fmt(shown.diff)}</NumTd>
                      </tr>
                    </Tfoot>
                  </Table>
                </TableFrame>
              )}

              {/* ===== ОЙМА-ОЙ ===== */}
              {tab === "MONTHLY" && (
                <TableFrame className="anim-fade" maxHeight="max-h-[70vh]">
                  <Table>
                    <Thead sticky>
                      <tr>
                        <Th sticky>{t("Фирма номлари")}</Th>
                        <Th align="center" width="w-32" sticky>{t("СТИР")}</Th>
                        <Th align="center" width="w-20" sticky>{t("Йил")}</Th>
                        <Th align="center" width="w-28" sticky>{t("Ой")}</Th>
                        <Th align="right" width="w-40" sticky>{t("Тушган пул")}</Th>
                        <Th align="right" width="w-40" sticky>{t("Ёзилган фактура")}</Th>
                        <Th align="right" width="w-40" sticky>{t("Фарқи")}</Th>
                      </tr>
                    </Thead>
                    <Tbody>
                      {monthlyRows.length === 0 && (
                        <EmptyRow
                          cols={7}
                          text={t("Битта ҳам қатор белгиланмаган — «Сверка» табида контрагент танланг.")}
                        />
                      )}
                      {monthlyRows.map((m, i) => (
                        <Tr key={i}>
                          <Td main>{m.name}</Td>
                          <Td align="center" className="font-mono text-caption">{m.inn}</Td>
                          <Td align="center">{m.year}</Td>
                          <Td align="center">{m.month}</Td>
                          <NumTd tone="cash">{fmt(m.credit)}</NumTd>
                          <NumTd tone="invoice">{fmt(m.factura)}</NumTd>
                          <NumTd tone={verdict(m.diff).tone} strong>{fmt(m.diff)}</NumTd>
                        </Tr>
                      ))}
                    </Tbody>
                    <Tfoot sticky>
                      <tr>
                        <Td colSpan={4} align="right" className="text-caption text-ink-3">
                          {t("ЖАМИ")} ({monthlyRows.length}):
                        </Td>
                        <NumTd>{fmt(shown.credit)}</NumTd>
                        <NumTd>{fmt(shown.factura)}</NumTd>
                        <NumTd tone={totalTone(shown.diff)}>{fmt(shown.diff)}</NumTd>
                      </tr>
                    </Tfoot>
                  </Table>
                </TableFrame>
              )}

              {/* ===== ТЎЛОВЛАР ===== */}
              {tab === "PAYMENTS" && (
                <TableFrame className="anim-fade" maxHeight="max-h-[70vh]">
                  <Table>
                    <Thead sticky>
                      <tr>
                        <Th align="center" width="w-28" sticky>{t("Сана")}</Th>
                        <Th align="center" width="w-20" sticky>{t("Йил")}</Th>
                        <Th align="center" width="w-28" sticky>{t("Ой")}</Th>
                        <Th sticky>{t("Фирма номлари")}</Th>
                        <Th align="center" width="w-32" sticky>{t("СТИР")}</Th>
                        <Th align="right" width="w-40" sticky>{t("Тушган пул")}</Th>
                        <Th align="center" width="w-28" sticky>{t("Ҳужжат №")}</Th>
                        <Th width="min-w-[320px]" sticky>{t("Тўлов мақсади")}</Th>
                      </tr>
                    </Thead>
                    <Tbody>
                      {paymentRows.length === 0 && (
                        <EmptyRow cols={8} text={t("Тўлов топилмади — банк кўчирмаси юкланганини текширинг.")} />
                      )}
                      {paymentRows.map((r, i) => (
                        <Tr key={i} className="align-top">
                          <Td align="center" className="whitespace-nowrap">{fmtDate(r.date)}</Td>
                          <Td align="center">{r.year}</Td>
                          <Td align="center">{r.month}</Td>
                          <Td main>{r.name}</Td>
                          <Td align="center" className="font-mono text-caption">{r.inn}</Td>
                          <NumTd tone="cash" strong>{fmt(r.amount)}</NumTd>
                          <Td align="center" className="font-mono text-caption">{r.doc}</Td>
                          <Td className="text-caption">{r.purpose}</Td>
                        </Tr>
                      ))}
                    </Tbody>
                    <Tfoot sticky>
                      <tr>
                        <Td colSpan={5} align="right" className="text-caption text-ink-3">
                          {t("ЖАМИ")} ({paymentRows.length}):
                        </Td>
                        <NumTd>{fmt(shown.credit)}</NumTd>
                        <Td colSpan={2} />
                      </tr>
                    </Tfoot>
                  </Table>
                </TableFrame>
              )}

              {/* ===== ФАКТУРАЛАР ===== */}
              {tab === "INVOICES" && (
                <TableFrame className="anim-fade" maxHeight="max-h-[70vh]">
                  <Table>
                    <Thead sticky>
                      <tr>
                        <Th align="center" width="w-28" sticky>{t("Сана")}</Th>
                        <Th align="center" width="w-20" sticky>{t("Йил")}</Th>
                        <Th align="center" width="w-28" sticky>{t("Ой")}</Th>
                        <Th sticky>{t("Фирма номлари")}</Th>
                        <Th align="center" width="w-32" sticky>{t("СТИР")}</Th>
                        <Th align="right" width="w-40" sticky>{t("Сумма")}</Th>
                        <Th width="min-w-[240px]" sticky>{t("Счёт-фактура")}</Th>
                      </tr>
                    </Thead>
                    <Tbody>
                      {invoiceRows.length === 0 && (
                        <EmptyRow cols={7} text={t("Фактура топилмади — реестр файли юкланганини текширинг.")} />
                      )}
                      {invoiceRows.map((r, i) => (
                        <Tr key={i}>
                          <Td align="center" className="whitespace-nowrap">{fmtDate(r.date)}</Td>
                          <Td align="center">{r.year}</Td>
                          <Td align="center">{r.month}</Td>
                          <Td main>{r.name}</Td>
                          <Td align="center" className="font-mono text-caption">{r.inn}</Td>
                          <NumTd tone="invoice" strong>{fmt(r.amount)}</NumTd>
                          <Td className="text-caption">{r.number}</Td>
                        </Tr>
                      ))}
                    </Tbody>
                    <Tfoot sticky>
                      <tr>
                        <Td colSpan={5} align="right" className="text-caption text-ink-3">
                          {t("ЖАМИ")} ({invoiceRows.length}):
                        </Td>
                        <NumTd>{fmt(shown.factura)}</NumTd>
                        <Td />
                      </tr>
                    </Tfoot>
                  </Table>
                </TableFrame>
              )}

              {/* ===== ҚАРЗ ЁШИ (AGING) ===== */}
              {tab === "AGING" && (
                <div className="anim-fade space-y-4">
                  {/* Гуруҳлар бўйича умумий манзара */}
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
                    {BUCKET_KEYS.map((k) => (
                      <div key={k} className="rounded-lg border border-line bg-surface p-4">
                        <p className="text-caption text-ink-3">{BUCKET_LABELS[k]}</p>
                        <p className={cx("mt-1 text-h3 font-semibold tabular", toneText[BUCKET_TONES[k]])}>
                          {fmt(aging.totals.buckets[k])}
                        </p>
                      </div>
                    ))}
                  </div>

                  <p className="text-caption text-ink-3">
                    {t("Ҳисоб санаси:")} <span className="font-medium text-ink-2">{fmtDate(aging.asOf)}</span> · {t("Жами қарз")}:{" "}
                    <Num tone="bad" strong>{fmt(aging.totals.receivable)}</Num> · {t("Аванс")}:{" "}
                    <Num tone="info" strong>{fmt(aging.totals.advance)}</Num>
                  </p>

                  <TableFrame maxHeight="max-h-[70vh]">
                    <Table>
                      <Thead sticky>
                        <tr>
                          <Th width="min-w-[240px]" sticky>{t("Фирма номлари")}</Th>
                          <Th align="center" width="w-32" sticky>{t("СТИР")}</Th>
                          <Th align="right" width="w-36" sticky>{t("Қарз қолдиғи")}</Th>
                          {BUCKET_KEYS.map((k) => (
                            <Th key={k} align="right" width="w-32" sticky>{BUCKET_LABELS[k]}</Th>
                          ))}
                          <Th align="right" width="w-32" sticky>{t("Ортиқча тушган")}</Th>
                          <Th align="center" width="w-28" sticky>{t("Энг эски")}</Th>
                        </tr>
                      </Thead>
                      <Tbody>
                        {aging.parties.length === 0 && (
                          <EmptyRow
                            cols={3 + BUCKET_KEYS.length + 2}
                            text={t("Битта ҳам қатор белгиланмаган — «Сверка» табида контрагент танланг.")}
                          />
                        )}
                        {aging.parties.map((p) => (
                          <Tr key={p.key}>
                            <Td main>{p.name}</Td>
                            <Td align="center" className="font-mono text-caption">{p.inn}</Td>
                            <NumTd strong>{p.receivable > 0.01 ? fmt(p.receivable) : "—"}</NumTd>
                            {BUCKET_KEYS.map((k) => (
                              <NumTd key={k} tone={p.buckets[k] > 0.01 ? BUCKET_TONES[k] : "muted"}>
                                {p.buckets[k] > 0.01 ? fmt(p.buckets[k]) : "—"}
                              </NumTd>
                            ))}
                            <NumTd tone="info">{p.advance > 0.01 ? fmt(p.advance) : "—"}</NumTd>
                            <Td align="center" className="whitespace-nowrap text-caption">
                              {p.oldestDays === null ? (
                                <span className="text-ink-3">—</span>
                              ) : (
                                <span className={p.oldestDays > 90 ? "font-semibold text-bad" : "text-ink-2"}>
                                  {p.oldestDays} {t("кун")}
                                </span>
                              )}
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                      <Tfoot sticky>
                        <tr>
                          <Td colSpan={2} align="right" className="text-caption text-ink-3">{t("ЖАМИ:")}</Td>
                          <NumTd>{fmt(aging.totals.receivable)}</NumTd>
                          {BUCKET_KEYS.map((k) => (
                            <NumTd key={k} tone={BUCKET_TONES[k]}>{fmt(aging.totals.buckets[k])}</NumTd>
                          ))}
                          <NumTd tone="info">{fmt(aging.totals.advance)}</NumTd>
                          <Td />
                        </tr>
                      </Tfoot>
                    </Table>
                  </TableFrame>

                  <p className="text-caption text-ink-3">
                    {t("Ҳисоблаш усули: келган пул энг эски фактурадан бошлаб ёпилади (FIFO). Ёпилмай қолган қолдиқ фактура санасидан ҳисоб санасигача ўтган кунга қараб гуруҳланади. Фактурадан ортиқча келган пул — аванс.")}
                  </p>
                </div>
              )}
            </div>
          </Card>
        </>
      )}

      {/* КОНТРАГЕНТЛАРНИ БИРЛАШТИРИШ */}
      <MergeModal
        open={mergeOpen}
        onClose={() => setMergeOpen(false)}
        companyId={companyId}
        side="in"
        rows={mergeRows}
        groups={merges}
        suggestions={mergeSuggestions}
        format={fmt}
        onMerged={handleMerged}
        onUnmerged={handleUnmerged}
      />

      {/* 📅 БОШЛАНҒИЧ ҚОЛДИҚ ОЙНАСИ */}
      <OpeningBalanceModal
        open={balanceOpen}
        onClose={() => setBalanceOpen(false)}
        rows={(report?.parties ?? []).map((p) => ({ key: p.key, name: p.name, inn: p.inn }))}
        balances={opening.balances}
        asOf={opening.asOf}
        format={fmt}
        saving={savingBalances}
        onSave={handleSaveBalances}
      />

      {/* 📄 АКТ СВЕРКИ ОЙНАСИ
          Ичидаги Дебет / Кредит / Сальдо блокига ТЕГИЛМАЙДИ — у расмий
          икки томонлама ҳужжат шакли, эталон PDF билан қаторма-қатор
          мос келиши шарт. Экрандаги «Фарқ» энди шу блок билан БИР ХИЛ
          ишорада: иккиси ҳам фактура − пул. */}
      <Modal
        open={actParty !== null && report !== null}
        onClose={() => setActParty(null)}
        title={t("Акт сверки")}
        hint={actParty ? `${actParty.name} · СТИР ${actParty.inn}` : undefined}
        icon={<FileText className="h-5 w-5" />}
        width="max-w-lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setActParty(null)}>
              {t("Бекор қилиш")}
            </Button>
            <Button variant="primary" onClick={handleActDownload} icon={<Download className="h-4 w-4" />}>
              {t("Excel юклаб олиш")}
            </Button>
          </>
        }
      >
        {actParty && (
          <div className="space-y-4">
            {/* «Сальдо начальное» — ҳужжатдаги БИРИНЧИ қатор, шунинг учун
                жадвал устида. */}
            {actOpening !== undefined && (
              <div className="flex items-center justify-between rounded-md border border-line bg-surface-2 px-3 py-2">
                <span className="text-caption text-ink-3">{t("Бошланғич қолдиқ")}</span>
                <span className="text-body font-semibold tabular text-ink">{fmt(actOpening)}</span>
              </div>
            )}

            {/* Ҳисоб-китоб хулосаси */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-md border border-line bg-surface-2 p-3">
                <p className="text-caption text-invoice">{t("Дебет (фактура)")}</p>
                <p className="mt-1 text-body font-semibold tabular">{fmt(actParty.facturaSent)}</p>
              </div>
              <div className="rounded-md border border-line bg-surface-2 p-3">
                <p className="text-caption text-cash">{t("Кредит (тўлов)")}</p>
                <p className="mt-1 text-body font-semibold tabular">{fmt(actParty.bankCredit)}</p>
              </div>
              <div className="rounded-md border border-line bg-surface-2 p-3">
                <p className="text-caption text-ink-3">
                  {actOpening === undefined ? t("Сальдо") : t("Якуний қолдиқ")}
                </p>
                <p
                  className={cx(
                    "mt-1 text-body font-semibold tabular",
                    toneText[verdict(actSaldo).tone]
                  )}
                >
                  {fmt(Math.abs(actSaldo))}
                </p>
              </div>
            </div>

            <p className="text-caption text-ink-2">
              {Math.abs(actSaldo) < 0.01
                ? t("Қарздорлик йўқ.")
                : actSaldo > 0
                  ? `${t("Улар қарздор — мижоз")} ${fmt(actSaldo)} ${t("сўм тўламаган.")}`
                  : `${t("Биз қарздормиз —")} ${fmt(-actSaldo)} ${t("сўм ортиқча тушган.")}`}
            </p>

            {/* Ҳужжат остига ҳам худди шу изоҳ ёзилади
                (`reconciliationAct.ts`) — экран билан ҳужжат бир хил
                гапиради. Чиқим сверкасида бу изоҳ бор эди, киримда
                тушиб қолган эди. */}
            {actOpening === undefined && (
              <Alert tone="warn">
                {t("Бу контрагентга бошланғич қолдиқ киритилмаган — акт фақат юкланган давр ҳаракатини кўрсатади.")}
              </Alert>
            )}

            <p className="text-caption text-ink-3">
              {t("Файлда фақат жадвалнинг ўзи бўлади: Дата · Документ · Дебет · Кредит — икки томонлама, Сальдо ва Обороты қаторлари билан.")}
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
