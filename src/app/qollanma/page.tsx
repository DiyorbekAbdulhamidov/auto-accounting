"use client";

import NextLink from "next/link";
import { ArrowRight } from "lucide-react";
import Logo from "@/components/Brand";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageToggle from "@/components/LanguageToggle";
import { useAuth } from "@/context/AuthContext";
import { useT } from "@/context/LanguageContext";
import { buttonClasses, layout } from "@/components/ui";
import Guide from "@/components/guide/Guide";

/**
 * ОЧИҚ қўлланма — кириш ТАЛАБ ҚИЛИНМАЙДИ.
 *
 * Бош саҳифа энди ўзи ҳам очиқ ва қўлланманинг асосий бўлимларини
 * кўрсатади. Бу саҳифа эса ТЎЛИҚ вариант: битта `<Guide />`
 * компоненти, битта манба — иккита жойда матн эскириб қолмайди.
 * Бош саҳифадан ва логин саҳифасидан шу ерга ҳавола бор.
 */
export default function QollanmaPage() {
  const t = useT();
  const { user, loading } = useAuth();
  const signedIn = !loading && !!user;

  return (
    <div className={layout.page}>
      <header className="sticky top-0 z-40 border-b border-line bg-surface/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-3 md:px-6">
          <NextLink href="/" aria-label={t("Бош саҳифа")}>
            <Logo size="sm" />
          </NextLink>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
            <NextLink
              href={signedIn ? "/korxonalar" : "/login"}
              className={buttonClasses("primary", "sm")}
            >
              {signedIn ? t("Иш столи") : t("Бепул бошлаш")}{" "}
              <ArrowRight className="h-4 w-4" />
            </NextLink>
          </div>
        </div>
      </header>

      <div className={`${layout.container} ${layout.stack}`}>
        <h1 className="text-h1 font-semibold tracking-tight text-ink">{t("Қўлланма")}</h1>

        <Guide />

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-surface p-5">
          <div>
            <p className="text-h3 font-semibold text-ink">{t("Синаб кўрасизми?")}</p>
            <p className="mt-1 text-body text-ink-2">
              {t("Бепул: 3 та корхона, сверка чексиз")}
            </p>
          </div>
          <NextLink
            href={signedIn ? "/korxonalar" : "/login"}
            className={buttonClasses("primary", "md")}
          >
            {signedIn ? t("Иш столи") : t("Бепул бошлаш")} <ArrowRight className="h-4 w-4" />
          </NextLink>
        </div>
      </div>
    </div>
  );
}
