"use client";

import { useEffect, useState } from "react";
import { useT } from "@/context/LanguageContext";
import { cx, usePrefersReducedMotion } from "@/components/ui";

/* ============================================================
   JONLI SVERKA — bosh sahifadagi asosiy animatsiya
   ------------------------------------------------------------
   NEGA AYNAN SHU. Odatda bunday joyga aylanadigan 3D shakl yoki
   abstrakt zarrachalar qo'yiladi. Ular chiroyli, lekin HECH NIMA
   demaydi — istalgan mahsulotga yopishtirsa bo'ladi.
   Bu yerda esa ekranda mahsulotning O'Z ISHI bajariladi: pul
   bilan faktura bir-biriga qulflanadi, qulflanmagani qizil bo'lib
   qoladi. To'rt soniyada odam nima sotib olayotganini tushunadi.

   Uch texnik qaror:
     1. Canvas/WebGL EMAS, oddiy DOM. Raqамlar HAQIQIY matn bo'lib
        qoladi: o'qiladi, tarjima qilinadi, ekran o'quvchi dastur
        ko'radi va tungi rejimda ranglar o'zidan to'g'ri keladi.
        Qo'shimcha hajm — nol.
     2. Harakat `transform` va `opacity` da. Bular kompozitor
        qatlamida ishlaydi, ya'ni arzon telefonda ham silliq.
     3. `prefers-reduced-motion` — animatsiya butunlay o'chadi va
        darhol OXIRGI holat ko'rsatiladi. Xabar yo'qolmaydi.
   ============================================================ */

type Pair = {
  name: string;
  paid: string;
  invoice: string;
  matched: boolean;
  /** Faqat mos kelmaganda */
  diff?: string;
};

const PAIRS: Pair[] = [
  { name: "YOSH ULGURJI SAVDO", paid: "473 954 000", invoice: "473 954 000", matched: true },
  { name: "KARVON MEBILLARI", paid: "8 271 000", invoice: "8 271 000", matched: true },
  { name: "HUDUDGAZTA'MINOT", paid: "—", invoice: "50 278 000", matched: false, diff: "50 278 000" },
];

/** 0 бўш · 1 чиқади · 2 марказга юради · 3 қулфланади · 4 хулоса */
const STEP_MS = [400, 900, 900, 900, 2600];

