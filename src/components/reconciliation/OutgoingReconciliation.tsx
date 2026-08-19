// ============================================================
// ЧИҚИМ СВЕРКАСИ — Тўланган пул ↔ Келган фактура
// ------------------------------------------------------------
// Илгари бу `app/excel-audit/companies/[id]/page.tsx` эди. Энди
// компонент: битта корхона саҳифасида кирим сверкаси билан ЁНМА-ЁН,
// таб бўлиб туради. Бухгалтер учун бу битта иш — «шу корхонани
// солиштир» — шунинг учун саҳифа ҳам битта.
//
// Саҳифа ўрами (`data-module="out"`, сарлавҳа, орқага тугмаси) ота
// саҳифада: `app/korxonalar/[id]/page.tsx`.
// ============================================================
"use client";

import React, { useState, useMemo, useEffect } from "react";
import { collection, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { authFetch } from "@/lib/authFetch";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { CalendarClock, ChevronDown, Download, FileText, Merge, Save } from "lucide-react";
import SortHeader from "@/components/SortHeader";
import { useT } from "@/context/LanguageContext";
import { CATEGORY_LABELS, type Category } from "@/lib/counterpartyCategory";
import {
  EMPTY_BALANCES,
  loadOpeningBalances,
  saveOpeningBalances,
  type OpeningBalances,
} from "@/lib/openingBalance";
import OpeningBalanceModal from "@/components/reconciliation/OpeningBalanceModal";
import OpenInvoices from "@/components/reconciliation/OpenInvoices";
import { buildAging, type AgingOpenInvoice } from "@/lib/aging";
import { buildReconciliationActWorkbook } from "@/lib/reconciliationAct";
import {
  newestFirst,
  stampToDate,
  summarizeOutgoing,
  formatStamp,
  type ReportSummary,
} from "@/lib/reportHistory";
import ReportHistory from "@/components/reconciliation/ReportHistory";
import {
  mergeOutgoingRows,
  type MergeGroup,
  type MergeSuggestion,
} from "@/lib/counterpartyMerge";
import MergeModal, { type MergeRow } from "@/components/reconciliation/MergeModal";
import {
  Alert,
  Badge,
  Button,
  Card,
  Checkbox,
  Code,
  FileDrop,
  Num,
  NumTd,
  RowCheckbox,
  SearchInput,
  Select,
  Spinner,
  StatCard,
  Modal,
  Table,
  TableFrame,
  Tbody,
  Td,
  Tfoot,
  Th,
  Thead,
  Tr,
  cx,
  notify,
  toneText,
  type Tone,
} from "@/components/ui";

interface MonthlyBucket {
  debit: number;
  credit: number;
}
interface TransactionRecord {
  date: string;
  /** 'BANK' | 'FAKTURA' | 'GENERIC_DOC' — serverdan keladi */
  type: string;
  debit: number;
  credit: number;
  /** Hujjat raqami. Serverda YOZILADI, klientda e'lon qilinmagan
   *  edi — yopilmagan fakturalar ro'yxati uchun kerak bo'ldi. */
  doc?: string;
}
interface AggregatedTx {
  key?: string;
  name: string;
  inn: string;
  monthlyData: Record<string, MonthlyBucket>;
  transactions: TransactionRecord[];
  totalDebit: number;
  totalCredit: number;
  difference: number;
  /** Танланган даврдан ОЛДИНГИ фарқлар йиғиндиси (нарастающий) */
  openingSaldo?: number;
  /** Коммунал/бюджет/банк тўловларини асосий сверкадан ажратиш учун.
   *  Стандарт ҳар доим «korxona» — src/lib/counterpartyCategory.ts */
  category?: Category;
  categorySource?: "standart" | "seed" | "user";
  categoryLabel?: string;
  /** Ном бўйича ТАХМИН. Қаторни ЯШИРМАЙДИ, фақат белгиси чиқади. */
  categoryHint?: Category;
  categoryHintLabel?: string;
  /** Қўлда бирлаштирилган бўлса — қайси калитлардан йиғилгани.
   *  `src/lib/counterpartyMerge.ts` */
  mergedFrom?: string[];
}

/** Эски сақланган ҳисоботларда тоифа йўқ — улар «korxona» ҳисобланади */
function catOf(tx: AggregatedTx): Category {
  return tx.category || "korxona";
}

/** Тизим таниган (ёки шу сафар ўрганиб олган) экспорт шакллари */
interface KnownFormat {
  id: string;
  kind: "BANK" | "FAKTURA";
  label: string;
  isNew: boolean;
}

/** Ҳар бир файл/варақ қандай ўқилгани — «жимгина хато» бўлмаслиги учун */
interface SheetReport {
  file: string;
  sheet: string;
  format: string;
  rows: number;
  debit: number;
  credit: number;
  allDebit?: number;
  allCredit?: number;
  fileDebit?: number;
  fileCredit?: number;
  note?: string;
}

/** Файлдан ТОПИЛГАН давр. Иккала томон учун алоҳида: кўчирма ва
 *  фактура рўйхати ҳар хил даврни қамраши мумкин ва бу — энг қиммат
 *  жимгина хато (1 ойлик кўчирма + 7 ойлик фактура = сохта фарқ). */
interface PeriodRange {
  from: string | null;
  to: string | null;
  undated: number;
}

/** Қолдиқ тенгламаси: бошланғич қолдиқ + кредит − дебет = охирги қолдиқ.
 *  «Итого»дан мустақил назорат — дебет билан кредит алмашиб кетса
 *  «Итого» буни сезмайди (йиғинди барибир тўғри), бу эса сезади. */
interface BalanceCheck {
  file: string;
  status: "MOS" | "NOMOS" | "YO'Q";
  note?: string;
  opening?: number;
  closing?: number;
  expected?: number;
  debit: number;
  credit: number;
}

/** Кўчирма/фактура ёзувини бир хил ном билан бирлаштириш учун калит */
function rowKey(tx: AggregatedTx): string {
  return tx.key || (tx.inn && tx.inn !== "-" ? tx.inn : `NAME:${tx.name}`);
}
interface ReconciliationReportDoc {
  companyId: string;
  savedAt?: { toMillis: () => number; toDate: () => Date };
  /** Қайси давр кесими сақлангани (`handleSaveToFirebase` ёзади) */
  period?: { year: number | null; month: number | null; cumulative: boolean; label: string } | null;
  firmsData: AggregatedTx[];
  totals?: { debit: number; credit: number; diff: number };
}

/** Firestore hujjati + o'z identifikatori (tarix ro'yxati uchun) */
type SavedOutgoingDoc = ReconciliationReportDoc & { id: string };

const MONTH_NAMES = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];

/** Тил ўзгарса ой номи ҳам ўзгариши учун таржимон узатилади */
function periodLabel(period: string, t: (s: string) => string): string {
  const [y, m] = period.split('-').map(Number);
  const raw = MONTH_NAMES[(m || 1) - 1];
  return raw ? `${t(raw)} ${y}` : period;
}
/** «2026-01 … 2026-07» ёки битта ой бўлса «2026-07» */
function periodRangeLabel(r: { from: string | null; to: string | null }): string {
  if (!r.from) return "—";
  return r.from === r.to ? r.from : `${r.from} … ${r.to}`;
}

function sortedPeriods(monthlyData: Record<string, MonthlyBucket>): string[] {
  return Object.keys(monthlyData || {}).sort();
}

// ФАРҚ = ТЎЛАНГАН ПУЛ − КЕЛГАН ФАКТУРА (сальдо).
//
// Ишора бухгалтерия қоидасидан: етказиб берувчи ҳисоби (6010
// «Етказиб берувчиларга тўланадиган счётлар») — ПАССИВ ҳисоб, унда
// тўлов ДЕБЕТ, келган фактура КРЕДИТ. Сальдо = дебет − кредит.
//
//   > 0  улар қарздор   (пул кетган, фактура келмаган)
//   < 0  биз қарздормиз (фактура келган, пул тўланмаган)
//
// Кирим сверкасидаги `verdict` билан БИР ХИЛ маъно: мусбат = улар
// қарздор. Ранг дизайн тизимидан келади.
function verdict(diff: number): { text: string; tone: Tone } {
  if (diff > 0) return { text: "Ҳисоб фактура олиш керак", tone: "warn" };
  if (diff < 0) return { text: "Қарзмиз", tone: "bad" };
  return { text: "-", tone: "muted" };
}

// ============================================================
// Давр кесими: танланган йил/ой бўйича суммалар + олдинги
// даврлардан қолган сальдо (нарастающий итог)
// ============================================================
type YearFilter = "ALL" | number;
type MonthFilter = "ALL" | number;

function slicePeriod(
  tx: AggregatedTx,
  year: YearFilter,
  month: MonthFilter,
  cumulative: boolean
): AggregatedTx {
  if (year === "ALL") {
    return { ...tx, openingSaldo: 0 };
  }

  let debit = 0;
  let credit = 0;
  let openingDebit = 0;
  let openingCredit = 0;

  for (const [period, bucket] of Object.entries(tx.monthlyData || {})) {
    // Сanasi аниқланмаган ёзувлар («SANASIZ») ҳеч қайси ойга
    // қўшилмайди — улар фақат «Барча давр»да кўринади
    const [ys, ms] = period.split("-");
    const y = Number(ys);
    const m = Number(ms);
    if (!y || !m) continue;

    const inYear = y === year;
    const inMonth = month === "ALL" || (cumulative ? m <= month : m === month);

    if (inYear && inMonth) {
      debit += bucket.debit || 0;
      credit += bucket.credit || 0;
    } else if (y < year || (inYear && month !== "ALL" && m < month)) {
      // Танланган даврга қадар бўлган ҳамма нарса — очилиш сальдоси
      openingDebit += bucket.debit || 0;
      openingCredit += bucket.credit || 0;
    }
  }

  return {
    ...tx,
    totalDebit: debit,
    totalCredit: credit,
    difference: debit - credit,
    openingSaldo: openingDebit - openingCredit,
  };
}

