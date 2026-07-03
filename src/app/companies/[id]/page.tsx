"use client";
import { useState, use, useMemo } from "react";
// 🔥 FIREBASE IMPORTLARI (firebaseConfig.js qayerda joylashgan bo'lsa, o'sha manzilni bering)
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
// import { db } from "@/lib/firebase"; // <--- BAZANI ULAGANDA SHU YERNI KOMMENTDAN CHIQARING

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
  const [parsedData, setParsedData] = useState<AggregatedTx[]>([]);
  const [detectedFormats, setDetectedFormats] = useState<string[]>([]);

  // 1-YANGILIK: Tanlangan firmalar INN raqamlarini saqlash uchun State
  const [selectedInns, setSelectedInns] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

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

        // API dan ma'lumot kelganda, farqi bor firmalarni avtomat tarzda "tanlangan" qilib qo'yamiz
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

  // 2-YANGILIK: FIRMALARNI FILTRLASH
  // Avval farqi borlarni ajratamiz (0.01 dan katta)
  const differenceData = useMemo(() =>
    parsedData.filter((item) => Math.abs(item.difference) > 0.01),
    [parsedData]);

  // Keyin faqat CHECKBOX orqali tanlanganlarini ekranga va jami summaga o'tkazamiz
  const displayData = useMemo(() =>
    differenceData.filter((tx) => selectedInns.includes(tx.inn)),
    [differenceData, selectedInns]);

  // CHECKBOX FUNKSIYALARI
  const toggleSelection = (inn: string) => {
    setSelectedInns((prev) =>
      prev.includes(inn) ? prev.filter((i) => i !== inn) : [...prev, inn]
    );
  };

  const toggleAll = () => {
    if (selectedInns.length === differenceData.length) {
      setSelectedInns([]); // Hammasini o'chirish
    } else {
      setSelectedInns(differenceData.map((d) => d.inn)); // Hammasini belgilash
    }
  };

  // 3-YANGILIK: FIREBASE-GA SAQLASH
  const handleSaveToFirebase = async () => {
    if (displayData.length === 0) {
      return alert("Сақлаш учун камида битта фирмани белгиланг!");
    }

    setIsSaving(true);
    try {
      const docRef = await addDoc(collection(db, "sverka_reports"), {
        companyId: companyId,
        savedAt: serverTimestamp(),
        totals: grandTotals,
        firmsData: displayData
      });
      alert(`Муваффақиятли сақланди! (ID: ${docRef.id})`);

      // Vaqtincha xabar (db ulanmaguncha tekshirib ko'rish uchun)
      alert("Маълумотлар Firebase'га юборишга тайёр! (Коддаги комментарийни очинг)");
    } catch (error) {
      console.error("Firebase хатолиги:", error);
      alert("Сақлашда хатолик юз берди.");
    } finally {
      setIsSaving(false);
    }
  };

  // ЖАМИ СУММАЛАРНИ ҲИСОБЛАШ (Grand Total) - Faqat tanlangan (displayData) bo'yicha
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
    if (!num) return "-";
    return num.toLocaleString("ru-RU", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  };

  return (
    <div className="p-4 md:p-8 max-w-[100vw] overflow-x-hidden space-y-6 bg-gray-50/50 min-h-screen">
      {/* 📁 FAYL YUKLASH */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 max-w-4xl mx-auto">
        <h1 className="text-2xl font-black text-gray-800 mb-2">Муқояса далолатномаси (Сверка)</h1>
        <p className="text-sm text-gray-500 mb-6">
          Бир вақтнинг ўзида <strong>Банк айланмаси (Hamkor/Ipoteka)</strong> ва <strong>Э-Фактура</strong> файлларни танлаб юкланг.
        </p>

        <form onSubmit={handleFileUpload} className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="w-full md:w-3/4">
              <label className="block text-sm font-semibold text-gray-600 mb-2">Excel файл(лар)ни танланг</label>
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

          {files.length > 0 && (
            <div className="text-sm text-gray-600 font-medium bg-gray-50 p-3 rounded-lg border">
              <span className="text-indigo-600 font-bold">{files.length} та файл танланди:</span>{" "}
              {files.map((f) => f.name).join(", ")}
            </div>
          )}
        </form>
      </div>

      {/* 📊 EXCEL PREVIEW */}
      {parsedData.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 md:p-6 w-full overflow-hidden">
          <div className="mb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Дебет (Тўловлар) ва Кредит (Счёт-Фактуралар)</h2>
              <p className="text-sm text-gray-600 mt-1">
                Танланган контрагентлар: <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">{displayData.length} та</span>
                <span className="mx-2 text-gray-300">|</span>
                Фарқи борлар: <span className="font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-md">{differenceData.length} та</span>
              </p>
            </div>

            <div className="flex gap-2 flex-wrap">
              {detectedFormats.length > 0 && (
                <div className="bg-blue-50 text-blue-800 px-4 py-2 rounded-lg text-sm font-bold border border-blue-200 flex items-center gap-2">
                  🤖 Форматлар:
                  {detectedFormats.map((fmt) => (
                    <span key={fmt} className="bg-white px-2 py-1 rounded text-[11px] border border-blue-200 uppercase shadow-sm">
                      {fmt.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              )}

              {/* FIREBASE SAQLASH TUGMASI */}
              <button
                onClick={handleSaveToFirebase}
                disabled={isSaving || displayData.length === 0}
                className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-5 py-2 rounded-lg text-sm font-bold shadow-md transition-all flex items-center gap-2"
              >
                {isSaving ? "Сақланмоқда..." : "💾 Firebase'га сақлаш"}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto w-full border border-gray-300 rounded-xl shadow-inner pb-4 relative custom-scrollbar">
            <table className="w-max text-left text-[12px] whitespace-nowrap table-auto border-collapse">
              <thead className="bg-gray-100 text-gray-700 font-bold uppercase tracking-wider sticky top-0 z-20 shadow-sm border-b-2 border-gray-300">
                {/* 1-QATOR */}
                <tr>
                  {/* CHECKBOX USTUNI */}
                  <th rowSpan={2} className="p-3 border-r border-gray-300 bg-gray-200 sticky left-0 z-40 w-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] text-center">
                    <input
                      type="checkbox"
                      className="w-4 h-4 cursor-pointer"
                      checked={selectedInns.length === differenceData.length && differenceData.length > 0}
                      onChange={toggleAll}
                      title="Барчасини белгилаш/бекор қилиш"
                    />
                  </th>
                  <th rowSpan={2} className="p-3 border-r border-gray-300 bg-gray-200 sticky left-10 z-30 w-72 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Фирма номлари</th>
                  <th rowSpan={2} className="p-3 border-r border-gray-300 bg-gray-200 sticky left-[328px] z-30 w-32 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">СТИР</th>

                  {/* DEBET */}
                  <th colSpan={12} className="p-2 border-r border-gray-300 text-center bg-red-100 text-red-800 border-b border-red-200">Чиқган пул (Дебет / Банк)</th>
                  <th rowSpan={2} className="p-3 border-r-2 border-gray-400 text-center bg-red-200 text-red-900 shadow-sm">Чиқган пул жами</th>

                  {/* KREDIT */}
                  <th colSpan={12} className="p-2 border-r border-gray-300 text-center bg-green-100 text-green-800 border-b border-green-200">Келган счёт-фактура (Кредит)</th>
                  <th rowSpan={2} className="p-3 border-r-2 border-gray-400 text-center bg-green-200 text-green-900 shadow-sm">Келган счёт-ф. жами</th>

                  <th rowSpan={2} className="p-3 text-center bg-indigo-100 text-indigo-900 shadow-sm">Фарқи (Сальдо)</th>
                </tr>
                {/* 2-QATOR */}
                <tr>
                  {months.map((m, i) => <th key={`d-${i}`} className="p-2 border-r border-gray-300 text-center font-bold bg-red-50">{m.slice(0, 3)}</th>)}
                  {months.map((m, i) => <th key={`c-${i}`} className="p-2 border-r border-gray-300 text-center font-bold bg-green-50">{m.slice(0, 3)}</th>)}
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 bg-white">
                {differenceData.length === 0 ? (
                  <tr>
                    <td colSpan={31} className="text-center p-12 text-gray-500 font-medium text-base">
                      🎉 Барча контрагентлар бўйича дебет ва кредит тенг ёки ҳеч қандай фарқ топилмади!
                    </td>
                  </tr>
                ) : (
                  differenceData.map((tx, idx) => {
                    const isSelected = selectedInns.includes(tx.inn);
                    return (
                      <tr key={`${tx.inn}-${idx}`} className={`transition-colors group ${isSelected ? 'hover:bg-blue-50/50' : 'bg-gray-50 opacity-60'}`}>
                        {/* CHECKBOX */}
                        <td className="p-3 border-r border-gray-200 text-center sticky left-0 bg-white z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                          <input
                            type="checkbox"
                            className="w-4 h-4 cursor-pointer"
                            checked={isSelected}
                            onChange={() => toggleSelection(tx.inn)}
                          />
                        </td>

                        <td className="p-3 border-r border-gray-200 font-bold text-gray-800 sticky left-10 bg-white z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] truncate max-w-[280px]" title={tx.name}>
                          {tx.name}
                        </td>
                        <td className="p-3 border-r border-gray-200 font-mono text-gray-600 sticky left-[328px] bg-white z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                          {tx.inn}
                        </td>

                        {/* Debet oylari */}
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                          <td key={`dm-${m}`} className="p-2 border-r border-gray-100 text-right text-red-600/80 font-medium">
                            {formatNum(tx.debitMonths[m])}
                          </td>
                        ))}
                        <td className="p-3 border-r-2 border-gray-300 text-right font-black text-red-700 bg-red-50/30">
                          {formatNum(tx.totalDebit)}
                        </td>

                        {/* Kredit oylari */}
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                          <td key={`cm-${m}`} className="p-2 border-r border-gray-100 text-right text-green-600/80 font-medium">
                            {formatNum(tx.creditMonths[m])}
                          </td>
                        ))}
                        <td className="p-3 border-r-2 border-gray-300 text-right font-black text-green-700 bg-green-50/30">
                          {formatNum(tx.totalCredit)}
                        </td>

                        {/* Farqi */}
                        <td className={`p-3 text-right font-black text-base ${tx.difference < 0 ? 'text-red-600' : 'text-green-600'} bg-indigo-50/30`}>
                          {formatNum(tx.difference)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>

              {/* 🏁 ЯКУНИЙ ЖАМИ (GRAND TOTAL) */}
              {displayData.length > 0 && (
                <tfoot className="sticky bottom-0 z-30 bg-gray-800 text-white font-bold shadow-[0_-2px_10px_rgba(0,0,0,0.1)]">
                  <tr>
                    <td className="p-4 border-r border-gray-600 sticky left-0 bg-gray-800 z-40 text-center">✓</td>
                    <td className="p-4 border-r border-gray-600 sticky left-10 bg-gray-800 z-40 text-right uppercase tracking-wider">Жами қолдиқ:</td>
                    <td className="p-4 border-r border-gray-600 sticky left-[328px] bg-gray-800 z-40"></td>
                    <td colSpan={12} className="border-r border-gray-600"></td>
                    <td className="p-4 border-r-2 border-gray-600 text-right text-red-300 text-sm">{formatNum(grandTotals.debit)}</td>
                    <td colSpan={12} className="border-r border-gray-600"></td>
                    <td className="p-4 border-r-2 border-gray-600 text-right text-green-300 text-sm">{formatNum(grandTotals.credit)}</td>
                    <td className={`p-4 text-right text-base ${grandTotals.diff < 0 ? 'text-red-400' : 'text-green-400'}`}>
                      {formatNum(grandTotals.diff)}
                    </td>
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