// app/company/[id]/page.tsx
"use client";
import React, { useState, use, useMemo, useEffect } from "react";
// 🔥 FIREBASE IMPORTLARI
import { collection, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

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
  monthlyData: Record<string, MonthlyBucket>; // key: "YYYY-MM"
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

  const formatNum = (num: number) => {
    if (!num && num !== 0) return "-";
    return num.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // 🔄 SAHIFA OCHILGANDA FIREBASE'DAN MA'LUMOTLARNI YUKLASH
  useEffect(() => {
    async function fetchSavedData() {
      if (!companyId) return;
      try {
        const q = query(
          collection(db, "sverka_reports"),
          where("companyId", "==", companyId)
        );

        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const docs = querySnapshot.docs.map((d) => ({ id: d.id, ...d.data() } as SverkaReportDoc & { id: string }));
          docs.sort((a, b) => (b.savedAt?.toMillis() || 0) - (a.savedAt?.toMillis() || 0));

          const latestReport = docs[0];

          if (latestReport.firmsData && latestReport.firmsData.length > 0) {
            // Формула ўзгаргани учун фарқни қайта ҳисоблаб оламиз: Чиққан пул - Келган пул
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
      const res = await fetch("/api/upload-preview", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.success) {
        // Келган маълумотни янги формула бўйича тўғрилаймиз: Чиққан пул (debit) - Келган пул (credit)
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

  // ✍️ QO'LDA O'ZGARTIRISH
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
          difference: totalDebit - totalCredit, // Янги формула: Чиққан пул - Келган пул
        };
      })
    );
  };

  // 🎯 FILTRLASH VA QIDIRUV
  const filteredData = useMemo(() => {
    return parsedData.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.inn.includes(searchTerm);
      if (!matchesSearch) return false;

      if (filterType === "DIFF") return Math.abs(item.difference) > 0.01;
      if (filterType === "EQUAL") return Math.abs(item.difference) <= 0.01;
      return true;
    });
  }, [parsedData, searchTerm, filterType]);

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

  // ЖАМИ СУММАЛАРНИ ҲИСОБЛАШ
  const grandTotals = displayData.reduce(
    (acc, curr) => {
      acc.debit += curr.totalDebit;
      acc.credit += curr.totalCredit;
      acc.diff += curr.difference;
      return acc;
    },
    { debit: 0, credit: 0, diff: 0 }
  );

  // ☁️ FIREBASE-GA SAQLASH
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

  // 🖨️ PDF ФОРМАТИДА ОЙМА-ОЙ ЮКЛАБ ОЛИШ
  const handleExportPDF = () => {
    if (displayData.length === 0) return alert("Рўйхат бўш. Камида битта фирмани белгиланг!");

    const printWindow = window.open('', '', 'width=900,height=700');
    if (!printWindow) return alert("Браузерингиз қалқиб чиқувчи (pop-up) ойналарни блоклаган!");

    const today = new Date().toLocaleDateString('ru-RU');

    let tableHTML = `
      <table class="main-table">
        <thead>
          <tr>
            <th style="width: 5%;">T/r</th>
            <th>Фирма номлари</th>
            <th style="width: 12%;">СТИР</th>
            <th style="width: 15%;">Чиққан пул жами</th>
            <th style="width: 15%;">Келган счет-ф жами</th>
            <th style="width: 15%;">Фарқи</th>
            <th style="width: 20%;">Изоҳ</th>
          </tr>
        </thead>
        <tbody>
    `;

    displayData.forEach((tx, index) => {
      const isInvoiceNeeded = tx.difference > 0; // Чиққан пул катта
      const isDebt = tx.difference < 0;        // Счет-фактура катта (минус)
      const statusText = isInvoiceNeeded ? 'Ҳисоб фактура олиш керак' : isDebt ? 'Қарзмиз' : '-';
      const statusClass = isDebt ? 'status-debt' : isInvoiceNeeded ? 'status-invoice' : '';

      tableHTML += `
        <tr class="firm-row">
          <td class="text-center">${index + 1}</td>
          <td>${tx.name}</td>
          <td class="text-center">${tx.inn}</td>
          <td class="text-right">${formatNum(tx.totalDebit)}</td>
          <td class="text-right">${formatNum(tx.totalCredit)}</td>
          <td class="text-right ${statusClass}">${formatNum(tx.difference)}</td>
          <td class="text-center ${statusClass}">${statusText}</td>
        </tr>
      `;

      sortedPeriods(tx.monthlyData).forEach((period) => {
        const bucket = tx.monthlyData[period] || { debit: 0, credit: 0 };
        const dVal = bucket.debit || 0;
        const cVal = bucket.credit || 0;
        const diff = dVal - cVal; // Чиққан пул - Келган пул

        if (dVal > 0 || cVal > 0 || diff !== 0) {
          const isMonthInvoice = diff > 0;
          const isMonthDebt = diff < 0;
          const mStatusText = isMonthInvoice ? 'Ҳисоб фактура олиш керак' : isMonthDebt ? 'Қарзмиз' : '-';
          const mStatusClass = isMonthDebt ? 'status-debt' : isMonthInvoice ? 'status-invoice' : '';

          tableHTML += `
            <tr class="month-row">
              <td></td>
              <td class="month-name">-- ${periodLabel(period)}</td>
              <td class="text-center">-</td>
              <td class="text-right">${formatNum(dVal)}</td>
              <td class="text-right">${formatNum(cVal)}</td>
              <td class="text-right ${mStatusClass}">${formatNum(diff)}</td>
              <td class="text-center ${mStatusClass}">${mStatusText}</td>
            </tr>
          `;
        }
      });
    });

    const grandIsInvoice = grandTotals.diff > 0;
    const grandIsDebt = grandTotals.diff < 0;
    const grandStatusText = grandIsInvoice ? 'Ҳисоб фактура олиш керак' : grandIsDebt ? 'Қарзмиз' : '-';
    const grandStatusClass = grandIsDebt ? 'status-debt' : grandIsInvoice ? 'status-invoice' : '';

    tableHTML += `
          <tr class="grand-total">
            <td class="text-center">✓</td>
            <td colspan="2">ЖАМИ ТАНЛАНГАНЛАР</td>
            <td class="text-right">${formatNum(grandTotals.debit)}</td>
            <td class="text-right">${formatNum(grandTotals.credit)}</td>
            <td class="text-right ${grandStatusClass}">${formatNum(grandTotals.diff)}</td>
            <td class="text-center ${grandStatusClass}">${grandStatusText}</td>
          </tr>
        </tbody>
      </table>
    `;

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="uz">
      <head>
        <meta charset="utf-8">
        <title>Далолатнома - ${today}</title>
        <style>
          @page { size: A4; margin: 15mm; }
          body { font-family: 'Times New Roman', serif; color: #000; font-size: 12px; margin: 0; padding: 0;}
          .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #1e3a8a; padding-bottom: 10px; }
          h1 { font-size: 16px; text-transform: uppercase; margin: 0 0 5px 0; color: #1e3a8a; font-weight: bold; }
          .subtitle { font-size: 12px; color: #444; font-style: italic; }
          .meta { width: 100%; margin-bottom: 15px; font-size: 12px; }
          
          .main-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          .main-table th { background-color: #1e3a8a; color: #fff; border: 1px solid #1e3a8a; padding: 6px; font-size: 11px; text-transform: uppercase;}
          .main-table td { border: 1px solid #aaa; padding: 4px 6px; font-size: 11px; }
          
          .firm-row { background-color: #f1f5f9; font-weight: bold; }
          .month-row { background-color: #fff; }
          .month-name { padding-left: 20px !important; color: #444; font-style: italic; }
          
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          
          .status-debt { color: #dc2626 !important; font-weight: bold; }
          .status-invoice { color: #d97706 !important; font-weight: bold; }
          
          .grand-total { background-color: #e2e8f0; font-weight: bold; border-top: 2px solid #1e3a8a; }
          .grand-total td { padding: 8px 6px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>ДАЛОЛАТНОМА ҲИСОБОТИ (СВЕРКА)</h1>
          <div class="subtitle">Ойма-ой батафсил таҳлил ва автоматик изоҳлар</div>
        </div>
        <table class="meta">
          <tr>
            <td style="width: 20%;"><strong>Ҳисобот санаси:</strong></td>
            <td>${today}</td>
          </tr>
        </table>
        
        ${tableHTML}
        
        <script>
          window.onload = function() { 
            setTimeout(() => { window.print(); }, 500);
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  if (isFetchingData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50/50 text-gray-500 font-medium">
        <span className="animate-pulse">Маълумотлар юкланмоқда... ⏳</span>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-[100vw] overflow-x-hidden space-y-6 bg-gray-50/50 min-h-screen">
      {/* 📁 FAYL YUKLASH */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 max-w-4xl mx-auto">
        <h1 className="text-2xl font-black text-gray-800 mb-2">Далолатнома (Сверка)</h1>
        <p className="text-sm text-gray-500 mb-6">
          Банк айланмаси ва Э-Фактура файлларни юкланг, таҳрирланг ва таҳлил қилинг.
        </p>

        <form onSubmit={handleFileUpload} className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="w-full md:w-3/4">
              <input
                type="file"
                accept=".xls,.xlsx,.csv"
                multiple
                onChange={(e) => setFiles(Array.from(e.target.files || []))}
                className="w-full p-2.5 border border-gray-200 rounded-xl bg-gray-50 text-sm font-medium text-gray-700 cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full md:w-1/4 px-8 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center"
            >
              {loading ? "Ўқилмоқда..." : "🚀 Таҳлил"}
            </button>
          </div>
        </form>
      </div>

      {/* 📊 ASOSIY QISM */}
      {parsedData.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 md:p-6 w-full max-w-[1500px] mx-auto overflow-hidden">

          {/* 🔍 FILTRLAR VA ТУГМАЛАР */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 bg-gray-50 p-4 rounded-xl border border-gray-200">
            <div className="flex gap-4 w-full md:w-auto">
              <input
                type="text"
                placeholder="Фирма номи ёки СТИР бўйича қидирув..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-4 py-2 w-full md:w-80 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as "ALL" | "DIFF" | "EQUAL")}
                className="px-4 py-2 rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-indigo-500 font-medium text-gray-700 outline-none"
              >
                <option value="ALL">Барчаси ({parsedData.length})</option>
                <option value="DIFF">Фарқи борлар</option>
                <option value="EQUAL">Тенг бўлганлар</option>
              </select>
            </div>

            <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
              <button
                onClick={handleExportPDF}
                disabled={displayData.length === 0}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-md transition-all flex items-center gap-2 w-full md:w-auto justify-center"
              >
                📄 PDF юклаш
              </button>

              <button
                onClick={handleSaveToFirebase}
                disabled={isSaving || selectedFullData.length === 0}
                className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-md transition-all flex items-center gap-2 w-full md:w-auto justify-center"
              >
                {isSaving ? "Сақланмоқда..." : "💾 Firebase'га сақлаш"}
              </button>
            </div>
          </div>

          {/* 📝 ASOSIY JADVAL */}
          <div className="overflow-x-auto w-full border border-gray-400 rounded-lg shadow-inner pb-4 custom-scrollbar">
            <table className="w-full text-sm table-auto border-collapse border border-gray-400">
              <thead className="bg-white text-black font-semibold text-center sticky top-0 z-20 shadow-sm">
                <tr>
                  <th className="p-2 border border-gray-400 w-12 text-center bg-gray-50">
                    <input
                      type="checkbox"
                      className="w-4 h-4 cursor-pointer accent-indigo-600"
                      checked={filteredData.length > 0 && filteredData.every((d) => selectedInns.includes(d.inn))}
                      onChange={toggleAll}
                    />
                  </th>
                  <th className="p-2 border border-gray-400 bg-gray-50 text-sm">Фирма номлари</th>
                  <th className="p-2 border border-gray-400 bg-gray-50 text-sm w-32">СТИР</th>
                  <th className="p-2 border border-gray-400 bg-gray-50 text-sm w-40">Чиққан пул<br />жами</th>
                  <th className="p-2 border border-gray-400 bg-gray-50 text-sm w-40">Келган счет-ф<br />жами</th>
                  <th className="p-2 border border-gray-400 bg-gray-50 text-sm w-40">Фарқи</th>
                  <th className="p-2 border border-gray-400 bg-gray-50 text-sm w-48">Изоҳ</th>
                  <th className="p-2 border border-gray-400 bg-gray-50 text-sm w-24">Ойлар</th>
                </tr>
              </thead>

              <tbody className="bg-white">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center p-12 text-gray-500 font-medium text-base border border-gray-400">
                      Маълумот топилмади... 🕵️‍♂️
                    </td>
                  </tr>
                ) : (
                  filteredData.map((tx, idx) => {
                    const isSelected = selectedInns.includes(tx.inn);
                    const isExpanded = expandedInns.includes(tx.inn);

                    // Изоҳ мантиғи янгиланди: 
                    // tx.difference > 0 (Чиққан пул кўп) -> Ҳисоб фактура олиш керак
                    // tx.difference < 0 (Минус бўлса, Счёт-фактура кўп) -> Қарзмиз
                    const isInvoiceNeeded = tx.difference > 0;
                    const isDebt = tx.difference < 0;

                    const statusText = isInvoiceNeeded ? "Ҳисоб фактура олиш керак" : isDebt ? "Қарзмиз" : "-";
                    const statusColor = isDebt ? "text-red-600" : isInvoiceNeeded ? "text-amber-600" : "text-gray-500";

                    return (
                      <React.Fragment key={`${tx.inn}-${idx}`}>
                        <tr className={`transition-all ${isSelected ? 'bg-indigo-50/20' : 'hover:bg-gray-50'}`}>
                          <td className="p-2 border border-gray-400 text-center">
                            <input
                              type="checkbox"
                              className="w-4 h-4 cursor-pointer accent-indigo-600"
                              checked={isSelected}
                              onChange={() => toggleSelection(tx.inn)}
                            />
                          </td>
                          <td className="p-2 border border-gray-400 text-left text-gray-900 whitespace-normal min-w-[250px]">
                            {tx.name}
                          </td>
                          <td className="p-2 border border-gray-400 text-center text-gray-800">{tx.inn}</td>

                          <td className="p-2 border border-gray-400 text-right text-gray-900">
                            {formatNum(tx.totalDebit)}
                          </td>
                          <td className="p-2 border border-gray-400 text-right text-gray-900">
                            {formatNum(tx.totalCredit)}
                          </td>
                          <td className={`p-2 border border-gray-400 text-right font-semibold ${statusColor}`}>
                            {formatNum(tx.difference)}
                          </td>
                          <td className={`p-2 border border-gray-400 text-left pl-4 font-medium ${statusColor}`}>
                            {statusText}
                          </td>
                          <td className="p-2 border border-gray-400 text-center">
                            <button
                              onClick={() => toggleExpand(tx.inn)}
                              className={`px-3 py-1 rounded text-xs font-bold transition-all border ${isExpanded ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-400 hover:bg-gray-100'}`}
                            >
                              {isExpanded ? 'Ёпиш ▴' : 'Очиш ▾'}
                            </button>
                          </td>
                        </tr>

                        {/* 🌟 ОЙМА-ОЙ ИЧКИ ЖАДВАЛ */}
                        {isExpanded && (
                          <tr>
                            <td colSpan={8} className="p-0 border border-gray-400">
                              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-6 border-b border-indigo-200 shadow-inner">
                                <h4 className="font-bold text-indigo-900 mb-4 flex items-center gap-2">
                                  <span>📅 {tx.name} - Ойма-ой тафсилотлар</span>
                                </h4>
                                <div className="overflow-hidden rounded-xl border border-indigo-200 bg-white shadow-sm">
                                  <table className="w-full text-sm text-left">
                                    <thead className="bg-indigo-100/60 text-indigo-900">
                                      <tr>
                                        <th className="p-3 font-bold border-r border-indigo-100">Давр</th>
                                        <th className="p-3 font-bold border-r border-indigo-100 text-right">Чиққан пул (Дебет)</th>
                                        <th className="p-3 font-bold border-r border-indigo-100 text-right">Келган счет-ф (Кредит)</th>
                                        <th className="p-3 font-bold text-right text-indigo-900">Фарқ</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-indigo-50">
                                      {sortedPeriods(tx.monthlyData).length === 0 ? (
                                        <tr>
                                          <td colSpan={4} className="p-3 text-center text-gray-400">Ойлик маълумот йўқ</td>
                                        </tr>
                                      ) : sortedPeriods(tx.monthlyData).map((period) => {
                                        const bucket = tx.monthlyData[period] || { debit: 0, credit: 0 };
                                        const dVal = bucket.debit || 0;
                                        const cVal = bucket.credit || 0;
                                        const diff = dVal - cVal; // Янги формула: Чиққан пул - Келган пул

                                        return (
                                          <tr key={period} className="hover:bg-indigo-50/30 transition-colors">
                                            <td className="p-3 font-semibold text-gray-700 border-r border-indigo-50 bg-gray-50/50">{periodLabel(period)}</td>
                                            <td className="p-2 border-r border-indigo-50">
                                              <input
                                                type="number"
                                                value={dVal === 0 ? '' : dVal}
                                                placeholder="0.00"
                                                onChange={(e) => handleCellEdit(tx.inn, period, 'debit', e.target.value)}
                                                className="w-full text-right p-1.5 border border-gray-200 rounded text-gray-800 font-medium focus:ring-2 focus:ring-blue-400 outline-none transition-all"
                                              />
                                            </td>
                                            <td className="p-2 border-r border-indigo-50">
                                              <input
                                                type="number"
                                                value={cVal === 0 ? '' : cVal}
                                                placeholder="0.00"
                                                onChange={(e) => handleCellEdit(tx.inn, period, 'credit', e.target.value)}
                                                className="w-full text-right p-1.5 border border-gray-200 rounded text-gray-800 font-medium focus:ring-2 focus:ring-blue-400 outline-none transition-all"
                                              />
                                            </td>
                                            <td className={`p-3 text-right font-bold ${diff < 0 ? 'text-red-600' : diff > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
                                              {formatNum(diff)}
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                    <tfoot className="bg-indigo-50 font-black text-indigo-900 border-t border-indigo-200">
                                      <tr>
                                        <td className="p-3 border-r border-indigo-100">ЖАМИ:</td>
                                        <td className="p-3 text-right border-r border-indigo-100">{formatNum(tx.totalDebit)}</td>
                                        <td className="p-3 text-right border-r border-indigo-100">{formatNum(tx.totalCredit)}</td>
                                        <td className={`p-3 text-right ${tx.difference < 0 ? 'text-red-600' : tx.difference > 0 ? 'text-amber-600' : 'text-gray-600'}`}>{formatNum(tx.difference)}</td>
                                      </tr>
                                    </tfoot>
                                  </table>
                                </div>

                                {/* 🧾 Барча ўтказмалар */}
                                {tx.transactions && tx.transactions.length > 0 && (
                                  <div className="mt-4 overflow-hidden rounded-xl border border-indigo-200 bg-white shadow-sm">
                                    <div className="px-4 py-2 bg-indigo-50 text-indigo-900 font-bold text-sm border-b border-indigo-100">
                                      🧾 Барча ўтказмалар ({tx.transactions.length})
                                    </div>
                                    <div className="max-h-64 overflow-y-auto">
                                      <table className="w-full text-xs text-left">
                                        <thead className="bg-gray-50 text-gray-600 sticky top-0">
                                          <tr>
                                            <th className="p-2 border-r border-gray-100">Сана</th>
                                            <th className="p-2 border-r border-gray-100">Тури</th>
                                            <th className="p-2 border-r border-gray-100 text-right">Дебет</th>
                                            <th className="p-2 text-right">Кредит</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                          {tx.transactions.map((t, ti) => (
                                            <tr key={ti} className="hover:bg-gray-50">
                                              <td className="p-2 border-r border-gray-100 text-gray-700">{t.date}</td>
                                              <td className="p-2 border-r border-gray-100 text-gray-500">{t.type}</td>
                                              <td className="p-2 border-r border-gray-100 text-right">{t.debit ? formatNum(t.debit) : '-'}</td>
                                              <td className="p-2 text-right">{t.credit ? formatNum(t.credit) : '-'}</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>

              {/* 🏁 ЯКУНИЙ ЖАМИ */}
              {displayData.length > 0 && (
                <tfoot className="sticky bottom-0 z-30 bg-gray-100 text-black font-bold border-t-2 border-gray-400">
                  <tr>
                    <td className="p-3 border border-gray-400 text-center">✓</td>
                    <td colSpan={2} className="p-3 border border-gray-400 text-right uppercase tracking-wider text-gray-700">Жами танланганлар:</td>
                    <td className="p-3 border border-gray-400 text-right text-base">{formatNum(grandTotals.debit)}</td>
                    <td className="p-3 border border-gray-400 text-right text-base">{formatNum(grandTotals.credit)}</td>
                    <td className={`p-3 border border-gray-400 text-right text-base ${grandTotals.diff < 0 ? 'text-red-600' : grandTotals.diff > 0 ? 'text-amber-600' : ''}`}>
                      {formatNum(grandTotals.diff)}
                    </td>
                    <td className={`p-3 border border-gray-400 text-left pl-4 ${grandTotals.diff < 0 ? 'text-red-600' : grandTotals.diff > 0 ? 'text-amber-600' : ''}`}>
                      {grandTotals.diff < 0 ? "Қарзмиз" : grandTotals.diff > 0 ? "Ҳисоб фактура олиш керак" : "-"}
                    </td>
                    <td className="p-3 border border-gray-400"></td>
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