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
import {
  ArrowRight,
  Boxes,
  Brain,
  Building2,
  Check,
  Clock,
  Cpu,
  FileSpreadsheet,
  FileText,
  Hourglass,
  Lock,
  Scale,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";
import { useT } from "@/context/LanguageContext";
import { BRAND } from "@/lib/brand";
import { PLANS } from "@/lib/plans";
import { LogoMark } from "@/components/Brand";
import SverkaAnimation, { SverkaAnimationText } from "@/components/guide/SverkaAnimation";
import { ColourKey } from "@/components/guide/Guide";
import { Badge, Card, Num, Reveal, buttonClasses, cx } from "@/components/ui";

/** Икки модуль рангининг юмшоқ нурланиши — hero ва CTA фони учун */
const GLOW = {
  background:
    "radial-gradient(55% 55% at 8% 0%, color-mix(in srgb, var(--brand-out) 14%, transparent) 0%, transparent 70%), " +
    "radial-gradient(55% 55% at 92% 100%, color-mix(in srgb, var(--brand-in) 14%, transparent) 0%, transparent 70%)",
};

/* ============================================================
   HERO
   ============================================================ */

export function Hero({ signedIn }: { signedIn: boolean }) {
  const t = useT();
  return (
    <section className="relative overflow-hidden border-b border-line">
      <div className="pointer-events-none absolute inset-0" style={GLOW} />
      <div className="relative mx-auto w-full max-w-7xl px-4 py-14 md:px-6 md:py-20">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
          <div>
            <Badge tone="muted" icon={<Scale className="h-3 w-3" />}>
              {t("Буxгалтер учун сверка воситаси")}
            </Badge>

            <h1 className="mt-4 text-h1 font-semibold tracking-tight text-ink md:text-[2.5rem] md:leading-[1.15]">
              {t("Пул билан фактура мос келдими?")}
            </h1>

            <p className="mt-4 max-w-xl text-lead text-ink-2">
              {t("Банк кўчирмангизни ва фактура рўйхатини юкланг — тизим ҳар бир контрагент бўйича солиштиради ва ФАРҚ борларини ажратиб беради. Қўлда бир неча кун кетадиган иш бир неча сонияда.")}
            </p>
            <SverkaAnimationText />

            <div className="mt-6 flex flex-wrap items-center gap-3">
              {signedIn ? (
                <NextLink href="/korxonalar" className={buttonClasses("primary", "md")}>
                  {t("Иш столига ўтиш")} <ArrowRight className="h-4 w-4" />
                </NextLink>
              ) : (
                <NextLink href="/login" className={buttonClasses("primary", "md")}>
                  {t("Бепул бошлаш")} <ArrowRight className="h-4 w-4" />
                </NextLink>
              )}
              <a href="#qanday" className={buttonClasses("secondary", "md")}>
                {t("Қандай ишлайди")}
              </a>
            </div>

            <p className="mt-3 text-caption text-ink-3">
              {t("Карта сўралмайди. Бепул режада 3 та корхона, сверка чексиз.")}
            </p>

            <div className="mt-6">
              <ColourKey />
            </div>
          </div>

          <SverkaAnimation />
        </div>

        {/* Ишонч қатори — умумий сўз эмас, ЎЛЧОВ */}
        <div className="mt-12 grid grid-cols-1 gap-4 border-t border-line pt-8 sm:grid-cols-3">
          <Fact value="1,37 mlrd" label={t("сўм айланмада синовдан ўтган")} />
          <Fact value="58" label={t("та автомат текширув, ҳар ўзгаришдан кейин")} />
          <Fact value="6" label={t("та ҳақиқий банк файли — эталон тўплам")} />
        </div>
      </div>
    </section>
  );
}

function Fact({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-num font-semibold tabular text-ink">{value}</p>
      <p className="mt-1 text-caption text-ink-3">{label}</p>
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
  const qolda = [
    "Иккита Excel'ни ёнма-ён очиб, кўз билан солиштириш",
    "Битта контрагент бир нечта ном билан ёзилган — қўлда бирлаштириш",
    "Коммунал ва бюджет тўловлари орасида адашиш",
    "Хато топилса — ҳаммасини бошидан",
  ];
  const tizimda = [
    "Файлларни ўз ҳолича юклаш — банк форматини ўзгартириш шарт эмас",
    "Контрагент СТИР бўйича ўзи бирлаштирилади",
    "Коммунал/бюджет алоҳида тоифага ажралади, ЖАМИ эса тўлиқ қолади",
    "Фарқ бор қаторлар рангда ажралиб туради",
  ];

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-14 md:px-6">
      <Reveal>
        <h2 className="text-h2 font-semibold text-ink">{t("Ойлик сверка — икки хил кун")}</h2>
        <p className="mt-2 max-w-2xl text-body text-ink-2">
          {t("Ҳақиқий синовда: 1,37 млрд сўм айланма, 152 ўтказма, 159 фактура, 35 контрагент.")}
        </p>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card className="flex flex-col">
            <div className="flex items-center gap-2.5">
              <Clock className="h-5 w-5 text-ink-3" />
              <h3 className="text-h3 font-semibold text-ink-2">{t("Қўлда")}</h3>
            </div>
            <p className="mt-1 text-num font-semibold tabular text-ink-3">
              {t("бир неча кун")}
            </p>
            <ul className="mt-4 space-y-2">
              {qolda.map((s) => (
                <li key={s} className="flex gap-2.5 text-body text-ink-2">
                  <span className="mt-0.5 shrink-0 text-ink-3">·</span>
                  {t(s)}
                </li>
              ))}
            </ul>
          </Card>

          <Card className="flex flex-col border-l-4 border-l-accent">
            <div className="flex items-center gap-2.5">
              <LogoMark size="sm" />
              <h3 className="text-h3 font-semibold text-ink">{BRAND.name}</h3>
            </div>
            <p className="mt-1 text-num font-semibold tabular text-ok">
              {t("бир неча сония")}
            </p>
            <ul className="mt-4 space-y-2">
              {tizimda.map((s) => (
                <li key={s} className="flex gap-2.5 text-body text-ink-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-ok" />
                  {t(s)}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </Reveal>
    </section>
  );
}

/* ============================================================
   ИМКОНИЯТЛАР
   ============================================================ */

const FEATURES = [
  {
    icon: Scale,
    title: "Қолдиқ тенгламаси",
    text:
      "Бошланғич қолдиқ + кирим − чиқим = охирги қолдиқ. Дебет билан кредит алмашиб кетса файлнинг «Итого» қатори буни СЕЗМАЙДИ — бу тенглама сезади ва айтади.",
  },
  {
    icon: Brain,
    title: "Формат хотираси",
    text:
      "Нотаниш банк шакли келса, тизим уни ўрганиб олади ва кейинги сафар ўзи танийди. Хотира умумий — ҳар янги фойдаланувчи ҳамма учун тизимни кучайтиради.",
  },
  {
    icon: SlidersHorizontal,
    title: "Коммунал ва бюджет ажралади",
    text:
      "Улар асосий жадвални чалғитмайди, лекин ҲЕЧ ҚАЧОН ўчирилмайди — тепадаги «ЖАМИ» ҳар доим тўлиқ сумма бўлиб қолади.",
  },
  {
    icon: FileText,
    title: "Акт сверки",
    text:
      "Битта контрагент учун расмий икки томонлама ҳужжат: Дата · Документ · Дебет · Кредит, Сальдо ва Обороты қаторлари билан. Excel'да, босишга тайёр.",
  },
  {
    icon: Hourglass,
    title: "Қарздорлик ёши",
    text:
      "Тўланмаган фактура қолдиғи 0–30 / 31–60 / 61–90 / 90+ кун бўйича ажратилади. Ҳисоб FIFO: келган пул энг эски фактурадан бошлаб ёпилади.",
  },
  {
    icon: FileSpreadsheet,
    title: "Беш варақли Excel ҳисобот",
    text:
      "Сверка · Йиллар · Ойма-ой · Тўловлар · Фактуралар. Экранда нима кўринса, файлда ҳам ўша.",
  },
  {
    icon: ShieldCheck,
    title: "Ўз иш майдонингиз",
    text:
      "Бошқа фойдаланувчи сизнинг корхоналарингизни ҳам, суммаларингизни ҳам кўрмайди. Ҳар ҳисоб ўз майдонида.",
  },
  {
    icon: Lock,
    title: "Рақам ўзгартирилмайди",
    text:
      "Тизим фақат файлда нима ёзилганини ўқийди ва фарқни кўрсатади. «Тўғрилаш» учун қўлда тузатма қўшилмайди — тўғрилаш сизнинг қарорингиз.",
  },
];

export function Features() {
  const t = useT();
  return (
    <section id="imkoniyatlar" className="border-y border-line bg-surface-2/40">
      <div className="mx-auto w-full max-w-7xl px-4 py-14 md:px-6">
        <Reveal>
          <h2 className="text-h2 font-semibold text-ink">{t("Нима бор")}</h2>
          <p className="mt-2 max-w-2xl text-body text-ink-2">
            {t("Ҳар бири ҳақиқий файлда чиққан муаммодан келиб чиққан — рўйхат тўлдириш учун эмас.")}
          </p>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <Card key={f.title} className="flex h-full flex-col">
                <span className="w-fit rounded-md bg-accent-soft p-2.5 text-accent-ink">
                  <f.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-h3 font-semibold text-ink">{t(f.title)}</h3>
                <p className="mt-2 text-body text-ink-2">{t(f.text)}</p>
              </Card>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ============================================================
   НАРХ
   ------------------------------------------------------------
   Чеклов СВЕРКА сонига эмас, КОРХОНА сонига (src/lib/plans.ts).
   Нарх шу файлдан олинади — иккита жойда ёзилса, биттаси эскирарди.
   ============================================================ */

function money(n: number): string {
  return n.toLocaleString("ru-RU");
}

export function Pricing() {
  const t = useT();
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
      forWhom: "Мижозлари бор буxгалтер учун",
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
    <section id="narx" className="mx-auto w-full max-w-7xl px-4 py-14 md:px-6">
      <Reveal>
        <h2 className="text-h2 font-semibold text-ink">{t("Нарх")}</h2>
        <p className="mt-2 max-w-2xl text-body text-ink-2">
          {t("Чеклов сверка сонига эмас, КОРХОНА сонига. Сверкани қанча хоҳласангиз шунча марта қайта юкласангиз бўлади.")}
        </p>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          {items.map((it) => (
            <Card
              key={it.key}
              className={cx(
                "flex h-full flex-col",
                it.highlight && "border-accent ring-1 ring-accent"
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-h3 font-semibold text-ink">{t(it.plan.label)}</h3>
                {it.highlight && <Badge tone="info">{t("Кўпчиликка мос")}</Badge>}
              </div>
              <p className="mt-1 text-caption text-ink-3">{t(it.forWhom)}</p>

              <p className="mt-4 text-num font-semibold tabular text-ink">
                {it.plan.priceUzs === 0 ? (
                  t("Бепул")
                ) : (
                  <>
                    {money(it.plan.priceUzs)}
                    <span className="ml-1.5 text-caption font-medium text-ink-3">
                      {t("сўм/ой")}
                    </span>
                  </>
                )}
              </p>

              <ul className="mt-4 flex-1 space-y-2">
                {it.lines.map((l) => (
                  <li key={l} className="flex gap-2.5 text-body text-ink-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-ok" />
                    {t(l)}
                  </li>
                ))}
              </ul>

              <NextLink
                href="/login"
                className={cx(
                  buttonClasses(it.highlight ? "primary" : "secondary", "md", { block: true }),
                  "mt-5"
                )}
              >
                {it.plan.priceUzs === 0 ? t("Бепул бошлаш") : t("Бепул бошлаш")}
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
   Буxгалтер ҳар куни кирганда қулфланган картани кўриши керак
   эмас — ваъда бош саҳифада, иш эса иш жойида.
   ============================================================ */

export function Roadmap() {
  const t = useT();
  const items = [
    {
      icon: Boxes,
      title: "Виртуал Омбор (Астатка)",
      text: "МХИК (ИКПУ) кодлари бўйича товар қолдиқларини автоматик ҳисоблаш.",
    },
    {
      icon: Cpu,
      title: "AI таҳлил ва прогноз",
      text: "Солиқ хавфларини олдиндан кўрсатиш ва автоматик баланс тузиш.",
    },
    {
      icon: Building2,
      title: "Тўғридан-тўғри уланиш",
      text: "Excel ўрнига банк ва Э-фактура билан бевосита алоқа (1C «Клиент-Банк», camt.053).",
    },
  ];
  return (
    <section className="border-y border-line bg-surface-2/40">
      <div className="mx-auto w-full max-w-7xl px-4 py-14 md:px-6">
        <Reveal>
          <h2 className="text-h2 font-semibold text-ink">{t("Кейин нима бўлади")}</h2>
          <p className="mt-2 max-w-2xl text-body text-ink-2">
            {t("Булар ҳали ЙЎҚ. Ваъда сифатида эмас, йўналиш сифатида ёзилган.")}
          </p>
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            {items.map((r) => (
              <Card key={r.title} className="flex h-full flex-col opacity-80">
                <div className="flex items-start justify-between gap-3">
                  <span className="rounded-md bg-surface-2 p-2.5 text-ink-3">
                    <r.icon className="h-5 w-5" />
                  </span>
                  <Badge tone="muted" icon={<Lock className="h-3 w-3" />}>
                    {t("Тез кунда")}
                  </Badge>
                </div>
                <h3 className="mt-4 text-h3 font-semibold text-ink-2">{t(r.title)}</h3>
                <p className="mt-2 text-body text-ink-3">{t(r.text)}</p>
              </Card>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ============================================================
   ЯКУНИЙ ЧАҚИРИҚ + ПОДВАЛ
   ============================================================ */

export function FinalCta({ signedIn }: { signedIn: boolean }) {
  const t = useT();
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0" style={GLOW} />
      <div className="relative mx-auto w-full max-w-7xl px-4 py-16 text-center md:px-6">
        <Reveal>
          <LogoMark size="lg" className="mx-auto" />
          <h2 className="mt-5 text-h1 font-semibold tracking-tight text-ink">
            {t("Битта корхонада синаб кўринг")}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-lead text-ink-2">
            {t("Энг чалкаш мижозингизнинг банк кўчирмаси ва фактура рўйхатини юкланг. Фарқ борми — бир дақиқада биласиз.")}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <NextLink
              href={signedIn ? "/korxonalar" : "/login"}
              className={buttonClasses("primary", "md")}
            >
              {signedIn ? t("Иш столига ўтиш") : t("Бепул бошлаш")}{" "}
              <ArrowRight className="h-4 w-4" />
            </NextLink>
            <NextLink href="/qollanma" className={buttonClasses("secondary", "md")}>
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
            <NextLink href="/qollanma" className="text-ink-2 hover:text-ink">
              {t("Қўлланма")}
            </NextLink>
            <a href="#narx" className="text-ink-2 hover:text-ink">
              {t("Нарх")}
            </a>
            <NextLink href="/login" className="text-ink-2 hover:text-ink">
              {t("Кириш")}
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
