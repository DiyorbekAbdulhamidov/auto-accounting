// ============================================================
// ИМКОНИЯТЛАР — БИТТА ВАРАҚ, КАТАКЛАРГА БЎЛИНГАН
// ------------------------------------------------------------
// УЧИНЧИ УРИНИШ, ва иккала олдингиси НЕГА ярамагани:
//
//   1. Тўртта бир хил ўлчамдаги ИКОНКАЛИ КАРТА — ҳар қандай
//      генератор чиқарадиган шакл. Ҳамма қути тенг, демак ҳеч
//      бир имконият ажралмайди.
//   2. Рақамли РЎЙХАТ — қутилардан халос бўлди, лекин ҳаддан
//      ортиқ қуруқ: саҳифа ҳужжатга эмас, кўрсаткичлар
//      варағига айланиб қолди.
//
// ЕЧИМ: битта ВАРАҚ, чизиқлар билан катакларга бўлинган.
// Техникаси — `gap-px` + остидаги `bg-line`: катаклар орасидаги
// 1px оралиқдан чизиқ ранги кўринади. Яъни саккизта АЛОҲИДА
// қути ЙЎҚ (соя ҳам, ҳар бирининг ўз рамкаси ҳам йўқ), лекин
// тузилма бор — худди ҳисоб варағининг катаклари.
//
// КАТАКЛАР ҲАР ХИЛ КЕНГЛИКДА: 6 устунли тўрда 3+3, 2+2+2 ва
// яна 2+2+2. Тенг бўлмаган ўлчам ИЕРАРХИЯ беради — кўз аввал
// каттасига тушади. Иккита катакда КЎРГАЗМА бор: тенглама ва
// ёш бўйича устунлар — улар матнни такрорламайди, КЎРСАТАДИ.
//
// Иконка қайтди, лекин рангли квадрат ичида ЭМАС: у сарлавҳа
// ёнида, бетараф рангда, 16px. У безак эмас — қаторни топиш
// учун белги.
// ============================================================
"use client";

import NextLink from "next/link";
import {
  ArrowRight,
  Boxes,
  Brain,
  FileSpreadsheet,
  FileText,
  Hourglass,
  Lock,
  Scale,
  ShieldCheck,
} from "lucide-react";
import { useLocale, useT } from "@/context/LanguageContext";
import { path } from "@/lib/routes";
import { Reveal, buttonClasses, cx } from "@/components/ui";

type Feature = {
  icon: typeof Scale;
  title: string;
  text: string;
  /** 6 устунли тўрдаги кенглик */
  span: 2 | 3;
  /** Айрим катакда матндан ташқари КЎРГАЗМА бор */
  visual?: "equation" | "aging";
};

const FEATURES: Feature[] = [
  {
    icon: Scale,
    title: "Қолдиқ тенгламаси",
    text:
      "Бошланғич қолдиқ + кирим − чиқим = охирги қолдиқ. Дебет билан кредит алмашиб кетса файлнинг «Итого» қатори буни СЕЗМАЙДИ — бу тенглама сезади ва айтади.",
    span: 3,
    visual: "equation",
  },
  {
    icon: Brain,
    title: "Формат хотираси",
    text:
      "Нотаниш банк шакли келса, тизим уни ўрганиб олади ва кейинги сафар ўзи танийди. Хотира умумий — ҳар янги фойдаланувчи ҳамма учун тизимни кучайтиради.",
    span: 3,
  },
  {
    icon: Hourglass,
    title: "Қарздорлик ёши",
    text:
      "Тўланмаган фактура қолдиғи 0–30 / 31–60 / 61–90 / 90+ кун бўйича ажратилади. Ҳисоб FIFO: келган пул энг эски фактурадан бошлаб ёпилади.",
    span: 3,
    visual: "aging",
  },
  {
    icon: FileText,
    title: "Акт сверки",
    text:
      "Битта контрагент учун расмий икки томонлама ҳужжат: Дата · Документ · Дебет · Кредит, Сальдо ва Обороты қаторлари билан. Excel'да, босишга тайёр.",
    span: 3,
  },
  {
    icon: Boxes,
    title: "Коммунал ва бюджет ажралади",
    text:
      "Улар асосий жадвални чалғитмайди, лекин ҲЕЧ ҚАЧОН ўчирилмайди — тепадаги «ЖАМИ» ҳар доим тўлиқ сумма бўлиб қолади.",
    span: 2,
  },
  {
    icon: FileSpreadsheet,
    title: "Беш варақли Excel ҳисобот",
    text: "Сверка · Йиллар · Ойма-ой · Тўловлар · Фактуралар. Экранда нима кўринса, файлда ҳам ўша.",
    span: 2,
  },
  {
    icon: ShieldCheck,
    title: "Ўз иш майдонингиз",
    text:
      "Бошқа фойдаланувчи сизнинг корхоналарингизни ҳам, суммаларингизни ҳам кўрмайди. Ҳар ҳисоб ўз майдонида.",
    span: 2,
  },
  {
    icon: Lock,
    title: "Рақам ўзгартирилмайди",
    text:
      "Тизим фақат файлда нима ёзилганини ўқийди ва фарқни кўрсатади. «Тўғрилаш» учун қўлда тузатма қўшилмайди — тўғрилаш сизнинг қарорингиз.",
    span: 2,
  },
];

