// ============================================================
// ИЛОВА ЎРАМИ — кириш талаб қиладиган саҳифалар учун
// ------------------------------------------------------------
// Иккита нарса шу ерда БИР МАРТА қилинади:
//   1. Кириш текшируви. Илгари ҳар саҳифа ўзи текширарди —
//      биттаси унутилса, саҳифа ҳимоясиз қоларди.
//   2. Юқори қатор: логотип, қўлланма, тил, тема, чиқиш.
//
// Модуль ранги бу ерда ЙЎҚ: юқори қатор бренд, у кирим ёки чиқимга
// боғлиқ эмас. Ранг фақат сверка саҳифасининг ичида.
//
// Нега `layout.tsx` нинг ЎЗИ эмас: у сервер компоненти бўлиб қолиши
// керак, акс ҳолда саҳифанинг `metadata` си (брaуzer ёрлиғи ва
// қидирув матни) ёзилмайди.
// ============================================================
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import NextLink from "next/link";
import { BookOpen, LogOut } from "lucide-react";
import Logo from "@/components/Brand";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageToggle from "@/components/LanguageToggle";
import { useAuth } from "@/context/AuthContext";
import { useLocale, useT } from "@/context/LanguageContext";
import { path } from "@/lib/routes";
import { Button, PageLoader, buttonClasses, layout } from "@/components/ui";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const t = useT();
  const locale = useLocale();

  useEffect(() => {
    if (!loading && !user) router.replace(path("login", locale));
  }, [loading, user, locale, router]);

  if (loading || !user) {
    return <PageLoader text={t("Хавфсизлик текшируви...")} />;
  }

  return (
    <div className={layout.page}>
      {/* Очиқ саҳифалардаги шапка билан БИР ХИЛ материал (тўлиқ сирт):
          одам кириш ва иш саҳифаси орасида ўтганда сирт ўзгармайди.
          Бренд градиенти бу ерда ЙЎҚ — иш саҳифасида диққат
          жадвалда бўлиши керак. */}
      <header className="sticky top-0 z-40 border-b border-line bg-surface">
        <div className="mx-auto flex w-full max-w-[1500px] items-center justify-between gap-3 px-4 py-2.5 md:px-6">
          <NextLink href={path("clients", locale)} aria-label={t("Мижозлар")}>
            <Logo size="sm" />
          </NextLink>

          <div className="flex items-center gap-2">
            <NextLink
              href={path("guide", locale)}
              className={buttonClasses("ghost", "sm")}
              title={t("Қўлланма")}
            >
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">{t("Қўлланма")}</span>
            </NextLink>
            <LanguageToggle />
            <ThemeToggle />
            <Button
              variant="secondary"
              size="sm"
              onClick={logout}
              icon={<LogOut className="h-4 w-4" />}
              title={t("Тизимдан чиқиш")}
            >
              <span className="hidden sm:inline">{t("Чиқиш")}</span>
            </Button>
          </div>
        </div>
      </header>

      {children}
    </div>
  );
}
