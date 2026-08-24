// ============================================================
// MOS KELMAGAN MANZIL -> 404
// ------------------------------------------------------------
// Nega bu fayl kerak (o'lchangan, taxmin emas):
//
// `not-found.tsx` faqat `notFound()` CHAQIRILGANDA ishlaydi.
// Hech qanday marshrutga tushmaydigan manzil (`/uz/bilmadim`)
// esa ILDIZDAGI `app/not-found.tsx` ni qidiradi. Bu loyihada
// ildiz maket `app/[locale]/layout.tsx` — ya'ni `app/` ning
// o'zida maket YO'Q, demak u yerga qo'yilgan sahifa `<html>`
// siz qolardi. Shu sababli `[locale]/not-found.tsx` ni
// qo'shganimizdan keyin ham `/uz/bilmadim` hamon Next'ning
// inglizcha standart sahifasini berardi.
//
// Yechim: hamma qolgan manzilni ushlaydigan marshrut. U darhol
// `notFound()` chaqiradi — natijada 404 holati ham to'g'ri
// qaytadi, sahifa esa `[locale]/not-found.tsx` bo'lib, TO'LIQ
// maket bilan (shrift, rang, shapka, til) chiziladi.
//
// Aniq marshrut har doim ustun: `/uz/clients` shu faylga
// tushmaydi, chunki Next avval aniq nomni qidiradi.
//
// Hujjatdagi `global-not-found.js` ham shu holat uchun, lekin u
// EXPERIMENTAL bayroq talab qiladi va o'zining `<html>`, shrifti
// va uslubini qaytadan yozishni so'raydi — ya'ni 404 dizayn
// tizimidan tashqarida qolardi.
// ============================================================
import { notFound } from "next/navigation";

export default function CatchAllNotFound() {
  notFound();
}
