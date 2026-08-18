// ============================================================
// YOPILMAGAN FAKTURALAR — «qaysi hujjat yetishmayapti»
// ------------------------------------------------------------
// Bu — dunyo standartidagi eng muhim narsa (docs/TAHLIL, 1-band).
// Ilgari buxgalter «bu firmada 12 450 000 farq bor» degan raqamni
// olardi va QAYSI faktura yopilmaganini o'zi qidirardi.
//
// Ma'lumot ALLAQACHON hisoblangan: `src/lib/aging.ts` to'lovlarni
// FIFO bilan eng eski fakturadan boshlab yopib chiqadi va har
// fakturaning qolgan qoldig'ini beradi. Bu komponent shuni
// KO'RSATADI — yangi hisob YO'Q.
//
// Ikkala sverkada ham ishlaydi: kirimda «bizga to'lanmagan
// faktura», chiqimda «biz to'lamagan faktura». Farqi faqat
// sarlavhada, shuning uchun u proп bo'lib keladi.
// ============================================================
"use client";

import { useT } from "@/context/LanguageContext";
import { BUCKET_KEYS, type AgingOpenInvoice, type BucketKey } from "@/lib/aging";
import {
  Table,
  TableFrame,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  NumTd,
  cx,
  toneText,
  type Tone,
} from "@/components/ui";

/** Yosh oshgani sayin rang «yaxshi»dan «yomon»ga o'tadi */
const BUCKET_TONE: Record<BucketKey, Tone> = {
  d0_30: "ok",
  d31_60: "warn",
  d61_90: "warn",
  d90plus: "bad",
  noDate: "muted",
};

export default function OpenInvoices({
  invoices,
  format,
  title,
  emptyText,
}: {
  invoices: AgingOpenInvoice[];
  format: (n: number) => string;
  /** «Ёпилмаган фактуралар» — modulga qarab matni boshqa bo'ladi */
  title: string;
  emptyText: string;
}) {
  const t = useT();

  if (invoices.length === 0) {
    return (
      <div className="rounded-lg border border-line bg-surface p-4 text-caption text-ok">
        ✓ {emptyText}
      </div>
    );
  }

  // Eng ESKISI birinchi: buxgalter ishni shundan boshlaydi
  const sorted = [...invoices].sort((a, b) => {
    if (a.days === null) return 1;
    if (b.days === null) return -1;
    return b.days - a.days;
  });
  const total = sorted.reduce((s, i) => s + i.outstanding, 0);

  return (
    <div>
      <h3 className="mb-2 text-caption font-semibold text-ink-2">
        {title} ({sorted.length}) — <span className="tabular">{format(total)}</span>
      </h3>
      <TableFrame>
        <Table>
          <Thead>
            <tr>
              <Th>{t("Сана")}</Th>
              <Th>{t("Ҳужжат")}</Th>
              <Th align="right">{t("Сумма")}</Th>
              <Th align="right">{t("Ёпилган")}</Th>
              <Th align="right">{t("Қолдиқ")}</Th>
              <Th align="center">{t("Ёши")}</Th>
            </tr>
          </Thead>
          <Tbody>
            {sorted.map((inv, i) => (
              <Tr key={`${inv.number}-${i}`}>
                <Td>{fmtDate(inv.date)}</Td>
                <Td main>{inv.number || "—"}</Td>
                <NumTd tone="invoice">{format(inv.amount)}</NumTd>
                <NumTd tone={inv.paid > 0 ? "cash" : "muted"}>
                  {inv.paid > 0 ? format(inv.paid) : "—"}
                </NumTd>
                <NumTd tone="bad" strong>
                  {format(inv.outstanding)}
                </NumTd>
                <Td align="center" className="whitespace-nowrap text-caption">
                  {inv.days === null ? (
                    <span className="text-ink-3">{t("Сансиз")}</span>
                  ) : (
                    <span className={cx("font-medium", toneText[BUCKET_TONE[inv.bucket]])}>
                      {inv.days} {t("кун")}
                    </span>
                  )}
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableFrame>
      <p className="mt-1.5 text-caption text-ink-3">
        {t("Тўловлар энг эски фактурадан бошлаб ёпилади (FIFO). Қисман ёпилган фактура ҳам шу рўйхатда — қолдиғи билан.")}
      </p>
    </div>
  );
}

function fmtDate(iso: string | null): string {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

export { BUCKET_KEYS };
