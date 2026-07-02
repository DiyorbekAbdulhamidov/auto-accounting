"use client";
import { useState } from "react";

export default function AdminUsersPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");

    // 10 soniyalik taymer qo'yamiz
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const res = await fetch("/api/admin/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role }),
        signal: controller.signal, // Taymerni so'rovga ulaymiz
      });

      clearTimeout(timeoutId); // Agar tez javob kelsa taymerni o'chiramiz
      const data = await res.json();
      setLoading(false);

      if (data.success) {
        setMsg("🎉 Foydalanuvchi yaratildi!");
        setEmail("");
        setPassword("");
      } else {
        setMsg("❌ Xatolik: " + data.error);
      }
    } catch (err: any) {
      setLoading(false);
      if (err.name === 'AbortError') {
        setMsg("❌ Tarmoq juda sekin: Server Google bilan bog'lana olmadi (Timeout). Internetni tekshiring yoki VPN yoqing!");
      } else {
        setMsg("❌ Kutilmagan xatolik yuz berdi.");
      }
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-xl shadow-md border">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Yangi Foydalanuvchi Qoʻshish</h2>

      {msg && <p className="mb-4 text-sm font-medium p-2 bg-gray-50 rounded text-center">{msg}</p>}

      <form onSubmit={handleCreateUser} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Email (Login)</label>
          <input
            type="email"
            required
            className="mt-1 w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Parol</label>
          <input
            type="password"
            required
            minLength={6}
            className="mt-1 w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Huquqi (Role)</label>
          <select
            className="mt-1 w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="user">Oddiy xodim</option>
            <option value="admin">Admin / Superuser</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white p-2.5 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:bg-indigo-400"
        >
          {loading ? "Yaratilmoqda..." : "Foydalanuvchini Faollashtirish"}
        </button>
      </form>
    </div>
  );
}