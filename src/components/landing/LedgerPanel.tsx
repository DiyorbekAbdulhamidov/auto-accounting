// ============================================================
// HERO ДАГИ МАҲСУЛОТ ОЙНАСИ — ҲИСОБ ВАРАҚАСИ
// ------------------------------------------------------------
// НЕГА БУ ЕРДА ЖАДВАЛ ТУРАДИ. Одам бош саҳифага «бу нима
// қиладими?» деб келади. Абстракт анимация ЖАРАЁНни кўрсатади,
// жадвал эса НАТИЖАни — бухгалтер эса натижа учун тўлайди.
// Анимация йўқолмади: у ўз жойида, қўлланмада, «қандай ишлайди»
// бўлимида қолди.
//
// ШАКЛ — учта йўналишнинг бирлашмаси:
//   · зичлик ва моношрифт устун (A) — рақам рақам билан текис
//     турсин, хато дарҳол кўринсин;
//   · варақ, чизиқ ва ҚИЗИЛ БЕЛГИ (B) — фарқ қаерда экани
//     кўрсатилган, худди қоғозда қалам билан;
//   · чуқурлик (C) — ойна саҳифа устида «сузади» (`shadow-3`).
//
// РАҚАМЛАР ҲАҚИҚИЙ синовдан, ФИРМА НОМЛАРИ эса шартли — мижознинг
// контрагентлари очиқ саҳифада турмаслиги керак.
// ============================================================
"use client";

import { useT } from "@/context/LanguageContext";
import { cx } from "@/components/ui";

type Row = {
  name: string;
  paid: string;
  invoice: string;
  diff: string;
  /** Фарқ рангини АЙНАН маълумот токенидан олади */
  tone: "ok" | "bad" | "warn";
};

const ROWS: Row[] = [
  { name: "SAMO SAVDO", paid: "473 954 000", invoice: "473 954 000", diff: "0", tone: "ok" },
  { name: "ORIENT TEXNIKA", paid: "—", invoice: "50 278 000", diff: "−50 278 000", tone: "bad" },
  { name: "BARKAMOL QURILISH", paid: "8 271 000", invoice: "6 036 948", diff: "2 234 052", tone: "warn" },
  { name: "NAVRO'Z MEBEL", paid: "8 271 000", invoice: "8 271 000", diff: "0", tone: "ok" },
];

const TONE_TEXT = {
  ok: "text-ok",
  bad: "text-bad",
  warn: "text-warn",
} as const;

export default function LedgerPanel() {
  const t = useT();

  return (
    <div>
      {/* ЙИҒМА — уч устун, учта маъно ранги. Жадвалнинг тепасида
          туради, чунки бухгалтер аввал ЖАМИни, кейин қаторни
          ўқийди. */}
      <div className="grid grid-cols-3 border-b border-line">
        <Tile label={t("Тўланган пул")} value="482 225 000" cls="text-cash" />
        <Tile label={t("Келган фактура")} value="530 268 948" cls="text-invoice" bordered />
        <Tile label={t("Фарқ")} value="−48 043 948" cls="text-bad" bordered />
      </div>

      {/* ЖАДВАЛ ШАПКАСИ */}
      <div className="grid grid-cols-[minmax(0,1.7fr)_repeat(3,minmax(0,1fr))] gap-x-3 border-b border-line bg-surface-2 px-3 py-2 text-caption text-ink-3">
        <span>{t("Контрагент")}</span>
        <span className="text-right">{t("Тўланган")}</span>
        <span className="text-right">{t("Фактура")}</span>
        <span className="text-right">{t("Фарқ")}</span>
      </div>

      {ROWS.map((r) => (
        <div
          key={r.name}
          className={cx(
            "grid grid-cols-[minmax(0,1.7fr)_repeat(3,minmax(0,1fr))] items-center gap-x-3 border-b border-line px-3 py-2.5 text-body",
            // ФАРҚ БОР ҚАТОР ажралиб туради: юмшоқ фон ва чап
            // қиррадаги 2px чизиқ. Ранг маълумот токенидан —
            // безак эмас, МАЪНО.
            r.tone === "bad" && "border-l-2 border-l-bad bg-bad-soft"
          )}
        >
          <span className="truncate text-ink">{r.name}</span>
          <span className="tabular text-right text-ink-2">{r.paid}</span>
          <span className="tabular text-right text-ink-2">{r.invoice}</span>
          <span className={cx("tabular text-right font-medium", TONE_TEXT[r.tone])}>
            {r.diff}
          </span>
        </div>
      ))}

      {/* ХУЛОСА — саҳифадаги ягона жумла: тизим НИМА топди */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 px-3 py-2.5 text-caption text-ink-2">
        <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-bad" />
        <span>{t("фактура бор, тўлов йўқ")}</span>
        <span className="tabular font-medium text-bad">50 278 000</span>
        <span className="ml-auto text-ink-3">{t("Акт сверки")} · Excel</span>
      </div>
    </div>
  );
}

/** Йиғма катак: ёрлиқ кичик, РАҚАМ катта */
function Tile({
  label,
  value,
  cls,
  bordered = false,
}: {
  label: string;
  value: string;
  cls: string;
  bordered?: boolean;
}) {
  return (
    <div className={cx("px-3 py-3", bordered && "border-l border-line")}>
      <p className="truncate text-caption text-ink-3">{label}</p>
      <p className={cx("tabular mt-1 text-h3 font-semibold", cls)}>{value}</p>
    </div>
  );
}
