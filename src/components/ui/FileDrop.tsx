"use client";

import { useState } from "react";
import { CloudUpload } from "lucide-react";
import { cx } from "./styles";

/**
 * Fayl tanlash maydoni.
 *
 * Ikkala sverkada ham bir xil ko'rinadi — buxgalter uchun bu bitta
 * harakat: «faylni bu yerga tashla». Tanlangandan keyin maydon rangi
 * modul rangiga o'tadi va FAYL NOMLARI ko'rsatiladi: noto'g'ri fayl
 * tanlanganini yuklashdan OLDIN ko'rish kerak.
 */
export default function FileDrop({
  files,
  onFiles,
  accept = ".xls,.xlsx,.csv",
  label,
  hint,
  selectedLabel,
  className,
}: {
  files: File[];
  onFiles: (files: File[]) => void;
  accept?: string;
  /** Fayl tanlanmaganda ko'rinadigan matn */
  label: string;
  /** Fayl tanlanmaganda ko'rinadigan izoh */
  hint: string;
  /** Masalan «3 та файл танланди» */
  selectedLabel: string;
  className?: string;
}) {
  const has = files.length > 0;
  const [over, setOver] = useState(false);

  /** `.xls,.xlsx,.csv` -> faqat shu kengaytmali fayllar */
  const keep = (list: File[]) => {
    const exts = accept
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    if (exts.length === 0) return list;
    return list.filter((f) => exts.some((e) => f.name.toLowerCase().endsWith(e)));
  };

  return (
    <label
      className={cx("block cursor-pointer", className)}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        // Yaroqli fayl bo'lmasa — tanlov O'ZGARMAYDI. Aks holda
        // noto'g'ri fayl tashlagan odam avvalgi to'g'ri tanlovini
        // ham yo'qotardi.
        const picked = keep(Array.from(e.dataTransfer.files));
        if (picked.length > 0) onFiles(picked);
      }}
    >
      <div
        className={cx(
          "flex items-center gap-3 rounded-md border border-dashed p-4 transition-colors",
          over
            ? "border-accent bg-accent-soft"
            : has
              ? "border-accent bg-accent-soft"
              : "border-line bg-surface-2 hover:border-ink-3"
        )}
      >
        <CloudUpload
          className={cx("h-5 w-5 shrink-0", has || over ? "text-accent-ink" : "text-ink-3")}
        />
        <div className="min-w-0">
          <p className="truncate text-body font-medium text-ink">{has ? selectedLabel : label}</p>
          <p className="truncate text-caption text-ink-3">
            {has ? files.map((f) => f.name).join(", ") : hint}
          </p>
        </div>
      </div>
      <input
        type="file"
        accept={accept}
        multiple
        onChange={(e) => onFiles(Array.from(e.target.files || []))}
        className="hidden"
      />
    </label>
  );
}
