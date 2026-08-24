// ============================================================
// OYLIK SVERKA SAFI TUGADI
// ------------------------------------------------------------
// Devor endi korxona qo'shish oynasida emas, SVERKA ekranida —
// chunki cheklov ham o'sha yerga ko'chdi (`plans.ts`).
//
// Uch qaror, uchalasi ham eski korxona panelidan ko'chirildi:
//
//  1. XATO EMAS, HOLAT. Qizil «xatolik» emas, tushuntirish va
//     yo'l. Odam noto'g'ri ish qilgani yo'q — safi tugadi.
//  2. QAYTA YUKLASH BEPULLIGI SHU YERDA AYTILADI. Aks holda
//     buxgalter «fakturani to'g'rilab qayta yuklasam yana bittasi
//     ketadimi?» deb o'ylab, tuzatishdan qo'rqadi.
//  3. TO'LAMAYDIGAN ODAM HAM YO'QOTILMAYDI. Kim devorga urilib,
//     lekin to'lamagani — eng qimmatli raqam: u narx yuqoriligini
//     yoki hozir vaqt emasligini ko'rsatadi. Shuning uchun
//     «kerak» tugmasi `plan_interest` ga yozadi.
// ============================================================
"use client";

import { useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PaymentBox } from "@/components/PaymentBox";
import { Alert, Button, notify } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { useT } from "@/context/LanguageContext";

export interface QuotaState {
  /** Shu oyda ishlatilgan sverka soni */
  used: number;
  /** Oylik cheklov. `null` — cheksiz (bu holda devor ko'rsatilmaydi) */
  limit: number | null;
  plan: string;
}

export default function QuotaWall({ quota }: { quota: QuotaState }) {
  const t = useT();
  const { user } = useAuth();
  const [sent, setSent] = useState(false);

  const tell = async () => {
    try {
      await addDoc(collection(db, "plan_interest"), {
        workspaceId: user?.workspaceId || null,
        email: user?.email || null,
        plan: quota.plan,
        sverkaAtRequest: quota.used,
        createdAt: serverTimestamp(),
      });
      setSent(true);
      notify.ok(t("Раҳмат! Тариф тайёр бўлганда хабар берамиз."));
    } catch (err) {
      console.error("Talabni yozishda xatolik:", err);
      // Foydalanuvchi uchun ish TO'XTAMAYDI — u baribir bog'lana oladi.
      setSent(true);
      notify.warn(t("Хабарингиз юборилмади, лекин биз билан боғланишингиз мумкин."));
    }
  };

  return (
    <Alert tone="info" title={t("Бу ойдаги сверка сафингиз тугади")}>
      <p>
        {t("Бепул режада ойига 3 та сверка. Бир мижознинг айни ўша даврини қайта юклаш янги сверка ҳисобланмайди — фактурани тўғрилаб қайта юкласангиз, саноқ ўзгармайди.")}
      </p>
      <p className="mt-1.5">{t("Чекловсиз ишлаш учун режани очинг:")}</p>
      <div className="mt-2.5">
        <PaymentBox plan="buxgalter" />
      </div>
      <div className="mt-2.5">
        {sent ? (
          <span className="text-caption font-medium text-ok">
            ✓ {t("Сўровингиз қайд этилди")}
          </span>
        ) : (
          <Button variant="ghost" size="sm" onClick={tell}>
            {t("Ҳозир тўлай олмайман, лекин керак")}
          </Button>
        )}
      </div>
    </Alert>
  );
}