export default function SverkaAnimation() {
  const t = useT();
  const reduced = usePrefersReducedMotion();
  const [raw, setRaw] = useState(0);
  // Ҳаракат камайтирилган бўлса — дарҳол ОХИРГИ ҳолат.
  // Хабар йўқолмайди, фақат йўлга тушмайди.
  const step = reduced ? 4 : raw;

  useEffect(() => {
    if (reduced) return;

    let alive = true;
    let timer: ReturnType<typeof setTimeout>;

    const advance = (s: number) => {
      timer = setTimeout(() => {
        if (!alive) return;
        const next = s >= 4 ? 0 : s + 1;
        setRaw(next);
        advance(next);
      }, STEP_MS[s]);
    };
    advance(0);

    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [reduced]);

  const visible = step >= 1;
  const centered = step >= 2;
  const locked = step >= 3;
  const summary = step >= 4;

  return (
    <div
      className="relative overflow-hidden rounded-lg border border-line bg-surface p-5"
      // Анимация — безак. Экран ўқийдиган дастур учун остида
      // ўша маънонинг матни турибди (`sr-only`).
      aria-hidden
    >
      {/* Юмшоқ фон — иккита модуль рангининг нурланиши */}
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(60% 60% at 12% 0%, color-mix(in srgb, var(--brand-out) 12%, transparent) 0%, transparent 70%), " +
            "radial-gradient(60% 60% at 88% 100%, color-mix(in srgb, var(--brand-in) 12%, transparent) 0%, transparent 70%)",
        }}
      />

      <div className="relative">
        <div className="mb-4 flex items-center justify-between text-caption font-medium">
          <span className="text-cash">{t("Тўланган пул")}</span>
          <span className="text-ink-3">{t("сверка")}</span>
          <span className="text-invoice">{t("Келган фактура")}</span>
        </div>

        <div className="space-y-2">
          {PAIRS.map((p, i) => {
            const lockedOk = locked && p.matched;
            const lockedBad = locked && !p.matched;
            const delay = `${i * 120}ms`;

            return (
              <div key={p.name} className="relative">
                <div
                  className={cx(
                    "flex items-center gap-2 rounded-md border px-2 py-2 transition-all duration-500 ease-out",
                    lockedOk && "border-ok bg-ok-soft",
                    lockedBad && "border-bad bg-bad-soft",
                    !locked && "border-line bg-surface"
                  )}
                  style={{
                    opacity: visible ? 1 : 0,
                    transform: visible ? "translateY(0)" : "translateY(8px)",
                    transitionDelay: delay,
                  }}
                >
                  {/* Чап: банкдан ўтган пул.
                      Сурилиш билан БИРГА шаффофлик ҳам ўзгаради — шунда
                      ҳаракат «оқиб кирди» бўлиб ўқилади, шунчаки
                      силжиш бўлиб эмас. */}
                  <span
                    className="w-[38%] shrink-0 text-right text-body font-semibold tabular text-cash transition-all duration-700 ease-out"
                    style={{
                      transform: centered ? "translateX(0)" : "translateX(-56px)",
                      opacity: centered ? 1 : 0.25,
                      transitionDelay: delay,
                    }}
                  >
                    {p.paid}
                  </span>

                  {/* Марказ: қулф ёки фарқ белгиси */}
                  <span className="flex w-[24%] shrink-0 justify-center">
                    <span
                      className={cx(
                        "inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-caption font-semibold transition-all duration-300",
                        lockedOk && "bg-ok text-white",
                        lockedBad && "bg-bad text-white",
                        !locked && "bg-surface-2 text-ink-3"
                      )}
                      style={{
                        transform: locked ? "scale(1)" : "scale(0.7)",
                        opacity: centered ? 1 : 0,
                        transitionDelay: delay,
                      }}
                    >
                      {lockedOk ? "✓" : lockedBad ? "✗" : "↔"}
                    </span>
                  </span>

                  {/* Ўнг: ёзилган фактура */}
                  <span
                    className="w-[38%] shrink-0 text-left text-body font-semibold tabular text-invoice transition-all duration-700 ease-out"
                    style={{
                      transform: centered ? "translateX(0)" : "translateX(56px)",
                      opacity: centered ? 1 : 0.25,
                      transitionDelay: delay,
                    }}
                  >
                    {p.invoice}
                  </span>
                </div>

                {/* Фарқ — фақат мос келмаган қаторда, қулфлангандан кейин */}
                {lockedBad && p.diff && (
                  <div
                    className="mt-1 flex items-center justify-between rounded-md bg-bad-soft px-2 py-1 text-caption transition-opacity duration-500"
                    style={{ opacity: summary ? 1 : 0 }}
                  >
                    <span className="truncate font-medium text-ink-2">{p.name}</span>
                    <span className="shrink-0 font-semibold tabular text-bad">
                      {t("фарқ")} {p.diff}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Хулоса — анимациянинг ЖАВОБИ */}
        <div
          className="mt-4 border-t border-line pt-3 text-body transition-all duration-500"
          style={{
            opacity: summary ? 1 : 0,
            transform: summary ? "translateY(0)" : "translateY(6px)",
          }}
        >
          <span className="text-ink-2">{t("3 контрагентдан")} </span>
          <span className="font-semibold text-bad">1 {t("тасида фарқ")}</span>
          <span className="text-ink-2">
            {" "}
            — <span className="font-semibold tabular text-bad">50 278 000</span> {t("сўм")}
          </span>
        </div>
      </div>
    </div>
  );
}

/** Экран ўқийдиган дастур учун — анимациянинг маъноси матн билан */
export function SverkaAnimationText() {
  const t = useT();
  return (
    <p className="sr-only">
      {t("Тизим тўланган пул билан келган фактурани контрагент кесимида солиштиради ва фарқ борларини ажратиб кўрсатади.")}
    </p>
  );
}
