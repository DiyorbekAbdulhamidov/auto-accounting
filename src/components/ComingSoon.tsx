"use client";

import NextLink from "next/link";
import { ArrowLeft, Lock } from "lucide-react";
import { useT } from "@/context/LanguageContext";
import { Badge, buttonClasses, Card, layout } from "@/components/ui";

// Hali ochilmagan modullar uchun yagona "Tez kunda" sahifasi
export default function ComingSoon({ title }: { title: string }) {
  const t = useT();
  return (
    <div className={`${layout.page} flex items-center justify-center px-4`}>
      <Card className="w-full max-w-lg p-8 text-center">
        <div className="mb-5 inline-flex rounded-lg border border-line bg-surface-2 p-4 text-ink-3">
          <Lock className="h-7 w-7" />
        </div>

        <div className="mb-4">
          <Badge tone="warn">{t("Тез кунда")}</Badge>
        </div>

        <h1 className="text-h2 font-semibold text-ink">{t(title)}</h1>
        <p className="mx-auto mt-3 max-w-sm text-body text-ink-2">
          {t("Ушбу модул ҳозирда ишлаб чиқилмоқда ва тез орада ишга тушади. Ҳозирча")}{" "}
          <span className="font-medium text-ink">{t("Чиқим сверкаси")}</span>{" "}
          {t("муҳитидан фойдаланишингиз мумкин.")}
        </p>

        <NextLink href="/" className={`${buttonClasses("primary", "md")} mt-6`}>
          <ArrowLeft className="h-4 w-4" /> {t("Бош саҳифага қайтиш")}
        </NextLink>
      </Card>
    </div>
  );
}
