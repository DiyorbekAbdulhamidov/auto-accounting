"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import Link from "next/link";
import {
  ArrowDownToLine,
  FileSpreadsheet,
  Cpu,
  Lock,
  ShieldCheck,
  Building2,
  Boxes,
  ArrowRight,
  LogOut,
  Sparkles,
} from "lucide-react";
import { app } from "@/lib/firebase";
import ThemeToggle from "@/components/ThemeToggle";

// Qulflangan modul kartasi (Tez kunda)
function SoonCard({
  icon,
  title,
  text,
  delay,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  delay: string;
}) {
  return (
    <div
      className={`anim-fade-up ${delay} surface p-8 text-left relative flex flex-col justify-between h-64 select-none overflow-hidden opacity-70`}
      style={{ cursor: "not-allowed" }}
    >
      <Lock className="absolute -right-8 -bottom-8 w-44 h-44 opacity-[0.04] text-slate-900 dark:text-white pointer-events-none" />

      <div className="flex justify-between items-start w-full relative z-10">
        <div className="p-4 rounded-2xl bg-slate-200 dark:bg-slate-800/80 text-slate-500">{icon}</div>
        <span className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-600 dark:text-amber-400 px-3 py-1.5 rounded-xl border border-amber-500/20">
          <Sparkles className="w-3 h-3" /> Тез кунда
        </span>
      </div>
      <div className="space-y-2 relative z-10">
        <h3 className="text-2xl font-extrabold tracking-tight text-slate-500">{title}</h3>
        <p className="text-sm text-slate-400 dark:text-slate-600 max-w-sm">{text}</p>
      </div>
    </div>
  );
}

export default function HubPage() {
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

  const handleLogout = async () => {
    await signOut(getAuth(app));
    router.push("/login");
  };

  if (loadingAuth) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white">
        <div className="relative flex items-center justify-center mb-6">
          <div className="anim-pulse-ring absolute w-24 h-24 border border-indigo-500/40 rounded-full" />
          <ShieldCheck className="h-10 w-10 text-indigo-500 relative z-10" />
        </div>
        <p className="font-bold text-xs tracking-[0.25em] uppercase animate-pulse text-indigo-600 dark:text-indigo-400">
          Хавфсизлик текшируви...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 px-4 md:px-8 pt-6 relative overflow-hidden flex flex-col">
      {/* Orqa fon bezaklari */}
      <div className="anim-blob absolute top-[-80px] left-1/2 -translate-x-1/2 w-[800px] h-[320px] bg-indigo-500/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="anim-blob absolute bottom-[-160px] right-[-120px] w-[600px] h-[350px] bg-violet-500/[0.07] blur-[130px] rounded-full pointer-events-none" style={{ animationDelay: "-7s" }} />

      {/* 🛡️ TOP BAR */}
      <div className="anim-fade w-full max-w-7xl mx-auto flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-800/80 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            <Building2 className="w-5 h-5" />
          </div>
          <h2 className="text-sm md:text-base font-black uppercase tracking-widest leading-none text-slate-700 dark:text-slate-200">
            Бухгалтерия Хизматлари Маркази
          </h2>
        </div>

        <div className="flex items-center gap-2">
        <ThemeToggle />
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 text-xs font-bold hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-500/30 transition-all duration-300"
          title="Тизимдан чиқиш"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Чиқиш</span>
        </button>
        </div>
      </div>

      {/* 💎 MAIN CONTENT */}
      <div className="max-w-7xl mx-auto w-full mt-10 md:mt-16 space-y-12 relative z-10 pb-16">
        {/* TITLE & BRANDING */}
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <div className="anim-fade-up inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-widest mb-2">
            <ShieldCheck className="w-4 h-4" /> Ички Бошқарув Тизими
          </div>
          <h1 className="anim-fade-up delay-1 text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
            Иш Муҳитини Танланг
          </h1>
          <p className="anim-fade-up delay-2 text-slate-500 dark:text-slate-400 text-base">
            Ҳозирча Excel Smart-Audit модули фаол. Қолган модуллар тез орада ишга тушади.
          </p>
        </div>

        {/* 🎛️ MODULLAR */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* 1 - Excel Smart-Audit (YAGONA FAOL MODUL) */}
          <Link href="/excel-audit" className="anim-fade-up delay-2 block group">
            <div className="surface glow-indigo p-8 text-left transition-all duration-500 relative flex flex-col justify-between h-64 overflow-hidden group-hover:border-indigo-500/60 group-hover:-translate-y-1.5 group-hover:shadow-[0_20px_60px_rgba(99,102,241,0.2)]">
              {/* Karta ichidagi fon effekti */}
              <div className="absolute top-0 right-0 p-16 bg-indigo-500/5 rounded-bl-full group-hover:scale-150 transition-transform duration-700 pointer-events-none" />

              <div className="flex justify-between items-start w-full relative z-10">
                <div className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 transition-transform group-hover:scale-110 duration-300">
                  <FileSpreadsheet className="w-8 h-8" />
                </div>
                <span className="text-xs font-black uppercase tracking-widest px-4 py-2 rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 group-hover:bg-indigo-500 transition-all flex items-center gap-1.5">
                  Кириш <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
              <div className="space-y-2 relative z-10">
                <h3 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  Excel Smart-Audit
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
                  Банк чиқимлари ва келган счёт-фактураларни автоматик солиштириш, фарқларни аниқлаш муҳити.
                </p>
              </div>
            </div>
          </Link>

          {/* 2 - Kirim Sverkasi (FAOL) */}
          <Link href="/kirim-audit" className="anim-fade-up delay-3 block group">
            <div className="surface p-8 text-left transition-all duration-500 relative flex flex-col justify-between h-64 overflow-hidden group-hover:border-emerald-500/60 group-hover:-translate-y-1.5 group-hover:shadow-[0_20px_60px_rgba(16,185,129,0.18)]">
              <div className="absolute top-0 right-0 p-16 bg-emerald-500/5 rounded-bl-full group-hover:scale-150 transition-transform duration-700 pointer-events-none" />

              <div className="flex justify-between items-start w-full relative z-10">
                <div className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 transition-transform group-hover:scale-110 duration-300">
                  <ArrowDownToLine className="w-8 h-8" />
                </div>
                <span className="text-xs font-black uppercase tracking-widest px-4 py-2 rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 group-hover:bg-emerald-500 transition-all flex items-center gap-1.5">
                  Кириш <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
              <div className="space-y-2 relative z-10">
                <h3 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  Кирим Сверкаси
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
                  Жами келган пул (кредит) ва биз юборган счёт-фактураларни контрагент кесимида солиштириш.
                </p>
              </div>
            </div>
          </Link>

          {/* 3 - Virtual Ombor (SOON) */}
          <SoonCard
            delay="delay-4"
            icon={<Boxes className="w-8 h-8" />}
            title="Виртуал Омбор (Астатка)"
            text="МХИК (ИКПУ) кодлари бўйича товар қолдиқларини автоматик ҳисоблаш тизими."
          />

          {/* 3 - AI Tahlil (SOON) */}
          <SoonCard
            delay="delay-5"
            icon={<Cpu className="w-8 h-8" />}
            title="AI Таҳлил ва Прогноз"
            text="Сунъий интеллект ёрдамида солиқ хавфларини башорат қилиш ва автоматик баланс тузиш."
          />
        </div>
      </div>
    </div>
  );
}
