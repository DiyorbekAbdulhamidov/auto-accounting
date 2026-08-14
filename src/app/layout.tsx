import { AuthProvider } from "@/context/AuthContext";
import { LanguageProvider } from "@/context/LanguageContext";
import "@/app/globals.css";

// Metadata loyihangizning brauzerdagi nomi va SEO qismini bildiradi
export const metadata = {
  title: "Бухгалтерия Хизматлари Маркази | Ички Тизим",
  description: "Интеллектуал бошқарув ва автоматик аудит тизими. Барча ҳаракатлар назорат остида.",
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