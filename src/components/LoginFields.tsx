"use client";

import { useId, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useT } from "@/context/LanguageContext";
import { Alert, Button, Field, Input } from "@/components/ui";

/* ============================================================
   KIRISH FORMASI — BITTA MANBA
   ------------------------------------------------------------
   Aynan shu forma IKKI joyda chiziladi:
     · modal oynada (`LoginModal`) — bosh sahifadan chiqadi
     · `/login` sahifasida (`LoginForm`) — to'g'ridan kirilganda
       va `AuthContext` yo'naltirganda

   Ikkitasi alohida yozilsa, biri tuzatilib ikkinchisi eskirib
   qolardi. Shuning uchun maydonlar, xato matni va yuborish
   mantig'i FAQAT shu yerda.

   BITTA AMAL: «кириш» va «рўйхатдан ўтиш» alohida emas. Raqam
   tanish bo'lsa kiradi, notanish bo'lsa hisob ochiladi — qaror
   `AuthContext.phoneAccess()` ichida, ekranda esa bitta tugma.
   Odam buni bilishi uchun izoh matni ostida turadi, aks holda
   «hisobim yo'q, qayerda ochaman?» degan savol tug'iladi.

   `id` lar `useId()` dan olinadi: modal va sahifa bir vaqtda
   mavjud bo'lsa, qattiq yozilgan `id="phone"` ikkilanardi va
   `<label for>` noto'g'ri maydonga ishora qilardi.
   ============================================================ */
export default function LoginFields({ onDone }: { onDone?: () => void }) {
  const t = useT();
  const { phoneAccess } = useAuth();
  const uid = useId();
  const phoneId = `phone-${uid}`;
  const passId = `password-${uid}`;

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    const message = await phoneAccess(phone, password);
    setIsSubmitting(false);
    if (message) {
      setError(message);
      return;
    }
    // Muvaffaqiyatda AuthContext o'zi mijozlar sahifasiga o'tkazadi;
    // modal esa yopilishi kerak, aks holda o'tish ortida osilib qoladi.
    onDone?.();
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <Field
        label={t("Телефон рақами")}
        htmlFor={phoneId}
        hint={t("+998 автоматик қўшилади")}
      >
        <Input
          id={phoneId}
          type="tel"
          required
          autoComplete="tel"
          inputMode="tel"
          placeholder="90 123 45 67"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </Field>

      <Field label={t("Парол")} htmlFor={passId} hint={t("Камида 6 та белги")}>
        <Input
          id={passId}
          type="password"
          required
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
        />
      </Field>

      {error && <Alert tone="bad">{t(error)}</Alert>}

      <Button type="submit" variant="primary" block loading={isSubmitting}>
        {isSubmitting ? t("Текширилмоқда...") : t("Тизимга кириш")}
      </Button>

      <p className="text-center text-caption text-ink-3">
        {t("Ҳисобингиз бўлмаса — рақамингизни ёзинг, ўзи очилади.")}
      </p>
    </form>
  );
}
