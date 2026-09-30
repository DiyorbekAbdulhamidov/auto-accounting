"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useLocale, useT } from "@/context/LanguageContext";
import { path } from "@/lib/routes";
import { Modal } from "@/components/ui";
import LoginFields from "@/components/LoginFields";

/* ============================================================
   KIRISH MODALI
   ------------------------------------------------------------
   Ilgari «Кириш» tugmasi `/login` sahifasiga OLIB O'TARDI: odam
   bosh sahifadan chiqib ketardi, kirgach yana qaytarib kelinardi.
   Endi oyna joyida ochiladi — sahifa almashmaydi.

   `/login` MARSHRUTI SAQLANADI va o'chirilmaydi. Sabab: uni
   `AuthContext` ham, `AppShell` ham yo'naltirish uchun ishlatadi
   (`router.replace(path("login"))`), ustiga odamlar havolani
   saqlab qo'ygan bo'lishi mumkin. Ikkalasi bitta `LoginFields`
   dan chiziladi, ya'ni matn bir joyda tuzatiladi.

   Oynaning o'zi `ui/Modal` — loyihadagi boshqa oynalar bilan bir
   xil xulq: Escape, fon bosilishi, fokus qaytishi.
   ============================================================ */

type Ctx = { open: () => void; close: () => void };

const LoginModalContext = createContext<Ctx | null>(null);

export function LoginModalProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();

  /* Oyna QAYSI sahifada ochilgani saqlanadi, ochiq/yopiq bayrog'i emas.
     Shu tufayli ikkita xulq EFFEKTSIZ keladi — holat HOSILA:
       · sahifa almashsa  ->  openedOn pathname ga teng emas  -> yopiq
       · odam kirsa       ->  user bor                        -> yopiq
     Effekt ichida setState qilinsa React ortiqcha qayta chizardi
     (eslint `react-hooks/set-state-in-effect` shuni ushlaydi). */
  const [openedOn, setOpenedOn] = useState<string | null>(null);

  const open = useCallback(() => setOpenedOn(pathname), [pathname]);
  const close = useCallback(() => setOpenedOn(null), []);

  const isOpen = openedOn !== null && openedOn === pathname && !user;

  const value = useMemo(() => ({ open, close }), [open, close]);

  return (
    <LoginModalContext.Provider value={value}>
      {children}
      <LoginModal open={isOpen} onClose={close} />
    </LoginModalContext.Provider>
  );
}

/** Provider ichida bo'lmasa ham yiqilmaydi: `open()` hech narsa
 *  qilmaydi va chaqiruvchi zaxira havolasiga tayanadi. */
export function useLoginModal(): Ctx {
  return useContext(LoginModalContext) ?? { open: () => {}, close: () => {} };
}

function LoginModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useT();
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("Кириш ёки рўйхатдан ўтиш")}
      hint={t("Бухгалтер учун автоматик текширув тизими")}
      width="26rem"
    >
      <LoginFields onDone={onClose} />
    </Modal>
  );
}

/* ============================================================
   «КИРИШ» ҲАВОЛАСИ
   ------------------------------------------------------------
   Ataylab `<a href="/login">` bo'lib qoladi va bosilganda modal
   ochiladi. Sabab: bu HAVOLA bo'lib qolgani uchun uni yangi
   oynada ochish, nusxa olish va qidiruv roboti bilan o'qish
   mumkin. JavaScript ishlamasa yoki provayder bo'lmasa — oddiy
   havola sifatida `/login` sahifasiga olib boradi, ya'ni kirish
   yo'li HECH QACHON uzilmaydi.
   ============================================================ */
export function LoginLink({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const locale = useLocale();
  const { open } = useLoginModal();
  return (
    <NextLink
      href={path("login", locale)}
      className={className}
      onClick={(e) => {
        // Yangi oynada ochishga urinishga xalaqit bermaymiz
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        open();
      }}
    >
      {children}
    </NextLink>
  );
}
