// app/excel-audit/companies/[id]/page.tsx
"use client";
import React, { useState, use, useMemo, useEffect } from "react";
// 🔥 FIREBASE IMPORTLARI
import { collection, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { authFetch } from "@/lib/authFetch";
// 📊 EXCEL IMPORTLARI
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import NextLink from "next/link";
import {
  ArrowLeft,
  ChevronDown,
  CloudUpload,
  Download,
  FileSpreadsheet,
  Loader2,
  Save,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import SortHeader from "@/components/SortHeader";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageToggle from "@/components/LanguageToggle";
import { useT } from "@/context/LanguageContext";
import { CATEGORY_LABELS, type Category } from "@/lib/counterpartyCategory";

interface MonthlyBucket {
  debit: number;
  credit: number;
}
interface TransactionRecord {
  date: string;
  type: string;
  debit: number;
  credit: number;
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
interface SverkaReportDoc {
  companyId: string;
  savedAt?: { toMillis: () => number };
  firmsData: AggregatedTx[];
  totals?: { debit: number; credit: number; diff: number };
}

interface PageProps {
  params: Promise<{ id: string }>;
}

const MONTH_NAMES = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];

/** Тил ўзгарса ой номи ҳам ўзгариши учун таржимон узатилади */
function periodLabel(period: string, t: (s: string) => string): string {
  const [y, m] = period.split('-').map(Number);
  const raw = MONTH_NAMES[(m || 1) - 1];
  return raw ? `${t(raw)} ${y}` : period;
}
function sortedPeriods(monthlyData: Record<string, MonthlyBucket>): string[] {
  return Object.keys(monthlyData || {}).sort();
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

export default function CompanyDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const companyId = resolvedParams.id;
  const t = useT();
  // Barcha o'qish/yozish ish maydoniga bog'lanadi (src/lib/workspace.ts)
  const { user } = useAuth();
  const workspaceId: string | undefined = user?.workspaceId;

  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(true);

  const [parsedData, setParsedData] = useState<AggregatedTx[]>([]);
  const [detectedFormats, setDetectedFormats] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [sheetReports, setSheetReports] = useState<SheetReport[]>([]);
  const [balanceChecks, setBalanceChecks] = useState<BalanceCheck[]>([]);
  const [knownFormats, setKnownFormats] = useState<KnownFormat[]>([]);
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
  const [categoryFilter, setCategoryFilter] = useState<"KORXONA" | "BOSHQA" | "ALL">("KORXONA");
  const [savingCategory, setSavingCategory] = useState<string | null>(null);

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
          const docs = querySnapshot.docs.map((d) => ({ id: d.id, ...d.data() } as SverkaReportDoc & { id: string }));
          docs.sort((a, b) => (b.savedAt?.toMillis() || 0) - (a.savedAt?.toMillis() || 0));
          const latestReport = docs[0];

          if (latestReport.firmsData && latestReport.firmsData.length > 0) {
            const correctedData = latestReport.firmsData.map((item) => ({
              ...item,
              difference: item.totalDebit - item.totalCredit,
            }));
            setParsedData(correctedData);
            setSelectedInns(correctedData.filter((d) => catOf(d) === "korxona").map((d) => rowKey(d)));
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

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) return alert(t("Илтимос, камида битта Excel ёки CSV файлни танланг!"));

    setLoading(true);
    setDetectedFormats([]);
    setWarnings([]);
    setSheetReports([]);
    setBalanceChecks([]);
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
        setKnownFormats(data.formats || []);
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
        alert(t("Хатолик:") + " " + (data.error || t("Номаълум хатолик юз берди")));
      }
    } catch (error) {
      console.error("Юклашда хато:", error);
      alert(t("Сервер билан уланишда хатолик!"));
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
      if (categoryFilter === "KORXONA" && catOf(item) !== "korxona") return false;
      if (categoryFilter === "BOSHQA" && catOf(item) === "korxona") return false;

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
      alert(t("Тоифани сақлаб бўлмади:") + " " + (error instanceof Error ? error.message : String(error)));
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
      korxonaDebit: 0, korxonaCredit: 0, korxonaCount: 0,
      // Коммунал + бюджет + банк + хизмат
      boshqaDebit: 0, boshqaCredit: 0, boshqaCount: 0,
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
        t.korxonaDebit += tx.totalDebit;
        t.korxonaCredit += tx.totalCredit;
        t.korxonaCount++;
        if (tx.categoryHint) t.hintCount++;
      } else {
        t.boshqaDebit += tx.totalDebit;
        t.boshqaCredit += tx.totalCredit;
        t.boshqaCount++;
      }
    }
    t.diff = t.debit - t.credit;
    return t;
  }, [periodData, yearFilter]);

  // Давр танланганда «ўтган даврдан сальдо» устуни қўшилади
  const showSaldo = yearFilter !== "ALL";
  // + «Тоифа» устуни
  const colCount = showSaldo ? 10 : 9;
  const periodTitle =
    yearFilter === "ALL"
      ? t("Барча давр")
      : monthFilter === "ALL"
        ? `${yearFilter}`
        : `${t(MONTH_NAMES[(monthFilter as number) - 1])} ${yearFilter}${cumulative ? ` ${t("(йил бошидан)")}` : ""}`;

  const handleSaveToFirebase = async () => {
    if (selectedFullData.length === 0) return alert(t("Сақлаш учун камида битта фирмани белгиланг!"));
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

      if (!workspaceId) {
        alert(t("Иш майдони аниқланмади. Тизимдан чиқиб, қайта киринг."));
        return;
      }

      const docRef = await addDoc(collection(db, "sverka_reports"), {
        companyId: companyId,
        // Egalik: hisobot boshqa ish maydoniga ko'rinmasligi uchun
        workspaceId,
        savedAt: serverTimestamp(),
        // Қайси давр кесими сақлангани — кейин очилганда аниқ бўлиши учун
        period: {
          year: yearFilter === "ALL" ? null : yearFilter,
          month: monthFilter === "ALL" ? null : monthFilter,
          cumulative,
          label: periodTitle,
        },
        totals,
        firmsData: selectedFullData,
      });
      alert(`${t("Муваффақиятли сақланди!")} (ID: ${docRef.id})`);
    } catch (error) {
      console.error("Firebase хатолиги:", error);
      alert(t("Сақлашда хатолик юз берди."));
    } finally {
      setIsSaving(false);
    }
  };

  // 📈 MUKAMMAL EXCEL EXPORT (EXCELJS)
  const handleExportExcel = async () => {
    if (displayData.length === 0) return alert(t("Рўйхат бўш. Камида битта фирмани белгиланг!"));

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
    const titleRow = worksheet.addRow(["OOO \"AZAM-MARKET ANGREN\""]);
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
      const isInvoiceNeeded = tx.difference > 0;
      const isDebt = tx.difference < 0;
      const statusText = isInvoiceNeeded ? t('Ҳисоб фактура олиш керак') : isDebt ? t('Қарзмиз') : '-';

      const row = worksheet.addRow([
        tx.name,
        tx.inn,
        tx.totalDebit,
        tx.totalCredit,
        tx.difference,
        statusText
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
    const grandStatusText = grandTotals.diff > 0 ? t('Ҳисоб фактура олиш керак') : grandTotals.diff < 0 ? t('Қарзмиз') : '-';

    const grandRow = worksheet.addRow([
      t("ЖАМИ"),
      "",
      grandTotals.debit,
      grandTotals.credit,
      grandTotals.diff,
      grandStatusText
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
    saveAs(blob, `Sverka_${today}.xlsx`);
  };

  if (isFetchingData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400">
        <Loader2 className="h-12 w-12 text-indigo-500 animate-spin" />
        <p className="mt-4 font-semibold text-sm animate-pulse">{t("Маълумотлар юкланмоқда...")}</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-[100vw] overflow-x-hidden space-y-6 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen relative">
      {/* Orqa fon bezagi */}
      <div className="anim-blob absolute top-[-100px] left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-indigo-500/[0.07] blur-[130px] rounded-full pointer-events-none" />

      {/* 📤 YUKLASH KARTASI */}
      <div className="anim-fade-up surface glow-indigo p-6 md:p-8 max-w-4xl mx-auto relative z-10">
        <div className="flex items-center gap-4 mb-1">
          <NextLink href="/excel-audit">
            <button className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 hover:-translate-x-0.5">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </NextLink>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">{t("Далолатнома (Сверка)")}</h1>
            <p className="text-sm text-slate-500">
              {t("Банк айланмаси ва Э-Фактура файлларни юкланг, таҳрирланг ва таҳлил қилинг.")}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2"><LanguageToggle /><ThemeToggle /></div>
        </div>

        <form onSubmit={handleFileUpload} className="flex flex-col gap-4 mt-6">
          <div className="flex flex-col md:flex-row gap-4 items-stretch">
            <label className="w-full md:w-3/4 cursor-pointer">
              <div className={`flex items-center gap-3 p-4 border-2 border-dashed rounded-xl transition-all duration-300 ${files.length > 0 ? "border-indigo-500/50 bg-indigo-500/5" : "border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950/50 hover:border-slate-400 dark:hover:border-slate-600"}`}>
                <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
                  <CloudUpload className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">
                    {files.length > 0
                      ? `${files.length} ${t("та файл танланди")}`
                      : t("Excel / CSV файлларни танланг")}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {files.length > 0 ? files.map((f) => f.name).join(", ") : t(".xls, .xlsx, .csv — бир нечта файлни бирга юкласа бўлади")}
                  </p>
                </div>
              </div>
              <input
                type="file"
                accept=".xls,.xlsx,.csv"
                multiple
                onChange={(e) => setFiles(Array.from(e.target.files || []))}
                className="hidden"
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="w-full md:w-1/4 px-8 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/25 transition-all duration-300 flex items-center justify-center gap-2 hover:-translate-y-0.5 active:scale-95"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
              {loading ? t("Ўқилмоқда...") : t("Таҳлил")}
            </button>
          </div>

          <label className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-300 cursor-pointer select-none w-fit">
            <input
              type="checkbox"
              className="w-4 h-4 accent-indigo-500 cursor-pointer"
              checked={includePending}
              onChange={(e) => setIncludePending(e.target.checked)}
            />
            <span>
              {t("Имзо кутилаётган фактураларни ҳам ҳисоблаш")}
              <span className="text-slate-400 dark:text-slate-500"> {t("— одатда ҳисобланмайди (имзоланмаган фактура кучга кирмаган)")}</span>
            </span>
          </label>

          {/* Aniqlangan formatlar */}
          {(detectedFormats.length > 0 || sheetReports.length > 0) && (
            <div className="anim-fade flex flex-wrap items-center gap-2">
              <span className="text-[11px] uppercase tracking-wider font-bold text-slate-500">{t("Аниқланган форматлар:")}</span>
              {detectedFormats.map((f) => (
                <span key={f} className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                  {FORMAT_LABELS[f] ? t(FORMAT_LABELS[f]) : f}
                </span>
              ))}
              {knownFormats.filter((f) => f.isNew).map((f) => (
                <span
                  key={f.id}
                  title={f.label}
                  className="px-2.5 py-1 rounded-lg bg-sky-500/10 border border-sky-500/25 text-sky-700 dark:text-sky-400 text-xs font-bold"
                >
                  🧠 {t("Янги шакл ўрганилди")}
                </span>
              ))}
              {sheetReports.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowReport((v) => !v)}
                  className={`ml-auto px-3 py-1 rounded-lg text-xs font-bold border transition-colors ${warnings.length > 0
                    ? "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400"
                    : "bg-slate-500/10 border-slate-500/20 text-slate-600 dark:text-slate-300"
                    }`}
                >
                  {warnings.length > 0 ? `⚠ ${warnings.length} ${t("та эслатма")}` : t("✓ Ўқиш ҳисоботи")} · {showReport ? t("яшириш") : t("кўриш")}
                </button>
              )}
            </div>
          )}

          {/* ЎҚИШ ҲИСОБОТИ — қайси файлдан нима ўқилгани, нима ўқилмагани */}
          {showReport && sheetReports.length > 0 && (
            <div className="anim-fade rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 overflow-hidden">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-left">
                      <th className="p-2.5 font-bold">{t("Файл / варақ")}</th>
                      <th className="p-2.5 font-bold">{t("Формат")}</th>
                      <th className="p-2.5 font-bold text-center">{t("Қатор")}</th>
                      <th className="p-2.5 font-bold text-right">{t("Чиққан пул")}</th>
                      <th className="p-2.5 font-bold text-right">{t("Келган")}</th>
                      <th className="p-2.5 font-bold text-right">{t("Файл якуни")}</th>
                      <th className="p-2.5 font-bold">{t("Изоҳ")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800/70">
                    {sheetReports.map((s, i) => {
                      const skipped = s.format === "SVODKA" || s.format === "AKT_SVERKI" || s.format === "TANILMADI";
                      return (
                        <tr key={i} className={skipped ? "text-slate-400 dark:text-slate-600" : "text-slate-700 dark:text-slate-200"}>
                          <td className="p-2.5">{s.file}<span className="text-slate-400"> / {s.sheet}</span></td>
                          <td className="p-2.5 font-mono text-[11px]">{s.format}</td>
                          <td className="p-2.5 text-center tabular">{s.rows || "—"}</td>
                          <td className="p-2.5 text-right tabular">{s.debit ? formatNum(s.debit) : "—"}</td>
                          <td className="p-2.5 text-right tabular">{s.credit ? formatNum(s.credit) : "—"}</td>
                          <td className="p-2.5 text-right tabular text-slate-500">
                            {s.allDebit || s.allCredit
                              ? `${formatNum(s.allDebit || 0)} / ${formatNum(s.allCredit || 0)}`
                              : "—"}
                          </td>
                          <td className="p-2.5 text-slate-500">{s.note || ""}</td>
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
                <div className="border-t border-slate-200 dark:border-slate-800 p-3">
                  <p className="text-[11px] uppercase tracking-wider font-bold text-slate-500 mb-2">
                    {t("Қолдиқ тенгламаси")}
                    <span className="normal-case font-normal tracking-normal text-slate-400">
                      {" — "}{t("бошланғич қолдиқ + кирим − чиқим = охирги қолдиқ")}
                    </span>
                  </p>
                  <ul className="space-y-1">
                    {balanceChecks.map((b, i) => (
                      <li key={i} className="text-xs flex flex-wrap gap-x-2 gap-y-0.5 items-baseline">
                        <span
                          className={
                            b.status === "MOS"
                              ? "text-emerald-600 dark:text-emerald-400 font-bold shrink-0"
                              : b.status === "NOMOS"
                                ? "text-amber-600 dark:text-amber-400 font-bold shrink-0"
                                : "text-slate-400 shrink-0"
                          }
                        >
                          {b.status === "MOS" ? "✓" : b.status === "NOMOS" ? "⚠" : "—"}
                        </span>
                        <span className="text-slate-600 dark:text-slate-300">{b.file}</span>
                        {b.status === "YO'Q" ? (
                          <span className="text-slate-400">{t(b.note || "текшириб бўлмади")}</span>
                        ) : (
                          <>
                            <span className="tabular text-slate-500">
                              {formatNum(b.opening ?? 0)} + {formatNum(b.credit)} − {formatNum(b.debit)}
                              {" = "}
                              {formatNum(b.expected ?? 0)}
                            </span>
                            <span
                              className={
                                b.status === "MOS"
                                  ? "tabular text-slate-400"
                                  : "tabular text-amber-600 dark:text-amber-400 font-bold"
                              }
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
                <div className="border-t border-slate-200 dark:border-slate-800 p-3">
                  <p className="text-[11px] uppercase tracking-wider font-bold text-slate-500 mb-2">
                    {t("Тизим таниган экспорт шакллари")} ({knownFormats.length})
                  </p>
                  <ul className="space-y-1">
                    {knownFormats.map((f) => (
                      <li key={f.id} className="text-xs text-slate-600 dark:text-slate-300 flex gap-2">
                        <span className={f.isNew ? "text-sky-600 dark:text-sky-400 font-bold shrink-0" : "text-slate-400 shrink-0"}>
                          {f.isNew ? t("янги") : t("таниш")}
                        </span>
                        <span className="truncate">{f.label}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {warnings.length > 0 && (
                <ul className="border-t border-amber-500/20 bg-amber-500/5 p-3 space-y-1.5">
                  {warnings.map((w, i) => (
                    <li key={i} className="text-xs text-amber-700 dark:text-amber-400 flex gap-2">
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
        </form>
      </div>

      {parsedData.length > 0 && (
        <div className="anim-fade-up delay-2 surface p-4 md:p-6 w-full max-w-[1500px] mx-auto overflow-hidden relative z-10">
          {/* FILTER BAR */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 bg-slate-100/70 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800/80">
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                <input
                  type="text"
                  placeholder={t("Фирма номи ёки СТИР бўйича қидирув...")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2.5 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/70 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 outline-none transition-all duration-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              {/* 📅 ЙИЛ */}
              {availableYears.length > 0 && (
                <select
                  value={String(yearFilter)}
                  onChange={(e) => {
                    const v = e.target.value;
                    setYearFilter(v === "ALL" ? "ALL" : Number(v));
                    setMonthFilter("ALL");
                  }}
                  className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/70 font-semibold text-sm text-slate-700 dark:text-slate-200 outline-none cursor-pointer focus:border-indigo-500"
                >
                  <option value="ALL">{t("Барча давр")}</option>
                  {availableYears.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              )}

              {/* 📅 ОЙ */}
              {yearFilter !== "ALL" && availableMonths.length > 0 && (
                <select
                  value={String(monthFilter)}
                  onChange={(e) => {
                    const v = e.target.value;
                    setMonthFilter(v === "ALL" ? "ALL" : Number(v));
                  }}
                  className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/70 font-semibold text-sm text-slate-700 dark:text-slate-200 outline-none cursor-pointer focus:border-indigo-500"
                >
                  <option value="ALL">{t("Йил бўйича")}</option>
                  {availableMonths.map((m) => (
                    <option key={m} value={m}>{t(MONTH_NAMES[m - 1])}</option>
                  ))}
                </select>
              )}

              {yearFilter !== "ALL" && monthFilter !== "ALL" && (
                <label className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/70 text-sm font-semibold text-slate-700 dark:text-slate-200 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-indigo-500 cursor-pointer"
                    checked={cumulative}
                    onChange={(e) => setCumulative(e.target.checked)}
                  />
                  {t("Йил бошидан")}
                </label>
              )}

              <div className="relative">
                <SlidersHorizontal className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4 pointer-events-none" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as "ALL" | "DIFF" | "EQUAL")}
                  className="pl-10 pr-8 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/70 font-semibold text-sm text-slate-700 dark:text-slate-200 outline-none cursor-pointer transition-all duration-300 focus:border-indigo-500 appearance-none"
                >
                  <option value="ALL" className="bg-slate-100 dark:bg-slate-900">{t("Барчаси")} ({parsedData.length})</option>
                  <option value="DIFF" className="bg-slate-100 dark:bg-slate-900">{t("Фарқи борлар")}</option>
                  <option value="EQUAL" className="bg-slate-100 dark:bg-slate-900">{t("Тенг бўлганлар")}</option>
                </select>
              </div>

              {/* 🏭 ТОИФА — фақат кўринишни ўзгартиради, ҳисобни эмас */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as "KORXONA" | "BOSHQA" | "ALL")}
                title={t("Коммунал, бюджет ва банк комиссияси асосий сверкани чалғитади. Улар йўқолмайди — тепадаги «ЖАМИ» ҳар доим тўлиқ.")}
                className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/70 font-semibold text-sm text-slate-700 dark:text-slate-200 outline-none cursor-pointer focus:border-indigo-500"
              >
                <option value="KORXONA" className="bg-slate-100 dark:bg-slate-900">{t("Фақат корхоналар")} ({periodTotals.korxonaCount})</option>
                <option value="BOSHQA" className="bg-slate-100 dark:bg-slate-900">{t("Коммунал/бюджет")} ({periodTotals.boshqaCount})</option>
                <option value="ALL" className="bg-slate-100 dark:bg-slate-900">{t("Ҳаммаси")} ({periodTotals.count})</option>
              </select>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <button
                onClick={handleExportExcel}
                disabled={displayData.length === 0}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-emerald-600/20 transition-all duration-300 flex items-center gap-2 w-full md:w-auto justify-center hover:-translate-y-0.5 active:scale-95"
              >
                <Download className="w-4 h-4" /> {t("Excel юклаш")}
              </button>

              <button
                onClick={handleSaveToFirebase}
                disabled={isSaving || selectedFullData.length === 0}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/25 transition-all duration-300 flex items-center gap-2 w-full md:w-auto justify-center hover:-translate-y-0.5 active:scale-95"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {isSaving ? t("Сақланмоқда...") : t("Сақлаш")}
              </button>
            </div>
          </div>

          {/* УМУМИЙ ЯКУН — фильтрдан қатъи назар, ҳамма контрагент бўйича.
              Катта рақам ҳар доим ТЎЛИҚ: у файлнинг ўз «Итого» қаторига
              тенг бўлиши керак, шунинг учун ундан коммунал ҳам
              чиқарилмайди. Остидаги кичик қатор эса корхоналар кесими. */}
          <div className="mb-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 p-4">
              <p className="text-[11px] uppercase tracking-wider font-bold text-slate-500">{t("Жами тўланган пул")}</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white tabular mt-1">{formatNum(periodTotals.debit)}</p>
              <p className="text-[11px] text-slate-500 tabular mt-1">
                {t("корхоналар")}: <b className="text-slate-700 dark:text-slate-300">{formatNum(periodTotals.korxonaDebit)}</b>
                {periodTotals.boshqaCount > 0 && <> · {t("коммунал/бюджет")}: {formatNum(periodTotals.boshqaDebit)}</>}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 p-4">
              <p className="text-[11px] uppercase tracking-wider font-bold text-slate-500">{t("Жами келган фактура")}</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white tabular mt-1">{formatNum(periodTotals.credit)}</p>
              <p className="text-[11px] text-slate-500 tabular mt-1">
                {t("корхоналар")}: <b className="text-slate-700 dark:text-slate-300">{formatNum(periodTotals.korxonaCredit)}</b>
                {periodTotals.boshqaCount > 0 && <> · {t("коммунал/бюджет")}: {formatNum(periodTotals.boshqaCredit)}</>}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 p-4">
              <p className="text-[11px] uppercase tracking-wider font-bold text-slate-500">{t("Фарқи")} ({periodTitle})</p>
              <p className={`text-xl font-bold tabular mt-1 ${periodTotals.diff < 0 ? "text-rose-600 dark:text-rose-400" : periodTotals.diff > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                {formatNum(periodTotals.diff)}
              </p>
              <p className="text-[11px] text-slate-500 tabular mt-1">
                {t("корхоналар")}: <b className="text-slate-700 dark:text-slate-300">{formatNum(periodTotals.korxonaDebit - periodTotals.korxonaCredit)}</b>
              </p>
            </div>
          </div>

          {periodTotals.hintCount > 0 && (
            <div className="mb-3 rounded-xl border border-amber-300/70 dark:border-amber-700/50 bg-amber-50 dark:bg-amber-950/30 px-4 py-2.5 text-xs text-amber-900 dark:text-amber-200">
              <b>{periodTotals.hintCount}</b> {t("та контрагент коммуналга ўхшайди (номи бўйича ёки бошқа корхоналар шундай белгилагани учун), лекин улар")}
              <b> {t("ҳисобдан чиқарилмаган")}</b> {t("— жадвалда «?» белгиси билан турибди. Текшириб, тоифасини ўзгартиринг. Тизим ўзи ҳеч қачон яшириб қўймайди.")}
            </div>
          )}

          <p className="text-xs text-slate-500 mb-3">
            {t("Жами")} <b className="text-slate-700 dark:text-slate-300">{periodTotals.count}</b> {t("контрагент, шундан")}
            {" "}<b className="text-slate-700 dark:text-slate-300">{periodTotals.withDiff}</b> {t("тасида фарқ бор. Қуйидаги жадвалда")}
            {" "}<b className="text-slate-700 dark:text-slate-300">
              {filterType === "DIFF" ? t("фақат фарқи борлар") : filterType === "EQUAL" ? t("фақат тенг бўлганлар") : t("барчаси")}
            </b> {t("кўрсатилмоқда, жадвал остидаги «Жами танланганлар» эса фақат ✓ белгиланганларни қўшади.")}
          </p>

          {/* JADVAL */}
          <div className="overflow-x-auto w-full border border-slate-200 dark:border-slate-800 rounded-xl pb-0 custom-scrollbar">
            <table className="w-full text-sm table-auto border-collapse">
              <thead className="sticky top-0 z-20">
                <tr className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                  <th className="p-3 w-12 text-center">
                    <input
                      type="checkbox"
                      className="w-4 h-4 cursor-pointer accent-indigo-500"
                      checked={filteredData.length > 0 && filteredData.every((d) => selectedInns.includes(rowKey(d)))}
                      onChange={toggleAll}
                    />
                  </th>
                  <th className="p-3 text-left"><SortHeader label={t("Фирма номлари")} k="name" activeKey={sortKey} dir={sortDir} onToggle={toggleSort} /></th>
                  <th className="p-3 w-32 text-center"><SortHeader label={t("СТИР")} k="inn" align="center" activeKey={sortKey} dir={sortDir} onToggle={toggleSort} /></th>
                  <th className="p-3 w-32 text-center uppercase tracking-wider text-[11px] font-bold text-slate-500 dark:text-slate-400">{t("Тоифа")}</th>
                  {showSaldo && (
                    <th className="p-3 w-36 text-right uppercase tracking-wider text-[11px] font-bold text-slate-500 dark:text-slate-400">{t("Ўтган даврдан")}</th>
                  )}
                  <th className="p-3 w-40 text-right"><SortHeader label={t("Тўланган пул жами")} k="debit" align="right" activeKey={sortKey} dir={sortDir} onToggle={toggleSort} /></th>
                  <th className="p-3 w-40 text-right"><SortHeader label={t("Келган фактура")} k="credit" align="right" activeKey={sortKey} dir={sortDir} onToggle={toggleSort} /></th>
                  <th className="p-3 w-40 text-right"><SortHeader label={t("Фарқи")} k="diff" align="right" activeKey={sortKey} dir={sortDir} onToggle={toggleSort} /></th>
                  <th className="p-3 w-48 text-left uppercase tracking-wider text-[11px] font-bold text-slate-500 dark:text-slate-400">{t("Изоҳ")}</th>
                  <th className="p-3 w-24 text-center uppercase tracking-wider text-[11px] font-bold text-slate-500 dark:text-slate-400">{t("Ойлар")}</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/70">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={colCount} className="text-center p-12 text-slate-500 font-medium text-base">
                      {t("Маълумот топилмади... 🕵️‍♂️")}
                    </td>
                  </tr>
                ) : (
                  filteredData.map((tx, idx) => {
                    const key = rowKey(tx);
                    const isSelected = selectedInns.includes(key);
                    const isExpanded = expandedInns.includes(key);
                    const isInvoiceNeeded = tx.difference > 0;
                    const isDebt = tx.difference < 0;

                    const statusText = isInvoiceNeeded ? t("Ҳисоб фактура олиш керак") : isDebt ? t("Қарзмиз") : "-";
                    const statusColor = isDebt ? "text-rose-600 dark:text-rose-400" : isInvoiceNeeded ? "text-amber-600 dark:text-amber-400" : "text-slate-500";

                    return (
                      <React.Fragment key={`${key}-${idx}`}>
                        <tr className={`transition-colors duration-200 ${isSelected ? "bg-indigo-500/[0.06]" : "hover:bg-slate-100 dark:hover:bg-slate-900/60"}`}>
                          <td className="p-3 text-center">
                            <input
                              type="checkbox"
                              className="w-4 h-4 cursor-pointer accent-indigo-500"
                              checked={isSelected}
                              onChange={() => toggleSelection(key)}
                            />
                          </td>
                          <td className="p-3 text-left text-slate-900 dark:text-slate-100 font-medium whitespace-normal min-w-[250px]">
                            {tx.name}
                          </td>
                          <td className="p-3 text-center">
                            <span className="font-mono text-xs text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950/60 px-2 py-0.5 rounded-md">{tx.inn}</span>
                          </td>
                          {/* 🏭 ТОИФА. Тахмин («?») қаторни ЯШИРМАЙДИ —
                              фойдаланувчи ўзи тасдиқлайди. */}
                          <td className="p-3 text-center">
                            <select
                              value={catOf(tx)}
                              disabled={savingCategory === key}
                              onChange={(e) => handleCategoryChange(tx, e.target.value as Category)}
                              title={
                                tx.categoryLabel
                                  ? `${t(tx.categoryLabel)}${tx.categorySource === "user" ? ` ${t("(сиз белгилагансиз)")}` : ""}`
                                  : tx.categoryHintLabel
                                    ? `${t(tx.categoryHintLabel)} — ${t("текширинг")}`
                                    : t("Контрагент тоифаси")
                              }
                              className={`w-full max-w-[110px] text-[11px] font-semibold rounded-md border px-1.5 py-1 outline-none cursor-pointer disabled:opacity-50 ${catOf(tx) === "korxona"
                                ? tx.categoryHint
                                  ? "border-amber-400 dark:border-amber-600 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300"
                                  : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 text-slate-500 dark:text-slate-400"
                                : "border-sky-300 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300"
                                }`}
                            >
                              {(Object.keys(CATEGORY_LABELS) as Category[]).map((c) => (
                                <option key={c} value={c} className="bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                                  {t(CATEGORY_LABELS[c])}
                                  {c === "korxona" && tx.categoryHint ? " ?" : ""}
                                </option>
                              ))}
                            </select>
                          </td>
                          {showSaldo && (
                            <td className={`p-3 text-right tabular text-xs ${(tx.openingSaldo || 0) === 0 ? "text-slate-400 dark:text-slate-600" : "text-slate-500 dark:text-slate-400"}`}>
                              {formatNum(tx.openingSaldo || 0)}
                            </td>
                          )}
                          <td className="p-3 text-right text-slate-700 dark:text-slate-200 tabular">{formatNum(tx.totalDebit)}</td>
                          <td className="p-3 text-right text-slate-700 dark:text-slate-200 tabular">{formatNum(tx.totalCredit)}</td>
                          <td className={`p-3 text-right font-bold tabular ${statusColor}`}>{formatNum(tx.difference)}</td>
                          <td className={`p-3 text-left pl-4 font-semibold text-xs ${statusColor}`}>{statusText}</td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => toggleExpand(key)}
                              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 border ${isExpanded
                                ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/25"
                                : "bg-white dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-500/40"
                                }`}
                            >
                              {isExpanded ? t("Ёпиш") : t("Очиш")}
                              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`} />
                            </button>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr>
                            <td colSpan={colCount} className="p-0">
                              <div className="anim-fade bg-slate-100/70 dark:bg-slate-900/50 p-5 md:p-6 border-y border-indigo-500/10">
                                <h4 className="font-bold text-indigo-700 dark:text-indigo-300 mb-4 flex items-center gap-2 text-sm">
                                  📅 {tx.name} — {t("Ойма-ой тафсилотлар")}
                                </h4>
                                <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950/60">
                                  <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-100 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400">
                                      <tr>
                                        <th className="p-3 font-bold text-[11px] uppercase tracking-wider">{t("Давр")}</th>
                                        <th className="p-3 font-bold text-[11px] uppercase tracking-wider text-right">{t("Тўланган пул")}</th>
                                        <th className="p-3 font-bold text-[11px] uppercase tracking-wider text-right">{t("Келган фактура")}</th>
                                        <th className="p-3 font-bold text-[11px] uppercase tracking-wider text-right">{t("Фарқ")}</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                                      {sortedPeriods(tx.monthlyData).length === 0 ? (
                                        <tr>
                                          <td colSpan={4} className="p-3 text-center text-slate-500">{t("Ойлик маълумот йўқ")}</td>
                                        </tr>
                                      ) : sortedPeriods(tx.monthlyData).map((period) => {
                                        const bucket = tx.monthlyData[period] || { debit: 0, credit: 0 };
                                        const dVal = bucket.debit || 0;
                                        const cVal = bucket.credit || 0;
                                        const diff = dVal - cVal;

                                        return (
                                          <tr key={period} className="hover:bg-slate-100 dark:hover:bg-slate-900/50 transition-colors">
                                            <td className="p-3 font-semibold text-slate-700 dark:text-slate-300">{periodLabel(period, t)}</td>
                                            <td className="p-2">
                                              <input
                                                type="number"
                                                value={dVal === 0 ? '' : dVal}
                                                placeholder="0.00"
                                                onChange={(e) => handleCellEdit(tx.inn, period, 'debit', e.target.value)}
                                                className="w-full text-right p-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/70 rounded-lg text-slate-900 dark:text-slate-100 font-medium tabular outline-none transition-all duration-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                                              />
                                            </td>
                                            <td className="p-2">
                                              <input
                                                type="number"
                                                value={cVal === 0 ? '' : cVal}
                                                placeholder="0.00"
                                                onChange={(e) => handleCellEdit(tx.inn, period, 'credit', e.target.value)}
                                                className="w-full text-right p-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/70 rounded-lg text-slate-900 dark:text-slate-100 font-medium tabular outline-none transition-all duration-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                                              />
                                            </td>
                                            <td className={`p-3 text-right font-bold tabular ${diff < 0 ? "text-rose-600 dark:text-rose-400" : diff > 0 ? "text-amber-600 dark:text-amber-400" : "text-slate-500"}`}>
                                              {formatNum(diff)}
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>

              {displayData.length > 0 && (
                <tfoot className="sticky bottom-0 z-30 bg-slate-100 dark:bg-slate-900 font-bold border-t-2 border-slate-300 dark:border-slate-700">
                  <tr>
                    <td className="p-3 text-center text-indigo-600 dark:text-indigo-400">✓</td>
                    <td colSpan={3} className="p-3 text-right uppercase tracking-wider text-[11px] text-slate-500 dark:text-slate-400">{t("Жами танланганлар:")}</td>
                    {showSaldo && (
                      <td className="p-3 text-right text-xs text-slate-500 dark:text-slate-400 tabular">{formatNum(grandTotals.saldo)}</td>
                    )}
                    <td className="p-3 text-right text-base text-slate-900 dark:text-white tabular">{formatNum(grandTotals.debit)}</td>
                    <td className="p-3 text-right text-base text-slate-900 dark:text-white tabular">{formatNum(grandTotals.credit)}</td>
                    <td className={`p-3 text-right text-base tabular ${grandTotals.diff < 0 ? "text-rose-600 dark:text-rose-400" : grandTotals.diff > 0 ? "text-amber-600 dark:text-amber-400" : "text-slate-900 dark:text-white"}`}>
                      {formatNum(grandTotals.diff)}
                    </td>
                    <td className={`p-3 text-left pl-4 text-xs ${grandTotals.diff < 0 ? "text-rose-600 dark:text-rose-400" : grandTotals.diff > 0 ? "text-amber-600 dark:text-amber-400" : "text-slate-500"}`}>
                      {grandTotals.diff < 0 ? t("Қарзмиз") : grandTotals.diff > 0 ? t("Ҳисоб фактура олиш керак") : "-"}
                    </td>
                    <td className="p-3"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
