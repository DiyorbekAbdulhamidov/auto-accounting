// ============================================================
// KONTRAGENTLARNI BIRLASHTIRISH OYNASI
// ------------------------------------------------------------
// Ikkala sverkada ham bir xil ishlaydi.
//
// Nega ALOHIDA oyna, jadvaldagi belgilash (ptichka) emas: jadvaldagi
// belgilash «qaysi firma saqlansin/eksport qilinsin» degani. O'sha
// belgilashga «birlashtirish» tugmasini qo'shsak, 40 ta firma
// belgilangan holatda bir bosishda hammasi qo'shilib ketardi.
//
// Taklif HECH QACHON o'zi qo'llanmaydi — u faqat «shu ikkitasiga
// qarang» deydi. Ikki HAR XIL firmani jimgina bir qilib qo'yish
// soxta farqdan ham qimmatroq xato.
// ============================================================
"use client";

import { useMemo, useState } from "react";
import { Merge, Split } from "lucide-react";
import { useT } from "@/context/LanguageContext";
import { authFetch } from "@/lib/authFetch";
import type { MergeGroup, MergeSide, MergeSuggestion } from "@/lib/counterpartyMerge";
import {
  Alert,
  Badge,
  Button,
  Code,
  Modal,
  RowCheckbox,
  SearchInput,
  cx,
  notify,
} from "@/components/ui";

/** Oynaga kerak bo'lgan minimal qator — ikkala sverkaning shakli
 *  boshqacha, shuning uchun ota komponent moslashtiradi. */
export interface MergeRow {
  key: string;
  inn: string;
  name: string;
  /** Ro'yxatda ko'rsatiladigan aylanma (debet + kredit) */
  turnover: number;
  /** Qaysi kalitlardan yig'ilgani — birlashtirilgan qatorlarda bor */
  mergedFrom?: string[];
}

