// ============================================================
// LOGOTIP
// ------------------------------------------------------------
// Belgi — teng belgisining o'zi: ikkita chiziq.
//   yuqorigi  = ПУЛ      (--cash,    yashil)
//   pastkisi  = ФАКТУРА  (--invoice, кўк)
// Ikkalasi TENG uzunlikda: mahsulotning butun javobi shu — mos keldi.
//
// Nega aynan `--cash` va `--invoice` (модуль ранги ЭМАС):
// bu ikki token butun ilovada «пул» va «фактура» ni anglatadi va
// ikkala сверкада ҳам bir xil. Logotip ham ayni shu ikki tushunchani
// ko'rsatgani uchun yangi rang O'YLAB TOPILMAYDI — mavjudi olinadi.
// `--accent` (модуль ранги) ishlatilmaydi: u саҳифага қараб ўзгаради,
// логотип эса ҳар жойда бир хил бўлиши керак.
//
// Токенлар тунги режимда ўз-ўзидан очроқ вариантга ўтади, шунинг учун
// логотип учун алоҳида тунги ранг ёзилмаган.
// ============================================================

import { cx } from "@/components/ui";
import { BRAND } from "@/lib/brand";

const SIZES = {
  sm: "h-5 w-5",
  md: "h-7 w-7",
  lg: "h-10 w-10",
} as const;

const WORD_SIZES = {
  sm: "text-body",
  md: "text-h3",
  lg: "text-h2",
} as const;

export type BrandSize = keyof typeof SIZES;

/**
 * Faqat belgi — favicon, tor joy va yuklanish ekrani uchun.
 *
 * `farq` — ikkinchi chiziq qisqaradi, ya'ni «mos kelmadi». Bu holat
 * animatsiyada ishlatiladi; статик логотип ҳар доим teng.
 */
export function LogoMark({
  size = "md",
  farq = false,
  className,
}: {
  size?: BrandSize;
  farq?: boolean;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      role="img"
      aria-label={BRAND.name}
      className={cx(SIZES[size], className)}
    >
      <rect x="2.5" y="6.5" width="19" height="4" rx="2" className="fill-cash" />
      <rect
        x="2.5"
        y="13.5"
        width={farq ? 12 : 19}
        height="4"
        rx="2"
        className="fill-invoice transition-all duration-500"
      />
    </svg>
  );
}

/** Belgi + nom. Sarlavhalarda va navigatsiyada ishlatiladi. */
export default function Logo({
  size = "md",
  className,
}: {
  size?: BrandSize;
  className?: string;
}) {
  return (
    <span className={cx("inline-flex items-center gap-2", className)}>
      <LogoMark size={size} />
      {/* Бренд t() дан ЎТКАЗИЛМАЙДИ — ном таржима қилинмайди */}
      <span className={cx("font-semibold tracking-tight text-ink", WORD_SIZES[size])}>
        {BRAND.name}
      </span>
    </span>
  );
}
