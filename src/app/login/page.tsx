"use client";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Building2, Loader2, Lock, Mail, ShieldCheck } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageToggle from "@/components/LanguageToggle";
import { useT } from "@/context/LanguageContext";

export default function LoginPage() {
  const t = useT();
  // Oldin bu yerda tayyor email va parol yozilgan turardi (sinov uchun).
  // Ro'yxatdan o'tish ochilgach ular olib tashlandi.
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [error, setError] = useState<string | null>(null);

  const { login, signup } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    if (mode === "signup") {
      const message = await signup(email, password);
      if (message) setError(message);
    } else {
      await login(email, password);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 px-4 relative overflow-hidden">
      {/* Orqa fon bezaklari */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2"><LanguageToggle /><ThemeToggle /></div>
      <div className="anim-blob absolute top-[-120px] left-1/2 -translate-x-1/2 w-[700px] h-[320px] bg-indigo-500/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="anim-blob absolute bottom-[-140px] left-[-100px] w-[500px] h-[300px] bg-violet-500/[0.08] blur-[130px] rounded-full pointer-events-none" style={{ animationDelay: "-7s" }} />

      <div className="anim-scale w-full max-w-md surface glow-indigo p-8 md:p-10 space-y-8 relative z-10">
        <div className="text-center space-y-3">
          <div className="inline-flex p-3.5 rounded-2xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 mb-1">
            <Building2 className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            {mode === "signup" ? t("Рўйхатдан ўтиш") : t("Тизимга кириш")}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            {mode === "signup"
              ? t("Бепул: 3 та корхона, сверка чексиз")
              : t("Тўланган пул ↔ келган фактура: фарқни топади")}
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="anim-fade-up delay-1 space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" /> {t("Email манзил")}
            </label>
            <input
              type="email"
              required
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/70 px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 outline-none transition-all duration-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              placeholder="admin@firma.uz"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="anim-fade-up delay-2 space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" /> {t("Парол")}
            </label>
            <input
              type="password"
              required
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/70 px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 outline-none transition-all duration-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={mode === "signup" ? 6 : undefined}
            />
            {mode === "signup" && (
              <p className="text-[11px] text-slate-400">{t("Камида 6 та белги")}</p>
            )}
          </div>

          {error && (
            <p className="rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-xs font-semibold text-rose-700 dark:text-rose-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="anim-fade-up delay-3 group relative flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3.5 text-sm font-bold text-white transition-all duration-300 hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-600/30 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {isSubmitting
              ? t("Текширилмоқда...")
              : mode === "signup"
                ? t("Бепул бошлаш")
                : t("Тизимга кириш")}
          </button>

          <p className="text-center text-xs text-slate-500 dark:text-slate-400">
            {mode === "signup" ? t("Аллақачон ҳисобингиз борми?") : t("Ҳисобингиз йўқми?")}{" "}
            <button
              type="button"
              onClick={() => { setMode(mode === "signup" ? "login" : "signup"); setError(null); }}
              className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              {mode === "signup" ? t("Кириш") : t("Бепул рўйхатдан ўтиш")}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
};