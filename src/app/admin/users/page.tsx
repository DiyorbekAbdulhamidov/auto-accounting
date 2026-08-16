"use client";
import { useState } from "react";
import { authFetch } from "@/lib/authFetch";
import { Alert, Button, Card, Field, Input, Select, layout } from "@/components/ui";

export default function AdminUsersPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [ok, setOk] = useState(false);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");

    // 10 soniyalik taymer qo'yamiz
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const res = await authFetch("/api/admin/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role }),
        signal: controller.signal, // Taymerni so'rovga ulaymiz
      });

      clearTimeout(timeoutId); // Agar tez javob kelsa taymerni o'chiramiz
      const data = await res.json();
      setLoading(false);

      if (data.success) {
        setOk(true);
        setMsg("Foydalanuvchi yaratildi!");
        setEmail("");
        setPassword("");
      } else {
        setOk(false);
        setMsg("Xatolik: " + data.error);
      }
    } catch (err) {
      setLoading(false);
      setOk(false);
      // `AbortError` ni ajratamiz: sekin tarmoq bilan haqiqiy xatoni
      // farqlash kerak, aks holda foydalanuvchi noto'g'ri joyni qidiradi
      if (err instanceof Error && err.name === "AbortError") {
        setMsg("Tarmoq juda sekin: Server Google bilan bog'lana olmadi (Timeout). Internetni tekshiring yoki VPN yoqing!");
      } else {
        setMsg("Kutilmagan xatolik yuz berdi.");
      }
    }
  };

  return (
    <div className={`${layout.page} flex items-start justify-center px-4 py-10`}>
      <Card className="w-full max-w-sm p-6">
        <h1 className="mb-5 text-h2 font-semibold text-ink">Yangi Foydalanuvchi Qoʻshish</h1>

        {msg && (
          <Alert tone={ok ? "ok" : "bad"} className="mb-4">
            {msg}
          </Alert>
        )}

        <form onSubmit={handleCreateUser} className="space-y-4">
          <Field label="Email (Login)" htmlFor="admin-email">
            <Input
              id="admin-email"
              type="email"
              required
              autoComplete="off"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>

          <Field label="Parol" htmlFor="admin-password">
            <Input
              id="admin-password"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>

          <Field label="Huquqi (Role)" htmlFor="admin-role">
            <Select id="admin-role" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="user">Oddiy xodim</option>
              <option value="admin">Admin / Superuser</option>
            </Select>
          </Field>

          <Button type="submit" variant="primary" block loading={loading}>
            {loading ? "Yaratilmoqda..." : "Foydalanuvchini Faollashtirish"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
