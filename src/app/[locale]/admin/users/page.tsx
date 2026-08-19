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
    <div className={`${layout.page} flex flex-wrap items-start justify-center gap-6 px-4 py-10`}>
      <PlanCard />

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

/* ============================================================
   REJANI QO'LDA QO'YISH
   ------------------------------------------------------------
   Nega kerak: `workspaces/{id}.plan` ga kod faqat `'free'` yozadi.
   Bepul davr (1-noyabr) tugagach hamma 3 korxona / 1 foydalanuvchi
   chekloviga qaytadi va uni ko'tarish yo'li YO'Q edi — 12 mijozli
   buxgalter 13-chisini qo'sha olmay qolardi va to'lay ham olmasdi.

   Bu TO'LOV TIZIMI EMAS: pul qo'lda (Click) olinadi, keyin reja shu
   yerdan qo'yiladi. Click integratsiyasi kelganda u ham aynan shu
   maydonni yozadi.

   Ikki qadam ATAYLAB: avval «Tekshirish» holatni ko'rsatadi (nechta
   korxona, nechta a'zo, hozirgi reja), keyingina o'zgartiriladi.
   Aks holda admin noto'g'ri emailga reja qo'yib, buni sezmasdi.
   ============================================================ */

interface PlanState {
  key: string;
  workspaceId: string;
  plan: string;
  planLabel: string;
  priceUzs: number;
  companies: number;
  members: number;
  /** `null` — cheksiz (JSON `Infinity` ni saqlay olmaydi) */
  planLimits: { companies: number | null; members: number | null };
  effectiveLimits: { companies: number | null; members: number | null };
  promoActive: boolean;
  promoUntil: string;
}

const PLAN_OPTIONS = [
  { value: "free", label: "Bepul — 3 korxona, 1 foydalanuvchi" },
  { value: "buxgalter", label: "Buxgalter — cheksiz korxona, 1 foydalanuvchi (9 999)" },
  { value: "byuro", label: "Byuro — cheksiz korxona, 5 foydalanuvchi (39 999)" },
];

const limitText = (n: number | null) => (n === null ? "cheksiz" : String(n));

function PlanCard() {
  const [key, setKey] = useState("");
  const [state, setState] = useState<PlanState | null>(null);
  const [plan, setPlan] = useState("buxgalter");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [ok, setOk] = useState(false);

  const call = async (url: string, init?: RequestInit) => {
    setBusy(true);
    setMsg("");
    try {
      const res = await authFetch(url, init);
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        setOk(false);
        setMsg(data.error || `Xatolik (HTTP ${res.status})`);
        return null;
      }
      return data as PlanState & { previousPlan?: string };
    } catch {
      setOk(false);
      setMsg("Serverga ulanib bo'lmadi.");
      return null;
    } finally {
      setBusy(false);
    }
  };

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    setState(null);
    const data = await call(`/api/admin/plan?key=${encodeURIComponent(key.trim())}`);
    if (!data) return;
    setState(data);
    setPlan(data.plan === "free" ? "buxgalter" : data.plan);
  };

  const handleApply = async () => {
    const data = await call("/api/admin/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: state?.key, plan, note }),
    });
    if (!data) return;
    setState(data);
    setNote("");
    setOk(true);
    setMsg(
      `Reja qo'yildi: ${data.previousPlan} → ${data.plan}. ` +
        `Endi korxona: ${limitText(data.planLimits.companies)}, ` +
        `foydalanuvchi: ${limitText(data.planLimits.members)}.`
    );
  };

  return (
    <Card className="w-full max-w-sm p-6">
      <h2 className="mb-1 text-h2 font-semibold text-ink">Rejani qo&apos;yish</h2>
      <p className="mb-5 text-caption text-ink-3">
        To&apos;lov qabul qilingandan keyin foydalanuvchining rejasini shu yerdan ko&apos;taring.
      </p>

      {msg && (
        <Alert tone={ok ? "ok" : "bad"} className="mb-4">
          {msg}
        </Alert>
      )}

      <form onSubmit={handleCheck} className="space-y-4">
        <Field label="Email yoki telefon" htmlFor="plan-key">
          <Input
            id="plan-key"
            required
            autoComplete="off"
            placeholder="buxgalter@firma.uz yoki +998901234567"
            value={key}
            onChange={(e) => setKey(e.target.value)}
          />
        </Field>
        <Button type="submit" variant="secondary" block loading={busy}>
          Tekshirish
        </Button>
      </form>

      {state && (
        <div className="mt-5 space-y-4 border-t border-line pt-5">
          <dl className="space-y-1.5 text-body">
            <div className="flex justify-between gap-3">
              <dt className="text-ink-3">Ish maydoni</dt>
              <dd className="truncate font-medium text-ink">{state.workspaceId}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ink-3">Hozirgi reja</dt>
              <dd className="font-medium text-ink">
                {state.plan} · korxona {limitText(state.planLimits.companies)} · foydalanuvchi{" "}
                {limitText(state.planLimits.members)}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ink-3">Hozir bor</dt>
              <dd className="font-medium text-ink">
                {state.companies} korxona · {state.members} foydalanuvchi
              </dd>
            </div>
          </dl>

          {state.promoActive && (
            // Admin «qo'ydim, lekin hech narsa o'zgarmadi» deb hayron
            // bo'lmasligi uchun: bepul davrda cheklov baribir cheksiz.
            <Alert tone="info">
              Bepul davr davom etmoqda ({`${state.promoUntil.slice(0, 10)} gacha`}) — hozir cheklov
              hammada cheksiz. Qo&apos;yilgan reja o&apos;sha sanadan keyin kuchga kiradi.
            </Alert>
          )}

          <Field label="Yangi reja" htmlFor="plan-value">
            <Select id="plan-value" value={plan} onChange={(e) => setPlan(e.target.value)}>
              {PLAN_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Izoh (ixtiyoriy)" htmlFor="plan-note">
            <Input
              id="plan-note"
              placeholder="Masalan: Click orqali 9 999 so'm, 19.08.2026"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </Field>

          <Button
            type="button"
            variant="primary"
            block
            loading={busy}
            disabled={busy || plan === state.plan}
            onClick={handleApply}
          >
            {plan === state.plan ? "Reja allaqachon shunday" : "Rejani qo'yish"}
          </Button>
        </div>
      )}
    </Card>
  );
}
