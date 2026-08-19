// ============================================================
// ISH MAYDONI A'ZOLARI
// ------------------------------------------------------------
// «Бюро» rejasi 5 foydalanuvchi va'da qiladi, lekin odam qo'shish
// yo'li umuman yo'q edi — ya'ni o'sha rejani sotib bo'lmasdi.
//
// Taklif PAROLSIZ: ega email YOKI telefon raqamini kiritadi, taklif
// qilingan odam esa odatdagidek ro'yxatdan o'tadi (email bilan ham,
// SMS bilan ham) va O'ZI ish maydoniga tushadi.
//
// NEGA TELEFON HAM: hisob kaliti email bo'lmasa telefon bo'ladi. Ya'ni
// SMS bilan kiradigan odamni EMAIL bilan taklif qilib bo'lmaydi — uning
// kaliti `+998...`, taklif esa email ustiga yozilgan bo'lardi va u
// kirganda o'ziga ALOHIDA ish maydoni ochilib ketardi. Jimgina.
// Sabab `src/app/api/workspace/members/route.ts` da yozilgan.
//
// Parol bu yerda HECH QACHON ko'rilmaydi va yaratilmaydi.
// ============================================================
"use client";

import { useCallback, useEffect, useState } from "react";
import { Mail, Phone, UserPlus, X } from "lucide-react";
import { useT } from "@/context/LanguageContext";
import { authFetch } from "@/lib/authFetch";
import { formatPhone } from "@/lib/phone";
import {
  Alert,
  Badge,
  Button,
  Input,
  Modal,
  Spinner,
  notify,
} from "@/components/ui";

interface Member {
  /** Email yoki telefon (E.164) — server bilan bir xil nom */
  key: string;
  role: string;
  status: string;
}

/** Telefon kaliti `+` bilan boshlanadi — ekranda bo'shliqli ko'rsatiladi */
const isPhoneKey = (key: string) => key.startsWith("+");
const showKey = (key: string) => (isPhoneKey(key) ? formatPhone(key) : key);

interface MembersResponse {
  success?: boolean;
  error?: string;
  members?: Member[];
  isOwner?: boolean;
  planLabel?: string;
  limit?: number;
  current?: number;
  limitReached?: boolean;
}

