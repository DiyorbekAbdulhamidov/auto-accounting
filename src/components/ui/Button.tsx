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
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={cx(buttonClasses(variant, size, { iconOnly, block }), className)}
    >
      {loading ? (
        <Loader2 className={size === "sm" ? "h-3.5 w-3.5 animate-spin" : "h-4 w-4 animate-spin"} />
      ) : (
        icon
      )}
      {!iconOnly && children}
    </button>
  );
}
