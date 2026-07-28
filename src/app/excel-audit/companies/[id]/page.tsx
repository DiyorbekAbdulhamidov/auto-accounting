// app/excel-audit/companies/[id]/page.tsx
"use client";
import React, { useState, use, useMemo, useEffect } from "react";
// 🔥 FIREBASE IMPORTLARI
import { collection, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
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
  name: string;
  inn: string;
  monthlyData: Record<string, MonthlyBucket>;
  transactions: TransactionRecord[];
  totalDebit: number;
  totalCredit: number;
  difference: number;
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

function periodLabel(period: string): string {
  const [y, m] = period.split('-').map(Number);
  const name = MONTH_NAMES[(m || 1) - 1] || period;
  return `${name} ${y}`;
}
function sortedPeriods(monthlyData: Record<string, MonthlyBucket>): string[] {
  return Object.keys(monthlyData || {}).sort();
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

  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(true);

  const [parsedData, setParsedData] = useState<AggregatedTx[]>([]);
  const [detectedFormats, setDetectedFormats] = useState<string[]>([]);

  const [selectedInns, setSelectedInns] = useState<string[]>([]);
  const [expandedInns, setExpandedInns] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"ALL" | "DIFF" | "EQUAL">("DIFF");

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
        const q = query(collection(db, "sverka_reports"), where("companyId", "==", companyId));
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
            setSelectedInns(correctedData.map((d) => d.inn));
          }
        }
      } catch (error) {
        console.error("Firebase'dan ma'lumot yuklashda xatolik:", error);
      } finally {
        setIsFetchingData(false);
      }
    }
    fetchSavedData();
  }, [companyId]);

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) return alert("Илтимос, камида битта Excel ёки CSV файлни танланг!");

    setLoading(true);
    setDetectedFormats([]);
    const formData = new FormData();

    files.forEach((f) => formData.append("files", f));
    formData.append("companyId", companyId);

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
        setDetectedFormats(data.detectedFormats);

        const diffData = correctedData.filter((item: AggregatedTx) => Math.abs(item.difference) > 0.01);
        setSelectedInns(diffData.map((d: AggregatedTx) => d.inn));
      } else {
        alert("Хатолик: " + (data.error || "Номаълум хатолик юз берди"));
      }
    } catch (error) {
      console.error("Юклашда хато:", error);
      alert("Сервер билан уланишда хатолик!");
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

  // 🔍 Qidiruv + filtr + sort - bitta zanjirda
  const filteredData = useMemo(() => {
    const result = parsedData.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.inn.includes(searchTerm);
      if (!matchesSearch) return false;

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
  }, [parsedData, searchTerm, filterType, sortKey, sortDir]);

  const displayData = useMemo(() =>
    filteredData.filter((tx) => selectedInns.includes(tx.inn)),
    [filteredData, selectedInns]);

  const selectedFullData = useMemo(() =>
    parsedData.filter((tx) => selectedInns.includes(tx.inn)),
    [parsedData, selectedInns]);

  const toggleSelection = (inn: string) => {
    setSelectedInns((prev) => prev.includes(inn) ? prev.filter((i) => i !== inn) : [...prev, inn]);
  };

  const toggleAll = () => {
    const filteredInns = filteredData.map((d) => d.inn);
    const allSelected = filteredInns.length > 0 && filteredInns.every((inn) => selectedInns.includes(inn));
    if (allSelected) {
      setSelectedInns((prev) => prev.filter((inn) => !filteredInns.includes(inn)));
    } else {
      setSelectedInns((prev) => Array.from(new Set([...prev, ...filteredInns])));
    }
  };

  const toggleExpand = (inn: string) => {
    setExpandedInns((prev) => prev.includes(inn) ? prev.filter((i) => i !== inn) : [...prev, inn]);
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "name" || key === "inn" ? "asc" : "desc");
    }
  };

  const grandTotals = displayData.reduce(
    (acc, curr) => {
      acc.debit += curr.totalDebit;
      acc.credit += curr.totalCredit;
      acc.diff += curr.difference;
      return acc;
    },
    { debit: 0, credit: 0, diff: 0 }
  );

  const handleSaveToFirebase = async () => {
    if (selectedFullData.length === 0) return alert("Сақлаш учун камида битта фирмани белгиланг!");
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

      const docRef = await addDoc(collection(db, "sverka_reports"), {
        companyId: companyId,
        savedAt: serverTimestamp(),
        totals,
        firmsData: selectedFullData,
      });
      alert(`Муваффақиятли сақланди! (ID: ${docRef.id})`);
    } catch (error) {
      console.error("Firebase хатолиги:", error);
      alert("Сақлашда хатолик юз берди.");
    } finally {
      setIsSaving(false);
    }
  };

  // 📈 MUKAMMAL EXCEL EXPORT (EXCELJS)
  const handleExportExcel = async () => {
    if (displayData.length === 0) return alert("Рўйхат бўш. Камида битта фирмани белгиланг!");

    const today = new Date().toLocaleDateString('ru-RU');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Сверка");

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

    const dateRow = worksheet.addRow(["", "", "", "", "", `${today} йил ҳолатига`]);
    dateRow.getCell(6).alignment = { horizontal: "right" };
    dateRow.getCell(6).font = { size: 11, name: "Times New Roman" };

    const headerRow = worksheet.addRow([
      "Фирма номлари",
      "СТИР",
      "Чиққан пул жами",
      "Келган счет-ф жами",
      "Фарқи",
      "Изоҳ"
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
      const statusText = isInvoiceNeeded ? 'Ҳисоб фактура олиш керак' : isDebt ? 'Қарзмиз' : '-';

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
    const grandStatusText = grandTotals.diff > 0 ? 'Ҳисоб фактура олиш керак' : grandTotals.diff < 0 ? 'Қарзмиз' : '-';

    const grandRow = worksheet.addRow([
      "ЖАМИ",
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
        <p className="mt-4 font-semibold text-sm animate-pulse">Маълумотлар юкланмоқда...</p>
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
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Далолатнома (Сверка)</h1>
            <p className="text-sm text-slate-500">
              Банк айланмаси ва Э-Фактура файлларни юкланг, таҳрирланг ва таҳлил қилинг.
            </p>
          </div>
          <div className="ml-auto"><ThemeToggle /></div>
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
                      ? `${files.length} та файл танланди`
                      : "Excel / CSV файлларни танланг"}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {files.length > 0 ? files.map((f) => f.name).join(", ") : ".xls, .xlsx, .csv — бир нечта файлни бирга юкласа бўлади"}
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
              {loading ? "Ўқилмоқда..." : "Таҳлил"}
            </button>
          </div>

          {/* Aniqlangan formatlar */}
          {detectedFormats.length > 0 && (
            <div className="anim-fade flex flex-wrap items-center gap-2">
              <span className="text-[11px] uppercase tracking-wider font-bold text-slate-500">Аниқланган форматлар:</span>
              {detectedFormats.map((f) => (
                <span key={f} className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                  {FORMAT_LABELS[f] || f}
                </span>
              ))}
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
                  placeholder="Фирма номи ёки СТИР бўйича қидирув..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2.5 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/70 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 outline-none transition-all duration-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div className="relative">
                <SlidersHorizontal className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4 pointer-events-none" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as "ALL" | "DIFF" | "EQUAL")}
                  className="pl-10 pr-8 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/70 font-semibold text-sm text-slate-700 dark:text-slate-200 outline-none cursor-pointer transition-all duration-300 focus:border-indigo-500 appearance-none"
                >
                  <option value="ALL" className="bg-slate-100 dark:bg-slate-900">Барчаси ({parsedData.length})</option>
                  <option value="DIFF" className="bg-slate-100 dark:bg-slate-900">Фарқи борлар</option>
                  <option value="EQUAL" className="bg-slate-100 dark:bg-slate-900">Тенг бўлганлар</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <button
                onClick={handleExportExcel}
                disabled={displayData.length === 0}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-emerald-600/20 transition-all duration-300 flex items-center gap-2 w-full md:w-auto justify-center hover:-translate-y-0.5 active:scale-95"
              >
                <Download className="w-4 h-4" /> Excel юклаш
              </button>

              <button
                onClick={handleSaveToFirebase}
                disabled={isSaving || selectedFullData.length === 0}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/25 transition-all duration-300 flex items-center gap-2 w-full md:w-auto justify-center hover:-translate-y-0.5 active:scale-95"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {isSaving ? "Сақланмоқда..." : "Сақлаш"}
              </button>
            </div>
          </div>

          {/* JADVAL */}
          <div className="overflow-x-auto w-full border border-slate-200 dark:border-slate-800 rounded-xl pb-0 custom-scrollbar">
            <table className="w-full text-sm table-auto border-collapse">
              <thead className="sticky top-0 z-20">
                <tr className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                  <th className="p-3 w-12 text-center">
                    <input
                      type="checkbox"
                      className="w-4 h-4 cursor-pointer accent-indigo-500"
                      checked={filteredData.length > 0 && filteredData.every((d) => selectedInns.includes(d.inn))}
                      onChange={toggleAll}
                    />
                  </th>
                  <th className="p-3 text-left"><SortHeader label="Фирма номлари" k="name" activeKey={sortKey} dir={sortDir} onToggle={toggleSort} /></th>
                  <th className="p-3 w-32 text-center"><SortHeader label="СТИР" k="inn" align="center" activeKey={sortKey} dir={sortDir} onToggle={toggleSort} /></th>
                  <th className="p-3 w-40 text-right"><SortHeader label="Чиққан пул жами" k="debit" align="right" activeKey={sortKey} dir={sortDir} onToggle={toggleSort} /></th>
                  <th className="p-3 w-40 text-right"><SortHeader label="Келган счет-ф жами" k="credit" align="right" activeKey={sortKey} dir={sortDir} onToggle={toggleSort} /></th>
                  <th className="p-3 w-40 text-right"><SortHeader label="Фарқи" k="diff" align="right" activeKey={sortKey} dir={sortDir} onToggle={toggleSort} /></th>
                  <th className="p-3 w-48 text-left uppercase tracking-wider text-[11px] font-bold text-slate-500 dark:text-slate-400">Изоҳ</th>
                  <th className="p-3 w-24 text-center uppercase tracking-wider text-[11px] font-bold text-slate-500 dark:text-slate-400">Ойлар</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/70">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center p-12 text-slate-500 font-medium text-base">
                      Маълумот топилмади... 🕵️‍♂️
                    </td>
                  </tr>
                ) : (
                  filteredData.map((tx, idx) => {
                    const isSelected = selectedInns.includes(tx.inn);
                    const isExpanded = expandedInns.includes(tx.inn);
                    const isInvoiceNeeded = tx.difference > 0;
                    const isDebt = tx.difference < 0;

                    const statusText = isInvoiceNeeded ? "Ҳисоб фактура олиш керак" : isDebt ? "Қарзмиз" : "-";
                    const statusColor = isDebt ? "text-rose-600 dark:text-rose-400" : isInvoiceNeeded ? "text-amber-600 dark:text-amber-400" : "text-slate-500";

                    return (
                      <React.Fragment key={`${tx.inn}-${idx}`}>
                        <tr className={`transition-colors duration-200 ${isSelected ? "bg-indigo-500/[0.06]" : "hover:bg-slate-100 dark:hover:bg-slate-900/60"}`}>
                          <td className="p-3 text-center">
                            <input
                              type="checkbox"
                              className="w-4 h-4 cursor-pointer accent-indigo-500"
                              checked={isSelected}
                              onChange={() => toggleSelection(tx.inn)}
                            />
                          </td>
                          <td className="p-3 text-left text-slate-900 dark:text-slate-100 font-medium whitespace-normal min-w-[250px]">
                            {tx.name}
                          </td>
                          <td className="p-3 text-center">
                            <span className="font-mono text-xs text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950/60 px-2 py-0.5 rounded-md">{tx.inn}</span>
                          </td>
                          <td className="p-3 text-right text-slate-700 dark:text-slate-200 tabular">{formatNum(tx.totalDebit)}</td>
                          <td className="p-3 text-right text-slate-700 dark:text-slate-200 tabular">{formatNum(tx.totalCredit)}</td>
                          <td className={`p-3 text-right font-bold tabular ${statusColor}`}>{formatNum(tx.difference)}</td>
                          <td className={`p-3 text-left pl-4 font-semibold text-xs ${statusColor}`}>{statusText}</td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => toggleExpand(tx.inn)}
                              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 border ${
                                isExpanded
                                  ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/25"
                                  : "bg-white dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-500/40"
                              }`}
                            >
                              {isExpanded ? "Ёпиш" : "Очиш"}
                              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`} />
                            </button>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr>
                            <td colSpan={8} className="p-0">
                              <div className="anim-fade bg-slate-100/70 dark:bg-slate-900/50 p-5 md:p-6 border-y border-indigo-500/10">
                                <h4 className="font-bold text-indigo-700 dark:text-indigo-300 mb-4 flex items-center gap-2 text-sm">
                                  📅 {tx.name} — Ойма-ой тафсилотлар
                                </h4>
                                <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950/60">
                                  <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-100 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400">
                                      <tr>
                                        <th className="p-3 font-bold text-[11px] uppercase tracking-wider">Давр</th>
                                        <th className="p-3 font-bold text-[11px] uppercase tracking-wider text-right">Чиққан пул (Дебет)</th>
                                        <th className="p-3 font-bold text-[11px] uppercase tracking-wider text-right">Келган счет-ф (Кредит)</th>
                                        <th className="p-3 font-bold text-[11px] uppercase tracking-wider text-right">Фарқ</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                                      {sortedPeriods(tx.monthlyData).length === 0 ? (
                                        <tr>
                                          <td colSpan={4} className="p-3 text-center text-slate-500">Ойлик маълумот йўқ</td>
                                        </tr>
                                      ) : sortedPeriods(tx.monthlyData).map((period) => {
                                        const bucket = tx.monthlyData[period] || { debit: 0, credit: 0 };
                                        const dVal = bucket.debit || 0;
                                        const cVal = bucket.credit || 0;
                                        const diff = dVal - cVal;

                                        return (
                                          <tr key={period} className="hover:bg-slate-100 dark:hover:bg-slate-900/50 transition-colors">
                                            <td className="p-3 font-semibold text-slate-700 dark:text-slate-300">{periodLabel(period)}</td>
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
                    <td colSpan={2} className="p-3 text-right uppercase tracking-wider text-[11px] text-slate-500 dark:text-slate-400">Жами танланганлар:</td>
                    <td className="p-3 text-right text-base text-slate-900 dark:text-white tabular">{formatNum(grandTotals.debit)}</td>
                    <td className="p-3 text-right text-base text-slate-900 dark:text-white tabular">{formatNum(grandTotals.credit)}</td>
                    <td className={`p-3 text-right text-base tabular ${grandTotals.diff < 0 ? "text-rose-600 dark:text-rose-400" : grandTotals.diff > 0 ? "text-amber-600 dark:text-amber-400" : "text-slate-900 dark:text-white"}`}>
                      {formatNum(grandTotals.diff)}
                    </td>
                    <td className={`p-3 text-left pl-4 text-xs ${grandTotals.diff < 0 ? "text-rose-600 dark:text-rose-400" : grandTotals.diff > 0 ? "text-amber-600 dark:text-amber-400" : "text-slate-500"}`}>
                      {grandTotals.diff < 0 ? "Қарзмиз" : grandTotals.diff > 0 ? "Ҳисоб фактура олиш керак" : "-"}
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
