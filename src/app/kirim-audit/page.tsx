// app/kirim-audit/page.tsx
//
// KIRIM СВЕРКАСИ — мустақил саҳифа.
// Банк кўчирмасидаги ЖАМИ КЕЛГАН ПУЛ (кредит) ва биз ЮБОРГАН
// счёт-фактураларни контрагент кесимида солиштиради.
"use client";

import React, { useMemo, useState } from "react";
import NextLink from "next/link";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import {
  AlertTriangle,
  ArrowLeft,
  ChevronDown,
  CloudUpload,
  Download,
  FileSpreadsheet,
  Loader2,
  Receipt,
  Scale,
  Search,
  SlidersHorizontal,
  TrendingUp,
} from "lucide-react";
import SortHeader from "@/components/SortHeader";
import ThemeToggle from "@/components/ThemeToggle";

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
}
interface KirimResponse {
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
    periodFrom: string | null;
    periodTo: string | null;
    warnings: string[];
  };
}

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

// Фарқнинг маъноси — чиқим сверкасининг АЙНАН ТЕСКАРИСИ:
//   пул > фактура  -> биз счёт-фактура ёзиб бермаганмиз
//   фактура > пул  -> мижоз тўламаган, бизга қарздор
function verdict(diff: number): { text: string; color: string } {
  if (diff > 0.01) return { text: "Ҳисоб фактура ёзиш керак", color: "text-amber-600 dark:text-amber-400" };
  if (diff < -0.01) return { text: "Бизга қарздор", color: "text-rose-600 dark:text-rose-400" };
  return { text: "-", color: "text-slate-500" };
}

type SortKey = "name" | "inn" | "credit" | "factura" | "diff";
type SortDir = "asc" | "desc";
type FilterKind = "ALL" | "DIFF" | "NO_FACTURA" | "UNPAID" | "EQUAL";

