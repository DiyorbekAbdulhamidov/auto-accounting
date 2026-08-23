// ============================================================
// HAVOLA RASMI (Open Graph)
// ------------------------------------------------------------
// NEGA KERAK. Sahifada `twitter:card=summary_large_image` e'lon
// qilingan edi, lekin `og:image` YO'Q edi — ya'ni sayt «katta rasm
// bo'ladi» deb va'da berib, rasmni bermasdi. Natijada Telegramda
// havola quruq matn bo'lib chiqadi.
//
// Bu shunchaki bezak emas: mahsulot buxgalterlarga aynan Telegram
// guruhlari orqali tarqaladi. Havola oldida rasm turgani bilan
// turmagani — bosiladimi yoki yo'qmi degan farq.
//
// Rasm KODDAN chiziladi (`next/og`), fayl emas: matn o'zgarsa
// rasm ham o'zi o'zgaradi va grafik muharrir ochilmaydi.
//
// Ildizga qo'yilgan — metama'lumot fayllari pastga meros bo'ladi,
// ya'ni bitta fayl to'rt til va hamma sahifani qoplaydi.
// ============================================================

import { ImageResponse } from "next/og";
import { BRAND } from "@/lib/brand";
import { translate } from "@/lib/i18n";

export const alt = `${BRAND.name} — ${translate(BRAND.tagline, "uz-latn")}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** `globals.css` dagi qiymatlar. `ImageResponse` CSS o'zgaruvchilarini
 *  o'qiy olmaydi — shuning uchun bu yerda ATAYLAB takrorlangan. */
const INK = "#0f172a";
const INK_2 = "#475569";
const ACCENT = "#4f46e5";
const IN = "#10b981";
const SURFACE = "#ffffff";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: SURFACE,
          padding: "72px 80px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Yuqori chiziq — brend gradienti */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: 10,
            background: `linear-gradient(90deg, ${ACCENT} 0%, ${IN} 100%)`,
          }}
        />

        <div style={{ display: "flex", flexDirection: "column" }}>
          {/* Logotip: teng belgisi — «mos keldi» ning o'zi */}
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              <div style={{ width: 58, height: 13, borderRadius: 7, background: ACCENT }} />
              <div style={{ width: 58, height: 13, borderRadius: 7, background: IN }} />
            </div>
            <div style={{ fontSize: 62, fontWeight: 700, color: INK, letterSpacing: -1 }}>
              {BRAND.name}
            </div>
          </div>

          <div
            style={{
              marginTop: 44,
              fontSize: 54,
              lineHeight: 1.18,
              fontWeight: 600,
              color: INK,
              maxWidth: 940,
            }}
          >
            {translate(BRAND.tagline, "uz-latn")}
          </div>

          <div
            style={{
              marginTop: 26,
              fontSize: 30,
              lineHeight: 1.4,
              color: INK_2,
              maxWidth: 900,
            }}
          >
            {translate(BRAND.promise, "uz-latn")}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 30, fontWeight: 600, color: ACCENT }}>{BRAND.domain}</div>
          <div style={{ fontSize: 26, color: INK_2 }}>
            Bepul reja: 3 ta korxona · sverka cheksiz
          </div>
        </div>
      </div>
    ),
    size
  );
}
