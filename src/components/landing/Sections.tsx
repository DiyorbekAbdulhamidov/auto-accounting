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
import { useAuth } from "@/context/AuthContext";
import { useLocale, useT } from "@/context/LanguageContext";
import { BRAND } from "@/lib/brand";
import { path } from "@/lib/routes";
import { PLANS } from "@/lib/plans";
import PromoBanner from "@/components/landing/PromoBanner";
import { LogoMark } from "@/components/Brand";
import ReconciliationAnimation, { ReconciliationAnimationText } from "@/components/guide/ReconciliationAnimation";
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

/** Икки модуль рангининг юмшоқ нурланиши — hero ва CTA фони учун */
const GLOW = {
  background:
    "radial-gradient(55% 55% at 8% 0%, color-mix(in srgb, var(--brand-out) 18%, transparent) 0%, transparent 70%), " +
    "radial-gradient(55% 55% at 92% 100%, color-mix(in srgb, var(--brand-in) 18%, transparent) 0%, transparent 70%)",
};

/* ============================================================
   HERO
   ============================================================ */

export function Hero() {
  const t = useT();
  const locale = useLocale();
  const signedIn = useSignedIn();
  return (
    <section className="relative overflow-hidden border-b border-line">
      {/* Уч қатлам фон: тўр -> нурланиш -> мазмун. Учаласи ҳам
          `pointer-events-none`, яъни бирортаси босишни тўсмайди. */}
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-60" />
      <div className="pointer-events-none absolute inset-0" style={GLOW} />

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
              {t("Карта сўралмайди. 1 ноябргача корхона сони чексиз, сверка ҳам чексиз.")}
            </p>

            <div className="mt-7">
              <ColourKey />
            </div>
          </div>

          {/* Анимация энди «дастур ойнаси» рамкасида: одам буни
              РАСМ эмас, ЭКРАН деб ўқийди. Рамка — учта нуқта ва
              манзил қатори, бошқа безак йўқ. */}
          <AppFrame label={`${BRAND.domain} · ${t("сверка")}`}>
            <ReconciliationAnimation />
          </AppFrame>
        </div>

        {/* Ишонч қатори — умумий сўз эмас, ЎЛЧОВ */}
        <div className="mt-16 grid grid-cols-1 gap-6 border-t border-line pt-10 sm:grid-cols-3">
          {/* Раqamning O'ZI ham tarjima qilinadi: «млрд» qisqartmasi
              har tilda boshqacha (mlrd / млрд / bn). */}
          <Fact value={t("1,37 млрд")} label={t("сўм айланмада синовдан ўтган")} />
          <Fact value="58" label={t("та автомат текширув, ҳар ўзгаришдан кейин")} />
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
      {/* Телефонда ички оралиқ КИЧИК: рамка ва анимациянинг ўз
          ички оралиғи қўшилиб, кўрсаткич жадвали қисилиб қоларди. */}
      <div className="p-2 md:p-5">{children}</div>
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
      <p className="brand-gradient-text text-title font-semibold tabular">{value}</p>
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
    <section className="mx-auto w-full max-w-7xl px-4 py-16 md:px-6 md:py-20">
      <Reveal>
        <h2 className="text-title font-semibold text-ink">{t("Ойлик сверка — икки хил кун")}</h2>
        <p className="mt-3 max-w-2xl text-lead text-ink-2">
          {t("Ҳақиқий синовда: 1,37 млрд сўм айланма, 152 ўтказма, 159 фактура, 35 контрагент.")}
        </p>

        <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
          <Card lift className="flex flex-col">
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

          <Card lift className="relative flex flex-col overflow-hidden">
            {/* Чап қиррадаги 4px модуль ранги ЎРНИГА бренд градиенти:
                бу карта «биз» томони, яъни модуль эмас, БРЕНД. */}
            <span className="brand-gradient absolute inset-y-0 left-0 w-1" />
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

/**
 * @param limit — nechta ko'rsatilsin. Bosh sahifada QISQARTIRILGAN
 *   ro'yxat turadi va «hammasi» havolasi `/features` ga olib boradi.
 *   Sabab: bir xil matnni ikkala sahifada to'liq takrorlash Google
 *   uchun dublikat bo'ladi va ikkalasining ham kuchini pasaytiradi.
 * @param heading — `false` bo'lsa sarlavha chizilmaydi (alohida
 *   sahifada u `<h1>` sifatida yuqorida turadi).
 */
export function Features({
  limit,
  heading = true,
}: {
  limit?: number;
  heading?: boolean;
}) {
  const t = useT();
  const locale = useLocale();
  const shown = limit ? FEATURES.slice(0, limit) : FEATURES;
  const hidden = FEATURES.length - shown.length;

  return (
    <section className="border-y border-line bg-surface-2/40">
      <div className="mx-auto w-full max-w-7xl px-4 py-16 md:px-6 md:py-20">
        <Reveal>
          {heading && (
            <>
              <h2 className="text-title font-semibold text-ink">{t("Нима бор")}</h2>
              <p className="mt-3 max-w-2xl text-lead text-ink-2">
                {t("Ҳар бири ҳақиқий файлда чиққан муаммодан келиб чиққан — рўйхат тўлдириш учун эмас.")}
              </p>
            </>
          )}

          <div
            className={cx(
              "grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4",
              heading && "mt-8"
            )}
          >
            {shown.map((f) => (
              <Card key={f.title} lift className="flex h-full flex-col">
                <span className="w-fit rounded-lg bg-accent-soft p-2.5 text-accent-ink">
                  <f.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-h3 font-semibold text-ink">{t(f.title)}</h3>
                <p className="mt-2 text-body text-ink-2">{t(f.text)}</p>
              </Card>
            ))}
          </div>

          {hidden > 0 && (
            <NextLink
              href={path("features", locale)}
              className={cx(buttonClasses("secondary", "md"), "mt-8")}
            >
              {t("Яна")} {hidden} {t("та имконият")} <ArrowRight className="h-4 w-4" />
            </NextLink>
          )}
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

        {/* Очилиш даври. Режа карталари ЎЗГАРМАЙДИ — улар доимий
            ҳақиқатни кўрсатади (1 ноябрдан кейин нима бўлишини), эълон
            эса ҳозир нима бўлаётганини айтади. Иккиси бир экранда
            туради, шунда ноябрда ҳеч ким «алдандим» демайди. */}
        <PromoBanner className={heading ? "mt-6" : ""} />

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
      <div className="mx-auto w-full max-w-7xl px-4 py-16 md:px-6 md:py-20">
        <Reveal>
          <h2 className="text-title font-semibold text-ink">{t("Кейин нима бўлади")}</h2>
          <p className="mt-3 max-w-2xl text-lead text-ink-2">
            {t("Булар ҳали ЙЎҚ. Ваъда сифатида эмас, йўналиш сифатида ёзилган.")}
          </p>
          <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
            {/* `opacity-80` ЙЎҚ. Ўлчанган: у матн контрастини 5,43 дан
                3,53 га туширарди (чегара 4,5). «Тез кунда» ҳолати
                шаффофлик билан эмас, БЕЛГИ ва бетараф ранг билан
                айтилади — иккиси ҳам контрастни бузмайди. */}
            {items.map((r) => (
              <Card key={r.title} className="flex h-full flex-col">
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

export function FinalCta() {
  const t = useT();
  const locale = useLocale();
  const signedIn = useSignedIn();
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-50" />
      <div className="pointer-events-none absolute inset-0" style={GLOW} />
      <div className="relative mx-auto w-full max-w-7xl px-4 py-24 text-center md:px-6">
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
