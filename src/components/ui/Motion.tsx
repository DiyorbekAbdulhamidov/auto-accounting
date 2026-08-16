"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { cx } from "./styles";

/* ============================================================
   HARAKAT
   ------------------------------------------------------------
   Qoida: harakat BEZAK emas, HOLAT xabari. U faqat «nimadir
   o'zgardi» deyish uchun ishlatiladi.

   Shuning uchun jadval KATAGI hech qachon jonlantirilmaydi:
   buxgalter raqamni o'qiyotganda u hali harakatda bo'lsa,
   noto'g'ri o'qilishi mumkin — bunday xatoning narxi pul bilan
   o'lchanadi. Sanaladigan raqam faqat YIG'MA kartochkada, u
   yerda aniq tiyin emas, kattalik muhim.

   Hammasi `prefers-reduced-motion` ni hurmat qiladi.
   ============================================================ */

const MQ = "(prefers-reduced-motion: reduce)";

function subscribeMQ(cb: () => void) {
  const mq = window.matchMedia(MQ);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

/**
 * «Harakatni kamaytir» tizim sozlamasi.
 *
 * `useState` + `useEffect` EMAS: bu tashqi holat, va uni effekt
 * ichida `setState` bilan o'qish React 19 da ogohlantirish beradi
 * hamda ortiqcha qayta render qiladi. `useSyncExternalStore` esa
 * aynan shuning uchun — loyihada til tanlovi ham shu naqshda.
 */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeMQ,
    () => window.matchMedia(MQ).matches,
    // Server tomonda media-so'rov yo'q — harakat bor deb hisoblanadi
    () => false
  );
}

/**
 * Ekranga kirganda yumshoq paydo bo'ladi.
 * Sahifani pastga surganda bo'limlar navbat bilan ochiladi.
 */
export function Reveal({
  delay = 0,
  className,
  children,
}: {
  /** millisekund */
  delay?: number;
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const [seen, setSeen] = useState(false);
  // Ҳаракат ўчирилган бўлса — дарҳол кўринади, кузатувчи ҳам керак эмас
  const shown = reduced || seen;

  useEffect(() => {
    if (reduced) return;
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setSeen(true);
            io.disconnect();
          }
        }
      },
      // Пастдан 12% кирганда бошланади — экранга тегиши биланоқ эмас,
      // акс ҳолда фойдаланувчи ҳаракатни кўрмай қолади
      { rootMargin: "0px 0px -12% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced]);

  return (
    <div
      ref={ref}
      className={cx("transition-all duration-500 ease-out", className)}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? "translateY(0)" : "translateY(14px)",
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/**
 * Raqam noldan haqiqiy qiymatgacha sanaladi.
 *
 * MUHIM: faqat yig'ma ko'rsatkich uchun. Sanash tugaganda qiymat
 * AYNAN `value` bo'ladi — oxirgi kadr yaxlitlashdan emas, qiymatning
 * o'zidan olinadi, aks holda ekranda tiyin yo'qolishi mumkin edi.
 */
export function CountUp({
  value,
  format,
  duration = 700,
  className,
}: {
  value: number;
  /** Raqamni matnga aylantiruvchi — sahifaning o'z formati */
  format: (n: number) => string;
  duration?: number;
  className?: string;
}) {
  const reduced = usePrefersReducedMotion();
  const [shown, setShown] = useState(value);
  const prev = useRef(value);

  useEffect(() => {
    const from = prev.current;
    prev.current = value;

    // Ҳаракат ўчирилган ёки қиймат ўзгармаган — санашга ҳожат йўқ
    if (reduced || from === value) return;

    let raf = 0;
    let start: number | null = null;

    const tick = (ts: number) => {
      if (start === null) start = ts;
      const p = Math.min(1, (ts - start) / duration);
      // easeOutCubic — тез бошланиб, охирида секинлашади
      const eased = 1 - Math.pow(1 - p, 3);
      if (p >= 1) {
        // Охирги қадам ҲИСОБДАН эмас, ҚИЙМАТДАН — тийин йўқолмасин
        setShown(value);
        return;
      }
      setShown(from + (value - from) * eased);
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration, reduced]);

  // Ҳаракат ўчирилганда ҳамиша ҲАҚИҚИЙ қиймат — оралиқ кадр эмас
  return <span className={cx("tabular", className)}>{format(reduced ? value : shown)}</span>;
}
