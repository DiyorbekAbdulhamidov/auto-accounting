import { AuthProvider } from "@/context/AuthContext"; // To'g'ri yo'lni tekshiring (src/context/AuthContext)
import "@/app/globals.css"; // Loyihangizning stillari

export const metadata = {
  title: "Bank Analyzer AI",
  description: "Avtomatlashtirilgan accounting tizimi",
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