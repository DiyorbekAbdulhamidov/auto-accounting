"use client";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { notify } from "@/components/ui";
import { auth, db } from "@/lib/firebase";
import {
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { usePathname, useRouter } from "next/navigation";
import { isPath, localeFromPathname, path } from "@/lib/routes";

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
        if (firebaseUser?.email) {
          const userRef = doc(db, "allowed_users", firebaseUser.email);
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
      const userSnap = await getDoc(doc(db, "allowed_users", cred.user.email!));
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

  const logout = async () => {
    await signOut(auth);
    router.replace(path("login", localeRef.current));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
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
