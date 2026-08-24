"use client";

import { cx } from "./styles";

export type TabItem<K extends string> = {
  key: K;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  /** Nechta qator borligi — buxgalter bosishdan oldin biladi */
  count?: number;
};

/**
 * Tablar.
 *
 * Aktiv tab modul rangi bilan belgilanadi (chiqim ko'k, kirim yashil),
 * qolganlari betaraf. Sanoq har doim ko'rsatiladi: bo'sh tabni bosib
 * ochib, keyin bo'sh ekanini bilish — behuda qadam.
 */
export default function Tabs<K extends string>({
  items,
  value,
  onChange,
  actions,
  className,
}: {
  items: TabItem<K>[];
  value: K;
  onChange: (k: K) => void;
  /** O'ng chetdagi tugma (masalan Excel yuklash) */
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx("flex flex-wrap items-center gap-1.5 border-b border-line px-2 py-2", className)}
      role="tablist"
    >
      {items.map((item) => {
        const Icon = item.icon;
        const active = value === item.key;
        return (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.key)}
            className={cx(
              "inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-caption font-medium transition-colors",
              active
                ? "bg-accent text-accent-fg"
                : "text-ink-2 hover:bg-surface-2 hover:text-ink"
            )}
          >
            {Icon && <Icon className="h-3.5 w-3.5" />}
            {item.label}
            {item.count !== undefined && (
              <span
                className={cx(
                  "rounded-sm px-1.5 tabular",
                  active ? "bg-black/15 text-accent-fg" : "bg-surface-2 text-ink-3"
                )}
              >
                {item.count}
              </span>
            )}
          </button>
        );
      })}
      {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
    </div>
  );
}
