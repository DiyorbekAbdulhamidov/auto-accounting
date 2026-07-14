"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import Link from "next/link";
import {
  Sun,
  Moon,
  FileSpreadsheet,
  Cpu,
  Lock,
  ShieldCheck,
  Building2,
  Boxes // 📦 Yangi ikonka qo'shildi
} from "lucide-react";
import { app } from "@/lib/firebase";

export default function HubPage() {
  const [darkMode, setDarkMode] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  // 🔒 Foydalanuvchi login qilganini tekshirish
  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true);
        setLoadingAuth(false);
      } else {
        router.push("/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (loadingAuth) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-screen ${darkMode ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-900"}`}>
        <div className="relative flex items-center justify-center mb-6">
          <div className="absolute w-24 h-24 border-4 border-indigo-500/20 rounded-full animate-ping" />
          <ShieldCheck className="h-10 w-10 text-indigo-600 relative z-10" />
        </div>
        <p className="font-bold text-sm tracking-widest uppercase animate-pulse text-indigo-500">
          Хавфсизлик текшируви...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className={`min-h-screen transition-colors duration-500 ${darkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-800"} px-4 md:px-8 pt-6 relative overflow-hidden flex flex-col`}>

      {/* Orqa fon uchun chiroyli bezaklar */}
      <div className="absolute top-[-50px] left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-indigo-500/10 dark:bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />

      {/* 🛡️ TOP BAR */}
      <div className="w-full max-w-7xl mx-auto flex justify-between items-center pb-4 border-b border-slate-300/60 dark:border-slate-800 relative z-10">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-lg ${darkMode ? "bg-indigo-500/20 text-indigo-400" : "bg-indigo-100 text-indigo-700"}`}>
            <Building2 className="w-5 h-5" />
          </div>
          <h2 className="text-sm md:text-base font-black uppercase tracking-widest leading-none">
            Бухгалтерия Хизматлари Маркази
          </h2>
        </div>

        <button
          onClick={() => setDarkMode(!darkMode)}
          className={`p-2.5 rounded-xl border transition-all duration-300 shadow-sm ${darkMode ? "bg-slate-900 border-slate-800 text-amber-400 hover:bg-slate-800" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"}`}
          title="Тунги/Кундузги режим"
        >
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>

      {/* 💎 MAIN CONTENT */}
      <div className="max-w-7xl mx-auto w-full mt-10 md:mt-16 space-y-12 relative z-10">

        {/* TITLE & BRANDING */}
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-widest mb-2">
            <ShieldCheck className="w-4 h-4" /> Ички Бошқарув Тизими
          </div>
          <h1 className={`text-4xl md:text-5xl font-black tracking-tight ${darkMode ? "text-white" : "text-slate-900"}`}>
            Иш Муҳитини Танланг
          </h1>
          <p className={`${darkMode ? "text-slate-400" : "text-slate-500"} text-base`}>
            Тизимнинг керакли интеллектуал ёки таҳлилий қисмига кириш учун қуйидаги асосий модуллардан бирини танланг. Барча ҳаракатлар назорат остида.
          </p>
        </div>

        {/* 🎛️ 3 TA ASOSIY TUGMA (Responsive grid o'zgartirildi) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

          {/* 1-TUGMA: Excel Smart-Audit */}
          <Link href="/excel-audit" className="block group">
            <div className={`p-8 rounded-3xl border text-left transition-all duration-500 relative shadow-2xl flex flex-col justify-between h-64 overflow-hidden ${darkMode
              ? "bg-slate-900/60 border-slate-800 text-slate-300 hover:border-indigo-500 hover:bg-slate-900"
              : "bg-white border-slate-200/80 text-slate-700 hover:border-indigo-600 hover:shadow-indigo-600/10"
              }`}>
              {/* Karta ichidagi fon effekti */}
              <div className="absolute top-0 right-0 p-16 bg-indigo-500/5 rounded-bl-full group-hover:scale-150 transition-transform duration-700 pointer-events-none" />

              <div className="flex justify-between items-start w-full relative z-10">
                <div className={`p-4 rounded-2xl transition-transform group-hover:scale-110 duration-300 ${darkMode ? "bg-emerald-500/10 text-emerald-500" : "bg-emerald-50 text-emerald-600"}`}>
                  <FileSpreadsheet className="w-8 h-8" />
                </div>
                <span className="text-xs font-black uppercase tracking-widest px-4 py-2 rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 group-hover:bg-indigo-500 group-hover:shadow-indigo-500/40 transition-all flex items-center gap-1">
                  Кириш <span>→</span>
                </span>
              </div>
              <div className="space-y-2 relative z-10">
                <h3 className={`text-2xl font-extrabold tracking-tight ${darkMode ? "text-white" : "text-slate-900"} group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors`}>
                  Excel Smart-Audit
                </h3>
                <p className="text-sm text-slate-400 max-w-sm">
                  Банк чиқимлари ва келган счёт-фактураларни автоматик солиштириш, фарқларни ва қолдиқларни аниқлаш муҳити.
                </p>
              </div>
            </div>
          </Link>

          {/* 2-TUGMA: Виртуал Омбор (Астатка) - YANGI QO'SHILGAN BO'LIM */}
          <Link href="/astatka" className="block group">
            <div className={`p-8 rounded-3xl border text-left transition-all duration-500 relative shadow-2xl flex flex-col justify-between h-64 overflow-hidden ${darkMode
              ? "bg-slate-900/60 border-slate-800 text-slate-300 hover:border-indigo-500 hover:bg-slate-900"
              : "bg-white border-slate-200/80 text-slate-700 hover:border-indigo-600 hover:shadow-indigo-600/10"
              }`}>
              {/* Karta ichidagi fon effekti */}
              <div className="absolute top-0 right-0 p-16 bg-indigo-500/5 rounded-bl-full group-hover:scale-150 transition-transform duration-700 pointer-events-none" />

              <div className="flex justify-between items-start w-full relative z-10">
                <div className={`p-4 rounded-2xl transition-transform group-hover:scale-110 duration-300 ${darkMode ? "bg-indigo-500/10 text-indigo-400" : "bg-indigo-50 text-indigo-600"}`}>
                  <Boxes className="w-8 h-8" />
                </div>
                <span className="text-xs font-black uppercase tracking-widest px-4 py-2 rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 group-hover:bg-indigo-500 group-hover:shadow-indigo-500/40 transition-all flex items-center gap-1">
                  Кириш <span>→</span>
                </span>
              </div>
              <div className="space-y-2 relative z-10">
                <h3 className={`text-2xl font-extrabold tracking-tight ${darkMode ? "text-white" : "text-slate-900"} group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors`}>
                  Виртуал Омбор (Астатка)
                </h3>
                <p className="text-sm text-slate-400 max-w-sm">
                  Кирувчи ва чиқувчи счёт-фактуралар асосида МХИК (ИКПУ) кодлари бўйича товар қолдиқларини автоматик ҳисоблаш тизими.
                </p>
              </div>
            </div>
          </Link>

          {/* 3-TUGMA: AI Bashorat Moduli (SOON) */}
          <div
            className={`p-8 rounded-3xl border text-left relative flex flex-col justify-between h-64 select-none opacity-50 bg-gradient-to-br transition-all duration-300 overflow-hidden ${darkMode
              ? "from-slate-900 to-slate-950 border-slate-900/60"
              : "from-slate-100 to-slate-200/50 border-slate-200"
              }`}
            style={{ cursor: 'not-allowed' }}
          >
            {/* Qulf foni */}
            <Lock className={`absolute -right-8 -bottom-8 w-48 h-48 opacity-[0.03] ${darkMode ? "text-white" : "text-black"} pointer-events-none`} />

            <div className="flex justify-between items-start w-full relative z-10">
              <div className={`p-4 rounded-2xl ${darkMode ? "bg-slate-800 text-slate-600" : "bg-slate-200 text-slate-400"}`}>
                <Cpu className="w-8 h-8" />
              </div>
              <span className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-500 px-3 py-1.5 rounded-xl border border-amber-500/20 shadow-sm">
                <Lock className="w-3 h-3" /> Яқинда
              </span>
            </div>
            <div className="space-y-2 relative z-10">
              <h3 className={`text-2xl font-extrabold tracking-tight ${darkMode ? "text-slate-600" : "text-slate-400"}`}>
                AI Таҳлил ва Прогноз
              </h3>
              <p className={`text-sm ${darkMode ? "text-slate-700" : "text-slate-400"} max-w-sm`}>
                Сунъий интеллект ёрдамида солиқ хавфларини башорат қилиш ва автоматик баланс тузиш (Ишлаб чиқилмоқда).
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}