"use client";

import { Loader2 } from "lucide-react";
import { buttonClasses, cx, type ButtonSize, type ButtonVariant } from "./styles";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Faqat belgi (icon) — kvadrat tugma. `title` yozish SHART. */
  iconOnly?: boolean;
  block?: boolean;
  /** Bosilgandan keyin kutish: aylanma chiqadi va tugma o'chadi */
  loading?: boolean;
  icon?: React.ReactNode;
};

/**
 * Yagona tugma. Rangi modulga bog'liq: chiqim sahifasida ko'k,
 * kirim sahifasida yashil — buni sahifadagi `data-module` hal qiladi,
 * tugmaning o'zida rang yozilmaydi.
 */
export default function Button({
  variant = "secondary",
  size = "md",
  iconOnly = false,
  block = false,
  loading = false,
  icon,
  disabled,
  className,
  children,
  ...rest
}: Props) {
  /* BELGILI TUGMANING NOMI.
     ------------------------------------------------------------
     `iconOnly` tugmada matn YO'Q — ichida faqat SVG turadi. `title`
     sichqoncha ustiga kelganda ko'rinadi, lekin ekran o'quvchi uni
     ishonchli o'qimaydi: qulay nom `aria-label` dan olinadi. Shu sabab
     `title` bo'lsa-yu `aria-label` yozilmagan bo'lsa, o'shani nom qilib
     qo'yamiz — aks holda tugma «tugma» deb eshitiladi (hisobotni
     o'chirish tugmasida aynan shunday edi). */
  const ariaLabel =
    iconOnly && !rest["aria-label"] && typeof rest.title === "string"
      ? rest.title
      : rest["aria-label"];

  return (
    <button
      {...rest}
      aria-label={ariaLabel}
      disabled={disabled || loading}
      className={cx(buttonClasses(variant, size, { iconOnly, block }), className)}
    >
      {loading ? (
        <Loader2 className={size === "sm" ? "h-3.5 w-3.5 animate-spin" : "h-4 w-4 animate-spin"} />
      ) : (
        /* BELGI `icon` PROPIDAN keladi. Lekin uni bolasi (children)
           sifatida yozish ham TABIIY ko'rinadi va aynan shunday
           yozilgan joy bor edi: `iconOnly` tugma ichida hech narsa
           chizilmay, jadvalda BO'SH kvadrat bo'lib turardi. Shuning
           uchun `icon` bo'lmasa bolasi belgi deb qabul qilinadi. */
        (icon ?? (iconOnly ? children : null))
      )}
      {!iconOnly && children}
    </button>
  );
}
