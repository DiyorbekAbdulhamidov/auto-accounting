"use client";

import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
import { cx } from "@/components/ui";

// Jadval ustunlari uchun yagona sortlash tugmasi (barcha sahifalarda bir xil).
// Ustun sarlavhasining o'lchami va rangi jadval shapkasi bilan bir xil
// bo'lishi shart — aks holda sortlanadigan va sortlanmaydigan ustunlar
// ikki xil jadvaldek ko'rinadi.
export default function SortHeader<K extends string>({
  label,
  k,
  activeKey,
  dir,
  onToggle,
  align = "left",
}: {
  label: string;
  k: K;
  activeKey: K;
  dir: "asc" | "desc";
  onToggle: (k: K) => void;
  align?: "left" | "right" | "center";
}) {
  const active = activeKey === k;
  return (
    <button
      type="button"
      onClick={() => onToggle(k)}
      className={cx(
        "group/s inline-flex items-center gap-1.5 text-caption font-medium transition-colors hover:text-ink",
        active ? "text-accent-ink" : "text-ink-3",
        align === "right" && "flex-row-reverse"
      )}
    >
      {label}
      {active ? (
        dir === "asc" ? (
          <ChevronUp className="h-3.5 w-3.5" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5" />
        )
      ) : (
        <ChevronsUpDown className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover/s:opacity-60 group-focus-visible/s:opacity-60" />
      )}
    </button>
  );
}
