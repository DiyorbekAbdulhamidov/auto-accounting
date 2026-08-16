import type { Metadata } from "next";
import { AuthProvider } from "@/context/AuthContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { BRAND } from "@/lib/brand";
import "@/app/globals.css";

// Brauzer yorlig'i va qidiruv natijasidagi matn.
//
// Bu YAGONA joy — sayt endi ochiq (bosh sahifa login talab qilmaydi),
// shuning uchun matn ichki tizim tili bilan emas, foydalanuvchi tili
// bilan yozilgan. Lotin: standart alifbo ham lotin.
export const metadata: Metadata = {
  title: {
    default: `${BRAND.name} — pul bilan fakturani solishtiradi`,
    template: `%s · ${BRAND.name}`,
  },
  description:
    "Bank ko'chirmangizni va faktura ro'yxatini yuklang — tizim har bir kontragent " +
    "bo'yicha pul bilan fakturani solishtiradi va farq borlarini ajratib beradi. " +
    "Qo'lda bir necha kun ketadigan ish bir necha soniyada.",
  applicationName: BRAND.name,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uz" suppressHydrationWarning>
      <body>
        {/* Tema flash bo'lmasligi uchun hydratsiyadan oldin qo'llanadi */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem('theme')==='dark')document.documentElement.classList.add('dark')}catch(e){}`,
          }}
        />
        {/* Barcha sahifalar auth holatidan xabardor bo'lishi uchun provider ichiga olamiz */}
        <AuthProvider>
          {/* Til tanlovi ham hamma sahifaga kerak. Standart — kirill
              o'zbekcha; tanlangani localStorage'da saqlanadi. */}
          <LanguageProvider>
            {children}
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}