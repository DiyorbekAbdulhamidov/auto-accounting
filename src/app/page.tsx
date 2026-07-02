"use client";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push("/login");
    }
  }, [user, router]);

  if (!user) return null; // Yuklanayotganda bo'sh sahifa ko'rsatib turadi

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <header className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Moliyaviy Analitika Paneli</h1>
          <p className="text-sm text-gray-500">Xush kelibsiz, {user.email}</p>
        </div>
        <button
          onClick={logout}
          className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-600 transition"
        >
          Chiqish
        </button>
      </header>

      {/* Bu yerga fayl yuklash va grafiklar komponentlarini joylashtiramiz */}
      <main className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm col-span-3 text-center border-2 border-dashed border-gray-300 p-12">
          <p className="text-gray-600">Bu yerga boyagi Excel yuklash komponentini qo'yamiz.</p>
        </div>
      </main>
    </div>
  );
}