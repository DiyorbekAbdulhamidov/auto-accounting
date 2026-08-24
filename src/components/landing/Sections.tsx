// ============================================================
// БОШ САҲИФА БЎЛИМЛАРИ
// ------------------------------------------------------------
// Бош саҳифа ОЧИҚ: кириш талаб қилмайди. Илгари у логин ортида
// эди ва фақат «Иш муҳитини танланг» деб турарди — яъни маҳсулот
// ҳақида ҳеч нарса айтмасди, ишонтириш керак бўлган одам эса уни
// умуман кўрмасди.
//
// Матннинг бир қисми `components/guide/Guide.tsx` дан олинади:
// «уч қадам», «иккита сверка», «синовда нима топилди», ТСС —
// иккаласида битта манба, эскириб қолиш хавфи йўқ.
//
// РАНГ ҚОИДАСИ бу ерда ҳам ўзгармайди: `slate-*`, `emerald-*` каби
// қотирилган қиймат йўқ, фақат токенлар. Фон нурланиши ҳам
// `var(--brand-in/out)` дан `color-mix` билан ҳосил қилинади.
// ============================================================
"use client";

import NextLink from "next/link";
// IKONKA UCHTA QOLDI. Ilgari o'n to'rtta edi va ularning o'n bittasi
// hech narsa demasdi: «Brain» — format xotirasi, «Boxes» — ombor,
// «Cpu» — tahlil. Bir xil o'lchamdagi bezak ikonka qatori — «shablon»
// hissining birinchi manbai. Qolgani ma'no tashiydi: yo'nalish
// (ArrowRight), tasdiq (Check), tarozi (Scale — brend belgisi).
import { ArrowRight, Check, Scale } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLocale, useT } from "@/context/LanguageContext";
import { BRAND } from "@/lib/brand";
import { path } from "@/lib/routes";
import { PLANS } from "@/lib/plans";
import { LogoMark } from "@/components/Brand";
import { ReconciliationAnimationText } from "@/components/guide/ReconciliationAnimation";
import LedgerPanel from "./LedgerPanel";
import { ColourKey } from "@/components/guide/Guide";
import { Badge, Card, Num, Reveal, buttonClasses, cx } from "@/components/ui";

/**
 * Кирганми-йўқми.
 *
 * Бўлимлар буни ПРОП сифатида қабул қилмайди: саҳифалар СЕРВЕР
 * компоненти (мета маълумот учун), сервердан клиентга эса функция
 * ҳам, ҳисоб ҳолати ҳам узатилмайди. Ҳар бўлим ўзи ўқигани — энг
 * содда ва хатосиз йўл.
 */
function useSignedIn(): boolean {
  const { user, loading } = useAuth();
  return !loading && !!user;
}

/* ============================================================
   HERO
   ============================================================ */

