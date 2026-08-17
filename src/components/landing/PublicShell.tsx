// ============================================================
// OCHIQ SAHIFALARNING O'RAMI — navigatsiya + podval
// ------------------------------------------------------------
// `/`, `/guide`, `/pricing`, `/features` — hammasi shu o'ramda.
// Ilgari nav bosh sahifaning ichida yozilgan edi, ya'ni yangi ochiq
// sahifa qo'shilganda u navsiz qolardi.
//
// Havolalar `path(key, locale)` orqali quriladi — qo'lda `/uz/...`
// yozilmaydi, aks holda til almashganda bitta havola eski tilda
// qolib ketardi.
// ============================================================
"use client";

import NextLink from "next/link";
import { usePathname } from "next/navigation";
import Logo from "@/components/Brand";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageToggle from "@/components/LanguageToggle";
import { useAuth } from "@/context/AuthContext";
import { useLocale, useT } from "@/context/LanguageContext";
import { PATHS, path } from "@/lib/routes";
import { buttonClasses, cx, layout } from "@/components/ui";
import { Footer } from "./Sections";

const NAV: { key: "guide" | "pricing" | "features"; label: string }[] = [
  { key: "features", label: "Нима бор" },
  { key: "pricing", label: "Нарх" },
  { key: "guide", label: "Қўлланма" },
];

export default function PublicShell({ children }: { children: React.ReactNode }) {
  const t = useT();
  const locale = useLocale();
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const signedIn = !loading && !!user;

  return (
    <div className={layout.page}>
      {/* Шапка «шиша» бўлди: остидан ўтган рангли блок хиралашади,
          лекин РАНГИ сақланади (`saturate`). Пастки чегара —
          бренд градиенти, 1px: у ерда чизиқ бор эканини айтади,
          лекин диққатни олмайди. */}
      <header className="glass sticky top-0 z-40 border-b border-line">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px opacity-40 brand-gradient" />
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-3 md:px-6">
          <NextLink href={path("home", locale)} aria-label={t("Бош саҳифа")}>
            <Logo size="sm" />
          </NextLink>

          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => {
              const href = path(item.key, locale);
              // Turgan sahifa navda ham ko'rinib tursin
              const active = pathname === href;
              return (
                <NextLink
                  key={item.key}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cx(
                    buttonClasses("ghost", "sm"),
                    active && "bg-surface-2 text-ink"
                  )}
                >
                  {t(item.label)}
                </NextLink>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
            <NextLink
              href={signedIn ? path("clients", locale) : path("login", locale)}
              className={buttonClasses("primary", "sm")}
            >
              {signedIn ? t("Иш столи") : t("Кириш")}
            </NextLink>
          </div>
        </div>
      </header>

      <main>{children}</main>

      <Footer />
    </div>
  );
}

/** Ochiq sahifalarning yuqori qismi: sarlavha + bir qatorli izoh */
export function PublicHeading({
  title,
  lead,
}: {
  title: string;
  lead: string;
}) {
  const t = useT();
  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-2 pt-16 md:px-6">
      <h1 className="text-title font-semibold text-ink">{t(title)}</h1>
      <p className="mt-4 max-w-2xl text-lead text-ink-2">{t(lead)}</p>
    </div>
  );
}

export { PATHS };
