"use client";

import { AlertTriangle, Info, CheckCircle2, Loader2 } from "lucide-react";
import { cx, toneSoft, type Tone } from "./styles";

/**
 * Ogohlantirish / xabar.
 *
 * `warn` — buxgalter tekshirishi kerak bo'lgan narsa (raqam shubhali).
 * `bad`  — ish bajarilmadi (fayl o'qilmadi, xato).
 * Ikkalasi ham YO'QOTILMAYDI: jimgina o'chirish eng qimmat xato.
 */
export function Alert({
  tone = "warn",
  title,
  className,
  children,
}: {
  tone?: "warn" | "bad" | "info" | "ok";
  title?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}) {
  const Icon = tone === "ok" ? CheckCircle2 : tone === "info" ? Info : AlertTriangle;
  return (
    <div
      className={cx(
        "flex items-start gap-2.5 rounded-md border p-3 text-caption",
        toneSoft[tone],
        className
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cx(title ? "mt-0.5" : null)}>{children}</div>}
      </div>
    </div>
  );
}

/** Kichik belgi: varaq nomi, davr, holat. */
export function Badge({
  tone = "muted",
  icon,
  className,
  children,
}: {
  tone?: Tone;
  icon?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-sm border px-2 py-1 text-caption font-medium",
        toneSoft[tone],
        className
      )}
    >
      {icon}
      {children}
    </span>
  );
}

/** Bo'sh ro'yxat. Nima yo'qligini VA nima qilish kerakligini aytadi. */
export function EmptyState({
  icon,
  title,
  hint,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  hint?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("flex flex-col items-center justify-center gap-2 p-12 text-center", className)}>
      {icon && <span className="text-ink-3">{icon}</span>}
      <p className="text-body font-medium text-ink-2">{title}</p>
      {hint && <p className="max-w-sm text-caption text-ink-3">{hint}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cx("h-4 w-4 animate-spin", className)} />;
}

/** Butun sahifa yuklanayotgani */
export function PageLoader({ text }: { text: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-page text-ink">
      <Loader2 className="h-7 w-7 animate-spin text-accent-ink" />
      <p className="text-body text-ink-3">{text}</p>
    </div>
  );
}