export default function KirimAuditPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<KirimResponse | null>(null);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [filterKind, setFilterKind] = useState<FilterKind>("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("credit");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [expanded, setExpanded] = useState<string[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) {
      setError("Камида битта файл танланг: банк кўчирмаси ва/ёки юборилган фактуралар реестри.");
      return;
    }

    setLoading(true);
    setError("");
    const formData = new FormData();
    files.forEach((f) => formData.append("files", f));

    try {
      const res = await fetch("/api/kirim-audit", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) {
        const parsed = data as KirimResponse;
        setReport(parsed);
        setExpanded([]);
        setSelectedKeys(parsed.parties.map((p) => p.key));
      } else {
        setReport(null);
        setError(data.error || "Номаълум хатолик юз берди.");
      }
    } catch (err) {
      console.error(err);
      setError("Сервер билан уланишда хатолик!");
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
        case "NO_FACTURA":
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

  // 📈 EXCEL EXPORT — чиқим сверкаси файлининг айнан тескари кўриниши
  //    (Фирма номлари | СТИР | Келган пул жами | Юборилган счет-ф жами | Фарқи | Изоҳ)
  const handleExport = async () => {
    if (!report || displayRows.length === 0) {
      setError("Рўйхат бўш. Камида битта контрагентни белгиланг!");
      return;
    }

    const today = new Date().toLocaleDateString("ru-RU");
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Сверка");

    ws.columns = [
      { key: "name", width: 50 },
      { key: "inn", width: 18 },
      { key: "credit", width: 22 },
      { key: "factura", width: 22 },
      { key: "diff", width: 22 },
      { key: "note", width: 35 },
    ];

    const titleRow = ws.addRow([report.meta.ownName || "Кирим сверкаси"]);
    titleRow.getCell(1).font = { bold: true, size: 14, name: "Times New Roman" };

    const dateRow = ws.addRow(["", "", "", "", "", `${today} йил ҳолатига`]);
    dateRow.getCell(6).alignment = { horizontal: "right" };
    dateRow.getCell(6).font = { size: 11, name: "Times New Roman" };

    const headerRow = ws.addRow([
      "Фирма номлари",
      "СТИР",
      "Келган пул жами",
      "Юборилган счет-ф жами",
      "Фарқи",
      "Изоҳ",
    ]);
    headerRow.height = 30;
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, name: "Times New Roman", size: 12 };
      cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
      cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
    });

    displayRows.forEach((p) => {
      const row = ws.addRow([p.name, p.inn, p.bankCredit, p.facturaSent, p.difference, verdict(p.difference).text]);
      row.eachCell((cell, col) => {
        cell.font = { name: "Times New Roman", size: 11 };
        cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
        if (col === 1) cell.alignment = { horizontal: "left", vertical: "middle", wrapText: true };
        else if (col === 2 || col === 6) cell.alignment = { horizontal: "center", vertical: "middle" };
        else {
          cell.numFmt = "#,##0.00";
          cell.alignment = { horizontal: "right", vertical: "middle" };
        }
      });
    });

    const grandRow = ws.addRow(["ЖАМИ", "", shown.credit, shown.factura, shown.diff, verdict(shown.diff).text]);
    grandRow.eachCell((cell, col) => {
      cell.font = { bold: true, name: "Times New Roman", size: 12 };
      cell.border = { top: { style: "medium" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
      if (col === 1 || col === 2 || col === 6) cell.alignment = { horizontal: "center", vertical: "middle" };
      else {
        cell.numFmt = "#,##0.00";
        cell.alignment = { horizontal: "right", vertical: "middle" };
      }
    });

    const buffer = await wb.xlsx.writeBuffer();
    saveAs(
      new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
      `Kirim_sverka_${today}.xlsx`
    );
  };

  const totals = report?.totals;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 md:p-8 relative overflow-x-hidden">
      <div className="anim-blob absolute top-[-100px] left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-emerald-500/[0.07] blur-[130px] rounded-full pointer-events-none" />

      <div className="max-w-[1500px] mx-auto space-y-6 relative z-10">
        {/* 📤 ЮКЛАШ КАРТАСИ */}
        <div className="anim-fade-up surface glow-indigo p-6 md:p-8">
          <div className="flex items-center gap-4">
            <NextLink href="/">
              <button className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 hover:-translate-x-0.5">
                <ArrowLeft className="w-4 h-4" />
              </button>
            </NextLink>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                📥 Кирим Сверкаси
              </h1>
              <p className="text-sm text-slate-500">
                Жами келган пул (кредит) ↔ биз юборган счёт-фактуралар. Банк кўчирмаси ва
                E-фактурадан юкланган «юборилган фактуралар» файлини бирга танланг.
              </p>
            </div>
            <div className="ml-auto"><ThemeToggle /></div>
          </div>

          <form onSubmit={handleUpload} className="flex flex-col gap-4 mt-6">
            <div className="flex flex-col md:flex-row gap-4 items-stretch">
              <label className="w-full md:w-3/4 cursor-pointer">
                <div
                  className={`flex items-center gap-3 p-4 border-2 border-dashed rounded-xl transition-all duration-300 ${
                    files.length > 0
                      ? "border-emerald-500/50 bg-emerald-500/5"
                      : "border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950/50 hover:border-slate-400 dark:hover:border-slate-600"
                  }`}
                >
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                    <CloudUpload className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">
                      {files.length > 0 ? `${files.length} та файл танланди` : "Банк кўчирмаси + фактура реестрини танланг"}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {files.length > 0
                        ? files.map((f) => f.name).join(", ")
                        : ".xls, .xlsx, .csv — бир нечта файлни бирга юкласа бўлади"}
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
                className="w-full md:w-1/4 px-8 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/25 transition-all duration-300 flex items-center justify-center gap-2 hover:-translate-y-0.5 active:scale-95"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
                {loading ? "Ўқилмоқда..." : "Ҳисоблаш"}
              </button>
            </div>

            {error && (
              <div className="anim-fade flex items-start gap-2 p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-sm font-medium">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {report && (
              <div className="anim-fade flex flex-wrap items-center gap-2 text-xs">
                {report.meta.bankSheets.map((s) => (
                  <span key={s} className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold">
                    🏦 {s}
                  </span>
                ))}
                {report.meta.facturaSheets.map((s) => (
                  <span key={s} className="px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold">
                    🧾 {s}
                  </span>
                ))}
                {report.meta.ownInn !== "-" && (
                  <span className="px-2.5 py-1 rounded-lg bg-slate-500/10 border border-slate-500/20 text-slate-500 font-bold font-mono">
                    Ўз СТИР: {report.meta.ownInn}
                  </span>
                )}
                {report.meta.periodFrom && (
                  <span className="px-2.5 py-1 rounded-lg bg-slate-500/10 border border-slate-500/20 text-slate-500 font-bold">
                    Давр: {fmtDate(report.meta.periodFrom)} — {fmtDate(report.meta.periodTo)}
                  </span>
                )}
              </div>
            )}

            {report && report.meta.warnings.length > 0 && (
              <div className="anim-fade space-y-1.5">
                {report.meta.warnings.map((w, i) => (
                  <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg border border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-medium">
                    <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <span>{w}</span>
                  </div>
                ))}
              </div>
            )}
          </form>
        </div>

        {report && totals && (
          <>
            {/* 📊 УМУМИЙ КЎРСАТКИЧЛАР */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="anim-fade-up delay-1 surface p-6 flex items-center justify-between transition-all duration-300 hover:border-emerald-500/30 hover:-translate-y-1">
                <div className="space-y-1.5">
                  <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                    Жами келган пул (Кредит)
                  </p>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white tabular">
                    {fmt(totals.bankCredit)} <span className="text-sm text-slate-500 font-bold">UZS</span>
                  </h3>
                  <p className="text-[11px] text-slate-500">{report.meta.bankRowCount} та банк ўтказмаси</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>

              <div className="anim-fade-up delay-2 surface p-6 flex items-center justify-between transition-all duration-300 hover:border-indigo-500/30 hover:-translate-y-1">
                <div className="space-y-1.5">
                  <p className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                    Жами юборилган счёт-фактура
                  </p>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white tabular">
                    {fmt(totals.facturaSent)} <span className="text-sm text-slate-500 font-bold">UZS</span>
                  </h3>
                  <p className="text-[11px] text-slate-500">{report.meta.invoiceCount} та тасдиқланган фактура</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  <Receipt className="w-5 h-5" />
                </div>
              </div>

              <div className="anim-fade-up delay-3 surface p-6 flex items-center justify-between transition-all duration-300 hover:border-amber-500/30 hover:-translate-y-1">
                <div className="space-y-1.5">
                  <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest">Фарқи</p>
                  <h3
                    className={`text-2xl font-black tabular ${
                      Math.abs(totals.difference) <= 0.01
                        ? "text-emerald-600 dark:text-emerald-400"
                        : totals.difference > 0
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {fmt(totals.difference)} <span className="text-sm text-slate-500 font-bold">UZS</span>
                  </h3>
                  <p className={`text-[11px] font-semibold ${verdict(totals.difference).color}`}>
                    {verdict(totals.difference).text}
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  <Scale className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Ҳисобга олинмаган фактуралар */}
            {report.meta.skippedInvoices.length > 0 && (
              <div className="anim-fade surface p-4 flex flex-wrap items-center gap-3 text-xs">
                <span className="font-bold uppercase tracking-wider text-slate-500">Ҳисобга олинмади:</span>
                {report.meta.skippedInvoices.map((s) => (
                  <span key={s.status} className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/60 font-semibold text-slate-600 dark:text-slate-300">
                    {s.status}: {s.count} та — <span className="tabular">{fmt(s.amount)}</span>
                  </span>
                ))}
                <span className="text-slate-400 dark:text-slate-600">
                  (фақат «Тасдиқланган» фактуралар ҳисобланади)
                </span>
              </div>
            )}

            {/* 📋 ЖАДВАЛ */}
            <div className="anim-fade-up delay-4 surface p-4 md:p-6 overflow-hidden">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 bg-slate-100/70 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800/80">
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                  <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Контрагент номи ёки СТИР бўйича қидирув..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2.5 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/70 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 outline-none transition-all duration-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <div className="relative">
                    <SlidersHorizontal className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4 pointer-events-none" />
                    <select
                      value={filterKind}
                      onChange={(e) => setFilterKind(e.target.value as FilterKind)}
                      className="pl-10 pr-8 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/70 font-semibold text-sm text-slate-700 dark:text-slate-200 outline-none cursor-pointer transition-all duration-300 focus:border-emerald-500 appearance-none"
                    >
                      <option value="ALL" className="bg-slate-100 dark:bg-slate-900">Барчаси ({report.parties.length})</option>
                      <option value="DIFF" className="bg-slate-100 dark:bg-slate-900">Фарқи борлар</option>
                      <option value="NO_FACTURA" className="bg-slate-100 dark:bg-slate-900">Пул келган, фактура йўқ</option>
                      <option value="UNPAID" className="bg-slate-100 dark:bg-slate-900">Фактура бор, пул келмаган</option>
                      <option value="EQUAL" className="bg-slate-100 dark:bg-slate-900">Тенг бўлганлар</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleExport}
                  disabled={displayRows.length === 0}
                  className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-emerald-600/20 transition-all duration-300 flex items-center gap-2 w-full md:w-auto justify-center hover:-translate-y-0.5 active:scale-95"
                >
                  <Download className="w-4 h-4" /> Excel юклаш
                </button>
              </div>

              <div className="overflow-x-auto w-full border border-slate-200 dark:border-slate-800 rounded-xl custom-scrollbar">
                <table className="w-full text-sm table-auto border-collapse">
                  <thead className="sticky top-0 z-20">
                    <tr className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                      <th className="p-3 w-12 text-center">
                        <input
                          type="checkbox"
                          className="w-4 h-4 cursor-pointer accent-emerald-500"
                          checked={allShownSelected}
                          onChange={toggleAll}
                        />
                      </th>
                      <th className="p-3 text-left"><SortHeader label="Фирма номлари" k="name" activeKey={sortKey} dir={sortDir} onToggle={toggleSort} /></th>
                      <th className="p-3 w-32 text-center"><SortHeader label="СТИР" k="inn" align="center" activeKey={sortKey} dir={sortDir} onToggle={toggleSort} /></th>
                      <th className="p-3 w-44 text-right"><SortHeader label="Келган пул жами" k="credit" align="right" activeKey={sortKey} dir={sortDir} onToggle={toggleSort} /></th>
                      <th className="p-3 w-44 text-right"><SortHeader label="Юборилган счет-ф жами" k="factura" align="right" activeKey={sortKey} dir={sortDir} onToggle={toggleSort} /></th>
                      <th className="p-3 w-40 text-right"><SortHeader label="Фарқи" k="diff" align="right" activeKey={sortKey} dir={sortDir} onToggle={toggleSort} /></th>
                      <th className="p-3 w-52 text-left uppercase tracking-wider text-[11px] font-bold text-slate-500">Изоҳ</th>
                      <th className="p-3 w-24 text-center uppercase tracking-wider text-[11px] font-bold text-slate-500">Ойлар</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800/70">
                    {rows.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center p-12 text-slate-500 font-medium">
                          Маълумот топилмади... 🕵️‍♂️
                        </td>
                      </tr>
                    ) : (
                      rows.map((p) => {
                        const v = verdict(p.difference);
                        const isOpen = expanded.includes(p.key);
                        const isSelected = selectedKeys.includes(p.key);
                        const periods = Object.keys(p.monthly).sort();

                        return (
                          <React.Fragment key={p.key}>
                            <tr className={`transition-colors ${isSelected ? "bg-emerald-500/[0.06]" : "hover:bg-slate-100 dark:hover:bg-slate-900/60"}`}>
                              <td className="p-3 text-center">
                                <input
                                  type="checkbox"
                                  className="w-4 h-4 cursor-pointer accent-emerald-500"
                                  checked={isSelected}
                                  onChange={() => toggleSelection(p.key)}
                                />
                              </td>
                              <td className="p-3 text-left min-w-[260px]">
                                <div className="font-medium text-slate-900 dark:text-slate-100">{p.name}</div>
                                {p.aliases.length > 1 && (
                                  <div className="text-[11px] text-slate-400 dark:text-slate-600 truncate max-w-[420px]">
                                    {p.aliases.filter((a) => a !== p.name).join(" · ")}
                                  </div>
                                )}
                              </td>
                              <td className="p-3 text-center">
                                <span className="font-mono text-xs text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950/60 px-2 py-0.5 rounded-md">
                                  {p.inn}
                                </span>
                              </td>
                              <td className="p-3 text-right text-emerald-600 dark:text-emerald-400 font-semibold tabular">{fmt(p.bankCredit)}</td>
                              <td className="p-3 text-right text-indigo-600 dark:text-indigo-400 font-semibold tabular">{fmt(p.facturaSent)}</td>
                              <td className={`p-3 text-right font-bold tabular ${v.color}`}>{fmt(p.difference)}</td>
                              <td className={`p-3 text-left text-xs font-semibold ${v.color}`}>{v.text}</td>
                              <td className="p-3 text-center">
                                <button
                                  onClick={() => toggleExpand(p.key)}
                                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 border ${
                                    isOpen
                                      ? "bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-600/25"
                                      : "bg-white dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-500/40"
                                  }`}
                                >
                                  {isOpen ? "Ёпиш" : "Очиш"}
                                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
                                </button>
                              </td>
                            </tr>

                            {isOpen && (
                              <tr>
                                <td colSpan={8} className="p-0">
                                  <div className="anim-fade bg-slate-100/70 dark:bg-slate-900/50 p-5 border-y border-emerald-500/10 space-y-5">
                                    {/* Ойма-ой */}
                                    <div>
                                      <h4 className="font-bold text-emerald-700 dark:text-emerald-300 mb-3 text-sm">📅 Ойма-ой</h4>
                                      <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60">
                                        <table className="w-full text-sm">
                                          <thead className="bg-slate-100 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400">
                                            <tr>
                                              <th className="p-2.5 text-left font-bold text-[11px] uppercase tracking-wider">Давр</th>
                                              <th className="p-2.5 text-right font-bold text-[11px] uppercase tracking-wider">Келган пул</th>
                                              <th className="p-2.5 text-right font-bold text-[11px] uppercase tracking-wider">Фактура</th>
                                              <th className="p-2.5 text-right font-bold text-[11px] uppercase tracking-wider">Фарқ</th>
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                                            {periods.map((period) => {
                                              const b = p.monthly[period];
                                              const d = b.credit - b.factura;
                                              return (
                                                <tr key={period}>
                                                  <td className="p-2.5 font-semibold text-slate-700 dark:text-slate-300">{periodLabel(period)}</td>
                                                  <td className="p-2.5 text-right tabular text-emerald-600 dark:text-emerald-400">{fmt(b.credit)}</td>
                                                  <td className="p-2.5 text-right tabular text-indigo-600 dark:text-indigo-400">{fmt(b.factura)}</td>
                                                  <td className={`p-2.5 text-right tabular font-bold ${verdict(d).color}`}>{fmt(d)}</td>
                                                </tr>
                                              );
                                            })}
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>

                                    {/* Ўтказмалар ва фактуралар */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 overflow-hidden">
                                        <div className="px-3 py-2 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold uppercase tracking-wider">
                                          Банк ўтказмалари ({p.payments.length})
                                        </div>
                                        <div className="max-h-64 overflow-y-auto custom-scrollbar">
                                          <table className="w-full text-xs">
                                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                                              {p.payments.length === 0 ? (
                                                <tr><td className="p-3 text-slate-500">Тўлов йўқ</td></tr>
                                              ) : (
                                                p.payments.map((pay, i) => (
                                                  <tr key={i} className="align-top">
                                                    <td className="p-2.5 w-24 text-slate-500 whitespace-nowrap">{fmtDate(pay.date)}</td>
                                                    <td className="p-2.5 text-right w-32 tabular font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">{fmt(pay.amount)}</td>
                                                    <td className="p-2.5 text-slate-500 dark:text-slate-400">{pay.purpose}</td>
                                                  </tr>
                                                ))
                                              )}
                                            </tbody>
                                          </table>
                                        </div>
                                      </div>

                                      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 overflow-hidden">
                                        <div className="px-3 py-2 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold uppercase tracking-wider">
                                          Юборилган счёт-фактуралар ({p.invoices.length})
                                        </div>
                                        <div className="max-h-64 overflow-y-auto custom-scrollbar">
                                          <table className="w-full text-xs">
                                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                                              {p.invoices.length === 0 ? (
                                                <tr><td className="p-3 text-slate-500">Фактура йўқ</td></tr>
                                              ) : (
                                                p.invoices.map((inv, i) => (
                                                  <tr key={i} className="align-top">
                                                    <td className="p-2.5 w-24 text-slate-500 whitespace-nowrap">{fmtDate(inv.date)}</td>
                                                    <td className="p-2.5 text-right w-32 tabular font-semibold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">{fmt(inv.amount)}</td>
                                                    <td className="p-2.5 text-slate-500 dark:text-slate-400">{inv.number}</td>
                                                  </tr>
                                                ))
                                              )}
                                            </tbody>
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
                  </tbody>

                  {displayRows.length > 0 && (
                    <tfoot className="sticky bottom-0 z-30 bg-slate-100 dark:bg-slate-900 font-bold border-t-2 border-slate-300 dark:border-slate-700">
                      <tr>
                        <td className="p-3 text-center text-emerald-600 dark:text-emerald-400">✓</td>
                        <td colSpan={2} className="p-3 text-right uppercase tracking-wider text-[11px] text-slate-500">
                          Жами танланганлар ({displayRows.length} та):
                        </td>
                        <td className="p-3 text-right text-base tabular text-slate-900 dark:text-white">{fmt(shown.credit)}</td>
                        <td className="p-3 text-right text-base tabular text-slate-900 dark:text-white">{fmt(shown.factura)}</td>
                        <td className={`p-3 text-right text-base tabular ${verdict(shown.diff).color}`}>{fmt(shown.diff)}</td>
                        <td className={`p-3 text-left text-xs ${verdict(shown.diff).color}`}>{verdict(shown.diff).text}</td>
                        <td className="p-3" />
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
