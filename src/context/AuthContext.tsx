"use client";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { notify } from "@/components/ui";
import { auth, db } from "@/lib/firebase";
import {
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { usePathname, useRouter } from "next/navigation";
import { isPath, localeFromPathname, path } from "@/lib/routes";
import { accountKeyOf } from "@/lib/workspace";

/**
 * Ilova ko'radigan foydalanuvchi: Firebase hisobi + `allowed_users`
 * hujjatidagi maydonlar (ish maydoni, rol, holat) bitta obyektda.
 *
 * `workspaceId` — ENG muhimi: barcha Firestore so'rovlari shunga
 * bog'lanadi. Uni `any` ostida qoldirish xatoni jimgina o'tkazib
 * yuborardi (nomi noto'g'ri yozilsa `undefined` bo'lib, so'rov
 * butunlay rad etilardi).
 */
export interface AppUser {
  uid: string;
  email: string | null;
  workspaceId?: string;
  role?: string;
  status?: string;
  /** `allowed_users` hujjatidagi qolgan maydonlar */
  [key: string]: unknown;
}

export interface AuthValue {
  user: AppUser | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  /** Xato matnini qaytaradi; muvaffaqiyatda `null` */
  signup: (email: string, pass: string) => Promise<string | null>;
  /** SMS yuborish. `phone` E.164 shaklida (`+998901234567`). */
  sendSmsCode: (phone: string) => Promise<string | null>;
  /**
   * SMS kodini tasdiqlash. Telefonda RO'YXATDAN O'TISH alohida amal
   * EMAS: Firebase raqamni birinchi ko'rganda hisobni o'zi ochadi,
   * shuning uchun bu funksiya har doim `/api/signup` ni ham chaqiradi
   * (u idempotent).
   */
  confirmSmsCode: (code: string) => Promise<string | null>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);

  // Til manzilning birinchi bo'lagida. `useLocale()` bu yerda ISHLAMAYDI:
  // `AuthProvider` `LanguageProvider` dan yuqorida turadi, ya'ni til
  // konteksti hali mavjud emas. Manzil esa har doim bor.
  const locale = localeFromPathname(pathname);
  const localeRef = useRef(locale);

  useEffect(() => {
    pathnameRef.current = pathname;
    localeRef.current = locale;
  }, [pathname, locale]);

  // RO'YXATDAN O'TISH POYGASI. `createUserWithEmailAndPassword` darhol
  // auth holatini o'zgartiradi, `allowed_users` hujjati esa /api/signup
  // ishlagandan KEYIN paydo bo'ladi. Oradagi lahzada quyidagi tekshiruv
  // «ruxsat yo'q» deb foydalanuvchini tashqariga uloqtirardi. Shu bayroq
  // o'sha oraliqni yopadi.
  const signingUpRef = useRef(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (signingUpRef.current) return;
        // HISOB KALITI: email YOKI telefon raqami. Ilgari bu yerda faqat
        // `firebaseUser?.email` tekshirilardi — SMS bilan kirgan odam
        // `else` shoxiga tushib, kirmagan hisoblanardi.
        const key = accountKeyOf(firebaseUser?.email, firebaseUser?.phoneNumber);
        if (firebaseUser && key) {
          const userRef = doc(db, "allowed_users", key);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            setUser({ ...firebaseUser, ...userSnap.data() });
          } else {
            await signOut(auth);
            setUser(null);
            if (!isPath(pathnameRef.current, "login")) {
              notify.error("Sizga bu tizimga kirishga ruxsat berilmagan!");
              router.replace(path("login", localeRef.current));
            }
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Auth tekshiruvi xatosi:", error);
        setUser(null);
        await signOut(auth).catch(() => {});
        if (!isPath(pathnameRef.current, "login")) {
          notify.error("Tizimga ulanishda xatolik. Qayta urinib ko'ring.");
          router.replace(path("login", localeRef.current));
        }
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Kirgan odam login sahifasida turmaydi. Manzil bosh sahifa EMAS:
  // u endi ochiq tanishtiruv sahifasi, ish esa mijozlar ro'yxatida.
  useEffect(() => {
    if (!loading && user && isPath(pathname, "login")) {
      router.replace(path("clients", locale));
    }
  }, [loading, user, pathname, locale, router]);

  const login = async (email: string, pass: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      notify.error("Login yoki parol xato", message);
      setLoading(false);
    }
  };

  /**
   * RO'YXATDAN O'TISH — o'zi ochadi va darhol ishlaydi.
   *
   * Ikki bosqich: avval Firebase'da hisob ochiladi, keyin /api/signup
   * ish maydonini yaratadi. Ikkinchisi yiqilsa hisob YARIM holatda
   * qolmasligi kerak — shuning uchun Firebase hisobi o'chiriladi va
   * odam qaytadan urinib ko'ra oladi.
   */
  const signup = async (email: string, pass: string): Promise<string | null> => {
    setLoading(true);
    signingUpRef.current = true;
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      const token = await cred.user.getIdToken();
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        await cred.user.delete().catch(() => signOut(auth));
        signingUpRef.current = false;
        setLoading(false);
        return data.error || "Рўйхатдан ўтишда хатолик.";
      }

      // Ish maydoni endi tayyor — foydalanuvchi holatini O'ZIMIZ qo'yamiz.
      // `onAuthStateChanged` bu hisob uchun allaqachon ishlab bo'lgan va
      // qaytadan chaqirilmaydi.
      const key = accountKeyOf(cred.user.email, cred.user.phoneNumber)!;
      const userSnap = await getDoc(doc(db, "allowed_users", key));
      signingUpRef.current = false;
      setUser({ ...cred.user, ...(userSnap.exists() ? userSnap.data() : {}) });
      setLoading(false);
      router.replace(path("clients", localeRef.current));
      return null;
    } catch (error) {
      signingUpRef.current = false;
      setLoading(false);
      const err = error as { code?: string; message?: string };
      const code = String(err?.code || "");
      if (code.includes("email-already-in-use")) return "Бу электрон почта аллақачон рўйхатдан ўтган. Кириш бўлимидан фойдаланинг.";
      if (code.includes("weak-password")) return "Парол жуда содда — камида 6 та белги бўлсин.";
      if (code.includes("invalid-email")) return "Электрон почта нотўғри ёзилган.";
      return err?.message || "Рўйхатдан ўтишда хатолик.";
    }
  };

  /* ============================================================
     SMS BILAN KIRISH
     ------------------------------------------------------------
     Uch qaror:

      1. RO'YXATDAN O'TISH ALOHIDA AMAL EMAS. Firebase telefon raqamini
         birinchi ko'rganda hisobni O'ZI ochadi. Shuning uchun kod
         tasdiqlangandan keyin HAR DOIM `/api/signup` chaqiriladi — u
         idempotent: ish maydoni yo'q bo'lsa yaratadi, bor bo'lsa tegmaydi.

      2. XATO BO'LSA HISOB O'CHIRILMAYDI. Email bilan ro'yxatdan o'tishda
         `/api/signup` yiqilsa hisob o'chiriladi (u aynan shu lahzada
         yaralgan). Telefonda esa hisob QAYTA KELGAN foydalanuvchiga
         tegishli bo'lishi mumkin — o'chirish uning butun ma'lumotini
         yo'q qilardi. Shu sabab faqat tizimdan chiqiladi.

      3. reCAPTCHA konteyneri SHU YERDA yaratiladi. Firebase telefon
         autentifikatsiyasi veb'da ilova tekshiruvini talab qiladi.
         Konteynerni sahifaga qo'ydirsak, boshqa joydan chaqirilganda
         element topilmay xato berardi.
     ============================================================ */
  const confirmationRef = useRef<ConfirmationResult | null>(null);
  const verifierRef = useRef<RecaptchaVerifier | null>(null);

  const getVerifier = (): RecaptchaVerifier => {
    if (verifierRef.current) return verifierRef.current;
    const ID = "recaptcha-holder";
    let holder = document.getElementById(ID);
    if (!holder) {
      holder = document.createElement("div");
      holder.id = ID;
      document.body.appendChild(holder);
    }
    verifierRef.current = new RecaptchaVerifier(auth, ID, { size: "invisible" });
    return verifierRef.current;
  };

  /** Firebase xato kodini o'zbekcha izohga o'giradi. */
  const phoneError = (code: string, fallback: string): string => {
    if (code.includes("invalid-phone-number")) return "Телефон рақами нотўғри. +998 билан ёзинг.";
    if (code.includes("too-many-requests")) return "Жуда кўп уриниш бўлди. Бироз кутиб қайта уриниб кўринг.";
    if (code.includes("quota-exceeded")) return "SMS чекловига етилди. Бироздан кейин уриниб кўринг.";
    // Spark (бепул) режада ҲАҚИҚИЙ SMS умуман юборилмайди. Синов
    // рақамлари ишлайверади — улар SMS юбормайди. Ҳақиқий фойдаланувчи
    // учун Blaze режаси ШАРТ.
    if (code.includes("billing-not-enabled")) {
      return "SMS юбориш учун Firebase'да Blaze режаси ёқилиши керак (ҳозир бепул Spark режаси). Email ва парол билан киришингиз мумкин.";
    }
    if (code.includes("invalid-verification-code")) return "Код хато. Қайта киритиб кўринг.";
    if (code.includes("code-expired")) return "Коднинг муддати тугади. Янги код сўранг.";
    if (code.includes("captcha-check-failed")) return "Текширув ўтмади. Саҳифани янгилаб қайта уриниб кўринг.";
    // `operation-not-allowed` IKKI xil sababdan keladi va Firebase
    // ikkalasiga ham AYNAN shu kodni beradi. 2026-08-18 da xabar faqat
    // birinchisini aytardi va noto'g'ri joyga yo'llardi — haqiqiy sabab
    // ikkinchisi edi («SMS unable to be sent until this region enabled
    // by the app developer»). Shuning uchun ikkalasi ham aytiladi.
    if (code.includes("operation-not-allowed")) {
      return (
        "Firebase'да телефон билан кириш ёқилмаган ЁКИ SMS бу давлатга " +
        "рухсат этилмаган. Иккаласини текширинг: Authentication -> " +
        "Sign-in method -> Phone, ва Authentication -> Settings -> " +
        "SMS region policy (Ўзбекистон рухсат этилганлар рўйхатида бўлсин)."
      );
    }
    return fallback;
  };

  const sendSmsCode = async (phone: string): Promise<string | null> => {
    try {
      confirmationRef.current = await signInWithPhoneNumber(auth, phone, getVerifier());
      return null;
    } catch (error) {
      const err = error as { code?: string; message?: string };
      // Yiqilgan verifier QAYTA ISHLATILMAYDI — keyingi urinish ham
      // yiqilardi. Tozalaymiz, shunda yangi tekshiruv yaratiladi.
      try {
        verifierRef.current?.clear();
      } catch {
        /* konteyner allaqachon yo'q bo'lishi mumkin */
      }
      verifierRef.current = null;
      return phoneError(String(err?.code || ""), err?.message || "SMS юборилмади.");
    }
  };

  const confirmSmsCode = async (code: string): Promise<string | null> => {
    if (!confirmationRef.current) return "Аввал SMS код сўранг.";
    setLoading(true);
    signingUpRef.current = true;
    try {
      const cred = await confirmationRef.current.confirm(code);
      const token = await cred.user.getIdToken();
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        // Hisob O'CHIRILMAYDI — sababi yuqorida (2-qaror).
        await signOut(auth).catch(() => {});
        signingUpRef.current = false;
        setLoading(false);
        return data.error || "Кириш тайёрланмади. Қайта уриниб кўринг.";
      }

      const key = accountKeyOf(cred.user.email, cred.user.phoneNumber)!;
      const userSnap = await getDoc(doc(db, "allowed_users", key));
      signingUpRef.current = false;
      setUser({ ...cred.user, ...(userSnap.exists() ? userSnap.data() : {}) });
      setLoading(false);
      confirmationRef.current = null;
      router.replace(path("clients", localeRef.current));
      return null;
    } catch (error) {
      signingUpRef.current = false;
      setLoading(false);
      const err = error as { code?: string; message?: string };
      return phoneError(String(err?.code || ""), err?.message || "Код тасдиқланмади.");
    }
  };

  const logout = async () => {
    await signOut(auth);
    router.replace(path("login", localeRef.current));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, sendSmsCode, confirmSmsCode, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = (): AuthValue => {
  const ctx = useContext(AuthContext);
  // Provider ichida bo'lmasa — bu dasturchi xatosi, jimgina `null`
  // qaytarilsa sahifa tushunarsiz joyda yiqilardi.
  if (!ctx) throw new Error("useAuth() faqat <AuthProvider> ichida ishlaydi");
  return ctx;
};
