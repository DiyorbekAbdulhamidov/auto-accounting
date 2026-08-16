// ============================================================
// БОШ САҲИФА — ОЧИҚ
// ------------------------------------------------------------
// Илгари бу ер логин ортида турарди ва «Иш Муҳитини Танланг» деб
// бошланарди. Иккита муаммо бор эди:
//   1. Маҳсулот ҳақида ҳеч нарса айтмасди. Ишонтириш керак бўлган
//      одам — яъни ҳали рўйхатдан ўтмаган буxгалтер — уни ҲЕЧ
//      ҚАЧОН кўрмасди.
//   2. «Иш муҳитини танланг» деган нарса бош саҳифа эмас, ичкари
//      экран. Энди у `/korxonalar` да: мижозни танлайсиз, ичида
//      чиқим ва кирим таб бўлиб туради.
//
// Кирган фойдаланувчи бу саҳифадан ҚАЙТАРИЛМАЙДИ — у ҳам нархни,
// ҳам қўлланмани кўра олиши керак. Фақат тугма «Иш столига ўтиш»
// га айланади.
// ============================================================
"use client";

import NextLink from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useT } from "@/context/LanguageContext";
import Logo from "@/components/Brand";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageToggle from "@/components/LanguageToggle";
import { buttonClasses, layout } from "@/components/ui";
import {
  GuideDirections,
  GuideFaq,
  GuideFindings,
  GuideSteps,
} from "@/components/guide/Guide";
import {
  Comparison,
  Features,
  FinalCta,
  Footer,
  Hero,
  Pricing,
  Roadmap,
} from "@/components/landing/Sections";

export default function LandingPage() {
  const t = useT();
  const { user, loading } = useAuth();
  const signedIn = !loading && !!user;

  return (
    <div className={layout.page}>
      {/* --- НАВИГАЦИЯ --- */}
      <header className="sticky top-0 z-40 border-b border-line bg-surface/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-3 md:px-6">
          <NextLink href="/" aria-label={t("Бош саҳифа")}>
            <Logo size="sm" />
          </NextLink>

          <nav className="hidden items-center gap-1 md:flex">
            <a href="#qanday" className={buttonClasses("ghost", "sm")}>
              {t("Қандай ишлайди")}
            </a>
            <a href="#imkoniyatlar" className={buttonClasses("ghost", "sm")}>
              {t("Нима бор")}
            </a>
            <a href="#narx" className={buttonClasses("ghost", "sm")}>
              {t("Нарх")}
            </a>
            <NextLink href="/qollanma" className={buttonClasses("ghost", "sm")}>
              {t("Қўлланма")}
            </NextLink>
          </nav>

          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
            <NextLink
              href={signedIn ? "/korxonalar" : "/login"}
              className={buttonClasses("primary", "sm")}
            >
              {signedIn ? t("Иш столи") : t("Кириш")}
            </NextLink>
          </div>
        </div>
      </header>

      <main>
        <Hero signedIn={signedIn} />
        <Comparison />

        {/* «Уч қадам» ва «иккита йўналиш» — қўлланма билан БИТТА
            манбадан. Икки жойда икки нусха бўлса, биттаси эскирарди. */}
        <section id="qanday" className="mx-auto w-full max-w-7xl space-y-6 px-4 py-14 md:px-6">
          <GuideSteps />
          <GuideDirections />
        </section>

        <Features />

        <section className="mx-auto w-full max-w-7xl px-4 py-14 md:px-6">
          <GuideFindings />
        </section>

        <Pricing />
        <Roadmap />

        <section className="mx-auto w-full max-w-7xl px-4 py-14 md:px-6">
          <GuideFaq />
        </section>

        <FinalCta signedIn={signedIn} />
      </main>

      <Footer />
    </div>
  );
}
