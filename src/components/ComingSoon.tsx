"use client";

import NextLink from "next/link";
import { ArrowLeft, Lock, Sparkles } from "lucide-react";
import { useT } from "@/context/LanguageContext";

// Hali ochilmagan modullar uchun yagona "Tez kunda" sahifasi
export default function ComingSoon({ title }: { title: string }) {
  const t = useT();
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Orqa fon bezaklari */}
      <div className="anim-blob absolute top-[-120px] left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-indigo-500/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="anim-blob absolute bottom-[-140px] right-[-100px] w-[500px] h-[300px] bg-violet-500/10 blur-[130px] rounded-full pointer-events-none" style={{ animationDelay: "-7s" }} />

      <div className="anim-scale surface glow-indigo p-10 md:p-14 max-w-lg w-full text-center relative z-10">
        <div className="relative inline-flex items-center justify-center mb-8">
          <div className="anim-pulse-ring absolute w-20 h-20 rounded-full border border-indigo-500/40" />
          <div className="p-5 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            <Lock className="w-8 h-8" />
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[11px] font-black uppercase tracking-widest mb-4">
          <Sparkles className="w-3.5 h-3.5" /> {t("Тез кунда")}
        </div>

        <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white mb-3">{t(title)}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-8">
          {t("Ушбу модул ҳозирда ишлаб чиқилмоқда ва тез орада ишга тушади. Ҳозирча")}{" "}
          <span className="text-indigo-600 dark:text-indigo-400 font-semibold">Excel Smart-Audit</span>{" "}
          {t("муҳитидан фойдаланишингиз мумкин.")}
        </p>

        <NextLink href="/">
          <button className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition-all duration-300 shadow-lg shadow-indigo-600/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 active:scale-95">
            <ArrowLeft className="w-4 h-4" /> {t("Бош саҳифага қайтиш")}
          </button>
        </NextLink>
      </div>
    </div>
  );
}
