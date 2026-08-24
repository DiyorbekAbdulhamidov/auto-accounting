"use client";

import {
  GuideDirections,
  GuideFaq,
  GuideFindings,
  GuideSteps,
} from "@/components/guide/Guide";
import FeatureGrid from "./FeatureGrid";
import { Comparison, FinalCta, Hero, Pricing, Roadmap } from "./Sections";

/**
 * Бош саҳифанинг ТАНАСИ (нав ва подвалсиз — улар `PublicShell` да).
 *
 * Тартиб атайлаб шундай: аввал НИМА (hero), кейин НЕГА (қўлда/тизимда),
 * кейин ҚАНДАЙ (уч қадам), кейин ИШОНЧ (синовда нима топилди), кейин
 * НАРХ. Одам «сотиб олишдан» олдин «тушуниш» босқичидан ўтади.
 *
 * `Features` ва `Pricing` бу ерда ҚИСҚАРТИРИЛГАН — тўлиқ варианти ўз
 * саҳифасида (`/features`, `/pricing`). Бир хил матн икки манзилда
 * тўлиқ такрорланса, Google уни дубликат деб ҳисоблайди.
 */
export default function LandingBody() {
  return (
    <>
      <Hero />
      <Comparison />

      {/* «Уч қадам» ва «иккита йўналиш» — қўлланма билан БИТТА
          манбадан. Икки жойда икки нусха бўлса, биттаси эскирарди. */}
      {/* Ички оралиқ КАМАЙТИРИЛДИ. Ўлчанган: бўлимнинг ўз
          `py-14` си, қўлланма блокининг `pb-10` и ва кейинги
          бўлимнинг `py-16` и қўшилиб, экранда бир экран бўш жой
          қоларди. Энди оралиқ фақат БИР жойда берилади. */}
      <section className="mx-auto w-full max-w-7xl space-y-8 px-4 py-10 md:px-6">
        <GuideSteps />
        <GuideDirections />
      </section>

      <FeatureGrid limit={4} />

      <section className="mx-auto w-full max-w-7xl px-4 py-10 md:px-6">
        <GuideFindings />
      </section>

      <Pricing />
      <Roadmap />

      <section className="mx-auto w-full max-w-7xl px-4 py-10 md:px-6">
        <GuideFaq />
      </section>

      <FinalCta />
    </>
  );
}
