import { AuthProvider } from "@/context/AuthContext";
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
    <html lang="uz">
      <body>
        {/* Barcha sahifalar auth holatidan xabardor bo'lishi uchun provider ichiga olamiz */}
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}