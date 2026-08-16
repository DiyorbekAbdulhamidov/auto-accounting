"use client";
import { useState } from "react";
import NextLink from "next/link";
import { useAuth } from "@/context/AuthContext";
import Logo from "@/components/Brand";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageToggle from "@/components/LanguageToggle";
import { useT } from "@/context/LanguageContext";
import { Alert, Button, Card, Field, Input, layout } from "@/components/ui";

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
    <div className={`${layout.page} flex items-center justify-center px-4`}>
      {/* Логотип бош саҳифага олиб боради: логинда турган одам
          «бу нима эди?» деса, орқага йўл бўлиши керак. */}
      <NextLink href="/" className="absolute left-4 top-4" aria-label={t("Бош саҳифа")}>
        <Logo size="sm" />
      </NextLink>
      <div className="absolute right-4 top-4 flex items-center gap-2">
        <LanguageToggle />
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-sm p-6">
        <div className="mb-6">
          <h1 className="text-h2 font-semibold text-ink">
            {mode === "signup" ? t("Рўйхатдан ўтиш") : t("Тизимга кириш")}
          </h1>
          <p className="mt-1.5 text-body text-ink-2">
            {mode === "signup"
              ? t("Бепул: 3 та корхона, сверка чексиз")
              : t("Тўланган пул ↔ келган фактура: фарқни топади")}
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <Field label={t("Email манзил")} htmlFor="email">
            <Input
              id="email"
              type="email"
              required
              autoComplete="email"
              placeholder="admin@firma.uz"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>

          <Field
            label={t("Парол")}
            htmlFor="password"
            hint={mode === "signup" ? t("Камида 6 та белги") : undefined}
          >
            <Input
              id="password"
              type="password"
              required
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={mode === "signup" ? 6 : undefined}
            />
          </Field>

          {error && <Alert tone="bad">{error}</Alert>}

          <Button type="submit" variant="primary" block loading={isSubmitting}>
            {isSubmitting
              ? t("Текширилмоқда...")
              : mode === "signup"
                ? t("Бепул бошлаш")
                : t("Тизимга кириш")}
          </Button>

          {/* Қўлланма кириш ТАЛАБ ҚИЛМАЙДИ: ишонтириш керак бўлган одам
              логинда турибди, тизимнинг ичида эмас. */}
          <p className="text-center text-caption text-ink-3">
            <NextLink href="/qollanma" className="font-medium text-accent-ink hover:underline">
              {t("Тизим қандай ишлайди?")}
            </NextLink>
          </p>

          <p className="text-center text-caption text-ink-3">
            {mode === "signup" ? t("Аллақачон ҳисобингиз борми?") : t("Ҳисобингиз йўқми?")}{" "}
            <button
              type="button"
              onClick={() => {
                setMode(mode === "signup" ? "login" : "signup");
                setError(null);
              }}
              className="font-medium text-accent-ink hover:underline"
            >
              {mode === "signup" ? t("Кириш") : t("Бепул рўйхатдан ўтиш")}
            </button>
          </p>
        </form>
      </Card>
    </div>
  );
}
