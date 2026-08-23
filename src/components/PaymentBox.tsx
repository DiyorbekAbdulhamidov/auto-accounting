// ============================================================
// REJANI OCHISH — QO'LDA TO'LOV YO'RIQNOMASI
// ------------------------------------------------------------
// Cheklovga yetgan odam eng ko'p qiziqqan lahzada turadi. Ilgari
// u «айтинг, тариф ҳали ишга туширилмаган» degan noaniq matnni
// ko'rardi — ya'ni yo'l ko'rsatilmasdi va qiziqish o'sha yerda
// so'nardi.
//
// Endi uchta aniq qadam turadi: qancha, qayerga, keyin nima.
// Uchinchisi ATAYLAB muddat bilan: «avtomat ochiladi» deb yozib
// bo'lmaydi, chunki rejani odam qo'lda qo'yadi.
// ============================================================
"use client";

import { useState } from "react";
import { Copy, Check, Send } from "lucide-react";
import NextLink from "next/link";
import { useLocale, useT } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { accountKeyOf } from "@/lib/workspace";
import { path } from "@/lib/routes";
import { PLANS, type Plan } from "@/lib/plans";
import { MANUAL_PAYMENT } from "@/lib/payment";
import { Button, notify } from "@/components/ui";

export function PaymentBox({ plan }: { plan: Exclude<Plan, "free"> }) {
  const t = useT();
  const locale = useLocale();
  const { user } = useAuth();
  const [copied, setCopied] = useState<"card" | "note" | null>(null);
  const limits = PLANS[plan];
  const price = limits.priceUzs.toLocaleString("ru-RU");

  /* ============================================================
     CHEK KIMNIKI — TO'LOVNING ENG ZAIF JOYI
     ------------------------------------------------------------
     Karta chekida hisob ko'rsatilmaydi. Odam faqat skrinshot
     tashlasa, rejani KIMGA ochish noma'lum qoladi va uni qidirish
     kerak bo'ladi — to'lagan odam esa kutib turadi.

     Yechim: hisob kaliti EKRANDA turadi va bitta bosishda tayyor
     xabar bo'lib nusxalanadi. Odam yozmaydi — qo'yadi, ya'ni xato
     yozish imkoni ham yo'q.

     Ko'rsatiladigan qiymat — ISH MAYDONI kaliti: reja aynan ish
     maydoniga qo'yiladi (`/api/admin/plan`), foydalanuvchiga emas.
     ============================================================ */
  const account =
    (typeof user?.workspaceId === "string" && user.workspaceId) ||
    accountKeyOf(user?.email, typeof user?.phone === "string" ? user.phone : null) ||
    "";

  const note = `Moslik — «${t(limits.label)}» ${price} ${t("сўм")}\n${t("Ҳисоб")}: ${account}`;

  const copy = async (what: "card" | "note") => {
    try {
      await navigator.clipboard.writeText(
        what === "card" ? MANUAL_PAYMENT.cardPlain : note
      );
      setCopied(what);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // Brauzer ruxsat bermasa — matn baribir ekranda turibdi
      notify.warn(t("Нусха олинмади — қўлда кўчиринг."));
    }
  };

  return (
    <div className="rounded-lg border border-line bg-surface p-4">
      <p className="text-body text-ink">
        <b>«{t(limits.label)}»</b> — {t("ойига")} <b>{price}</b> {t("сўм")}
      </p>

      {/* NEGA AYNAN SHU REJA. Ikki devor ikki xil narx aytadi: korxona
          uchun 9 999, jamoa uchun 39 999. Tushuntirilmasa bu qarama-
          qarshilikka o'xshaydi — 2026-08-20 da aynan shu savol tug'ildi.
          Matn `PLANS` dan olinadi, ya'ni jadval o'zgarsa o'zi o'zgaradi. */}
      <p className="mt-1 text-caption text-ink-3">
        {t("Корхона сони чекланмайди")} ·{" "}
        {limits.members === 1
          ? t("1 та фойдаланувчи")
          : `${limits.members} ${t("тагача фойдаланувчи")}`}
      </p>

      <ol className="mt-3 space-y-2 text-body text-ink-2">
        <li>
          <b>1.</b> {t("Қуйидаги картага")} <b>{price}</b> {t("сўм ўтказинг")}
        </li>
        <li>
          <b>2.</b> {t("Чекни ВА қуйидаги маълумотни ботга ташланг:")}{" "}
          <a
            href={MANUAL_PAYMENT.botUrl}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-accent-ink hover:underline"
          >
            {MANUAL_PAYMENT.botUsername}
          </a>
        </li>
        <li>
          {/* Muddat ANIQ: pul to'lagan odam «qachon?» deb ikkilanmasligi kerak */}
          <b>3.</b>{" "}
          {t("Режа очилади — одатда бир неча соат ичида, кечи билан 1 иш куни.")}
        </li>
      </ol>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-line bg-surface-2 px-3 py-2.5">
        <span className="font-mono text-body font-medium tracking-wide text-ink">
          {MANUAL_PAYMENT.card}
        </span>
        <span className="text-caption text-ink-3">{MANUAL_PAYMENT.cardHolder}</span>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => copy("card")}
          icon={copied === "card" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        >
          {copied === "card" ? t("Нусха олинди") : t("Нусха олиш")}
        </Button>
      </div>

      {/* HISOB — chek bilan birga yuboriladigan qator */}
      {account && (
        <div className="mt-2 rounded-lg border border-line bg-surface-2 px-3 py-2.5">
          <p className="text-caption text-ink-3">{t("Чек билан бирга шуни юборинг")}</p>
          <p className="mt-0.5 break-all font-mono text-body text-ink">
            {t("Ҳисоб")}: {account}
          </p>
          <Button
            className="mt-1.5"
            size="sm"
            variant="secondary"
            onClick={() => copy("note")}
            icon={copied === "note" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          >
            {copied === "note" ? t("Нусха олинди") : t("Хабарни нусхалаш")}
          </Button>
        </div>
      )}

      <p className="mt-2.5 flex items-start gap-2 text-caption text-ink-3">
        <Send className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>{t("Режа очилганда шу ботдан хабар келади.")}</span>
      </p>

      <NextLink
        href={path("pricing", locale)}
        className="mt-2 inline-block text-caption text-ink-3 underline hover:text-ink-2"
      >
        {t("Режаларни солиштириш")}
      </NextLink>
    </div>
  );
}
