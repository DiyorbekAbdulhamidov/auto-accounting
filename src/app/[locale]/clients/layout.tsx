import type { Metadata } from "next";
import AppShell from "@/components/AppShell";
import { isLocale } from "@/lib/i18n";
import { pageMeta } from "@/lib/pageMeta";

// Bu qatlam SERVER komponenti bo'lib qoladi — faqat shunda sahifaning
// `metadata` si yoziladi. Kirish tekshiruvi va yuqori qator klient
// tomonda: `src/components/AppShell.tsx`.
//
// `pageMeta` bu sahifalarga `noindex` qo'yadi: ular mijoz ma'lumoti
// va qidiruvda hech qanday qiymati yo'q.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return pageMeta(locale, "clients");
}

export default function ClientsLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
