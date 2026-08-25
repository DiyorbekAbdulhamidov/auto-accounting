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

/**
 * Шапка ҳаволаси.
 *
 * Актив саҳифа ОСТИГА чизилади — ранг билан эмас. Сабаб: ранг бу
 * маҳсулотда маъно ташийди (пул, фактура, фарқ), навигация эса
 * маълумот эмас. Чизиқ 2px: ўқилади, лекин рангни банд қилмайди.
 */
function NavLink({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  return (
    <NextLink
      href={href}
      aria-current={active ? "page" : undefined}
      className={cx(
        "shrink-0 whitespace-nowrap border-b-2 pb-1 text-body transition-colors",
        active
          ? "border-ink font-medium text-ink"
          : "border-transparent text-ink-2 hover:text-ink"
      )}
    >
      {label}
    </NextLink>
  );
}

export default function PublicShell({ children }: { children: React.ReactNode }) {
  const t = useT();
  const locale = useLocale();
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const signedIn = !loading && !!user;

  return (
    /* `flex flex-col` + `main` да `flex-1`: калта саҳифада (404,
       алоқа) поябзал юқорида осилиб қоларди — ўлчанган: 1280×720 да
       поябзал 614px да тугаб, тагида 106px бўш жой қоларди. */
    <div className={cx(layout.page, "flex flex-col")}>
      {/* ============================================================
          ШАПКА — қайта ёзилди (2026-08-23)
          ------------------------------------------------------------
          НИМА НОТЎҒРИ ЭДИ:

          1. ТЕЛЕФОНДА ҲАВОЛА ЙЎҚ ЭДИ. `hidden md:flex` — яъни кичик
             экранда «Нима бор», «Нарх», «Қўлланма» УМУМАН чиқмасди,
             бургер тугма ҳам йўқ эди. Бош саҳифадан бошқа ҳеч қаёққа
             ўтиб бўлмасди. Энг оғир нуқсон шу.
          2. Ҳавола ТУГМА кўринишида эди (`ghost`): шапкада тўртта
             тугма ёнма-ён турса, қайси бири асосий экани йўқолади.
             Асосий ҳаракат биттагина — «Кириш».
          3. «Шиша» (blur) ва градиент чизиқ — 2023 йил қолипи.
             Ҳужжат билан ишлайдиган восита учун ортиқча.

          ЭНДИ: тўлиқ сирт, битта чизиқ. Ҳавола — МАТН, актив саҳифа
          остига чизилади (ҳужжатдаги каби). Телефонда ҳаволалар
          иккинчи қаторда, доим кўринади — қўшимча БОСИШ йўқ.
          ============================================================ */}
      <header className="sticky top-0 z-40 border-b border-line bg-surface">
        <div className="mx-auto flex w-full max-w-7xl items-center gap-7 px-4 py-2.5 md:px-6 md:py-3">
          <NextLink
            href={path("home", locale)}
            aria-label={t("Бош саҳифа")}
            className="shrink-0"
          >
            <Logo size="sm" />
          </NextLink>

          <nav className="hidden items-center gap-7 md:flex">
            {NAV.map((item) => (
              <NavLink
                key={item.key}
                href={path(item.key, locale)}
                active={pathname === path(item.key, locale)}
                label={t(item.label)}
              />
            ))}
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-2">
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

        {/* ТЕЛЕФОН: учта ҳавола иккинчи қаторда. Кенглик етмаса
            ён томонга сурилади — яширилмайди. */}
        <nav className="flex items-center gap-6 overflow-x-auto border-t border-line px-4 pb-1.5 pt-1 md:hidden">
          {NAV.map((item) => (
            <NavLink
              key={item.key}
              href={path(item.key, locale)}
              active={pathname === path(item.key, locale)}
              label={t(item.label)}
            />
          ))}
        </nav>
      </header>

      <main className="flex-1">{children}</main>

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
