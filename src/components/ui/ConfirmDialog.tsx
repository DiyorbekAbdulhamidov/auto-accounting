// ============================================================
// TASDIQ OYNASI — brauzerning `confirm()` i o'rniga
// ------------------------------------------------------------
// Nega kerak bo'ldi: uchta QAYTARIB BO'LMAYDIGAN amal —
// korxonani o'chirish, saqlangan hisobotni o'chirish va ish
// maydonidan a'zoni chiqarish — brauzerning `confirm()` iga
// suyanardi. `alert()` lar aynan shu sabablarga ko'ra
// allaqachon olib tashlangan (`Toast.tsx`), `confirm()` esa
// e'tibordan chetda qolgan edi:
//
//   - dizayn tizimidan TASHQARIDA turadi (tungi rejimni,
//     shriftni, rangni bilmaydi);
//   - tugmalari BRAUZER tilida chiqadi — lotin yoki rus
//     interfeysda ham «OK / Отмена» bo'lib qolaveradi;
//   - matni bir qatorga cho'ziladi, qaysi korxona haqida
//     ketayotgani ajralib turmaydi.
//
// YANGI QADAM QO'SHILMAYDI: ilgari ham bir marta tasdiqlanardi,
// hozir ham bir marta. Faqat oyna o'ziniki.
// ============================================================
"use client";

import { AlertTriangle } from "lucide-react";
import Button from "./Button";
import Modal from "./Modal";
import { useT } from "@/context/LanguageContext";

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  loading = false,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  /** Nima bo'lishi to'liq yoziladi — «ishonchingiz komilmi?» yetarli emas */
  message: React.ReactNode;
  /** Tasdiq tugmasining matni: «Ўчириш», «Чиқариш» — «OK» EMAS */
  confirmLabel: string;
  loading?: boolean;
}) {
  const t = useT();
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      icon={<AlertTriangle className="h-5 w-5 text-bad" />}
      width="max-w-sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {t("Бекор қилиш")}
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-body text-ink-2">{message}</p>
    </Modal>
  );
}
