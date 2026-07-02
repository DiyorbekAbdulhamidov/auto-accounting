"use client";
import { useState } from "react";

export default function FileUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [companyId, setCompanyId] = useState("");
  const [formatType, setFormatType] = useState("HAMKORBANK");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file || !companyId) {
      alert("Iltimos, firma va faylni tanlang!");
      return;
    }

    setLoading(true);
    setStatus("Fayl tahlil qilinmoqda...");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("companyId", companyId);
    formData.append("formatType", formatType);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setStatus(`🎉 Muvaffaqiyatli yuklandi! ${data.count} ta tranzaksiya saqlandi.`);
        setFile(null);
      } else {
        setStatus(`❌ Xatolik: ${data.error || data.message}`);
      }
    } catch (err) {
      setStatus("❌ Tarmoq xatoligi yuz berdi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 max-w-xl mx-auto">
      <h3 className="text-lg font-bold text-gray-800 mb-4">Yangi Oborot (Excel) Yuklash</h3>

      <div className="space-y-4 mb-6">
        {/* Firma tanlash paneli (Vaqtincha qo'lda kiritamiz, keyin bazadan dinamik qilamiz) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Firmani tanlang</label>
          <select
            className="w-full p-2.5 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
          >
            <option value="">-- Tanlang --</option>
            <option value="angren_auto_id">ANGREN AUTO PARTS MChJ</option>
            <option value="agrozoobet_id">AGROZOOBET-FAYZ XK</option>
          </select>
        </div>

        {/* Bank Formati */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bank Formati (Shablon)</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                name="format"
                value="HAMKORBANK"
                checked={formatType === "HAMKORBANK"}
                onChange={() => setFormatType("HAMKORBANK")}
                className="text-indigo-600 focus:ring-indigo-500"
              />
              Hamkorbank (Excel)
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                name="format"
                value="IPOTEKA_ASBT"
                checked={formatType === "IPOTEKA_ASBT"}
                onChange={() => setFormatType("IPOTEKA_ASBT")}
                className="text-indigo-600 focus:ring-indigo-500"
              />
              Ipoteka ASBT (Excel/Spravka)
            </label>
          </div>
        </div>
      </div>

      {/* Drag and Drop Maydoni */}
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition ${file ? "border-green-400 bg-green-50/30" : "border-gray-300 hover:border-indigo-400 bg-gray-50/50"
          }`}
      >
        <input
          type="file"
          id="file-input"
          className="hidden"
          accept=".xlsx, .xls, .csv"
          onChange={handleFileChange}
        />
        <label htmlFor="file-input" className="cursor-pointer">
          <div className="text-4xl mb-2">{file ? "📄" : "📁"}</div>
          <p className="text-sm font-medium text-gray-700">
            {file ? file.name : "Excel faylni shu yerga tashlang yoki bosing"}
          </p>
          <p className="text-xs text-gray-400 mt-1">Faqat .xlsx, .xls formatlar</p>
        </label>
      </div>

      {status && (
        <p className="mt-4 text-sm text-center font-medium p-2 bg-gray-50 rounded-xl text-gray-700">
          {status}
        </p>
      )}

      <button
        onClick={handleUpload}
        disabled={loading || !file}
        className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-4 rounded-xl transition disabled:bg-gray-300 disabled:cursor-not-allowed text-sm shadow-sm shadow-indigo-100"
      >
        {loading ? "Yuklanmoqda..." : "Ma'lumotlarni Tahlil Qilish"}
      </button>
    </div>
  );
}