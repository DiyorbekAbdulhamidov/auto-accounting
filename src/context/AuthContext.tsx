"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut, signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

const AuthContext = createContext<any>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser && firebaseUser.email) {
        // Ruxsat berilganlar ro'yxatidan tekshiramiz
        const userRef = doc(db, "allowed_users", firebaseUser.email);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          // Ruxsat bor bo'lsa, foydalanuvchini saqlaymiz
          setUser({ ...firebaseUser, ...userSnap.data() });
        } else {
          // Ruxsat yo'q bo'lsa, tizimdan chiqarib yuboramiz
          await signOut(auth);
          setUser(null);
          alert("Sizga bu tizimga kirishga ruxsat berilmagan!");
          router.push("/login");
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  // Login funksiyasi
  const login = async (email: string, pass: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      router.push("/"); // Bosh sahifaga (Dashboard) yo'naltirish
    } catch (error: any) {
      alert("Login yoki parol xato: " + error.message);
      setLoading(false);
    }
  };

  // Logout funksiyasi
  const logout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);