export default function TeamModal({
  open,
  onClose,
  onNeedMore,
}: {
  open: boolean;
  onClose: () => void;
  /** Cheklovga yetganda — «Кўпроқ керак» bilan bir xil yo'l */
  onNeedMore?: () => void;
}) {
  const t = useT();
  const [data, setData] = useState<MembersResponse | null>(null);
  // Boshlang'ich qiymat `true`: effekt ichida setState'ni SINXRON
  // chaqirish kaskadli qayta chizishga olib keladi (React qoidasi).
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await authFetch("/api/workspace/members");
      const json = (await res.json()) as MembersResponse;
      if (!res.ok) {
        setError(String(json?.error || res.status));
        setData(null);
        return;
      }
      setError("");
      setData(json);
    } catch (err) {
      console.error("A'zolar ro'yxatini o'qishda xatolik:", err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    // Har ochilganda qayta o'qiladi: boshqa qurilmada a'zo qo'shilgan
    // bo'lishi mumkin. Ro'yxat kichkina (rejada ko'pi bilan 5 ta).
    (async () => {
      await load();
      if (!alive) return;
    })();
    return () => {
      alive = false;
    };
  }, [open, load]);

  const send = async (body: Record<string, unknown>): Promise<MembersResponse | null> => {
    setBusy(true);
    setError("");
    try {
      const res = await authFetch("/api/workspace/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as MembersResponse;
      if (!res.ok) {
        setError(String(json?.error || res.status));
        return json;
      }
      return json;
    } catch (err) {
      console.error("A'zoni saqlashda xatolik:", err);
      setError(err instanceof Error ? err.message : String(err));
      return null;
    } finally {
      setBusy(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    // Kichik harfga O'TKAZILMAYDI: telefon raqamida ma'nosi yo'q, email
    // esa serverda baribir kichiklashtiriladi (kalit qoidasi bitta joyda).
    const value = email.trim();
    if (!value) return;
    const res = await send({ action: "invite", key: value });
    if (!res?.success) return;
    setEmail("");
    notify.ok(
      t("Таклиф қилинди"),
      t("Шу email ёки телефон билан рўйхатдан ўтганда — иш майдонингизга тушади.")
    );
    await load();
  };

  const handleRemove = async (member: Member) => {
    if (!confirm(`${showKey(member.key)} — ${t("иш майдонидан чиқарилсинми?")}`)) return;
    const res = await send({ action: "remove", key: member.key });
    if (!res?.success) return;
    notify.ok(t("Чиқарилди"), t("Бу одам энди сизнинг маълумотингизни кўрмайди."));
    await load();
  };

  const members = data?.members || [];
  /* ЧЕКЛОВ: `null` = ЧЕКСИЗ.
     ------------------------------------------------------------
     Сервер `limitsOf()` дан `Infinity` олади, лекин `JSON.stringify(Infinity)`
     — бу `"null"`. Яъни чексизлик симда ЙЎҚОЛАДИ ва клиентга `null` етиб
     келади. Илгари бу ерда `?? 1` турарди: `??` айнан `null` ни ушлайди,
     шунинг учун БЕПУЛ ДАВРДА ҳам ҳамма «1 / 1» кўриб, ҳеч кимни таклиф
     қила олмасди — сервер эса ўша сўровни бемалол қабул қиларди.
     `null` = чексиз келишуви `/api/companies` да ҳам шундай. */
  const limit = data ? (data.limit ?? Infinity) : 1;
  const full = members.length >= limit;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("Иш майдони аъзолари")}
      hint={t("Аъзо сизнинг барча корхонангизни ва сверкаларингизни кўради.")}
      icon={<UserPlus className="h-5 w-5" />}
      width="max-w-lg"
      footer={
        <div className="flex items-center justify-between gap-3">
          <span className="text-caption text-ink-3">
            {data?.planLabel && (
              <>
                «{t(data.planLabel)}» · {members.length} / {Number.isFinite(limit) ? limit : "∞"}
              </>
            )}
          </span>
          <Button variant="ghost" onClick={onClose}>
            {t("Ёпиш")}
          </Button>
        </div>
      }
    >
      {loading && !data ? (
        <div className="flex items-center gap-2 py-6 text-body text-ink-3">
          <Spinner className="h-5 w-5 text-accent-ink" />
          {t("Маълумотлар юкланмоқда...")}
        </div>
      ) : (
        <div className="space-y-4">
          {error && <Alert tone="bad">{t(error)}</Alert>}

          <ul className="divide-y divide-line rounded-lg border border-line">
            {members.map((m) => (
              <li key={m.key} className="flex items-center gap-2 px-3 py-2.5">
                {isPhoneKey(m.key) ? (
                  <Phone className="h-4 w-4 shrink-0 text-ink-3" />
                ) : (
                  <Mail className="h-4 w-4 shrink-0 text-ink-3" />
                )}
                <span className="min-w-0 flex-1 truncate text-body text-ink">
                  {showKey(m.key)}
                </span>
                {m.role === "owner" ? (
                  <Badge tone="ok">{t("эга")}</Badge>
                ) : m.status === "invited" ? (
                  <Badge tone="warn">{t("рўйхатдан ўтмаган")}</Badge>
                ) : (
                  <Badge tone="muted">{t("аъзо")}</Badge>
                )}
                {data?.isOwner && m.role !== "owner" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    iconOnly
                    title={t("Чиқариш")}
                    loading={busy}
                    onClick={() => handleRemove(m)}
                    icon={<X className="h-4 w-4" />}
                  />
                )}
              </li>
            ))}
          </ul>

          {!data?.isOwner ? (
            <Alert tone="info">
              {t("Аъзоларни фақат иш майдони эгаси бошқаради.")}
            </Alert>
          ) : full ? (
            // Cheklovga yetganda qizil xato EMAS — tushuntirish va yo'l.
            // 2026-08-18 dagi qaror: cheklov «yo'q» demaydi, «qanday
            // ochish mumkin» deydi.
            <div className="space-y-2 rounded-lg border border-line bg-surface-2 p-4">
              <p className="text-body text-ink">
                {t("Режа чекловига етдингиз")} — {members.length} / {limit}
              </p>
              <p className="text-caption text-ink-3">
                {t("Кўпроқ фойдаланувчи керак бўлса — бизга айтинг, режани очамиз.")}
              </p>
              {onNeedMore && (
                <Button variant="primary" size="sm" onClick={onNeedMore}>
                  {t("Кўпроқ керак")}
                </Button>
              )}
            </div>
          ) : (
            <form onSubmit={handleInvite} className="space-y-2">
              <div className="flex gap-2">
                <Input
                  // `type="email"` EMAS: brauzer telefon raqamini rad etardi
                  // va shakl umuman yuborilmasdi. Tekshiruv serverda.
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("hamkasb@example.com ёки 90 123 45 67")}
                  autoComplete="off"
                  required
                />
                <Button
                  type="submit"
                  variant="primary"
                  loading={busy}
                  disabled={!email.trim()}
                  icon={<UserPlus className="h-4 w-4" />}
                >
                  {t("Таклиф қилиш")}
                </Button>
              </div>
              <p className="text-caption text-ink-3">
                {t("Парол керак эмас: шу email ёки телефон билан рўйхатдан ўтса — ўзи иш майдонингизга тушади. SMS билан кирадиган ҳамкасбни ТЕЛЕФОН рақами билан таклиф қилинг.")}
              </p>
            </form>
          )}
        </div>
      )}
    </Modal>
  );
}
