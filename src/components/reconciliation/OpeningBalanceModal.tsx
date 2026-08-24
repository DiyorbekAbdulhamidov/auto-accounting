// ============================================================
// BOSHLANG'ICH QOLDIQ OYNASI (сальдо начальное)
// ------------------------------------------------------------
// Ikkala sverka uchun bitta. Nima uchun kerakligi va manbalari
// `src/lib/openingBalance.ts` boshida yozilgan.
//
// UCH QAROR:
//
// 1. Ro'yxat EKRANDAGI kontragentlardan tuziladi. Sabab: qoldiq
//    kalitini qo'lda yozib bo'lmaydi (u STIR yoki `NAME:` bo'ladi),
//    ya'ni fayl yuklanmagan holda kiritish xato kalit berardi.
//
// 2. Nol qiymat SAQLANMAYDI. «0» va «kiritilmagan» — bir xil ma'no,
//    ikkitasini ajratish foydalanuvchiga hech narsa bermaydi,
//    hujjatni esa shishiradi.
//
// 3. Sana MAJBURIY. Qoldiq qaysi kundagi holat ekani aytilmasa,
//    raqam ma'nosini yo'qotadi — buxgalter uni tekshira olmaydi.
// ============================================================
"use client";

import { useMemo, useState } from "react";
import { CalendarClock } from "lucide-react";
import { useT } from "@/context/LanguageContext";
import { parseBalanceInput } from "@/lib/openingBalance";
import {
  Button,
  Code,
  Field,
  Input,
  Modal,
  SearchInput,
  notify,
} from "@/components/ui";

export interface BalanceRow {
  key: string;
  name: string;
  inn: string;
}

export default function OpeningBalanceModal({
  open,
  onClose,
  rows,
  balances,
  asOf,
  format,
  saving,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  /** Ekrandagi kontragentlar (asosiy sverka kesimi) */
  rows: BalanceRow[];
  balances: Record<string, number>;
  asOf: string;
  format: (n: number) => string;
  saving: boolean;
  onSave: (asOf: string, balances: Record<string, number>) => void;
}) {
  const t = useT();
  // Matn holicha saqlanadi: raqamga aylantirish faqat saqlashda
  // bo'ladi, aks holda «-» yozayotgan odamning kiritishi uzilardi.
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [draftDate, setDraftDate] = useState(asOf);
  const [search, setSearch] = useState("");
  const [touched, setTouched] = useState(false);

  // Oyna ochilganda saqlangan qiymatlardan boshlanadi
  const initial = useMemo(() => {
    const out: Record<string, string> = {};
    for (const r of rows) {
      const v = balances[r.key];
      out[r.key] = v === undefined ? "" : String(v);
    }
    return out;
  }, [rows, balances]);

  const value = touched ? draft : initial;
  const dateValue = touched ? draftDate : asOf;

  const setOne = (key: string, raw: string) => {
    if (!touched) {
      setDraft({ ...initial, [key]: raw });
      setDraftDate(asOf);
      setTouched(true);
    } else {
      setDraft((p) => ({ ...p, [key]: raw }));
    }
  };

  const setDate = (raw: string) => {
    if (!touched) {
      setDraft(initial);
      setTouched(true);
    }
    setDraftDate(raw);
  };

  const shown = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return rows;
    return rows.filter(
      (r) => r.name.toLowerCase().includes(q) || r.inn.includes(q)
    );
  }, [rows, search]);

  const filled = useMemo(
    () => Object.values(value).filter((v) => Math.abs(parseBalanceInput(v)) > 0.005).length,
    [value]
  );
  const total = useMemo(
    () => Object.values(value).reduce((a, v) => a + parseBalanceInput(v), 0),
    [value]
  );

  const submit = () => {
    if (!dateValue) {
      notify.warn(t("Қолдиқ санасини киритинг"));
      return;
    }
    const out: Record<string, number> = {};
    for (const [k, v] of Object.entries(value)) {
      const n = parseBalanceInput(v);
      if (Math.abs(n) > 0.005) out[k] = n;
    }
    onSave(dateValue, out);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("Бошланғич қолдиқ")}
      hint={t("Файл бошланишидан ОЛДИНГИ давр қолдиғи. Мусбат — улар қарздор, манфий — биз қарздормиз.")}
      icon={<CalendarClock className="h-5 w-5" />}
      width="max-w-3xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t("Бекор қилиш")}
          </Button>
          <Button variant="primary" onClick={submit} loading={saving} disabled={saving}>
            {saving ? t("Сақланмоқда...") : t("Сақлаш")}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field
          label={t("Қолдиқ санаси")}
          hint={t("Одатда — юкланган давр бошланишидан бир кун олдин")}
          htmlFor="balance-asof"
        >
          <Input
            id="balance-asof"
            type="date"
            value={dateValue}
            onChange={(e) => setDate(e.target.value)}
          />
        </Field>

        <SearchInput
          placeholder={t("Фирма номи ёки СТИР бўйича қидирув...")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="rounded-lg border border-line">
          {shown.length === 0 ? (
            <p className="p-6 text-center text-caption text-ink-3">
              {t("Маълумот топилмади... 🕵️‍♂️")}
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {shown.map((r) => (
                <li key={r.key} className="flex items-center gap-3 px-3 py-2">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-body text-ink">{r.name}</span>
                    {r.inn && r.inn !== "-" && <Code className="mt-0.5">{r.inn}</Code>}
                  </span>
                  <Input
                    className="w-44 text-right tabular"
                    inputMode="decimal"
                    placeholder="0,00"
                    value={value[r.key] ?? ""}
                    onChange={(e) => setOne(r.key, e.target.value)}
                    aria-label={`${r.name} — ${t("Бошланғич қолдиқ")}`}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="text-caption text-ink-3">
          {t("Киритилди")}: <b className="text-ink-2">{filled}</b> / {rows.length} ·{" "}
          {t("Жами")}: <span className="tabular text-ink-2">{format(total)}</span>
        </p>
      </div>
    </Modal>
  );
}
