"use client";
import React, { useState, use, useMemo } from "react";
// 🔥 FIREBASE IMPORTLARI 
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface AggregatedTx {
  name: string;
  inn: string;
  debitMonths: Record<number, number>;
  creditMonths: Record<number, number>;
  totalDebit: number;
  totalCredit: number;
  difference: number;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function CompanyDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const companyId = resolvedParams.id;

  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  // Asosiy ma'lumotlar bazasi (tahrirlanadigan state)
  const [parsedData, setParsedData] = useState<AggregatedTx[]>([]);
  const [detectedFormats, setDetectedFormats] = useState<string[]>([]);

  // Tanlangan va ochilgan qatorlar
  const [selectedInns, setSelectedInns] = useState<string[]>([]);
  const [expandedInns, setExpandedInns] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // 🔍 Qidiruv va Filtr state'lari
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"ALL" | "DIFF" | "EQUAL">("DIFF");

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
        setParsedData(data.data);
        setDetectedFormats(data.detectedFormats);

        // Avtomat tarzda farqi borlarni tanlaymiz
        const diffData = data.data.filter((item: AggregatedTx) => Math.abs(item.difference) > 0.01);
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

  // ✍️ QO'LDA O'ZGARTIRISH FUNKSIYASI (Manual Edit)
  const handleCellEdit = (inn: string, month: number, field: "debit" | "credit", val: string) => {
    const numVal = parseFloat(val.replace(/,/g, "")) || 0;

    setParsedData((prev) =>
      prev.map((row) => {
        if (row.inn !== inn) return row;

        const newRow = { ...row };
        if (field === "debit") {
          newRow.debitMonths = { ...newRow.debitMonths, [month]: numVal };
          newRow.totalDebit = Object.values(newRow.debitMonths).reduce((a, b) => a + b, 0);
        } else {
          newRow.creditMonths = { ...newRow.creditMonths, [month]: numVal };
          newRow.totalCredit = Object.values(newRow.creditMonths).reduce((a, b) => a + b, 0);
        }

        // Yangi farqni hisoblash (Debet - Kredit = Saldo)
        newRow.difference = newRow.totalDebit - newRow.totalCredit;
        return newRow;
      })
    );
  };

  // 🎯 FILTRLASH VA QIDIRUV LOGIKASI
  const filteredData = useMemo(() => {
    return parsedData.filter((item) => {
      // 1. Qidiruv bo'yicha
      const matchesSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.inn.includes(searchTerm);
      if (!matchesSearch) return false;

      // 2. Filtr bo'yicha
      if (filterType === "DIFF") return Math.abs(item.difference) > 0.01;
      if (filterType === "EQUAL") return Math.abs(item.difference) <= 0.01;
      return true; // ALL
    });
  }, [parsedData, searchTerm, filterType]);

  // Faqat CHECKBOX orqali tanlanganlarini ekranga va jami summaga o'tkazamiz
  const displayData = useMemo(() =>
    filteredData.filter((tx) => selectedInns.includes(tx.inn)),
    [filteredData, selectedInns]);

  // CHECKBOX VA EXPAND FUNKSIYALARI
  const toggleSelection = (inn: string) => {
    setSelectedInns((prev) => prev.includes(inn) ? prev.filter((i) => i !== inn) : [...prev, inn]);
  };

  const toggleAll = () => {
    if (selectedInns.length === filteredData.length && filteredData.length > 0) {
      setSelectedInns([]);
    } else {
      setSelectedInns(filteredData.map((d) => d.inn));
    }
  };

  const toggleExpand = (inn: string) => {
    setExpandedInns((prev) => prev.includes(inn) ? prev.filter((i) => i !== inn) : [...prev, inn]);
  };

  // ☁️ FIREBASE-GA SAQLASH
  const handleSaveToFirebase = async () => {
    if (displayData.length === 0) return alert("Сақлаш учун камида битта фирмани белгиланг!");

    setIsSaving(true);
    try {
      const docRef = await addDoc(collection(db, "sverka_reports"), {
        companyId: companyId,
        savedAt: serverTimestamp(),
        totals: grandTotals,
        firmsData: displayData,
      });
      alert(`Муваффақиятли сақланди! (ID: ${docRef.id})`);
    } catch (error) {
      console.error("Firebase хатолиги:", error);
      alert("Сақлашда хатолик юз берди.");
    } finally {
      setIsSaving(false);
    }
  };

  // ЖАМИ СУММАЛАРНИ ҲИСОБЛАШ (Grand Total)
  const grandTotals = displayData.reduce(
    (acc, curr) => {
      acc.debit += curr.totalDebit;
      acc.credit += curr.totalCredit;
      acc.diff += curr.difference;
      return acc;
    },
    { debit: 0, credit: 0, diff: 0 }
  );

  const months = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];

  const formatNum = (num: number) => {
    if (!num && num !== 0) return "-";
    return num.toLocaleString("ru-RU", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  };

  return (
    <div className="p-4 md:p-8 max-w-[100vw] overflow-x-hidden space-y-6 bg-gray-50/50 min-h-screen">
      {/* 📁 FAYL YUKLASH */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 max-w-4xl mx-auto">
        <h1 className="text-2xl font-black text-gray-800 mb-2">Муқояса далолатномаси (Сверка)</h1>
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
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 md:p-6 w-full max-w-[1400px] mx-auto overflow-hidden">

          {/* 🔍 FILTRLAR VA QIDIRUV PANELLARI */}
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
                onChange={(e) => setFilterType(e.target.value as any)}
                className="px-4 py-2 rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-indigo-500 font-medium text-gray-700 outline-none"
              >
                <option value="ALL">Барчаси ({parsedData.length})</option>
                <option value="DIFF">Фарқи борлар</option>
                <option value="EQUAL">Тенг бўлганлар</option>
              </select>
            </div>

            <button
              onClick={handleSaveToFirebase}
              disabled={isSaving || displayData.length === 0}
              className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-md transition-all flex items-center gap-2 w-full md:w-auto justify-center"
            >
              {isSaving ? "Сақланмоқда..." : "💾 Firebase'га сақлаш"}
            </button>
          </div>

          {/* 📝 ASOSIY JADVAL */}
          <div className="overflow-x-auto w-full border border-gray-300 rounded-xl shadow-inner pb-4 custom-scrollbar">
            <table className="w-full text-left text-sm whitespace-nowrap table-auto border-collapse">
              <thead className="bg-gray-100 text-gray-700 font-bold uppercase tracking-wider sticky top-0 z-20 shadow-sm border-b-2 border-gray-300">
                <tr>
                  <th className="p-4 border-r border-gray-300 w-12 text-center">
                    <input
                      type="checkbox"
                      className="w-4 h-4 cursor-pointer accent-indigo-600"
                      checked={selectedInns.length === filteredData.length && filteredData.length > 0}
                      onChange={toggleAll}
                    />
                  </th>
                  <th className="p-4 border-r border-gray-300">Фирма номлари</th>
                  <th className="p-4 border-r border-gray-300">СТИР</th>
                  <th className="p-4 border-r border-gray-300 text-right bg-red-50 text-red-800">Жами Дебет</th>
                  <th className="p-4 border-r border-gray-300 text-right bg-green-50 text-green-800">Жами Кредит</th>
                  <th className="p-4 border-r border-gray-300 text-right bg-indigo-50 text-indigo-900">Фарқ (Сальдо)</th>
                  <th className="p-4 text-center">Батафсил</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center p-12 text-gray-500 font-medium text-base">
                      Маълумот топилмади... 🕵️‍♂️
                    </td>
                  </tr>
                ) : (
                  filteredData.map((tx, idx) => {
                    const isSelected = selectedInns.includes(tx.inn);
                    const isExpanded = expandedInns.includes(tx.inn);

                    return (
                      <React.Fragment key={`${tx.inn}-${idx}`}>
                        <tr className={`transition-all ${isSelected ? 'bg-indigo-50/30' : 'hover:bg-gray-50'}`}>
                          <td className="p-3 border-r border-gray-200 text-center">
                            <input
                              type="checkbox"
                              className="w-4 h-4 cursor-pointer accent-indigo-600"
                              checked={isSelected}
                              onChange={() => toggleSelection(tx.inn)}
                            />
                          </td>
                          <td className="p-3 border-r border-gray-200 font-bold text-gray-800 whitespace-normal min-w-[250px]">
                            {tx.name}
                          </td>
                          <td className="p-3 border-r border-gray-200 font-mono text-gray-600">{tx.inn}</td>

                          <td className="p-3 border-r border-gray-200 text-right font-bold text-red-700 bg-red-50/20">
                            {formatNum(tx.totalDebit)}
                          </td>
                          <td className="p-3 border-r border-gray-200 text-right font-bold text-green-700 bg-green-50/20">
                            {formatNum(tx.totalCredit)}
                          </td>
                          <td className={`p-3 border-r border-gray-200 text-right font-black text-base ${tx.difference < 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {formatNum(tx.difference)}
                          </td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => toggleExpand(tx.inn)}
                              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${isExpanded ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                            >
                              {isExpanded ? 'Ёпиш ▴' : 'Очиш ▾'}
                            </button>
                          </td>
                        </tr>

                        {/* 🌟 ОЙМА-ОЙ ИЧКИ ЖАДВАЛ (EXPANDED ROW) */}
                        {isExpanded && (
                          <tr>
                            <td colSpan={7} className="p-0">
                              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-6 border-b border-indigo-200 shadow-inner">
                                <h4 className="font-black text-indigo-900 mb-4 flex items-center gap-2">
                                  <span>📅 {tx.name} - Ойма-ой ҳисобот</span>
                                </h4>
                                <div className="overflow-hidden rounded-xl border border-indigo-200 bg-white shadow-sm">
                                  <table className="w-full text-sm text-left">
                                    <thead className="bg-indigo-100/60 text-indigo-900">
                                      <tr>
                                        <th className="p-3 font-bold border-r border-indigo-100">Ойлар</th>
                                        <th className="p-3 font-bold border-r border-indigo-100 text-right text-red-700">Дебет (Банк/Чиққан)</th>
                                        <th className="p-3 font-bold border-r border-indigo-100 text-right text-green-700">Кредит (Фактура)</th>
                                        <th className="p-3 font-bold text-right text-indigo-900">Фарқ</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-indigo-50">
                                      {months.map((mName, i) => {
                                        const m = i + 1;
                                        const dVal = tx.debitMonths[m] || 0;
                                        const cVal = tx.creditMonths[m] || 0;
                                        const diff = dVal - cVal;

                                        return (
                                          <tr key={mName} className="hover:bg-indigo-50/30 transition-colors">
                                            <td className="p-3 font-semibold text-gray-700 border-r border-indigo-50 bg-gray-50/50">{mName}</td>

                                            {/* QO'LDA O'ZGARTIRISH INPUTLARI */}
                                            <td className="p-2 border-r border-indigo-50">
                                              <input
                                                type="number"
                                                value={dVal === 0 ? '' : dVal}
                                                placeholder="0.00"
                                                onChange={(e) => handleCellEdit(tx.inn, m, 'debit', e.target.value)}
                                                className="w-full text-right p-1.5 border border-gray-200 rounded text-red-700 font-medium focus:ring-2 focus:ring-red-400 outline-none transition-all hover:border-red-300"
                                              />
                                            </td>
                                            <td className="p-2 border-r border-indigo-50">
                                              <input
                                                type="number"
                                                value={cVal === 0 ? '' : cVal}
                                                placeholder="0.00"
                                                onChange={(e) => handleCellEdit(tx.inn, m, 'credit', e.target.value)}
                                                className="w-full text-right p-1.5 border border-gray-200 rounded text-green-700 font-medium focus:ring-2 focus:ring-green-400 outline-none transition-all hover:border-green-300"
                                              />
                                            </td>
                                            <td className={`p-3 text-right font-bold ${diff < 0 ? 'text-red-500' : diff > 0 ? 'text-green-500' : 'text-gray-400'}`}>
                                              {formatNum(diff)}
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                    <tfoot className="bg-indigo-50 font-black text-indigo-900 border-t border-indigo-200">
                                      <tr>
                                        <td className="p-3 border-r border-indigo-100">ЖАМИ:</td>
                                        <td className="p-3 text-right text-red-700 border-r border-indigo-100">{formatNum(tx.totalDebit)}</td>
                                        <td className="p-3 text-right text-green-700 border-r border-indigo-100">{formatNum(tx.totalCredit)}</td>
                                        <td className={`p-3 text-right ${tx.difference < 0 ? 'text-red-600' : 'text-green-600'}`}>{formatNum(tx.difference)}</td>
                                      </tr>
                                    </tfoot>
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

              {/* 🏁 ЯКУНИЙ ЖАМИ (GRAND TOTAL) */}
              {displayData.length > 0 && (
                <tfoot className="sticky bottom-0 z-30 bg-gray-900 text-white font-bold shadow-[0_-4px_15px_rgba(0,0,0,0.1)]">
                  <tr>
                    <td className="p-4 border-r border-gray-700 text-center">✓</td>
                    <td colSpan={2} className="p-4 border-r border-gray-700 text-right uppercase tracking-wider text-gray-300">Жами танланганлар:</td>
                    <td className="p-4 border-r border-gray-700 text-right text-red-400 text-base">{formatNum(grandTotals.debit)}</td>
                    <td className="p-4 border-r border-gray-700 text-right text-green-400 text-base">{formatNum(grandTotals.credit)}</td>
                    <td className={`p-4 border-r border-gray-700 text-right text-lg ${grandTotals.diff < 0 ? 'text-red-400' : 'text-green-400'}`}>
                      {formatNum(grandTotals.diff)}
                    </td>
                    <td></td>
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