// Aniqlangan format nomlarini chiroyli ko'rsatish
const FORMAT_LABELS: Record<string, string> = {
  HAMKORBANK: "Hamkorbank",
  IPOTEKA_ASBT: "Ipoteka / ASBT",
  FAKTURA: "Счёт-фактура",
  UNIVERSAL: "Universal parser",
  GENERIC: "Umumiy format",
};

type SortKey = "name" | "inn" | "debit" | "credit" | "diff";
type SortDir = "asc" | "desc";

export default function OutgoingReconciliation({
  companyId,
  companyName,
}: {
  companyId: string;
  /** Excel ҳисоботининг сарлавҳасига ЁЗИЛАДИ. Илгари бу ерда битта
   *  мижознинг номи қотириб қўйилган эди — ҳар кимнинг ҳисоботида
   *  ўша ном чиқарди. */
  companyName: string;
}) {
  const t = useT();
  // Barcha o'qish/yozish ish maydoniga bog'lanadi (src/lib/workspace.ts)
  const { user } = useAuth();
  const workspaceId: string | undefined = user?.workspaceId;

  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(true);
  // Saqlangan hisobotlar TARIXI. Ro'yxat tiklash so'rovi allaqachon
  // yuklab olgan snapshot'dan tuziladi — qo'shimcha o'qish YO'Q.
  const [savedDocs, setSavedDocs] = useState<SavedOutgoingDoc[]>([]);
  const [activeReportId, setActiveReportId] = useState<string | null>(null);
  // Қўлда бирлаштирилган контрагентлар (`counterpartyMerge.ts`)
  const [merges, setMerges] = useState<MergeGroup[]>([]);
  const [mergeSuggestions, setMergeSuggestions] = useState<MergeSuggestion[]>([]);
  const [mergeOpen, setMergeOpen] = useState(false);
  /** Ekrandagi natija saqlangan hisobotdan tiklanganmi. Kirim
   *  tomonida bu belgi bor edi, chiqimda YO'Q edi — buxgalter eski
   *  raqamni yangi deb o'qishi mumkin edi. */
  const [restoredAt, setRestoredAt] = useState<string | null>(null);

  const [parsedData, setParsedData] = useState<AggregatedTx[]>([]);
  const [detectedFormats, setDetectedFormats] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [sheetReports, setSheetReports] = useState<SheetReport[]>([]);
  const [balanceChecks, setBalanceChecks] = useState<BalanceCheck[]>([]);
  const [periods, setPeriods] = useState<{ bank: PeriodRange; faktura: PeriodRange } | null>(null);
  const [knownFormats, setKnownFormats] = useState<KnownFormat[]>([]);
  /** AUDIT IZI: toifani kim va qachon o'zgartirgani. Byuroda bir
   *  necha odam ishlaydi — «kim buni kommunal deb belgilagan?»
   *  degan savolga javob bo'lishi kerak. */
  const [categoryAuthors, setCategoryAuthors] = useState<Record<string, { by: string; at: string }>>({});
  const [showReport, setShowReport] = useState(false);

  // 📅 Давр кесими
  const [yearFilter, setYearFilter] = useState<YearFilter>("ALL");
  const [monthFilter, setMonthFilter] = useState<MonthFilter>("ALL");
  const [cumulative, setCumulative] = useState(true);
  // «Ожидает подписи партнёра» — имзоланмаган фактура одатда ҳисобланмайди
  const [includePending, setIncludePending] = useState(false);

  const [selectedInns, setSelectedInns] = useState<string[]>([]);
  const [expandedInns, setExpandedInns] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"ALL" | "DIFF" | "EQUAL">("ALL");
  // 🏭 Тоифа фильтри. Стандарт — фақат корхоналар: коммунал, бюджет ва
  // банк комиссияси асосий сверкани чалғитади. Улар ЙЎҚОЛМАЙДИ —
  // тепадаги «ЖАМИ» карточкаси ҳар доим тўлиқ суммани кўрсатади.
  const [categoryFilter, setCategoryFilter] = useState<"COMPANY" | "OTHER" | "ALL">("COMPANY");
  const [savingCategory, setSavingCategory] = useState<string | null>(null);

  // 📅 Boshlang'ich qoldiq — fayl boshlanishidan OLDINGI davr saldosi.
  // Fayldan olib bo'lmaydi (bankda kontragent kesimi yo'q), shuning
  // uchun buxgalter kiritadi va u Firestore'da saqlanadi.
  const [opening, setOpening] = useState<OpeningBalances>(EMPTY_BALANCES);
  const [balanceOpen, setBalanceOpen] = useState(false);
  // 📄 АКТ СВЕРКИ — битта етказиб берувчи учун
  const [actRow, setActRow] = useState<AggregatedTx | null>(null);
  const [savingBalances, setSavingBalances] = useState(false);

  // 🔽 Jadval sortlash holati
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const formatNum = (num: number) => {
    if (!num && num !== 0) return "-";
    return num.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  useEffect(() => {
    async function fetchSavedData() {
      if (!companyId) return;
      try {
        // Ish maydoni filtri SHART: Firestore qoidasi so'rovni hujjatlarni
        // o'qimasdan tekshiradi, filtrsiz so'rov butunlay rad etiladi.
        if (!workspaceId) return;
        const q = query(
          collection(db, "sverka_reports"),
          where("workspaceId", "==", workspaceId),
          where("companyId", "==", companyId)
        );
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          // Snapshot BUTUNLAY saqlanadi: tarix ro'yxati aynan shundan
          // tuziladi, ya'ni ikkinchi so'rov qilinmaydi.
          const docs = newestFirst(
            querySnapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as SavedOutgoingDoc)
          );
          setSavedDocs(docs);
          const latestReport = docs[0];

          if (latestReport.firmsData && latestReport.firmsData.length > 0) {
            const correctedData = latestReport.firmsData.map((item) => ({
              ...item,
              difference: item.totalDebit - item.totalCredit,
            }));
            setParsedData(correctedData);
            setSelectedInns(correctedData.filter((d) => catOf(d) === "korxona").map((d) => rowKey(d)));
            setActiveReportId(latestReport.id);
            setRestoredAt(formatStamp(stampToDate(latestReport.savedAt)));
          }
        }
      } catch (error) {
        console.error("Firebase'dan ma'lumot yuklashda xatolik:", error);
      } finally {
        setIsFetchingData(false);
      }
    }
    fetchSavedData();
  }, [companyId, workspaceId]);

  // Saqlangan qoldiqlarni tiklash. Xato bo'lsa ish TO'XTAMAYDI —
  // sverka qoldiqsiz ham to'g'ri hisoblanadi, faqat yakuniy qoldiq
  // ustuni bo'sh qoladi.
  useEffect(() => {
    let alive = true;
    async function load() {
      if (!companyId || !workspaceId) return;
      try {
        const b = await loadOpeningBalances(workspaceId, companyId, "out");
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

  const handleSaveBalances = async (asOf: string, balances: Record<string, number>) => {
    if (!workspaceId) {
      notify.error(t("Иш майдони аниқланмади. Тизимдан чиқиб, қайта киринг."));
      return;
    }
    setSavingBalances(true);
    try {
      const id = await saveOpeningBalances(
        workspaceId,
        companyId,
        "out",
        asOf,
        balances,
        opening.id
      );
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
  // АКТ СВЕРКИ (чиқим томони)
  // ------------------------------------------------------------
  // Роллар кирим томонига ТЕСКАРИ. Етказиб берувчи ҳисоби (6010) —
  // ПАССИВ: биз тўлаган пул ДЕБЕТ, келган фактура КРЕДИТ. Сальдо =
  // дебет − кредит = тўлов − фактура, яъни жадвалдаги «Фарқ» билан
  // АЙНАН бир хил (HANDOFF 8-бўлим).
  //
  // Шунинг учун акт майдонлари нейтрал: `debitDocs` / `creditDocs`.
  // «invoices» деб аталганда бу ерга ТЎЛОВ узатилиши керак бўларди.
  // ============================================================
  const handleActDownload = async () => {
    if (!actRow) return;
    const key = rowKey(actRow);
    const txs = actRow.transactions || [];
    const wb = buildReconciliationActWorkbook(
      {
        name: actRow.name,
        inn: actRow.inn,
        debitTotal: actRow.totalDebit,
        creditTotal: actRow.totalCredit,
        debitDocs: txs
          .filter((r) => (r.debit || 0) > 0)
          .map((r) => ({ date: r.date || null, number: r.doc || "", amount: r.debit })),
        creditDocs: txs
          .filter((r) => (r.credit || 0) > 0)
          .map((r) => ({ date: r.date || null, number: r.doc || "", amount: r.credit })),
      },
      {
        ownName: companyName,
        openingBalance:
          opening.balances[key] === undefined ? undefined : opening.balances[key],
        periodLabel: periodTitle,
      }
    );
    const buffer = await wb.xlsx.writeBuffer();
    const safe = actRow.name.replace(/[^A-Za-zА-Яа-я0-9]+/g, "_").slice(0, 40);
    saveAs(
      new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      `Akt_sverki_${safe}_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
    setActRow(null);
  };

  /* ЭКРАНДАГИ АКТ = ЮКЛАБ ОЛИНАДИГАН АКТ.
     ------------------------------------------------------------
     `reconciliationAct.ts` да «Сальдо конечное» = бошланғич қолдиқ +
     дебет − кредит. Экрандаги ойна эса фақат давр ҳаракатини
     кўрсатарди, яъни қолдиқ киритилган контрагентда экран ва ҳужжат
     АЙНАН ўша қолдиққа фарқ қиларди (2026-08-19 да ўлчанган: экранда
     30 000 000, ҳужжатда 31 000 000). Иккиси бир манбадан ҳисобланади.

     Асосий жадвалдаги «Фарқ» ЎЗГАРМАЙДИ — у ҳамон дебет − кредит,
     қолдиқ унга қўшилмайди. Бу фақат АКТ, яъни расмий ҳужжат шакли. */
  const actOpening = actRow ? opening.balances[rowKey(actRow)] : undefined;
  const actSaldo = (actOpening ?? 0) + (actRow?.difference ?? 0);

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) {
      notify.warn(t("Илтимос, камида битта Excel ёки CSV файлни танланг!"));
      return;
    }

    setLoading(true);
    setDetectedFormats([]);
    setWarnings([]);
    setSheetReports([]);
    setBalanceChecks([]);
    setPeriods(null);
    setKnownFormats([]);
    const formData = new FormData();

    files.forEach((f) => formData.append("files", f));
    formData.append("companyId", companyId);
    formData.append("includePending", includePending ? "true" : "false");

    try {
      const res = await authFetch("/api/upload-preview", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.success) {
        const correctedData = data.data.map((item: AggregatedTx) => ({
          ...item,
          difference: item.totalDebit - item.totalCredit,
        }));

        setParsedData(correctedData);
        setDetectedFormats(data.detectedFormats || []);
        setWarnings(data.warnings || []);
        setSheetReports(data.sheets || []);
        setBalanceChecks(data.balanceChecks || []);
        setPeriods(data.periods || null);
        setCategoryAuthors(data.categoryAuthors || {});
        setKnownFormats(data.formats || []);
        setMerges(data.merges || []);
        setMergeSuggestions(data.mergeSuggestions || []);
        // Огоҳлантириш бўлса — ҳисобот панели дарҳол очиқ турсин
        setShowReport((data.warnings || []).length > 0);

        // Янги файл — давр фильтри бошланғич ҳолатга қайтади
        setYearFilter("ALL");
        setMonthFilter("ALL");

        // Ҳамма КОРХОНА белгиланади: акс ҳолда Excel экспорт ва жадвал
        // остидаги «ЖАМИ» фақат фарқи борларни қўшади ва умумий сумма
        // ҳақиқийдан кичик кўринади. Коммунал/бюджет белгиланмайди —
        // улар жадвалда ҳам кўринмайди, лекин тепадаги «ЖАМИ»
        // карточкаси уларни ҳам ҳисоблайверади.
        setSelectedInns(
          correctedData
            .filter((d: AggregatedTx) => catOf(d) === "korxona")
            .map((d: AggregatedTx) => rowKey(d))
        );
      } else {
        setWarnings(data.warnings || []);
        setSheetReports(data.sheets || []);
        setBalanceChecks(data.balanceChecks || []);
        setShowReport(true);
        notify.error(t("Файл ўқилмади"), data.error ? t(data.error) : t("Номаълум хатолик юз берди"));
      }
    } catch (error) {
      console.error("Юклашда хато:", error);
      notify.error(t("Сервер билан уланишда хатолик!"));
    } finally {
      setLoading(false);
    }
  };

  const handleCellEdit = (inn: string, period: string, field: "debit" | "credit", val: string) => {
    const numVal = parseFloat(val.replace(/,/g, "")) || 0;

    setParsedData((prev) =>
      prev.map((row) => {
        if (row.inn !== inn) return row;

        const newMonthlyData = { ...row.monthlyData };
        const existing = newMonthlyData[period] || { debit: 0, credit: 0 };
        newMonthlyData[period] = { ...existing, [field]: numVal };

        const totalDebit = Object.values(newMonthlyData).reduce((a, b) => a + (b.debit || 0), 0);
        const totalCredit = Object.values(newMonthlyData).reduce((a, b) => a + (b.credit || 0), 0);

        return {
          ...row,
          monthlyData: newMonthlyData,
          totalDebit,
          totalCredit,
          difference: totalDebit - totalCredit,
        };
      })
    );
  };

  // Файллардаги ҳамма йиллар — давр танлаш учун
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    parsedData.forEach((tx) =>
      Object.keys(tx.monthlyData || {}).forEach((p) => {
        const y = Number(p.split("-")[0]);
        if (y) years.add(y);
      })
    );
    return [...years].sort();
  }, [parsedData]);

  // Танланган йилда ҳақиқатан маълумот бор ойлар
  const availableMonths = useMemo(() => {
    if (yearFilter === "ALL") return [];
    const months = new Set<number>();
    parsedData.forEach((tx) =>
      Object.keys(tx.monthlyData || {}).forEach((p) => {
        const [y, m] = p.split("-").map(Number);
        if (y === yearFilter && m) months.add(m);
      })
    );
    return [...months].sort((a, b) => a - b);
  }, [parsedData, yearFilter]);

  // Давр кесимидаги маълумот — қуйидаги ҳамма ҳисоб-китоб шундан кетади
  const periodData = useMemo(
    () => parsedData.map((tx) => slicePeriod(tx, yearFilter, monthFilter, cumulative)),
    [parsedData, yearFilter, monthFilter, cumulative]
  );

  // 🔍 Qidiruv + filtr + sort - bitta zanjirda
  const filteredData = useMemo(() => {
    const result = periodData.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.inn.includes(searchTerm);
      if (!matchesSearch) return false;

      // Танланган даврда ҳаракат бўлмаган контрагент рўйхатда керак эмас
      if (yearFilter !== "ALL" && item.totalDebit === 0 && item.totalCredit === 0) return false;

      // Тоифа: фақат КЎРИНИШНИ ўзгартиради, ҳисобни эмас
      if (categoryFilter === "COMPANY" && catOf(item) !== "korxona") return false;
      if (categoryFilter === "OTHER" && catOf(item) === "korxona") return false;

      if (filterType === "DIFF") return Math.abs(item.difference) > 0.01;
      if (filterType === "EQUAL") return Math.abs(item.difference) <= 0.01;
      return true;
    });

    const dir = sortDir === "asc" ? 1 : -1;
    result.sort((a, b) => {
      switch (sortKey) {
        case "name":
          return dir * (a.name || "").localeCompare(b.name || "", "ru");
        case "inn":
          return dir * (a.inn || "").localeCompare(b.inn || "");
        case "debit":
          return dir * (a.totalDebit - b.totalDebit);
        case "credit":
          return dir * (a.totalCredit - b.totalCredit);
        case "diff":
          return dir * (a.difference - b.difference);
        default:
          return 0;
      }
    });
    return result;
  }, [periodData, searchTerm, filterType, categoryFilter, sortKey, sortDir, yearFilter]);

  const displayData = useMemo(() =>
    filteredData.filter((tx) => selectedInns.includes(rowKey(tx))),
    [filteredData, selectedInns]);

  // Сақлашга — танланган давр кесимидаги рақамлар (кўринаётгани билан бир хил)
  const selectedFullData = useMemo(() =>
    periodData.filter((tx) => selectedInns.includes(rowKey(tx))),
    [periodData, selectedInns]);

  const toggleSelection = (key: string) => {
    setSelectedInns((prev) => prev.includes(key) ? prev.filter((i) => i !== key) : [...prev, key]);
  };

  const toggleAll = () => {
    const keys = filteredData.map((d) => rowKey(d));
    const allSelected = keys.length > 0 && keys.every((k) => selectedInns.includes(k));
    if (allSelected) {
      setSelectedInns((prev) => prev.filter((k) => !keys.includes(k)));
    } else {
      setSelectedInns((prev) => Array.from(new Set([...prev, ...keys])));
    }
  };

  const toggleExpand = (key: string) => {
    setExpandedInns((prev) => prev.includes(key) ? prev.filter((i) => i !== key) : [...prev, key]);
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "name" || key === "inn" ? "asc" : "desc");
    }
  };

  // 🏭 Контрагент тоифасини ўзгартириш. Қарор шу КОРХОНА учун
  // сақланади — бошқа мижозда бу ташкилот асосий контрагент бўлиши
  // мумкин. «Корхона» ни танлаш тизимнинг бошланғич рўйхатини ҳам
  // бекор қилади, яъни контрагент асосий сверкага қайтади.
  const handleCategoryChange = async (tx: AggregatedTx, category: Category) => {
    const key = rowKey(tx);
    const prevCat = catOf(tx);
    if (prevCat === category) return;

    setSavingCategory(key);
    // Оптимистик: жадвалда дарҳол кўринади
    setParsedData((prev) =>
      prev.map((r) =>
        rowKey(r) === key
          ? { ...r, category, categorySource: "user" as const, categoryHint: undefined, categoryHintLabel: undefined }
          : r
      )
    );
    // Птичка жадвал билан мос турсин: корхонага қайтса белгиланади,
    // коммуналга ўтса белгидан чиқади (акс ҳолда пастдаги «Жами
    // танланганлар» кўринмаётган қаторни ҳам қўшиб юборарди).
    setSelectedInns((prev) =>
      category === "korxona"
        ? Array.from(new Set([...prev, key]))
        : prev.filter((k) => k !== key)
    );

    try {
      const res = await authFetch("/api/counterparty-category", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId, key, inn: tx.inn, name: tx.name, category }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Номаълум хато");
    } catch (error) {
      // Сақланмаса — эски ҳолатга қайтарамиз, акс ҳолда экранда
      // сақланган бўлиб кўринарди
      setParsedData((prev) =>
        prev.map((r) =>
          rowKey(r) === key
            ? { ...r, category: prevCat, categorySource: tx.categorySource, categoryHint: tx.categoryHint, categoryHintLabel: tx.categoryHintLabel }
            : r
        )
      );
      setSelectedInns((prev) =>
        prevCat === "korxona"
          ? Array.from(new Set([...prev, key]))
          : prev.filter((k) => k !== key)
      );
      notify.error(
        t("Тоифани сақлаб бўлмади:"),
        error instanceof Error ? error.message : String(error)
      );
    } finally {
      setSavingCategory(null);
    }
  };

  const grandTotals = displayData.reduce(
    (acc, curr) => {
      acc.debit += curr.totalDebit;
      acc.credit += curr.totalCredit;
      acc.diff += curr.difference;
      acc.saldo += curr.openingSaldo || 0;
      return acc;
    },
    { debit: 0, credit: 0, diff: 0, saldo: 0 }
  );

  // ҲАММА контрагент бўйича якун — фильтр ва птичкадан қатъи назар.
  // Пастдаги «Жами танланганлар» фақат белгиланганларни қўшади, шу
  // сабабли фойдаланувчи «фактура камайиб қолди» деб ўйлаши мумкин эди.
  const periodTotals = useMemo(() => {
    const t = {
      debit: 0, credit: 0, diff: 0, count: 0, withDiff: 0,
      // Корхоналар кесими — асосий сверка шу
      companyDebit: 0, companyCredit: 0, companyCount: 0,
      // Коммунал + бюджет + банк + хизмат
      otherDebit: 0, otherCredit: 0, otherCount: 0,
      // Ном бўйича «коммуналга ўхшайди» деб ТАХМИН қилинганлар. Улар
      // жадвалда ҚОЛАДИ — фақат текшириб кўриш учун саналади.
      hintCount: 0,
    };
    for (const tx of periodData) {
      if (yearFilter !== "ALL" && tx.totalDebit === 0 && tx.totalCredit === 0) continue;
      t.debit += tx.totalDebit;
      t.credit += tx.totalCredit;
      t.count++;
      if (Math.abs(tx.difference) > 0.01) t.withDiff++;
      if (catOf(tx) === "korxona") {
        t.companyDebit += tx.totalDebit;
        t.companyCredit += tx.totalCredit;
        t.companyCount++;
        if (tx.categoryHint) t.hintCount++;
      } else {
        t.otherDebit += tx.totalDebit;
        t.otherCredit += tx.totalCredit;
        t.otherCount++;
      }
    }
    t.diff = t.debit - t.credit;
    return t;
  }, [periodData, yearFilter]);

  // Давр танланганда «ўтган даврдан сальдо» устуни қўшилади
  /** АСОСИЙ СВЕРКА фарқи — фақат корхоналар. Жадвал ости билан
   *  бир хил бўлиши учун алоҳида чиқарилди. */
  const companyDiff = periodTotals.companyDebit - periodTotals.companyCredit;

  /** Nechta kontragentda saqlangan qoldiq bor */
  const openingCount = useMemo(
    () => Object.keys(opening.balances).length,
    [opening.balances]
  );

  /** Boshlang'ich qoldiq JAMI — «Фарқи» kartasi bilan BIR XIL qamrov
   *  (faqat korxonalar), aks holda ekranda yana ikkita mos kelmaydigan
   *  raqam paydo bo'lardi. */
  const openingTotal = useMemo(
    () =>
      periodData
        .filter((tx) => catOf(tx) === "korxona")
        .reduce((sum, tx) => sum + (opening.balances[rowKey(tx)] || 0), 0),
    [periodData, opening.balances]
  );

  // ============================================================
  // YOPILMAGAN FAKTURALAR (chiqim tomoni)
  // ------------------------------------------------------------
  // `aging.ts` kirim sverkasi uchun yozilgan, lekin hisobi bir xil:
  // to'lovlar fakturalarni eng eskisidan boshlab yopadi. Farqi
  // faqat MA'NOda — bu yerda BIZ to'laymiz, ya'ni yopilmagan
  // faktura bizning qarzimiz.
  //
  // Chiqim tomonida to'lov va faktura BITTA ro'yxatda (debet/kredit
  // bo'lib), shuning uchun ular ajratib beriladi:
  //   kredit > 0  -> kelgan faktura
  //   debet  > 0  -> to'langan pul
  // ============================================================
  const openInvoicesByKey = useMemo(() => {
    const input = periodData.map((tx) => ({
      key: rowKey(tx),
      inn: tx.inn,
      name: tx.name,
      invoices: (tx.transactions || [])
        .filter((r) => (r.credit || 0) > 0)
        .map((r) => ({ date: r.date || null, number: r.doc || "", amount: r.credit })),
      payments: (tx.transactions || [])
        .filter((r) => (r.debit || 0) > 0)
        .map((r) => ({ date: r.date || null, amount: r.debit })),
    }));
    const report = buildAging(input, null);
    const map = new Map<string, AgingOpenInvoice[]>();
    for (const party of report.parties) map.set(party.key, party.openInvoices);
    return map;
  }, [periodData]);

  const showSaldo = yearFilter !== "ALL";
  /** Boshlang'ich qoldiq ustuni FAQAT kiritilgan bo'lsa ko'rinadi —
   *  bo'sh ustun jadvalni kengaytiradi, foyda bermaydi. */
  const showOpening = openingCount > 0;
  // + «Тоифа» устуни
  const colCount = 9 + (showSaldo ? 1 : 0) + (showOpening ? 2 : 0);
  const periodTitle =
    yearFilter === "ALL"
      ? t("Барча давр")
      : monthFilter === "ALL"
        ? `${yearFilter}`
        : `${t(MONTH_NAMES[(monthFilter as number) - 1])} ${yearFilter}${cumulative ? ` ${t("(йил бошидан)")}` : ""}`;

  // ============================================================
  // HISOBOT TARIXI
  // ------------------------------------------------------------
  // Eski hisobotni ochish YANGI SO'ROV qilmaydi — hujjat allaqachon
  // `savedDocs` da. O'chirish esa kolleksiyaning cheksiz o'sishini
  // to'xtatadi (har «Сақлаш» yangi hujjat yaratadi).
  // ============================================================
  const history: ReportSummary[] = useMemo(
    () => savedDocs.map((d) => summarizeOutgoing(d.id, d)),
    [savedDocs]
  );

  const handleOpenSaved = (id: string) => {
    const d = savedDocs.find((x) => x.id === id);
    if (!d?.firmsData?.length) {
      notify.warn(t("Бу ҳисоботда контрагент йўқ."));
      return;
    }
    // «Фарқ» QAYTA hisoblanadi: eski hujjatlarda ishora teskari
    // bo'lishi mumkin (2026-08-16 dagi tuzatishgacha saqlanganlar).
    const corrected = d.firmsData.map((item) => ({
      ...item,
      difference: item.totalDebit - item.totalCredit,
    }));
    setParsedData(corrected);
    setSelectedInns(corrected.filter((x) => catOf(x) === "korxona").map((x) => rowKey(x)));
    setActiveReportId(d.id);
    setRestoredAt(formatStamp(stampToDate(d.savedAt)));
  };

  const handleDeletedReport = (id: string) => {
    setSavedDocs((prev) => prev.filter((x) => x.id !== id));
    // Ekranda turgani o'chirilsa — raqamlar qoladi, lekin ular endi
    // saqlanmagan. Buni AYTISH shart.
    if (activeReportId === id) {
      setActiveReportId(null);
      setRestoredAt(null);
    }
  };

  // ============================================================
  // BIRLASHTIRISH
  // ------------------------------------------------------------
  // Saqlangandan keyin jadval DARHOL yangilanadi: birlashtirish
  // mantig'i klientda ham server bilan AYNAN bir xil funksiya
  // (`mergeOutgoingRows`). Faylni qayta yuklash shart emas.
  //
  // Ajratish esa qayta yuklashni talab qiladi — birlashgan qatorda
  // oylik kesim allaqachon qo'shilib ketgan, uni ishonchli ajratib
  // bo'lmaydi. Buni foydalanuvchiga AYTAMIZ, jimgina qoldirmaymiz.
  // ============================================================
  const mergeRows: MergeRow[] = useMemo(
    () =>
      parsedData.map((d) => ({
        key: rowKey(d),
        inn: d.inn,
        name: d.name,
        turnover: d.totalDebit + d.totalCredit,
        mergedFrom: d.mergedFrom,
      })),
    [parsedData]
  );

  const handleMerged = (group: MergeGroup) => {
    setMerges((prev) => [...prev.filter((g) => g.primary !== group.primary), group]);
    // `key` ATAYLAB qayta qo'yiladi: klient turida u ixtiyoriy
    // (eski saqlangan hisobotlarda yo'q), birlashtirish esa aynan
    // kalitga tayanadi. `rowKey` serverdagi bilan bir xil qoida.
    setParsedData((prev) => mergeOutgoingRows(prev.map((d) => ({ ...d, key: rowKey(d) })), [group]));
    // Qo'shilgan kalitlar endi yo'q — belgilashdan olib tashlanadi,
    // aks holda «Жами танланганлар» yo'q qatorni sanayverardi.
    setSelectedInns((prev) => {
      const gone = new Set(group.members);
      const kept = prev.filter((k) => !gone.has(k));
      return kept.includes(group.primary) || prev.some((k) => gone.has(k))
        ? [...new Set([...kept, group.primary])]
        : kept;
    });
    setMergeSuggestions((prev) =>
      prev.filter((sug) => !sug.keys.some((k) => group.members.includes(k) || k === group.primary))
    );
  };

  const handleUnmerged = (primary: string) => {
    setMerges((prev) => prev.filter((g) => g.primary !== primary));
  };

  const handleSaveToFirebase = async () => {
    if (selectedFullData.length === 0) {
      notify.warn(t("Сақлаш учун камида битта фирмани белгиланг!"));
      return;
    }
    setIsSaving(true);
    try {
      const totals = selectedFullData.reduce(
        (acc, curr) => {
          acc.debit += curr.totalDebit;
          acc.credit += curr.totalCredit;
          acc.diff += curr.difference;
          return acc;
        },
        { debit: 0, credit: 0, diff: 0 }
      );

      // «Нечтасида фарқ бор» — SAQLASHDA sanaladi. Korxonalar ro'yxati
      // shu sonni ko'rsatadi; ilgari u yerda butun `firmsData` (900 KB
      // gacha) yuklab olinib sanalardi. Qoida ro'yxatdagi bilan AYNAN
      // bir xil: |debet − kredit| > 0,01.
      const diffCount = selectedFullData.filter(
        (f) => Math.abs(f.totalDebit - f.totalCredit) > 0.01
      ).length;

      if (!workspaceId) {
        notify.error(t("Иш майдони аниқланмади. Тизимдан чиқиб, қайта киринг."));
        return;
      }

      const period = {
        year: yearFilter === "ALL" ? null : yearFilter,
        month: monthFilter === "ALL" ? null : monthFilter,
        cumulative,
        label: periodTitle,
      };
      const ref = await addDoc(collection(db, "sverka_reports"), {
        companyId: companyId,
        // Egalik: hisobot boshqa ish maydoniga ko'rinmasligi uchun
        workspaceId,
        savedAt: serverTimestamp(),
        // Қайси давр кесими сақлангани — кейин очилганда аниқ бўлиши учун
        period,
        totals,
        diffCount,
        firmsData: selectedFullData,
      });
      // `serverTimestamp()` klientda hali BO'SH — tarix qatori sanasiz
      // chiqmasligi uchun mahalliy vaqt qo'yiladi.
      const now = new Date();
      const localStamp = { toMillis: () => now.getTime(), toDate: () => now };
      setSavedDocs((prev) =>
        newestFirst([
          {
            id: ref.id,
            companyId,
            savedAt: localStamp,
            period,
            totals,
            firmsData: selectedFullData,
          },
          ...prev,
        ])
      );
      setActiveReportId(ref.id);
      setRestoredAt(null);
      notify.ok(t("Муваффақиятли сақланди!"));
    } catch (error) {
      console.error("Firebase хатолиги:", error);
      notify.error(t("Сақлашда хатолик юз берди."));
    } finally {
      setIsSaving(false);
    }
  };

  // 📈 MUKAMMAL EXCEL EXPORT (EXCELJS)
  const handleExportExcel = async () => {
    if (displayData.length === 0) {
      notify.warn(t("Рўйхат бўш. Камида битта фирмани белгиланг!"));
      return;
    }

    const today = new Date().toLocaleDateString('ru-RU');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(t("Сверка"));

    // --- Ustun kengliklari ---
    worksheet.columns = [
      { key: "name", width: 50 },
      { key: "inn", width: 18 },
      { key: "debit", width: 22 },
      { key: "credit", width: 22 },
      { key: "diff", width: 22 },
      { key: "note", width: 35 },
    ];

    // --- Sarlavha qatorlari ---
    // Корхона номи ПРОПДАН келади. Илгари бу ерда битта мижознинг номи
    // қотириб қўйилган эди — ҳар кимнинг ҳисоботида ўша ном чиқарди.
    const titleRow = worksheet.addRow([companyName]);
    titleRow.getCell(1).font = { bold: true, size: 14, name: "Times New Roman" };

    const dateRow = worksheet.addRow(["", "", "", "", "", `${periodTitle} · ${today} ${t("ҳолатига")}`]);
    dateRow.getCell(6).alignment = { horizontal: "right" };
    dateRow.getCell(6).font = { size: 11, name: "Times New Roman" };

    const headerRow = worksheet.addRow([
      t("Фирма номлари"),
      t("СТИР"),
      t("Тўланган пул жами"),
      t("Келган фактура"),
      t("Фарқи"),
      t("Изоҳ")
    ]);
    headerRow.height = 30;

    headerRow.eachCell((cell) => {
      cell.font = { bold: true, name: "Times New Roman", size: 12 };
      cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" }
      };
    });

    // --- Ma'lumotlarni yozish ---
    displayData.forEach((tx) => {
      const row = worksheet.addRow([
        tx.name,
        tx.inn,
        tx.totalDebit,
        tx.totalCredit,
        tx.difference,
        t(verdict(tx.difference).text)
      ]);

      row.eachCell((cell, colNumber) => {
        cell.font = { name: "Times New Roman", size: 11 };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" }
        };

        if (colNumber === 1) {
          cell.alignment = { horizontal: "left", vertical: "middle", wrapText: true };
        } else if (colNumber === 2) {
          cell.alignment = { horizontal: "center", vertical: "middle" };
        } else if (colNumber === 6) {
          cell.alignment = { horizontal: "center", vertical: "middle" };
        } else {
          cell.numFmt = '#,##0.00';
          cell.alignment = { horizontal: "right", vertical: "middle" };
        }
      });
    });

    // --- ЖАМИ qatori ---
    const grandRow = worksheet.addRow([
      t("ЖАМИ"),
      "",
      grandTotals.debit,
      grandTotals.credit,
      grandTotals.diff,
      t(verdict(grandTotals.diff).text)
    ]);

    grandRow.eachCell((cell, colNumber) => {
      cell.font = { bold: true, name: "Times New Roman", size: 12 };
      cell.border = {
        top: { style: "medium" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" }
      };

      if (colNumber === 1 || colNumber === 2) {
        cell.alignment = { horizontal: "center", vertical: "middle" };
      } else if (colNumber === 6) {
        cell.alignment = { horizontal: "center", vertical: "middle" };
      } else {
        cell.numFmt = '#,##0.00';
        cell.alignment = { horizontal: "right", vertical: "middle" };
      }
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const safe = companyName.replace(/[^A-Za-zА-Яа-я0-9]+/g, "_").slice(0, 40);
    saveAs(blob, `Chiqim_sverka_${safe}_${today}.xlsx`);
  };

  // БУТУН ЭКРАНЛИ юклагич ЭМАС: бу компонент энди саҳифанинг ЎЗИ
  // эмас, таб ичидаги бўлак. `min-h-screen` спиннер сарлавҳа ва
  // табларни пастга суриб юборарди.
  if (isFetchingData) {
    return (
      <Card className="flex items-center justify-center gap-3 py-12">
        <Spinner className="h-5 w-5 text-accent-ink" />
        <span className="text-body text-ink-3">{t("Маълумотлар юкланмоқда...")}</span>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 📤 YUKLASH KARTASI */}
      <Card>
        <form onSubmit={handleFileUpload} className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-stretch">
            <FileDrop
              className="w-full md:w-3/4"
              files={files}
              onFiles={setFiles}
              label={t("Excel / CSV файлларни танланг")}
              hint={t(".xls, .xlsx, .csv — бир нечта файлни бирга юкласа бўлади")}
              selectedLabel={`${files.length} ${t("та файл танланди")}`}
            />
            <Button type="submit" variant="primary" loading={loading} className="md:w-1/4">
              {loading ? t("Ўқилмоқда...") : t("Таҳлил")}
            </Button>
          </div>

          <Checkbox
            checked={includePending}
            onChange={setIncludePending}
            label={t("Имзо кутилаётган фактураларни ҳам ҳисоблаш")}
            hint={t("— одатда ҳисобланмайди (имзоланмаган фактура кучга кирмаган)")}
          />

          {/* Aniqlangan formatlar */}
          {(detectedFormats.length > 0 || sheetReports.length > 0) && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-caption text-ink-3">{t("Аниқланган форматлар:")}</span>
              {detectedFormats.map((f) => (
                <Badge key={f} tone="ok">
                  {FORMAT_LABELS[f] ? t(FORMAT_LABELS[f]) : f}
                </Badge>
              ))}
              {/* ТОПИЛГАН ДАВР — бухгалтер файлни очмасдан «тўғри
                  файлми» деб кўради. Иккита алоҳида белги: кўчирма ва
                  фактура ҳар хил даврни қамраши мумкин. */}
              {periods?.bank.from && (
                <Badge tone="muted">
                  {t("Кўчирма")}: {periodRangeLabel(periods.bank)}
                </Badge>
              )}
              {periods?.faktura.from && (
                <Badge tone="muted">
                  {t("Фактура")}: {periodRangeLabel(periods.faktura)}
                </Badge>
              )}
              {knownFormats.filter((f) => f.isNew).map((f) => (
                <Badge key={f.id} tone="info" className="cursor-help" >
                  <span title={f.label}>🧠 {t("Янги шакл ўрганилди")}</span>
                </Badge>
              ))}
              {sheetReports.length > 0 && (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className={cx("ml-auto", warnings.length > 0 && "border-warn text-warn")}
                  onClick={() => setShowReport((v) => !v)}
                >
                  {warnings.length > 0 ? `⚠ ${warnings.length} ${t("та эслатма")}` : t("✓ Ўқиш ҳисоботи")} ·{" "}
                  {showReport ? t("яшириш") : t("кўриш")}
                </Button>
              )}
            </div>
          )}

          {/* ЎҚИШ ҲИСОБОТИ — қайси файлдан нима ўқилгани, нима ўқилмагани.
              Бу ерда БАНК ТИЛИ ишлатилади (дебет/кредит/Итого) — бу
              атайлаб: бухгалтер шу ерда файлни текширади. */}
          {showReport && sheetReports.length > 0 && (
            <div className="overflow-hidden rounded-lg border border-line">
              <div className="custom-scrollbar overflow-x-auto">
                <table className="w-full border-collapse text-caption">
                  <thead className="bg-surface-2">
                    <tr>
                      <th className="border-b border-line px-3 py-2 text-left font-medium text-ink-3">{t("Файл / варақ")}</th>
                      <th className="border-b border-line px-3 py-2 text-left font-medium text-ink-3">{t("Формат")}</th>
                      <th className="border-b border-line px-3 py-2 text-center font-medium text-ink-3">{t("Қатор")}</th>
                      <th className="border-b border-line px-3 py-2 text-right font-medium text-ink-3">{t("Чиққан пул")}</th>
                      <th className="border-b border-line px-3 py-2 text-right font-medium text-ink-3">{t("Келган")}</th>
                      <th className="border-b border-line px-3 py-2 text-right font-medium text-ink-3">{t("Файл якуни")}</th>
                      <th className="border-b border-line px-3 py-2 text-left font-medium text-ink-3">{t("Изоҳ")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {sheetReports.map((s, i) => {
                      const skipped = s.format === "SVODKA" || s.format === "AKT_SVERKI" || s.format === "TANILMADI";
                      return (
                        <tr key={i} className={skipped ? "text-ink-3" : "text-ink-2"}>
                          <td className="px-3 py-2">{s.file}<span className="text-ink-3"> / {s.sheet}</span></td>
                          <td className="px-3 py-2 font-mono">{s.format}</td>
                          <td className="px-3 py-2 text-center tabular">{s.rows || "—"}</td>
                          <td className="px-3 py-2 text-right tabular">{s.debit ? formatNum(s.debit) : "—"}</td>
                          <td className="px-3 py-2 text-right tabular">{s.credit ? formatNum(s.credit) : "—"}</td>
                          <td className="px-3 py-2 text-right tabular text-ink-3">
                            {s.allDebit || s.allCredit
                              ? `${formatNum(s.allDebit || 0)} / ${formatNum(s.allCredit || 0)}`
                              : "—"}
                          </td>
                          <td className="px-3 py-2 text-ink-3">{s.note ? t(s.note) : ""}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* ҚОЛДИҚ ТЕНГЛАМАСИ — «Итого»дан мустақил назорат.
                  Дебет билан кредит алмашиб кетса «Итого» буни сезмайди
                  (йиғинди барибир тўғри), қолдиқ тенгламаси эса йиқилади. */}
              {balanceChecks.length > 0 && (
                <div className="border-t border-line p-3">
                  <p className="mb-2 text-caption text-ink-3">
                    <span className="font-medium text-ink-2">{t("Қолдиқ тенгламаси")}</span>
                    {" — "}{t("бошланғич қолдиқ + кирим − чиқим = охирги қолдиқ")}
                  </p>
                  <ul className="space-y-1">
                    {balanceChecks.map((b, i) => (
                      <li key={i} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-caption">
                        <span
                          className={cx(
                            "shrink-0 font-semibold",
                            b.status === "MOS" ? "text-ok" : b.status === "NOMOS" ? "text-warn" : "text-ink-3"
                          )}
                        >
                          {b.status === "MOS" ? "✓" : b.status === "NOMOS" ? "⚠" : "—"}
                        </span>
                        <span className="text-ink-2">{b.file}</span>
                        {b.status === "YO'Q" ? (
                          <span className="text-ink-3">{t(b.note || "текшириб бўлмади")}</span>
                        ) : (
                          <>
                            <span className="tabular text-ink-3">
                              {formatNum(b.opening ?? 0)} + {formatNum(b.credit)} − {formatNum(b.debit)}
                              {" = "}
                              {formatNum(b.expected ?? 0)}
                            </span>
                            <span
                              className={cx(
                                "tabular",
                                b.status === "MOS" ? "text-ink-3" : "font-semibold text-warn"
                              )}
                            >
                              ({t("файлда")} {formatNum(b.closing ?? 0)})
                            </span>
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {knownFormats.length > 0 && (
                <div className="border-t border-line p-3">
                  <p className="mb-2 text-caption font-medium text-ink-2">
                    {t("Тизим таниган экспорт шакллари")} ({knownFormats.length})
                  </p>
                  <ul className="space-y-1">
                    {knownFormats.map((f) => (
                      <li key={f.id} className="flex gap-2 text-caption text-ink-2">
                        <span className={cx("shrink-0 font-medium", f.isNew ? "text-info" : "text-ink-3")}>
                          {f.isNew ? t("янги") : t("таниш")}
                        </span>
                        <span className="truncate">{f.label}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {warnings.length > 0 && (
                <ul className="space-y-1.5 border-t border-line bg-warn-soft p-3">
                  {warnings.map((w, i) => (
                    <li key={i} className="flex gap-2 text-caption text-warn">
                      <span className="shrink-0">⚠</span>
                      {/* Сервер огоҳлантиришлари динамик тузилади —
                          луғатда бўлмайди, лекин лотин ёзувига
                          автоматик ўгирилади */}
                      <span>{t(w)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Экрандаги натижа ФАЙЛдан эмас, САҚЛАНГАН ҳисоботдан
              келган бўлса — буни айтиш шарт, акс ҳолда бухгалтер
              эски рақамни янги деб ўқийди. */}
          {restoredAt && (
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="info">
                {t("Сақланган ҳисобот")}: {restoredAt}
              </Badge>
            </div>
          )}

          {/* Сақланган ҳисоботлар. ЁПИҚ туради — жадвални бекитмайди
              ва янги мажбурий қадам қўшмайди. */}
          <ReportHistory
            kind="out"
            items={history}
            activeId={activeReportId}
            onOpen={handleOpenSaved}
            onDeleted={handleDeletedReport}
            format={formatNum}
          />
        </form>
      </Card>

      {parsedData.length > 0 && (
        <>
          {/* УМУМИЙ ЯКУН — фильтрдан қатъи назар, ҳамма контрагент бўйича.
              Катта рақам ҳар доим ТЎЛИҚ: у файлнинг ўз «Итого» қаторига
              тенг бўлиши керак, шунинг учун ундан коммунал ҳам
              чиқарилмайди. Остидаги кичик қатор эса корхоналар кесими. */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              label={`${t("Жами тўланган пул")} · ${t("ҳаммаси")}`}
              count={periodTotals.debit}
              format={formatNum}
              tone="cash"
              hint={
                <>
                  {t("корхоналар")}: <Num tone="default">{formatNum(periodTotals.companyDebit)}</Num>
                  {periodTotals.otherCount > 0 && (
                    <> · {t("коммунал/бюджет")}: <span className="tabular">{formatNum(periodTotals.otherDebit)}</span></>
                  )}
                </>
              }
            />
            <StatCard
              label={`${t("Жами келган фактура")} · ${t("ҳаммаси")}`}
              count={periodTotals.credit}
              format={formatNum}
              tone="invoice"
              hint={
                <>
                  {t("корхоналар")}: <Num tone="default">{formatNum(periodTotals.companyCredit)}</Num>
                  {periodTotals.otherCount > 0 && (
                    <> · {t("коммунал/бюджет")}: <span className="tabular">{formatNum(periodTotals.otherCredit)}</span></>
                  )}
                </>
              }
            />
            {/* ФАРҚ КАРТАСИ — ЖАДВАЛ БИЛАН БИР ХИЛ РАҚАМ.
                Юқоридаги икки карта тўлиқ (улар файлнинг «Итого»сига
                тенг бўлиши шарт), бу эса АСОСИЙ СВЕРКА рақами:
                коммунал/бюджет асосий сверкага кирмайди ва жадвалда
                ҳам кўринмайди. Илгари бу карта тўлиқ рақамни
                кўрсатарди — экранда иккита ҳар хил «Фарқ» турарди. */}
            <StatCard
              label={`${t("Фарқи")} · ${t("корхоналар")} (${periodTitle})`}
              count={companyDiff}
              format={formatNum}
              tone={Math.abs(companyDiff) <= 0.01 ? "ok" : verdict(companyDiff).tone}
              hint={
                <>
                  {periodTotals.otherCount > 0 ? (
                    <>
                      {t("коммунал/бюджет")}:{" "}
                      <span className="tabular">{formatNum(periodTotals.otherDebit - periodTotals.otherCredit)}</span>
                      {" · "}
                      {t("ҳаммаси")}: <span className="tabular">{formatNum(periodTotals.diff)}</span>
                    </>
                  ) : (
                    <>{t("бошқа тоифадаги контрагент йўқ")}</>
                  )}
                  {/* Бошланғич қолдиқ киритилган бўлса — ЯКУНИЙ
                      қолдиқ ҳам кўрсатилади. Бухгалтерга керак
                      бўладиган рақам аслида шу. */}
                  {openingCount > 0 && (
                    <>
                      <br />
                      {t("Бошланғич қолдиқ")}:{" "}
                      <span className="tabular">{formatNum(openingTotal)}</span>
                      {" · "}
                      {t("Якуний қолдиқ")}:{" "}
                      <Num tone="default">{formatNum(openingTotal + companyDiff)}</Num>
                    </>
                  )}
                </>
              }
            />
          </div>

          {periodTotals.hintCount > 0 && (
            <Alert tone="warn">
              <b>{periodTotals.hintCount}</b> {t("та контрагент коммуналга ўхшайди (номи бўйича ёки бошқа корхоналар шундай белгилагани учун), лекин улар")}
              <b> {t("ҳисобдан чиқарилмаган")}</b> {t("— жадвалда «?» белгиси билан турибди. Текшириб, тоифасини ўзгартиринг. Тизим ўзи ҳеч қачон яшириб қўймайди.")}
            </Alert>
          )}

          <Card padded={false}>
            {/* FILTER BAR */}
            <div className="flex flex-col gap-3 border-b border-line p-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-2">
                <SearchInput
                  placeholder={t("Фирма номи ёки СТИР бўйича қидирув...")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  wrapClassName="w-full sm:w-72"
                />

                {/* 📅 ЙИЛ */}
                {availableYears.length > 0 && (
                  <Select
                    aria-label={t("Давр")}
                    value={String(yearFilter)}
                    onChange={(e) => {
                      const v = e.target.value;
                      setYearFilter(v === "ALL" ? "ALL" : Number(v));
                      setMonthFilter("ALL");
                    }}
                    className="w-auto"
                  >
                    <option value="ALL">{t("Барча давр")}</option>
                    {availableYears.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </Select>
                )}

                {/* 📅 ОЙ */}
                {yearFilter !== "ALL" && availableMonths.length > 0 && (
                  <Select
                    aria-label={t("Ой")}
                    value={String(monthFilter)}
                    onChange={(e) => {
                      const v = e.target.value;
                      setMonthFilter(v === "ALL" ? "ALL" : Number(v));
                    }}
                    className="w-auto"
                  >
                    <option value="ALL">{t("Йил бўйича")}</option>
                    {availableMonths.map((m) => (
                      <option key={m} value={m}>{t(MONTH_NAMES[m - 1])}</option>
                    ))}
                  </Select>
                )}

                {yearFilter !== "ALL" && monthFilter !== "ALL" && (
                  <Checkbox
                    checked={cumulative}
                    onChange={setCumulative}
                    label={t("Йил бошидан")}
                    className="h-10 items-center rounded-md border border-line px-3"
                  />
                )}

                <Select
                  aria-label={t("Фильтр")}
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as "ALL" | "DIFF" | "EQUAL")}
                  className="w-auto"
                >
                  <option value="ALL">{t("Барчаси")} ({parsedData.length})</option>
                  <option value="DIFF">{t("Фарқи борлар")}</option>
                  <option value="EQUAL">{t("Тенг бўлганлар")}</option>
                </Select>

                {/* 🏭 ТОИФА — фақат кўринишни ўзгартиради, ҳисобни эмас */}
                <Select
                  aria-label={t("Тоифа")}
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value as "COMPANY" | "OTHER" | "ALL")}
                  title={t("Коммунал, бюджет ва банк комиссияси асосий сверкани чалғитади. Улар йўқолмайди — тепадаги «ЖАМИ» ҳар доим тўлиқ.")}
                  className="w-auto"
                >
                  <option value="COMPANY">{t("Фақат корхоналар")} ({periodTotals.companyCount})</option>
                  <option value="OTHER">{t("Коммунал/бюджет")} ({periodTotals.otherCount})</option>
                  <option value="ALL">{t("Ҳаммаси")} ({periodTotals.count})</option>
                </Select>
              </div>

              <div className="flex shrink-0 gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setBalanceOpen(true)}
                  disabled={parsedData.length === 0}
                  icon={<CalendarClock className="h-4 w-4" />}
                  title={t("Файл бошланишидан ОЛДИНГИ давр қолдиғи")}
                >
                  {t("Бошланғич қолдиқ")}
                  {openingCount > 0 && ` (${openingCount})`}
                </Button>

                <Button
                  variant="secondary"
                  onClick={() => setMergeOpen(true)}
                  disabled={parsedData.length === 0}
                  icon={<Merge className="h-4 w-4" />}
                  title={t("Битта фирма икки хил ёзилган бўлса — қаторларни қўшинг")}
                  className={cx(mergeSuggestions.length > 0 && "border-warn text-warn")}
                >
                  {t("Бирлаштириш")}
                  {mergeSuggestions.length > 0 && ` (${mergeSuggestions.length})`}
                </Button>

                <Button
                  variant="secondary"
                  onClick={handleExportExcel}
                  disabled={displayData.length === 0}
                  icon={<Download className="h-4 w-4" />}
                >
                  {t("Excel юклаш")}
                </Button>

                <Button
                  variant="primary"
                  onClick={handleSaveToFirebase}
                  disabled={selectedFullData.length === 0}
                  loading={isSaving}
                  icon={<Save className="h-4 w-4" />}
                >
                  {isSaving ? t("Сақланмоқда...") : t("Сақлаш")}
                </Button>
              </div>
            </div>

            <p className="border-b border-line px-4 py-3 text-caption text-ink-3">
              {t("Жами")} <b className="text-ink-2">{periodTotals.count}</b> {t("контрагент, шундан")}
              {" "}<b className="text-ink-2">{periodTotals.withDiff}</b> {t("тасида фарқ бор. Қуйидаги жадвалда")}
              {" "}<b className="text-ink-2">
                {filterType === "DIFF" ? t("фақат фарқи борлар") : filterType === "EQUAL" ? t("фақат тенг бўлганлар") : t("барчаси")}
              </b> {t("кўрсатилмоқда, жадвал остидаги «Жами танланганлар» эса фақат ✓ белгиланганларни қўшади.")}
            </p>

            {/* JADVAL */}
            <div className="p-4">
              <TableFrame>
                <Table>
                  <Thead sticky>
                    <tr>
                      <Th align="center" width="w-12" sticky>
                        <RowCheckbox
                          checked={filteredData.length > 0 && filteredData.every((d) => selectedInns.includes(rowKey(d)))}
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
                      <Th align="center" width="w-32" sticky>{t("Тоифа")}</Th>
                      {showOpening && (
                        <Th align="right" width="w-40" sticky>{t("Бошланғич қолдиқ")}</Th>
                      )}
                      {showSaldo && (
                        <Th align="right" width="w-36" sticky>{t("Ўтган даврдан")}</Th>
                      )}
                      <Th align="right" width="w-40" sticky>
                        <SortHeader label={t("Тўланган пул жами")} k="debit" align="right" activeKey={sortKey} dir={sortDir} onToggle={toggleSort} />
                      </Th>
                      <Th align="right" width="w-40" sticky>
                        <SortHeader label={t("Келган фактура")} k="credit" align="right" activeKey={sortKey} dir={sortDir} onToggle={toggleSort} />
                      </Th>
                      <Th align="right" width="w-40" sticky>
                        <SortHeader label={t("Фарқи")} k="diff" align="right" activeKey={sortKey} dir={sortDir} onToggle={toggleSort} />
                      </Th>
                      {showOpening && (
                        <Th align="right" width="w-40" sticky>{t("Якуний қолдиқ")}</Th>
                      )}
                      <Th width="w-48" sticky>{t("Изоҳ")}</Th>
                      <Th align="center" width="w-24" sticky>{t("Ойлар")}</Th>
                    </tr>
                  </Thead>

                  <Tbody>
                    {filteredData.length === 0 ? (
                      <tr>
                        <td colSpan={colCount} className="p-12 text-center text-body text-ink-3">
                          {t("Маълумот топилмади... 🕵️‍♂️")}
                        </td>
                      </tr>
                    ) : (
                      filteredData.map((tx, idx) => {
                        const key = rowKey(tx);
                        const isSelected = selectedInns.includes(key);
                        const isExpanded = expandedInns.includes(key);
                        const v = verdict(tx.difference);

                        return (
                          <React.Fragment key={`${key}-${idx}`}>
                            <Tr selected={isSelected}>
                              <Td align="center">
                                <RowCheckbox
                                  checked={isSelected}
                                  onChange={() => toggleSelection(key)}
                                  label={tx.name}
                                />
                              </Td>
                              <Td main className="min-w-[250px] font-medium whitespace-normal">
                                {tx.name}
                                {/* Қатор бир нечта ёзувдан йиғилган бўлса — буни
                                    АЙТИШ шарт: акс ҳолда бухгалтер файлдаги
                                    номни излаб тополмайди. */}
                                {tx.mergedFrom && tx.mergedFrom.length > 1 && (
                                  <>
                                    {" "}
                                    <Badge tone="info" className="align-middle">
                                      {t("бирлаштирилган")} ({tx.mergedFrom.length})
                                    </Badge>
                                  </>
                                )}
                              </Td>
                              <Td align="center">
                                <Code>{tx.inn}</Code>
                              </Td>
                              {/* 🏭 ТОИФА. Тахмин («?») қаторни ЯШИРМАЙДИ —
                                  фойдаланувчи ўзи тасдиқлайди. */}
                              <Td align="center">
                                <select
                                  value={catOf(tx)}
                                  disabled={savingCategory === key}
                                  onChange={(e) => handleCategoryChange(tx, e.target.value as Category)}
                                  title={(() => {
                                    // AUDIT IZI: kim va qachon o'zgartirgani.
                                    // Byuroda bir necha odam ishlaydi va
                                    // «kim buni kommunal deb belgilagan?»
                                    // degan savolga javob bo'lishi kerak.
                                    const who = categoryAuthors[key] || categoryAuthors[tx.inn];
                                    const audit = who
                                      ? `
${t("Ўзгартирган")}: ${who.by}${who.at ? ` · ${who.at.slice(0, 10)}` : ""}`
                                      : "";
                                    const base = tx.categoryLabel
                                      ? `${t(tx.categoryLabel)}${tx.categorySource === "user" ? ` ${t("(сиз белгилагансиз)")}` : ""}`
                                      : tx.categoryHintLabel
                                        ? `${t(tx.categoryHintLabel)} — ${t("текширинг")}`
                                        : t("Контрагент тоифаси");
                                    return base + audit;
                                  })()}
                                  className={cx(
                                    "w-full max-w-[110px] cursor-pointer rounded-sm border px-1.5 py-1 text-caption font-medium outline-none disabled:opacity-50",
                                    catOf(tx) === "korxona"
                                      ? tx.categoryHint
                                        // Тахмин бор — сариқ. Қатор ЯШИРИЛМАЙДИ,
                                        // фақат «текшир» деб турибди.
                                        ? "border-warn bg-warn-soft text-warn"
                                        : "border-line bg-surface text-ink-3"
                                      : "border-info bg-info-soft text-info"
                                  )}
                                >
                                  {(Object.keys(CATEGORY_LABELS) as Category[]).map((c) => (
                                    <option key={c} value={c}>
                                      {t(CATEGORY_LABELS[c])}
                                      {c === "korxona" && tx.categoryHint ? " ?" : ""}
                                    </option>
                                  ))}
                                </select>
                              </Td>
                              {showOpening && (
                                <NumTd
                                  tone={(opening.balances[key] || 0) === 0 ? "muted" : "default"}
                                  className="text-caption"
                                >
                                  {formatNum(opening.balances[key] || 0)}
                                </NumTd>
                              )}
                              {showSaldo && (
                                <NumTd tone={(tx.openingSaldo || 0) === 0 ? "muted" : "default"} className="text-caption">
                                  {formatNum(tx.openingSaldo || 0)}
                                </NumTd>
                              )}
                              <NumTd tone="cash">{formatNum(tx.totalDebit)}</NumTd>
                              <NumTd tone="invoice">{formatNum(tx.totalCredit)}</NumTd>
                              <NumTd tone={v.tone} strong>{formatNum(tx.difference)}</NumTd>
                              {showOpening && (() => {
                                // YAKUNIY QOLDIQ = boshlang'ich + fayl ichidagi
                                // o'tgan davr + shu davr farqi. Uchalasi ham
                                // bir xil ishorada (HANDOFF 8-bo'lim).
                                const closing =
                                  (opening.balances[key] || 0) + (tx.openingSaldo || 0) + tx.difference;
                                return (
                                  <NumTd tone={verdict(closing).tone} strong>
                                    {formatNum(closing)}
                                  </NumTd>
                                );
                              })()}
                              <Td className={cx("text-caption font-medium", toneText[v.tone])}>
                                {t(v.text)}
                              </Td>
                              <Td align="center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <Button
                                    size="sm"
                                    variant={isExpanded ? "primary" : "secondary"}
                                    onClick={() => toggleExpand(key)}
                                  >
                                    {isExpanded ? t("Ёпиш") : t("Очиш")}
                                    <ChevronDown className={cx("h-3.5 w-3.5 transition-transform", isExpanded && "rotate-180")} />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => setActRow(tx)}
                                    title={t("Акт сверки")}
                                    aria-label={`${t("Акт сверки")}: ${tx.name}`}
                                  >
                                    <FileText className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </Td>
                            </Tr>

                            {isExpanded && (
                              <tr>
                                <td colSpan={colCount} className="p-0">
                                  <div className="space-y-4 border-y border-line bg-surface-2 p-4">
                                    {/* ЁПИЛМАГАН ФАКТУРАЛАР — биринчи
                                        ўринда: бухгалтерга керак бўладиган
                                        нарса аслида шу, ойма-ой кесим эмас. */}
                                    <OpenInvoices
                                      invoices={openInvoicesByKey.get(key) ?? []}
                                      format={formatNum}
                                      title={t("Тўланмаган фактуралар")}
                                      emptyText={t("Ёпилмаган фактура йўқ")}
                                    />

                                    <h3 className="mb-3 text-caption font-semibold text-ink-2">
                                      📅 {tx.name} — {t("Ойма-ой тафсилотлар")}
                                    </h3>
                                    <TableFrame>
                                      <Table>
                                        <Thead>
                                          <tr>
                                            <Th>{t("Давр")}</Th>
                                            <Th align="right">{t("Тўланган пул")}</Th>
                                            <Th align="right">{t("Келган фактура")}</Th>
                                            <Th align="right">{t("Фарқ")}</Th>
                                          </tr>
                                        </Thead>
                                        <Tbody>
                                          {sortedPeriods(tx.monthlyData).length === 0 ? (
                                            <tr>
                                              <td colSpan={4} className="p-3 text-center text-caption text-ink-3">
                                                {t("Ойлик маълумот йўқ")}
                                              </td>
                                            </tr>
                                          ) : sortedPeriods(tx.monthlyData).map((period) => {
                                            const bucket = tx.monthlyData[period] || { debit: 0, credit: 0 };
                                            const dVal = bucket.debit || 0;
                                            const cVal = bucket.credit || 0;
                                            const diff = dVal - cVal;

                                            return (
                                              <Tr key={period}>
                                                <Td main>{periodLabel(period, t)}</Td>
                                                <Td className="py-1.5">
                                                  <input
                                                    type="number"
                                                    value={dVal === 0 ? '' : dVal}
                                                    placeholder="0.00"
                                                    aria-label={`${tx.name} ${periodLabel(period, t)} ${t("Тўланган пул")}`}
                                                    onChange={(e) => handleCellEdit(tx.inn, period, 'debit', e.target.value)}
                                                    className="h-8 w-full rounded-sm border border-line bg-surface px-2 text-right text-body tabular text-ink outline-none transition-colors focus:border-accent"
                                                  />
                                                </Td>
                                                <Td className="py-1.5">
                                                  <input
                                                    type="number"
                                                    value={cVal === 0 ? '' : cVal}
                                                    placeholder="0.00"
                                                    aria-label={`${tx.name} ${periodLabel(period, t)} ${t("Келган фактура")}`}
                                                    onChange={(e) => handleCellEdit(tx.inn, period, 'credit', e.target.value)}
                                                    className="h-8 w-full rounded-sm border border-line bg-surface px-2 text-right text-body tabular text-ink outline-none transition-colors focus:border-accent"
                                                  />
                                                </Td>
                                                <NumTd tone={verdict(diff).tone} strong>{formatNum(diff)}</NumTd>
                                              </Tr>
                                            );
                                          })}
                                        </Tbody>
                                      </Table>
                                    </TableFrame>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })
                    )}
                  </Tbody>

                  {displayData.length > 0 && (
                    <Tfoot sticky>
                      <tr>
                        <Td align="center" className="text-accent-ink">✓</Td>
                        <Td colSpan={3} align="right" className="text-caption text-ink-3">
                          {t("Жами танланганлар:")}
                        </Td>
                        {showSaldo && (
                          <NumTd tone="muted" className="text-caption">{formatNum(grandTotals.saldo)}</NumTd>
                        )}
                        {showOpening && (
                          <NumTd className="text-caption">
                            {formatNum(
                              displayData.reduce((a, x) => a + (opening.balances[rowKey(x)] || 0), 0)
                            )}
                          </NumTd>
                        )}
                        <NumTd tone="cash">{formatNum(grandTotals.debit)}</NumTd>
                        <NumTd tone="invoice">{formatNum(grandTotals.credit)}</NumTd>
                        <NumTd tone={grandTotals.diff === 0 ? "default" : verdict(grandTotals.diff).tone}>
                          {formatNum(grandTotals.diff)}
                        </NumTd>
                        {showOpening && (
                          <NumTd>
                            {formatNum(
                              displayData.reduce(
                                (a, x) =>
                                  a + (opening.balances[rowKey(x)] || 0) + (x.openingSaldo || 0) + x.difference,
                                0
                              )
                            )}
                          </NumTd>
                        )}
                        <Td className={cx("text-caption", toneText[verdict(grandTotals.diff).tone])}>
                          {t(verdict(grandTotals.diff).text)}
                        </Td>
                        <Td />
                      </tr>
                    </Tfoot>
                  )}
                </Table>
              </TableFrame>
            </div>
          </Card>

          {/* 📄 АКТ СВЕРКИ ОЙНАСИ.
              Ичидаги Дебет / Кредит / Сальдо блокига ТЕГИЛМАЙДИ — у
              расмий икки томонлама ҳужжат шакли. */}
          <Modal
            open={actRow !== null}
            onClose={() => setActRow(null)}
            title={t("Акт сверки")}
            hint={actRow ? `${actRow.name} · СТИР ${actRow.inn}` : undefined}
            icon={<FileText className="h-5 w-5" />}
            width="max-w-lg"
            footer={
              <>
                <Button variant="secondary" onClick={() => setActRow(null)}>
                  {t("Бекор қилиш")}
                </Button>
                <Button variant="primary" onClick={handleActDownload} icon={<Download className="h-4 w-4" />}>
                  {t("Excel юклаб олиш")}
                </Button>
              </>
            }
          >
            {actRow && (
              <div className="space-y-4">
                {/* «Сальдо начальное» — ҳужжатдаги БИРИНЧИ қатор. Жадвал
                    устида турибди, чунки ҳужжатда ҳам ундан олдин келади. */}
                {actOpening !== undefined && (
                  <div className="flex items-center justify-between rounded-md border border-line bg-surface-2 px-3 py-2">
                    <span className="text-caption text-ink-3">{t("Бошланғич қолдиқ")}</span>
                    <span className="text-body font-semibold tabular text-ink">
                      {formatNum(actOpening)}
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-md border border-line bg-surface-2 p-3">
                    <p className="text-caption text-cash">{t("Дебет (тўлов)")}</p>
                    <p className="mt-1 text-body font-semibold tabular">{formatNum(actRow.totalDebit)}</p>
                  </div>
                  <div className="rounded-md border border-line bg-surface-2 p-3">
                    <p className="text-caption text-invoice">{t("Кредит (фактура)")}</p>
                    <p className="mt-1 text-body font-semibold tabular">{formatNum(actRow.totalCredit)}</p>
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
                      {formatNum(Math.abs(actSaldo))}
                    </p>
                  </div>
                </div>

                <p className="text-caption text-ink-2">
                  {Math.abs(actSaldo) < 0.01
                    ? t("Қарздорлик йўқ.")
                    : actSaldo > 0
                      ? `${t("Улар қарздор — етказиб берувчи")} ${formatNum(actSaldo)} ${t("сўмлик фактура ёзмаган.")}`
                      : `${t("Биз қарздормиз —")} ${formatNum(-actSaldo)} ${t("сўм тўланмаган.")}`}
                </p>

                {actOpening === undefined && (
                  <Alert tone="warn">
                    {t("Бу контрагентга бошланғич қолдиқ киритилмаган — акт фақат юкланган давр ҳаракатини кўрсатади.")}
                  </Alert>
                )}
              </div>
            )}
          </Modal>

          {/* БОШЛАНҒИЧ ҚОЛДИҚ ОЙНАСИ */}
          <OpeningBalanceModal
            open={balanceOpen}
            onClose={() => setBalanceOpen(false)}
            rows={periodData
              .filter((tx) => catOf(tx) === "korxona")
              .map((tx) => ({ key: rowKey(tx), name: tx.name, inn: tx.inn }))}
            balances={opening.balances}
            asOf={opening.asOf}
            format={formatNum}
            saving={savingBalances}
            onSave={handleSaveBalances}
          />

          {/* КОНТРАГЕНТЛАРНИ БИРЛАШТИРИШ */}
          <MergeModal
            open={mergeOpen}
            onClose={() => setMergeOpen(false)}
            companyId={companyId}
            side="out"
            rows={mergeRows}
            groups={merges}
            suggestions={mergeSuggestions}
            format={formatNum}
            onMerged={handleMerged}
            onUnmerged={handleUnmerged}
          />
        </>
      )}
    </div>
  );
}
