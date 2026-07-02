"use client";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import FileUpload from "@/components/FileUpload"; // Komponentni chaqiramiz

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push("/login");
    }
  }, [user, router]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <header className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm mb-8 border border-gray-100 max-w-5xl mx-auto">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Bank Analyzer AI</h1>
          <p className="text-xs text-gray-500">Tizim operatori: {user.email}</p>
        </div>
        <button
          onClick={logout}
          className="bg-rose-50 text-rose-600 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-rose-100 transition"
        >
          Tizimdan chiqish
        </button>
      </header>

      <main className="max-w-5xl mx-auto">
        {/* Bizning Drag-and-Drop komponentimiz shu yerda ishlaydi */}
        <FileUpload />
      </main>
    </div>
  );
}