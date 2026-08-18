// ============================================================
// SAQLANGAN HISOBOTLAR RO'YXATI
// ------------------------------------------------------------
// Ikkala sverkada ham bir xil ishlaydi.
//
// Uch qaror:
//
//  1. YANGI SO'ROV YO'Q. Ro'yxat ota komponent allaqachon yuklab
//     olgan snapshot'dan tuziladi. Ya'ni bu ekran Firestore'dan
//     bitta ham qo'shimcha o'qish talab qilmaydi.
//
//  2. YOPIQ TURADI. Sahifa ochilganda faqat bitta qator ko'rinadi
//     («N та сақланган ҳисобот»). Jadval BEKITILMAYDI va yangi
//     majburiy qadam qo'shilmaydi — 2026-08-18 dagi qoida.
//
//  3. O'CHIRISH SHU YERDA. Aks holda kolleksiya cheksiz o'sadi:
//     har «Сақлаш» yangi hujjat, har biri 900 KB gacha, va tiklash
//     so'rovi ularning HAMMASINI yuklab oladi.
// ============================================================
"use client";

import { useState } from "react";
import { ChevronDown, History, Trash2 } from "lucide-react";
import { useT } from "@/context/LanguageContext";
import {
  deleteReport,
  formatStamp,
  HISTORY_SOFT_LIMIT,
  type ReportKind,
  type ReportSummary,
} from "@/lib/reportHistory";
import {
  Alert,
  Badge,
  Button,
  NumTd,
  Table,
  TableFrame,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  cx,
  notify,
} from "@/components/ui";

export default function ReportHistory({
  kind,
  items,
  activeId,
  onOpen,
  onDeleted,
  format,
}: {
  kind: ReportKind;
  items: ReportSummary[];
  /** Hozir ekranda turgan hisobot. Fayldan yuklangan bo'lsa `null`. */
  activeId: string | null;
  onOpen: (id: string) => void;
  onDeleted: (id: string) => void;
  format: (n: number) => string;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  if (items.length === 0) return null;

  const handleDelete = async (item: ReportSummary) => {
    const when = formatStamp(item.savedAt);
    if (!confirm(`${when} — ${t("сақланган ҳисоботни ўчирасизми? Бу амални қайтариб бўлмайди.")}`)) {
      return;
    }
    setBusyId(item.id);
    try {
      await deleteReport(kind, item.id);
      onDeleted(item.id);
      notify.ok(t("Ҳисобот ўчирилди"));
    } catch (err) {
      console.error("Hisobotni o'chirishda xatolik:", err);
      notify.error(
        t("Ўчириб бўлмади, қайта уриниб кўринг."),
        err instanceof Error ? err.message : String(err)
      );
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="rounded-lg border border-line bg-surface-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-caption text-ink-2 transition-colors hover:text-ink"
        aria-expanded={open}
      >
        <History className="h-4 w-4 shrink-0 text-ink-3" />
        <span className="font-medium">
          {items.length} {t("та сақланган ҳисобот")}
        </span>
        <span className="text-ink-3">
          · {t("охиргиси")} {formatStamp(items[0].savedAt)}
        </span>
        <ChevronDown
          className={cx(
            "ml-auto h-4 w-4 shrink-0 text-ink-3 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div className="space-y-3 border-t border-line p-4">
          {items.length > HISTORY_SOFT_LIMIT && (
            <Alert tone="warn">
              {t("Сақланган ҳисобот кўп — саҳифа секин очилади. Эскиларини ўчиринг.")}
            </Alert>
          )}

          <TableFrame>
            <Table>
              <Thead>
                <Tr>
                  <Th>{t("Сақланган сана")}</Th>
                  <Th>{t("Давр")}</Th>
                  <Th align="right">{t("Контрагент")}</Th>
                  <Th align="right">{t("Фарқ")}</Th>
                  <Th align="right" aria-label={t("Амаллар")} />
                </Tr>
              </Thead>
              <Tbody>
                {items.map((it) => {
                  const isActive = it.id === activeId;
                  return (
                    <Tr key={it.id} selected={isActive}>
                      <Td main>
                        <div className="flex items-center gap-2">
                          <span>{formatStamp(it.savedAt)}</span>
                          {isActive && <Badge tone="info">{t("экранда")}</Badge>}
                        </div>
                      </Td>
                      <Td>{it.periodLabel || "—"}</Td>
                      <NumTd>{it.partyCount}</NumTd>
                      <NumTd
                        tone={
                          Math.abs(it.totals.diff) <= 0.01
                            ? "ok"
                            : it.totals.diff > 0
                              ? "bad"
                              : "info"
                        }
                      >
                        {format(it.totals.diff)}
                      </NumTd>
                      <Td align="right" className="whitespace-nowrap">
                        <div className="flex justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => onOpen(it.id)}
                            disabled={isActive}
                          >
                            {t("Очиш")}
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            iconOnly
                            title={t("Ўчириш")}
                            loading={busyId === it.id}
                            onClick={() => handleDelete(it)}
                            icon={<Trash2 className="h-3.5 w-3.5" />}
                          />
                        </div>
                      </Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          </TableFrame>
        </div>
      )}
    </div>
  );
}
