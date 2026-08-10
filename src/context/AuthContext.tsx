"use client";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut, signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { usePathname, useRouter } from "next/navigation";

const AuthContext = createContext<any>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser?.email) {
          const userRef = doc(db, "allowed_users", firebaseUser.email);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            setUser({ ...firebaseUser, ...userSnap.data() });
          } else {
            await signOut(auth);
            setUser(null);
            if (pathnameRef.current !== "/login") {
              alert("Sizga bu tizimga kirishga ruxsat berilmagan!");
              router.replace("/login");
            }
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Auth tekshiruvi xatosi:", error);
        setUser(null);
        await signOut(auth).catch(() => {});
        if (pathnameRef.current !== "/login") {
          alert("Tizimga ulanishda xatolik. Qayta urinib ko'ring.");
          router.replace("/login");
        }
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (!loading && user && pathname === "/login") {
      router.replace("/");
    }
  }, [loading, user, pathname, router]);

  const login = async (email: string, pass: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error: any) {
      alert("Login yoki parol xato: " + error.message);
      setLoading(false);
    }
  };

  const logout = async () => {
    await signOut(auth);
    router.replace("/login");
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
