"use client";
import { useState } from "react";

// Hozircha mavjud firmalar ro'yxati (Buni keyinchalik Firestore 'companies' kolleksiyasidan ham tortish mumkin)
const FIXED_COMPANIES = [
  { id: "comp_01", name: "Alfa Tekstil MCHJ" },
  { id: "comp_02", name: "Premium Trading XK" },
  { id: "comp_03", name: "Auto Accounting Service" },
  { id: "comp_04", name: "Global Logistics MCHJ" },
  // Qolgan 30-40 ta firmani shu yerga tartib bilan qo'shib borasiz...
];

export default function FileUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [formatType, setFormatType] = useState("HAMKORBANK");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !selectedCompany) {
      setMessage({ type: "error", text: "⚠️ Iltimos, firma va faylni tanlang!" });
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "" });

    const formData = new FormData();
    formData.append("file", file);
    formData.append("companyId", selectedCompany);
    formData.append("formatType", formatType);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setLoading(false);

      if (res.ok && data.success) {
        setMessage({
          type: "success",
          text: `🎉 Muvaffaqiyatli yuklandi! ${data.count} ta tranzaksiya qayta ishlandi (dublikatlar filtrlangan).`,
        });
        setFile(null); // Fayl oynasini tozalash
      } else {
        setMessage({ type: "error", text: `❌ Xatolik: ${data.error || data.message}` });
      }
    } catch (err) {
      setLoading(false);
      setMessage({ type: "error", text: "❌ Server bilan bog'lanishda kutilmagan xatolik." });
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-8 p-6 bg-white rounded-2xl shadow-lg border border-gray-100">
      <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        📊 Bank Oborotkasini Yuklash & Tahlil (AI)
      </h2>

      {message.text && (
        <div
          className={`p-3 mb-4 rounded-xl text-center text-sm font-medium ${message.type === "success"
              ? "bg-green-50 text-green-700 border border-green-100"
              : "bg-red-50 text-red-700 border border-red-100"
            }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleUpload} className="space-y-5">
        {/* 1. Firmani Tanlash Dropdown */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">1. Qaysi Firmaning Hisoboti? (30-40 ta firma)</label>
          <select
            required
            value={selectedCompany}
            onChange={(e) => setSelectedCompany(e.target.value)}
            className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 text-gray-700 font-medium"
          >
            <option value="">-- Firmani tanlang --</option>
            {FIXED_COMPANIES.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
        </div>

        {/* 2. Bank Formatini Tanlash */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">2. Bank Shabloni (Format turi)</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setFormatType("HAMKORBANK")}
              className={`p-3 rounded-xl border font-medium text-sm transition text-center ${formatType === "HAMKORBANK"
                  ? "border-indigo-600 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-500/20"
                  : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                }`}
            >
              🏛️ HAMKORBANK
            </button>
            <button
              type="button"
              onClick={() => setFormatType("IPOTEKA_ASBT")}
              className={`p-3 rounded-xl border font-medium text-sm transition text-center ${formatType === "IPOTEKA_ASBT"
                  ? "border-indigo-600 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-500/20"
                  : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                }`}
            >
              🏢 IPOTEKA ASBT
            </button>
          </div>
        </div>

        {/* 3. Excel Faylni Yuklash (Drag & Drop yoki Oddiy input) */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">3. Excel/Vypiska Faylini Tanlang</label>
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 bg-gray-50 text-center hover:bg-gray-100/50 transition cursor-pointer relative">
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              required
            />
            <div className="space-y-1">
              <span className="text-2xl">📁</span>
              <p className="text-sm font-medium text-gray-600">
                {file ? `Tanlangan fayl: ${file.name}` : "Excel faylni bosing yoki shu yerga tashlang"}
              </p>
              <p className="text-xs text-gray-400">Faqat .xlsx yoki .xls formatlar</p>
            </div>
          </div>
        </div>

        {/* 4. Yuborish Tugmasi */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white p-3.5 rounded-xl font-bold hover:bg-indigo-700 transition disabled:bg-indigo-400 shadow-md shadow-indigo-600/10 flex justify-center items-center gap-2"
        >
          {loading ? (
            <>
              <span className="animate-spin text-lg">⏳</span> Tahlil qilinmoqda (6 oylik ma'lumot)...
            </>
          ) : (
            "🚀 Faylni Yuklash va Avtomat Tahlil Qilish"
          )}
        </button>
      </form>
    </div>
  );
}