export function Hero() {
  const t = useT();
  const locale = useLocale();
  const signedIn = useSignedIn();
  return (
    /* ============================================================
       ФОН — ТЎР ҳам, НУРЛАНИШ ҳам ЙЎҚ (2026-08-23)
       ------------------------------------------------------------
       Илгари бу ерда уч қатлам турарди: катакли тўр (`grid-bg`) ва
       иккита рангли радиал нурланиш. Иккови ҳам ҲЕЧ НАРСА демасди —
       соф безак, ва айнан ўша безак 2021–2024 йиллардаги ҳар
       иккинчи бош саҳифада бор.
       Ўрнига МАЪНО: hero — оқ ВАРАҚ (`--surface`), саҳифанинг
       қолгани эса илиқ СТОЛ (`--page`). Чегара битта — варақнинг
       қирраси. Бухгалтер кун бўйи қоғоз билан ишлайди; экран ҳам
       шу тилда гапиради.
       ============================================================ */
    <section className="paper brand-field relative overflow-hidden border-b border-line bg-surface">
      <div className="relative mx-auto w-full max-w-7xl px-4 py-16 md:px-6 md:py-24">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
          <div>
            <Badge tone="muted" icon={<Scale className="h-3 w-3" />}>
              {t("Ўзбекистондаги бухгалтерлар учун")}
            </Badge>

            {/* ШИОР — тоифани эълон қилади, битта модулни эмас.
                Остидаги қатор МАЖБУРИЙ: шиорнинг ўзи «нима қилишини»
                айтмайди, шунинг учун иккови доим бирга юради.

                Ўлчов `--text-display`: телефонда 36px, катта экранда
                64px. Битта қиймат ярамасди — 64px телефонда шиорни
                беш қаторга ёярди. */}
            <h1 className="mt-5 text-display font-semibold text-ink">{t(BRAND.tagline)}</h1>

            <p className="mt-5 max-w-xl text-lead text-ink-2">{t(BRAND.promise)}</p>
            <p className="mt-2 max-w-xl text-body text-ink-3">
              {t("Қўлда бир неча кун кетадиган иш бир неча сонияда.")}
            </p>
            <ReconciliationAnimationText />

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <NextLink
                href={signedIn ? path("clients", locale) : path("login", locale)}
                className={buttonClasses("primary", "md")}
              >
                {signedIn ? t("Иш столига ўтиш") : t("Бепул бошлаш")}{" "}
                <ArrowRight className="h-4 w-4" />
              </NextLink>
              <NextLink href={path("guide", locale)} className={buttonClasses("secondary", "md")}>
                {t("Қандай ишлайди")}
              </NextLink>
            </div>

            <p className="mt-3 text-caption text-ink-3">
              {t("Карта сўралмайди. Бепул режада 3 та корхона, сверка чексиз.")}
            </p>

            <div className="mt-7">
              <ColourKey />
            </div>
          </div>

          {/* Анимация энди «дастур ойнаси» рамкасида: одам буни
              РАСМ эмас, ЭКРАН деб ўқийди. Рамка — учта нуқта ва
              манзил қатори, бошқа безак йўқ. */}
          <AppFrame label={`${BRAND.domain} · ${t("сверка")}`}>
            <LedgerPanel />
          </AppFrame>
        </div>

        {/* Ишонч қатори — умумий сўз эмас, ЎЛЧОВ */}
        <div className="mt-16 grid grid-cols-1 gap-6 border-t border-line pt-10 sm:grid-cols-3">
          {/* Раqamning O'ZI ham tarjima qilinadi: «млрд» qisqartmasi
              har tilda boshqacha (mlrd / млрд / bn). */}
          <Fact value={t("1,37 млрд")} label={t("сўм айланмада синовдан ўтган")} />
          {/* Сон `scripts/verify-parsers.cjs` дан. Ўзгарса — шу ерда ҳам */}
          <Fact value="142" label={t("та автомат текширув, ҳар ўзгаришдан кейин")} />
          <Fact value="6" label={t("та ҳақиқий банк файли — эталон тўплам")} />
        </div>
      </div>
    </section>
  );
}

/**
 * «Дастур ойнаси» рамкаси.
 *
 * Ичидаги нарса ЭКРАН экани кўриниб турсин деб қўйилган. Рангли
 * нуқта ЙЎҚ — уччала доира ҳам бетараф, чунки ранг бу маҳсулотда
 * МАЪНО ташийди (пул, фактура, фарқ) ва безак учун сарфланмайди.
 */
function AppFrame({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-3">
      <div className="flex items-center gap-2 border-b border-line bg-surface-2 px-4 py-2.5">
        <span className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
          <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
          <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
        </span>
        <span className="ml-2 truncate text-caption text-ink-3">{label}</span>
      </div>
      {/* ЖАДВАЛ РАМКАГА ТЕГИБ ТУРАДИ. Ички оралиқ ЙЎҚ: ҳисоб
          варағининг чизиғи варақнинг қиррасигача боради, худди
          қоғоздагидек. Оралиқ қўйилса, жадвал «расм» бўлиб
          кўринарди. */}
      <div>{children}</div>
    </div>
  );
}

/**
 * Ишонч рақами.
 *
 * Рақам бренд градиенти билан: юқориси `--invoice`, пасти `--cash` —
 * логотипдаги АЙНАН ўша икки ранг. Контраст иккала учида ҳам
 * ўлчанган (globals.css, `.brand-gradient-text` изоҳи), шунинг учун
 * градиент матнга қўйилса ҳам ўқилади.
 */