const SPAN_CLS = {
  2: "md:col-span-3 lg:col-span-2",
  3: "md:col-span-3",
} as const;

/**
 * @param limit — nechta ko'rsatilsin. Bosh sahifada QISQARTIRILGAN
 *   ro'yxat turadi va «hammasi» havolasi `/features` ga olib boradi.
 *   Sabab: bir xil matnni ikkala sahifada to'liq takrorlash Google
 *   uchun dublikat bo'ladi va ikkalasining ham kuchini pasaytiradi.
 * @param heading — `false` bo'lsa sarlavha chizilmaydi (alohida
 *   sahifada u `<h1>` sifatida yuqorida turadi).
 */
export default function FeatureGrid({
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
    <section className="border-y border-line bg-surface-2">
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

          {/* Оралиқ 1px, ости чизиқ ранги — катаклар орасидаги
              чегара шундан ҳосил бўлади. Ташқи рамка ҳам шу
              усулда: `border` эмас, `p-px`. */}
          <div
            className={cx(
              "grid grid-cols-1 gap-px overflow-hidden rounded-lg bg-line md:grid-cols-6",
              heading && "mt-8"
            )}
          >
            {shown.map((f) => (
              <article
                key={f.title}
                className={cx(
                  "flex flex-col bg-surface p-5 transition-colors hover:bg-surface-2",
                  SPAN_CLS[f.span]
                )}
              >
                <div className="flex items-center gap-2.5">
                  <f.icon className="h-4 w-4 shrink-0 text-ink-3" />
                  <h3 className="text-h3 font-semibold text-ink">{t(f.title)}</h3>
                </div>
                <p className="mt-2 flex-1 text-body text-ink-2">{t(f.text)}</p>
                {f.visual === "equation" && <EquationVisual />}
                {f.visual === "aging" && <AgingVisual />}
              </article>
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

/**
 * ТЕНГЛАМА — матнда айтилган нарса РАҚАМ билан кўрсатилади.
 * Сонлар ҳақиқий синовдан; уларни ўқиган одам тенгламани
 * тушунтиришсиз ҳам тушунади.
 */
function EquationVisual() {
  const t = useT();
  return (
    <div className="mt-4 rounded-md border border-line bg-surface-2 px-3 py-2.5">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-caption">
        <span className="tabular text-ink-2">12 480 000</span>
        <span className="text-ink-3">+</span>
        <span className="tabular text-cash">482 225 000</span>
        <span className="text-ink-3">−</span>
        <span className="tabular text-invoice">470 300 000</span>
        <span className="text-ink-3">=</span>
        <span className="tabular font-semibold text-ink">24 405 000</span>
      </div>
      <p className="mt-1.5 text-caption text-ink-3">
        {t("бошланғич")} · {t("кирим")} · {t("чиқим")} · {t("охирги қолдиқ")}
      </p>
    </div>
  );
}

/** ЁШ БЎЙИЧА — тўртта устун, эскиси қизилроқ */
function AgingVisual() {
  const bars = [
    { label: "0–30", w: "18%", cls: "bg-ok" },
    { label: "31–60", w: "34%", cls: "bg-info" },
    { label: "61–90", w: "26%", cls: "bg-warn" },
    { label: "90+", w: "56%", cls: "bg-bad" },
  ];
  return (
    <div className="mt-4 space-y-1.5">
      {bars.map((b) => (
        <div key={b.label} className="flex items-center gap-2.5">
          <span className="tabular w-12 shrink-0 text-caption text-ink-3">{b.label}</span>
          <span className="h-1.5 flex-1 rounded-full bg-line">
            <span className={cx("block h-full rounded-full", b.cls)} style={{ width: b.w }} />
          </span>
        </div>
      ))}
    </div>
  );
}
