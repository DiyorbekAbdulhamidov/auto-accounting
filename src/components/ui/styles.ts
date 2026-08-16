// Dizayn tizimining SINF (className) qatlami.
//
// Nega alohida fayl: sahifadagi har element komponentga o'ralavermaydi —
// masalan 20 ustunli jadvalning katagi. Shunday joyda ham qaror bitta
// yerda turishi uchun sinflar shu yerdan olinadi.
//
// Qoida: sahifada `slate-500`, `emerald-600`, `rounded-xl` kabi to'g'ridan
// -to'g'ri qiymat YOZILMAYDI. Faqat shu yerdagi yoki globals.css dagi
// tokenlar (`text-ink-2`, `border-line`, `text-cash`) ishlatiladi.

/** Bo'sh va `false` qiymatlarni tashlab, sinflarni birlashtiradi. */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/* ============================================================
   TUGMA
   ============================================================ */

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md";

const BUTTON_BASE =
  "inline-flex items-center justify-center gap-2 rounded-md font-medium whitespace-nowrap " +
  "transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:opacity-50";

const BUTTON_VARIANT: Record<ButtonVariant, string> = {
  // Modul rangi (`--accent`): chiqimda ko'k, kirimda yashil
  primary: "bg-accent text-accent-fg hover:opacity-90",
  secondary: "bg-surface text-ink-2 border border-line hover:bg-surface-2 hover:text-ink",
  ghost: "text-ink-3 hover:bg-surface-2 hover:text-ink",
  danger: "bg-surface text-bad border border-line hover:bg-bad-soft hover:border-bad",
};

const BUTTON_SIZE: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-caption",
  md: "h-10 px-4 text-body",
};

const BUTTON_ICON_SIZE: Record<ButtonSize, string> = {
  sm: "h-8 w-8 p-0",
  md: "h-10 w-10 p-0",
};

/** Tugma sinflari. `<Link>` ga ham beriladi — shuning uchun funksiya. */
export function buttonClasses(
  variant: ButtonVariant = "secondary",
  size: ButtonSize = "md",
  opts?: { iconOnly?: boolean; block?: boolean }
): string {
  return cx(
    BUTTON_BASE,
    BUTTON_VARIANT[variant],
    opts?.iconOnly ? BUTTON_ICON_SIZE[size] : BUTTON_SIZE[size],
    opts?.block && "w-full"
  );
}

/* ============================================================
   MAYDON (input, select)
   ============================================================ */

export const fieldClasses =
  "w-full h-10 px-3 rounded-md border border-line bg-surface text-body text-ink " +
  "placeholder:text-ink-3 outline-none transition-colors " +
  "focus:border-accent disabled:opacity-60";

export const labelClasses = "block mb-1.5 text-caption font-medium text-ink-2";

/* ============================================================
   JADVAL
   ------------------------------------------------------------
   Buxgalter ekranda eng ko'p shu bilan ishlaydi, shuning uchun
   qarorlar shu yerda qotirilgan:
     · katak oralig'i bitta (px-4 py-2.5)
     · raqam HAR DOIM o'ngda va tekis (tabular)
     · shapka HARFLARI katta emas — kirillda o'qish qiyinlashadi
   ============================================================ */

export const tableCls = {
  /** Aylantiriladigan ramka. Jadval doim shuning ichida bo'ladi. */
  frame: "w-full overflow-auto rounded-lg border border-line bg-surface custom-scrollbar",
  table: "w-full border-collapse text-body",
  thead: "bg-surface-2",
  /** Shapka katagi. Sticky kerak bo'lsa: cx(tableCls.th, tableCls.thSticky) */
  th: "px-4 py-2.5 text-caption font-medium text-ink-3 text-left whitespace-nowrap border-b border-line",
  thSticky: "sticky top-0 z-10 bg-surface-2",
  tbody: "divide-y divide-line",
  tr: "transition-colors hover:bg-surface-2",
  trSelected: "bg-accent-soft",
  td: "px-4 py-2.5 text-ink-2 align-middle",
  /** Nomi bor ustun — matn asosiy rangda */
  tdMain: "px-4 py-2.5 text-ink align-middle",
  /** Raqamli katak: o'ngda va tekis */
  num: "px-4 py-2.5 text-right tabular align-middle",
  tfoot: "bg-surface-2 font-semibold border-t-2 border-line-strong text-ink",
  tfootSticky: "sticky bottom-0 z-10",
} as const;

/** Ustun yo'nalishi */
export const align = {
  left: "text-left",
  right: "text-right",
  center: "text-center",
} as const;

/* ============================================================
   MA'LUMOT RANGLARI
   ------------------------------------------------------------
   Modul rangidan MUSTAQIL: pul ikkala sverkada ham bir xil
   rangda bo'ladi. Aks holda buxgalter rang ma'nosini har
   sahifada qaytadan o'rganishga majbur bo'ladi.
   ============================================================ */

export type Tone = "default" | "cash" | "invoice" | "ok" | "warn" | "bad" | "info" | "muted";

export const toneText: Record<Tone, string> = {
  default: "text-ink",
  cash: "text-cash", // тўланган / тушган пул
  invoice: "text-invoice", // келган / ёзилган фактура
  ok: "text-ok", // фарқ йўқ
  warn: "text-warn", // диққат талаб қилади
  bad: "text-bad", // қарз, номувофиқлик
  info: "text-info", // аванс, ортиқча
  muted: "text-ink-3",
};

/** Belgi (badge) va yumshoq panel foni */
export const toneSoft: Record<Tone, string> = {
  default: "bg-surface-2 text-ink-2 border-line",
  cash: "bg-ok-soft text-cash border-cash/30",
  invoice: "bg-accent-soft text-invoice border-invoice/30",
  ok: "bg-ok-soft text-ok border-ok/30",
  warn: "bg-warn-soft text-warn border-warn/30",
  bad: "bg-bad-soft text-bad border-bad/30",
  info: "bg-info-soft text-info border-info/30",
  muted: "bg-surface-2 text-ink-3 border-line",
};

/* ============================================================
   ORALIQ (spacing) — bitta shkala
   ------------------------------------------------------------
   Bo'lim orasi 24px, karta ichi 20px, mayda oraliq 8/12px.
   Boshqa qiymat ishlatilmaydi.
   ============================================================ */

export const layout = {
  /** Sahifa konteyneri */
  page: "min-h-screen bg-page text-ink",
  container: "mx-auto w-full max-w-7xl px-4 py-6 md:px-6",
  /** Keng jadvalli sahifalar uchun */
  containerWide: "mx-auto w-full max-w-[1500px] px-4 py-6 md:px-6",
  /** Bo'limlar orasidagi oraliq */
  stack: "space-y-6",
  cardPad: "p-5",
} as const;