export default function MergeModal({
  open,
  onClose,
  companyId,
  side,
  rows,
  groups,
  suggestions,
  format,
  onMerged,
  onUnmerged,
}: {
  open: boolean;
  onClose: () => void;
  companyId: string;
  side: MergeSide;
  rows: MergeRow[];
  groups: MergeGroup[];
  suggestions: MergeSuggestion[];
  format: (n: number) => string;
  /** Saqlangandan keyin: jadval DARHOL yangilanadi (fayl qayta
   *  yuklanmaydi — birlashtirish mantig'i klientda ham bir xil). */
  onMerged: (group: MergeGroup) => void;
  onUnmerged: (primary: string) => void;
}) {
  const t = useT();
  const [search, setSearch] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [primary, setPrimary] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const byKey = useMemo(() => new Map(rows.map((r) => [r.key, r])), [rows]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q
      ? rows.filter((r) => r.name.toLowerCase().includes(q) || r.inn.includes(q))
      : rows;
    // Aylanmasi kattasi tepada — buxgalter avval kattasini tekshiradi
    return [...list].sort((a, b) => b.turnover - a.turnover).slice(0, 200);
  }, [rows, search]);

  const toggle = (key: string) => {
    setPicked((prev) => {
      const next = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key];
      // Asosiy qator har doim tanlanganlar ichida bo'lsin
      setPrimary((p) => {
        if (next.length === 0) return null;
        if (p && next.includes(p)) return p;
        // Standart: aylanmasi eng katta qator. Uning nomi va STIRi
        // birlashgan qatorga o'tadi.
        return next.reduce((best, k) =>
          (byKey.get(k)?.turnover || 0) > (byKey.get(best)?.turnover || 0) ? k : best
        );
      });
      return next;
    });
  };

  const send = async (body: Record<string, unknown>): Promise<boolean> => {
    setBusy(true);
    try {
      const res = await authFetch("/api/counterparty-merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId, side, ...body }),
      });
      const data = await res.json();
      if (!res.ok) {
        notify.error(t("Сақлашда хатолик юз берди."), String(data?.error || res.status));
        return false;
      }
      return true;
    } catch (err) {
      console.error("Birlashtirishda xatolik:", err);
      notify.error(
        t("Сақлашда хатолик юз берди."),
        err instanceof Error ? err.message : String(err)
      );
      return false;
    } finally {
      setBusy(false);
    }
  };

  const doMerge = async (keys: string[], primaryKey: string) => {
    const members = keys.filter((k) => k !== primaryKey);
    if (members.length === 0) return;
    const okDone = await send({ primary: primaryKey, members });
    if (!okDone) return;
    onMerged({ primary: primaryKey, members, side });
    setPicked([]);
    setPrimary(null);
    notify.ok(
      t("Бирлаштирилди"),
      `${members.length + 1} ${t("та қатор битта контрагентга йиғилди")}`
    );
  };

  const doUnmerge = async (primaryKey: string) => {
    const okDone = await send({ action: "unmerge", primary: primaryKey });
    if (!okDone) return;
    onUnmerged(primaryKey);
    notify.ok(
      t("Ажратилди"),
      t("Жадвал файлларни қайта юклаганда алоҳида кўринади.")
    );
  };

  const nameOf = (key: string) => byKey.get(key)?.name || key;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("Контрагентларни бирлаштириш")}
      hint={t("Битта фирма икки хил ёзилган бўлса — қаторларни қўшинг. Йиғинди ўзгармайди.")}
      icon={<Merge className="h-5 w-5" />}
      width="max-w-3xl"
      footer={
        <div className="flex items-center justify-between gap-3">
          <span className="text-caption text-ink-3">
            {picked.length > 0
              ? `${picked.length} ${t("та танланди")}${primary ? ` · ${t("асосий")}: ${nameOf(primary)}` : ""}`
              : t("Камида иккита қаторни белгиланг")}
          </span>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>
              {t("Ёпиш")}
            </Button>
            <Button
              variant="primary"
              icon={<Merge className="h-4 w-4" />}
              loading={busy}
              disabled={picked.length < 2 || !primary}
              onClick={() => primary && doMerge(picked, primary)}
            >
              {t("Бирлаштириш")}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* ---- ТАКЛИФЛАР ---- */}
        {suggestions.length > 0 && (
          <div className="space-y-2">
            <p className="text-caption font-medium text-ink-2">
              {t("Ўхшаш деб топилганлар")} ({suggestions.length})
            </p>
            <Alert tone="info">
              {t("Тизим ўзи бирлаштирмайди — фақат кўрсатади. Тасдиқлашдан олдин СТИР ва номни солиштиринг.")}
            </Alert>
            <ul className="space-y-2">
              {suggestions.slice(0, 12).map((s) => (
                <li
                  key={s.keys.join("|")}
                  className="flex flex-wrap items-center gap-2 rounded-md border border-line bg-surface-2 p-3"
                >
                  <Badge tone={s.reason === "inn" ? "ok" : "warn"}>
                    {s.reason === "inn" ? t("бир хил СТИР") : t("ўхшаш ном")}
                  </Badge>
                  <span className="text-caption text-ink-2">{s.names.join("  ·  ")}</span>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="ml-auto"
                    loading={busy}
                    onClick={() => {
                      // Asosiy — aylanmasi eng kattasi
                      const best = s.keys.reduce((a, b) =>
                        (byKey.get(a)?.turnover || 0) >= (byKey.get(b)?.turnover || 0) ? a : b
                      );
                      doMerge(s.keys, best);
                    }}
                  >
                    {t("Бирлаштириш")}
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ---- АЛЛАҚАЧОН БИРЛАШТИРИЛГАНЛАР ---- */}
        {groups.length > 0 && (
          <div className="space-y-2">
            <p className="text-caption font-medium text-ink-2">
              {t("Бирлаштирилганлар")} ({groups.length})
            </p>
            <ul className="space-y-1.5">
              {groups.map((g) => (
                <li
                  key={g.primary}
                  className="flex flex-wrap items-center gap-2 rounded-md border border-line p-2.5"
                >
                  <span className="text-caption text-ink">{g.name || nameOf(g.primary)}</span>
                  <span className="text-caption text-ink-3">
                    + {g.members.length} {t("та қатор")}
                  </span>
                  {g.updatedBy && (
                    <span className="text-caption text-ink-3" title={g.updatedAt || ""}>
                      · {t("Ўзгартирган")}: {g.updatedBy}
                    </span>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="ml-auto"
                    icon={<Split className="h-3.5 w-3.5" />}
                    loading={busy}
                    onClick={() => doUnmerge(g.primary)}
                  >
                    {t("Ажратиш")}
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ---- ҚЎЛДА ТАНЛАШ ---- */}
        <div className="space-y-2">
          <SearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("Контрагент номи ёки СТИР бўйича қидирув...")}
          />
          <div className="custom-scrollbar max-h-72 overflow-y-auto rounded-lg border border-line">
            <ul className="divide-y divide-line">
              {visible.map((r) => {
                const isPicked = picked.includes(r.key);
                return (
                  <li
                    key={r.key}
                    className={cx(
                      "flex items-center gap-3 px-3 py-2 transition-colors",
                      isPicked ? "bg-accent-soft" : "hover:bg-surface-2"
                    )}
                  >
                    <RowCheckbox checked={isPicked} onChange={() => toggle(r.key)} label={r.name} />
                    <button
                      type="button"
                      onClick={() => toggle(r.key)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <span className="block truncate text-body text-ink">{r.name}</span>
                      <span className="text-caption text-ink-3">
                        {r.inn && r.inn !== "-" ? <Code>{r.inn}</Code> : t("СТИРсиз")}
                        {r.mergedFrom && r.mergedFrom.length > 1 && (
                          <>
                            {" "}
                            <Badge tone="info">
                              {t("бирлаштирилган")} ({r.mergedFrom.length})
                            </Badge>
                          </>
                        )}
                      </span>
                    </button>
                    {isPicked && (
                      <label className="flex shrink-0 cursor-pointer items-center gap-1.5 text-caption text-ink-2">
                        <input
                          type="radio"
                          name="merge-primary"
                          checked={primary === r.key}
                          onChange={() => setPrimary(r.key)}
                          className="accent-accent"
                        />
                        {t("асосий")}
                      </label>
                    )}
                    <span className="shrink-0 tabular text-caption text-ink-3">
                      {format(r.turnover)}
                    </span>
                  </li>
                );
              })}
              {visible.length === 0 && (
                <li className="px-3 py-6 text-center text-caption text-ink-3">
                  {t("Ҳеч нарса топилмади")}
                </li>
              )}
            </ul>
          </div>
          {rows.length > 200 && (
            <p className="text-caption text-ink-3">
              {t("Рўйхатда энг катта 200 та кўрсатилди — қолганини қидирув орқали топинг.")}
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
}
