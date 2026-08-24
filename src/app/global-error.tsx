// ============================================================
// ILDIZ MAKETNING O'ZI YIQILGANDA
// ------------------------------------------------------------
// `[locale]/error.tsx` sahifadagi xatoni ushlaydi, LEKIN o'zi
// turgan segmentning MAKETINI ushlay olmaydi. Ya'ni
// `[locale]/layout.tsx` yiqilsa — til konteksti ham, shrift
// ham, tema ham yo'q. Faqat shu fayl qoladi.
//
// Shuning uchun bu yerda HECH NARSAGA tayanilmaydi: na
// `globals.css`, na `t()`, na dizayn tokenlari. Ranglar
// to'g'ridan-to'g'ri yozilgan, matn lotin o'zbekchada
// (standart yozuv). `<html>` va `<body>` ham shu yerda —
// hujjat shuni talab qiladi, chunki bu fayl ildiz maketning
// O'RNINI egallaydi.
//
// Bu ekran deyarli hech qachon ko'rinmasligi kerak. Ko'rinsa —
// bo'sh oyna emas, hech bo'lmasa sabab va yo'l ko'rinadi.
// ============================================================
"use client";

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <html lang="uz">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f4f2ed",
          color: "#17150f",
          fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
          padding: "24px",
        }}
      >
        <title>Moslik — xatolik</title>
        <main style={{ maxWidth: "34rem" }}>
          <h1 style={{ margin: "0 0 12px", fontSize: "1.5rem", fontWeight: 600 }}>
            Kutilmagan xatolik
          </h1>
          <p style={{ margin: "0 0 20px", lineHeight: 1.6, color: "#4a463c" }}>
            Sahifani ochib bo&apos;lmadi. Saqlangan hisobotlaringiz joyida — bu xato
            hisobga tegmaydi.
          </p>
          <button
            type="button"
            onClick={() => unstable_retry()}
            style={{
              height: "40px",
              padding: "0 16px",
              borderRadius: "6px",
              border: "1px solid #17150f",
              background: "#17150f",
              color: "#fffdfa",
              fontSize: "0.9375rem",
              cursor: "pointer",
            }}
          >
            Qayta urinish
          </button>
          {error.digest && (
            <p style={{ marginTop: "20px", fontSize: "0.8125rem", color: "#6b6558" }}>
              Xato raqami: {error.digest}
            </p>
          )}
        </main>
      </body>
    </html>
  );
}