function Fact({ value, label }: { value: string; label: string }) {
  return (
    <div>
      {/* `tabular` ЙЎҚ. У ФАҚАТ рақам устуни учун: ичида минглик
          оралиғи қисқартирилган (`word-spacing`), бу ерда эса
          қиймат сон БИЛАН СЎЗ («1,37 млрд») — оралиқ йўқолиб,
          «1,37млрд» бўлиб қоларди (браузерда кўрилган). */}
      <p className="brand-gradient-text text-title font-semibold">{value}</p>
      <p className="mt-1.5 text-caption text-ink-3">{label}</p>
    </div>
  );
}

/* ============================================================
   ҚЎЛДА / ТИЗИМДА
   ------------------------------------------------------------
   Маҳсулотнинг қиймати вақтда ўлчанади. Иккита карта ёнма-ён —
   ўқувчи фарқни ўқимасдан ҳам кўради.
   ============================================================ */

export function Comparison() {
  const t = useT();
  /* ЙИҒМА ЖУФТЛИК: чапда эски йўл, ўнгда шу ЎША ишнинг тизимдаги
     кўриниши. Иккита алоҳида рўйхат эмас — БИТТА қаторнинг икки
     учи. Одам «нима ўзгаради?» деб солиштириш учун кўзини у
     ёқдан-бу ёққа юргизмайди: жавоб ёнида турибди. */
  const pairs: { before: string; after: string }[] = [
    {
      before: "Иккита Excel'ни ёнма-ён очиб, кўз билан солиштириш",
      after: "Файлларни ўз ҳолича юклаш — банк форматини ўзгартириш шарт эмас",
    },
    {
      before: "Битта контрагент бир нечта ном билан ёзилган — қўлда бирлаштириш",
      after: "Контрагент СТИР бўйича ўзи бирлаштирилади",
    },
    {
      before: "Коммунал ва бюджет тўловлари орасида адашиш",
      after: "Коммунал/бюджет алоҳида тоифага ажралади, ЖАМИ эса тўлиқ қолади",
    },
    {
      before: "Хато топилса — ҳаммасини бошидан",
      after: "Фарқ бор қаторлар рангда ажралиб туради",
    },
  ];

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-16 md:px-6 md:py-20">
      <Reveal>
        <h2 className="text-title font-semibold text-ink">{t("Ойлик сверка — икки хил кун")}</h2>
        <p className="mt-3 max-w-2xl text-lead text-ink-2">
          {t("Ҳақиқий синовда: 1,37 млрд сўм айланма, 152 ўтказма, 159 фактура, 35 контрагент.")}
        </p>

        {/* ЮЗМА-ЮЗ ЖАДВАЛ. Икки устун — иккита рўйхат ЭМАС, битта
            қаторнинг икки учи: чапда бугунги иш, ўнгда ўшанинг
            тизимдаги кўриниши. Ўртадаги чизиқ — чегара.
            Телефонда устун битта бўлади ва жуфтлик устма-уст
            тушади: «олдин / кейин» тартиби сақланади. */}
        <div className="mt-8 overflow-hidden rounded-lg border border-line bg-surface">
          {/* Шапка: икки томоннинг ВАҚТИ */}
          <div className="grid grid-cols-1 border-b border-line md:grid-cols-2">
            <div className="flex items-baseline gap-3 px-5 py-4">
              <h3 className="text-h3 font-semibold text-ink-2">{t("Қўлда")}</h3>
              {/* СЎЗ — моношрифтда ЭМАС. `tabular` фақат рақам учун */}
              <span className="text-body font-medium text-ink-3">
                {t("бир неча кун")}
              </span>
            </div>
            <div className="relative flex items-baseline gap-3 border-t border-line px-5 py-4 md:border-l md:border-t-0">
              <span className="brand-gradient absolute inset-x-0 top-0 h-0.5 md:inset-y-0 md:left-0 md:right-auto md:h-auto md:w-0.5" />
              <LogoMark size="sm" />
              <h3 className="text-h3 font-semibold text-ink">{BRAND.name}</h3>
              <span className="text-body font-medium text-ok">
                {t("бир неча сония")}
              </span>
            </div>
          </div>

          {pairs.map((p) => (
            <div
              key={p.before}
              className="grid grid-cols-1 border-b border-line last:border-b-0 md:grid-cols-2"
            >
              <div className="flex gap-2.5 px-5 py-4 text-body text-ink-3">
                <span className="mt-0.5 shrink-0">·</span>
                {t(p.before)}
              </div>
              <div className="flex gap-2.5 border-t border-line px-5 py-4 text-body text-ink-2 md:border-l md:border-t-0">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-ok" />
                {t(p.after)}
              </div>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}

/* ИМКОНИЯТЛАР бўлими бу файлдан ЧИҚАРИЛДИ — `FeatureGrid.tsx`.
   Сабаб: у энди оддий рўйхат эмас, ўз кўргазмалари бор алоҳида
   тузилма; бу файлда турса, иккиси ҳам ўқилмас бўлиб қоларди. */

/* ============================================================
   НАРХ
   ------------------------------------------------------------
   Чеклов СВЕРКА сонига эмас, КОРХОНА сонига (src/lib/plans.ts).
   Нарх шу файлдан олинади — иккита жойда ёзилса, биттаси эскирарди.
   ============================================================ */

function money(n: number): string {
  return n.toLocaleString("ru-RU");
}

export function Pricing({ heading = true }: { heading?: boolean }) {
  const t = useT();
  const locale = useLocale();
  const items = [
    {
      plan: PLANS.free,
      key: "free",
      forWhom: "Синаб кўриш учун",
      lines: ["3 та корхона", "1 фойдаланувчи", "Сверка чексиз", "Барча ҳисоботлар"],
      highlight: false,
    },
    {
      plan: PLANS.buxgalter,
      key: "buxgalter",
      forWhom: "Мижозлари бор бухгалтер учун",
      lines: ["Корхона чексиз", "1 фойдаланувчи", "Сверка чексиз", "Барча ҳисоботлар"],
      highlight: true,
    },
    {
      plan: PLANS.byuro,
      key: "byuro",
      forWhom: "Жамоа билан ишлайдиган бюро учун",
      lines: ["Корхона чексиз", "5 фойдаланувчи", "Сверка чексиз", "Умумий иш майдони"],
      highlight: false,
    },
  ];

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-16 md:px-6 md:py-20">
      <Reveal>
        {heading && (
          <>
            <h2 className="text-title font-semibold text-ink">{t("Нарх")}</h2>
            <p className="mt-3 max-w-2xl text-lead text-ink-2">
              {t("Чеклов сверка сонига эмас, КОРХОНА сонига. Сверкани қанча хоҳласангиз шунча марта қайта юкласангиз бўлади.")}
            </p>
          </>
        )}

        <div className={cx("grid grid-cols-1 gap-5 md:grid-cols-3", heading && "mt-8")}>
          {items.map((it) => (
            <Card
              key={it.key}
              lift
              // Танланган режа РАМКА билан эмас, БАЛАНДЛИК билан
              // ажралади: у қоғоздан бир поғона юқорида туради.
              elevation={it.highlight ? 2 : 1}
              className={cx(
                "relative flex h-full flex-col overflow-hidden",
                it.highlight && "border-accent"
              )}
            >
              {it.highlight && (
                <span className="brand-gradient absolute inset-x-0 top-0 h-1" />
              )}
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-h3 font-semibold text-ink">{t(it.plan.label)}</h3>
                {it.highlight && <Badge tone="info">{t("Кўпчиликка мос")}</Badge>}
              </div>
              <p className="mt-1 text-caption text-ink-3">{t(it.forWhom)}</p>

              {/* `tabular` ФАҚАТ рақамда. Илгари у бутун қаторда
                  эди ва «Бепул» СЎЗИ моношрифтда чиқарди — сўз
                  моношрифтда «код» бўлиб кўринади (ўлчанган). */}
              <p className="mt-4 text-num font-semibold text-ink">
                {it.plan.priceUzs === 0 ? (
                  t("Бепул")
                ) : (
                  <>
                    <span className="tabular">{money(it.plan.priceUzs)}</span>
                    <span className="ml-1.5 text-caption font-medium text-ink-3">
                      {t("сўм/ой")}
                    </span>
                  </>
                )}
              </p>

              {/* Uchta rejada 12 ta bir xil yashil «✓» turardi. Belgi
                  hamma qatorda bir xil bo'lsa, u ma'lumot emas — bezak.
                  Chiziq esa qatorni ajratadi va solishtirishni osonlashtiradi. */}
              <ul className="mt-4 flex-1 divide-y divide-line border-t border-line">
                {it.lines.map((l) => (
                  <li key={l} className="py-2 text-body text-ink-2">
                    {t(l)}
                  </li>
                ))}
              </ul>

              <NextLink
                href={path("login", locale)}
                className={cx(
                  buttonClasses(it.highlight ? "primary" : "secondary", "md", { block: true }),
                  "mt-5"
                )}
              >
                {t("Бепул бошлаш")}
              </NextLink>
            </Card>
          ))}
        </div>

        {/* ҲАЛОЛ ЭСЛАТМА. Тўлов ҳали уланмаган — буни яширмаган
            маъқул: одам тугмани босиб, кейин билиб қолса ишонч
            йўқолади. */}
        <p className="mt-4 text-caption text-ink-3">
          {t("Ҳозирча тўлов қабул қилинмайди — ҳамма ҳисоб бепул режада ишлайди. Пулли режа керак бўлса, ёзиб қолдиринг: ким сўраганини биламиз ва аввал ўшаларга очамиз.")}
        </p>
      </Reveal>
    </section>
  );
}

/* ============================================================
   ЙЎЛ ХАРИТАСИ
   ------------------------------------------------------------
   Илгари бу иккита «Тез кунда» картаси ИШ САҲИФАСИДА турарди.
   Бухгалтер ҳар куни кирганда қулфланган картани кўриши керак
   эмас — ваъда бош саҳифада, иш эса иш жойида.
   ============================================================ */

export function Roadmap() {
  const t = useT();
  const items = [
    {
      title: "Виртуал Омбор (Астатка)",
      text: "МХИК (ИКПУ) кодлари бўйича товар қолдиқларини автоматик ҳисоблаш.",
    },
    {
      title: "AI таҳлил ва прогноз",
      text: "Солиқ хавфларини олдиндан кўрсатиш ва автоматик баланс тузиш.",
    },
    {
      title: "Тўғридан-тўғри уланиш",
      text: "Excel ўрнига банк ва Э-фактура билан бевосита алоқа (1C «Клиент-Банк», camt.053).",
    },
  ];
  return (
    <section className="border-y border-line bg-surface-2/40">
      <div className="mx-auto w-full max-w-7xl px-4 py-16 md:px-6 md:py-20">
        <Reveal>
          {/* «ТЕЗ КУНДА» BIR MARTA AYTILADI. Ilgari uchta kartaning
              har birida alohida qulf belgisi turardi — bir xil xabar
              uch marta. Endi u sarlavha yonida bitta belgi, ro'yxat
              esa qutisiz: bular hali YO'Q narsalar, ular sahifada
              mavjud imkoniyatlar bilan teng joy egallamasligi kerak.

              `opacity` ISHLATILMAYDI: o'lchangan — u matn kontrastini
              5,43 dan 3,53 ga tushirardi (chegara 4,5). */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <h2 className="text-title font-semibold text-ink">{t("Кейин нима бўлади")}</h2>
            <Badge tone="muted">{t("Тез кунда")}</Badge>
          </div>
          <p className="mt-3 max-w-2xl text-lead text-ink-2">
            {t("Булар ҳали ЙЎҚ. Ваъда сифатида эмас, йўналиш сифатида ёзилган.")}
          </p>
          {/* ВАҚТ ЧИЗИҒИ. Йўл харитаси — рўйхат эмас, ТАРТИБ:
              нима олдин, нима кейин. Чизиқ шуни айтади, рўйхат
              айтмасди. Ҳалқа ичи бўш — булар ҲАЛИ йўқ нарсалар;
              тайёр бўлганда у тўлдирилади. */}
          <ol className="mt-10 grid grid-cols-1 gap-x-8 gap-y-8 md:grid-cols-3">
            {items.map((r, i) => (
              <li key={r.title} className="relative">
                <div className="flex items-center gap-3">
                  <span className="relative z-10 h-3 w-3 shrink-0 rounded-full border-2 border-line-strong bg-surface" />
                  {/* Чизиқ ҳалқадан кейин давом этади; охиргисида йўқ */}
                  {i < items.length - 1 && (
                    <span className="absolute left-3 right-[-2rem] top-1.5 hidden h-px bg-line md:block" />
                  )}
                  <span className="tabular text-caption text-ink-3">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="mt-3 text-h3 font-semibold text-ink-2">{t(r.title)}</h3>
                <p className="mt-1.5 text-body text-ink-3">{t(r.text)}</p>
              </li>
            ))}
          </ol>
        </Reveal>
      </div>
    </section>
  );
}

/* ============================================================
   ЯКУНИЙ ЧАҚИРИҚ + ПОДВАЛ
   ============================================================ */

export function FinalCta() {
  const t = useT();
  const locale = useLocale();
  const signedIn = useSignedIn();
  return (
    /* Hero билан БИР ХИЛ материал: саҳифа варақ билан бошланиб,
       варақ билан тугайди. Ораси — стол. */
    <section className="paper brand-field border-t border-line bg-surface">
      <div className="mx-auto w-full max-w-7xl px-4 py-24 text-center md:px-6">
        <Reveal>
          <LogoMark size="lg" className="mx-auto" />
          <h2 className="mt-6 text-title font-semibold text-ink">
            {t("Битта корхонада синаб кўринг")}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lead text-ink-2">
            {t("Энг чалкаш мижозингизнинг банк кўчирмаси ва фактура рўйхатини юкланг. Фарқ борми — бир дақиқада биласиз.")}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <NextLink
              href={signedIn ? path("clients", locale) : path("login", locale)}
              className={buttonClasses("primary", "md")}
            >
              {signedIn ? t("Иш столига ўтиш") : t("Бепул бошлаш")}{" "}
              <ArrowRight className="h-4 w-4" />
            </NextLink>
            <NextLink href={path("guide", locale)} className={buttonClasses("secondary", "md")}>
              {t("Тўлиқ қўлланма")}
            </NextLink>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function Footer() {
  const t = useT();
  const locale = useLocale();
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto w-full max-w-7xl px-4 py-10 md:px-6">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-2xl">
            <LogoMark size="sm" />
            <p className="mt-3 text-caption text-ink-3">
              {/* Расмий таъриф — Ташаббус аризаси ва ҳужжатлар учун.
                  Ном эмас, ТАЪРИФ: маҳсулот аниқ нима қилишини айтади. */}
              {t(BRAND.definition)}.
            </p>
          </div>

          <nav className="flex flex-col gap-2 text-body">
            <NextLink href={path("features", locale)} className="text-ink-2 hover:text-ink">
              {t("Нима бор")}
            </NextLink>
            <NextLink href={path("pricing", locale)} className="text-ink-2 hover:text-ink">
              {t("Нарх")}
            </NextLink>
            <NextLink href={path("guide", locale)} className="text-ink-2 hover:text-ink">
              {t("Қўлланма")}
            </NextLink>
            <NextLink href={path("login", locale)} className="text-ink-2 hover:text-ink">
              {t("Кириш")}
            </NextLink>
          </nav>

          {/* HUQUQIY USTUN. Ataylab alohida: to'lov tizimi moderatsiyasi
              oferta, qaytarish tartibi va rekvizitlarni saytning HAR
              sahifasidan topa olishi kerak — footer yagona shunday joy. */}
          <nav className="flex flex-col gap-2 text-body">
            <NextLink href={path("offer", locale)} className="text-ink-2 hover:text-ink">
              {t("Оммавий оферта")}
            </NextLink>
            <NextLink href={path("refund", locale)} className="text-ink-2 hover:text-ink">
              {t("Тўловни қайтариш")}
            </NextLink>
            <NextLink href={path("contact", locale)} className="text-ink-2 hover:text-ink">
              {t("Алоқа ва реквизитлар")}
            </NextLink>
          </nav>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5 text-caption text-ink-3">
          <span>
            {BRAND.name} · {BRAND.domain}
          </span>
          <span>
            <Num tone="muted">2026</Num> · {t("Ўзбекистон")}
          </span>
        </div>
      </div>
    </footer>
  );
}
