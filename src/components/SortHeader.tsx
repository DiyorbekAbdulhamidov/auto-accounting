"use client";

import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";

// Jadval ustunlari uchun yagona sortlash tugmasi (barcha sahifalarda bir xil)
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
      onClick={() => onToggle(k)}
      className={`group/s inline-flex items-center gap-1.5 uppercase tracking-wider text-[11px] font-bold transition-colors hover:text-indigo-600 dark:hover:text-indigo-400 ${
        active ? "text-indigo-600 dark:text-indigo-400" : "text-slate-500"
      } ${align === "right" ? "flex-row-reverse" : ""}`}
    >
      {label}
      {active ? (
        dir === "asc" ? (
          <ChevronUp className="w-3.5 h-3.5" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5" />
        )
      ) : (
        <ChevronsUpDown className="w-3.5 h-3.5 opacity-0 group-hover/s:opacity-60 transition-opacity" />
      )}
    </button>
  );
}
