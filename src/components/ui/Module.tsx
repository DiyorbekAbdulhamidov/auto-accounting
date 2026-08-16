"use client";

import { createContext, useContext } from "react";
import { cx } from "./styles";

/**
 * MODUL DOIRASI — «bu qism qaysi sverka».
 *
 * `data-module` atributi `--accent` ni almashtiradi (globals.css):
 * chiqim ko'k, kirim yashil. Tugma, aktiv tab va fokus halqasi
 * shundan rang oladi, komponent ichida rang YOZILMAYDI.
 *
 * NEGA KONTEKST HAM KERAK. `Modal` `<body>` ga PORTAL orqali
 * chiqariladi — ya'ni uning DOM ota-onasi sahifa emas, `<body>`.
 * Shuning uchun sahifadagi `data-module` unga YETIB BORMAYDI va
 * kirim sverkasining modali ko'k tugma bilan ochilardi. Kontekst
 * shu uzilishni yopadi: portal o'z ildiziga aynan shu atributni
 * qaytadan qo'yadi.
 */
export type ModuleKind = "in" | "out";

const ModuleCtx = createContext<ModuleKind | undefined>(undefined);

/** Portal ichida modulni tiklash uchun */
export function useModule(): ModuleKind | undefined {
  return useContext(ModuleCtx);
}

export function ModuleScope({
  module,
  className,
  children,
}: {
  module: ModuleKind;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <ModuleCtx.Provider value={module}>
      <div data-module={module} className={cx(className)}>
        {children}
      </div>
    </ModuleCtx.Provider>
  );
}
