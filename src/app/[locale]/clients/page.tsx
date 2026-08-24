// ============================================================
// КОРХОНАЛАР — ИККАЛА сверка учун БИТТА рўйхат
// ------------------------------------------------------------
// Илгари корхоналар фақат чиқим сверкасида бор эди (`/excel-audit`),
// кирим сверкаси эса корхонасиз мустақил саҳифа эди. Бухгалтер учун
// эса бу битта иш: «қайси мижоз» -> «қайси йўналиш». Шунинг учун
// корхона — рўйхат, йўналиш — таб.
//
// Саҳифада МОДУЛЬ РАНГИ ЙЎҚ: рўйхат кирим ҳам, чиқим ҳам эмас.
// Ранг фақат корхонанинг ичида, таб танлангандан кейин пайдо бўлади.
// ============================================================
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { db } from "@/lib/firebase";
import { authFetch } from "@/lib/authFetch";
import { PaymentBox } from "@/components/PaymentBox";
import { useAuth } from "@/context/AuthContext";
import { addDoc, collection, getDocs, query, serverTimestamp, where } from "firebase/firestore";
import NextLink from "next/link";
import { Building2, Plus, ArrowRight, FolderOpen, Trash2, Users } from "lucide-react";
import SortHeader from "@/components/SortHeader";
import TeamModal from "@/components/TeamModal";
import { useLocale, useT } from "@/context/LanguageContext";
import { clientPath } from "@/lib/routes";
import {
  Alert,
  Badge,
  Button,
  Card,
  Code,
  EmptyState,
  notify,
  Field,
  Input,
  Modal,
  NumTd,
  PageHeader,
  PageLoader,
  SearchInput,
  Select,
  SumStrip,
  SumCell,
  Table,
  TableFrame,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  buttonClasses,
  cx,
  layout,
} from "@/components/ui";

interface Company {
  id: string;
  name: string;
  inn: string;
  createdAt?: { toMillis?: () => number };
}

/**
 * Ro'yxat uchun YENGIL yozuv — `/api/reports/summary` qaytaradi.
 *
 * Ilgari bu yerda TO'LIQ hujjat turardi va sahifa ish maydonidagi
 * hamma hisobotni `firmsData` bilan birga yuklardi — har biri 900 KB
 * gacha. Ro'yxatga esa shu besh son yetadi. Batafsil: route izohi.
 */
interface ReportLite {
  id: string;
  companyId: string;
  /** Millisekund. `serverTimestamp()` hali yozilmagan bo'lsa null. */
  savedAtMs: number | null;
  /** `totals` maydoni bormi — «сақланган» belgisi shunga qarab qo'yiladi */
  hasTotals: boolean;
  debit: number;
  credit: number;
  /** Nechta kontragentda farq bor. Eski hujjatlarda maydon YO'Q → null
   *  → ekranda «—». Migratsiya qilinmaydi. */
  diffCount: number | null;
}

/**
 * Сақланган ЧИҚИМ сверкалари бўйича йиғма.
 *
 * `tolov`   — тўланган пул (дебет)
 * `faktura` — келган фактура (кредит)
 * `farq`    — тўлов − фактура (сальдо)
 *
 * ФАРҚ ИШОРАСИ. Илгари бу ерда `credit − debit` турарди, яъни бутун
 * тизимга ТЕСКАРИ: корхона саҳифасида ҳам, Excel ҳисоботида ҳам
 * `debit − credit`. Етказиб берувчи ҳисоби (6010) — пассив, унда
 * тўлов дебет, фактура кредит; сальдо = дебет − кредит.
 *   > 0 улар қарздор (фактура келмаган) · < 0 биз қарздормиз
 */
interface Totals {
  tolov: number;
  faktura: number;
  farq: number;
  /* KIRIM yo'nalishi (2026-08-24 da qo'shildi).
     `tushgan`  — bizga tushgan pul (kredit)
     `yozilgan` — biz yozgan faktura (debet)
     `kirimFarq` = yozilgan − tushgan, ya'ni AYNAN o'sha qoida:
     farq = debet − kredit. > 0 bo'lsa BIZGA qarzdor. */
  tushgan: number;
  yozilgan: number;
  kirimFarq: number;
}

type SortKey = "name" | "inn" | "tolov" | "faktura" | "farq" | "kirimFarq";

/**
 * ҲОЛАТ — рақамдан СЎЗга.
 *
 * Бухгалтер рўйхатни «ким билан иш бор?» деб очади. Рақамнинг ўзи
 * бу саволга жавоб бермайди: ҳар сафар ишорасини ва қайси
 * йўналиш эканини эслаш керак бўлади. Шунинг учун жавоб СЎЗ билан
 * ёзилади, ранг эса маълумот токенидан олинади.
 *
 * Бир вақтда ИККАЛА томонда ҳам иш бўлиши мумкин — шунинг учун
 * рўйхат қайтарилади, битта белги эмас.
 */
function verdicts(farq: number, kirimFarq: number, saved: boolean, kirimSaved: boolean) {
  const out: { text: string; tone: "bad" | "warn" | "info" | "ok" }[] = [];
  // Тийиндаги фарқ фарқ эмас: 1 сўмдан кичиги юмалоқлаш хатоси
  const EPS = 1;
  if (saved && farq < -EPS) out.push({ text: "Биз қарздормиз", tone: "bad" });
  if (saved && farq > EPS) out.push({ text: "Фактура олиш керак", tone: "warn" });
  if (kirimSaved && kirimFarq > EPS) out.push({ text: "Бизга қарздор", tone: "warn" });
  if (kirimSaved && kirimFarq < -EPS) out.push({ text: "Аванс тушган", tone: "info" });
  if (!out.length && (saved || kirimSaved)) out.push({ text: "Ҳаммаси мос", tone: "ok" });
  return out;
}
type SortDir = "asc" | "desc";

export default function ClientsPage() {
  const t = useT();
  const locale = useLocale();
  // Ish maydoni `allowed_users/{email}` hujjatidan keladi (AuthContext uni
  // foydalanuvchi obyektiga qo'shib beradi). Barcha o'qish/yozish shunga
  // bog'lanadi — ma'lumot egasiz qolmasligi kerak.
  const { user } = useAuth();
  const workspaceId: string | undefined = user?.workspaceId;
  const [companies, setCompanies] = useState<Company[]>([]);
  const [reports, setReports] = useState<ReportLite[]>([]);
  /** KIRIM сверкалари — ро'йхат учун худди чиқим каби енгил ёзув */
  const [income, setIncome] = useState<ReportLite[]>([]);
  /* ЙИҒМА ҚАТОР ҚАЙСИ ЙЎНАЛИШНИ КЎРСАТАДИ.
     Илгари тепада ҳар икки йўналишнинг сони АРАЛАШ турарди:
     «биз қарздормиз» чиқимдан, «бизга қарздор» киримдан, айланма
     эса иккаласидан. Бухгалтер бир қарашда қайси сон қаердан
     келганини айта олмасди. Энди йўналиш ТАНЛАНАДИ ва учала сон
     ҳам ЎША йўналишдан бўлади. Жадвал эса иккаласини ҳам
     кўрсатаверади — у ерда устун номи ёзилган. */
  const [sumDir, setSumDir] = useState<"out" | "in">("out");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);

  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [teamOpen, setTeamOpen] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newCompanyInn, setNewCompanyInn] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [addError, setAddError] = useState("");
  /** Reja chekloviga yetildi — xato matni o'rniga YO'L ko'rsatiladi */
  const [limitHit, setLimitHit] = useState<{ plan: string; limit: number; current: number } | null>(null);
  const [interestSent, setInterestSent] = useState(false);

  const [totals, setTotals] = useState<Totals>({
    tolov: 0,
    faktura: 0,
    farq: 0,
    tushgan: 0,
    yozilgan: 0,
    kirimFarq: 0,
  });

  const formatMoney = (amount: number) => {
    // ИККИ хона ҲАР ДОИМ. Илгари `minimumFractionDigits: 0` эди ва
    // 3 883 286 487,20 юқоридаги картада «...,2» бўлиб кўринарди —
    // қуйидаги жадвалда эса «...,20». Битта саҳифада битта сон икки
    // хил ёзилса, бухгалтер уни икки хил сон деб ўқийди.
    if (!amount) return "0,00";
    return amount.toLocaleString("ru-RU", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // MUHIM: faqat MAVJUD firmalarning hisobotlari qo'shiladi. Firma o'chirilgan-u
  // hisoboti qolib ketgan bo'lsa ("yetim" hisobot), u umumiy summaga kirmasligi kerak —
  // aks holda ro'yxat bo'sh bo'lsa ham yuqorida raqam turaveradi.
  const calculateTotals = useCallback(
    (
      reportsList: ReportLite[],
      incomeList: ReportLite[],
      year: number,
      companiesList: Company[]
    ) => {
      const liveCompanyIds = new Set(companiesList.map((c) => c.id));
      const sum = (list: ReportLite[]) => {
        let debit = 0;
        let credit = 0;
        list.forEach((report) => {
          if (!liveCompanyIds.has(report.companyId)) return;
          const reportYear = report.savedAtMs
            ? new Date(report.savedAtMs).getFullYear()
            : new Date().getFullYear();
          if (reportYear === year && report.hasTotals) {
            debit += report.debit;
            credit += report.credit;
          }
        });
        return { debit, credit };
      };

      const out = sum(reportsList);
      const inc = sum(incomeList);
      setTotals({
        tolov: out.debit,
        faktura: out.credit,
        farq: out.debit - out.credit,
        yozilgan: inc.debit,
        tushgan: inc.credit,
        kirimFarq: inc.debit - inc.credit,
      });
    },
    []
  );

  // Ma'lumotlarni Firestore'dan yuklash funksiyasi.
  // MUHIM: setLoading(true) bu yerda chaqirilmaydi (effect ichida sinxron
  // setState taqiqlangan) - spinner kerak joyda event handler yoqadi.
  const loadDashboardData = useCallback(async () => {
    // ISH MAYDONI SHART. Firestore qoidasi so'rovni hujjatlarni o'qimasdan
    // tekshiradi: `where('workspaceId','==',...)` bo'lmasa so'rov butunlay
    // RAD ETILADI (bo'sh ro'yxat emas, xato). Shuning uchun bu filtr
    // ixtiyoriy emas — u himoyaning klient tomondagi juftligi.
    if (!workspaceId) {
      setLoading(false);
      return;
    }
    try {
      // `orderBy` ATAYLAB yo'q: `where` bilan birga u Firestore'da QO'SHMA
      // INDEKS talab qiladi va indeks yaratilmaguncha so'rov xato beradi.
      // Korxonalar soni bitta ish maydonida oz — tartiblash shu yerda.
      const companiesQuery = query(
        collection(db, "companies"),
        where("workspaceId", "==", workspaceId)
      );
      const companiesSnapshot = await getDocs(companiesQuery);
      const companiesList = companiesSnapshot.docs
        .map((d) => ({ id: d.id, ...d.data() } as Company))
        .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
      setCompanies(companiesList);

      // Hisobotlar SERVER orqali: `select()` faqat admin SDK'da bor,
      // ya'ni og'ir `firmsData` umuman uzatilmaydi (route izohiga qarang).
      const res = await authFetch("/api/reports/summary");
      const payload = (await res.json().catch(() => ({}))) as {
        reports?: ReportLite[];
        income?: ReportLite[];
        error?: string;
      };
      if (!res.ok) throw new Error(payload.error || "Ҳисоботларни ўқиб бўлмади.");
      const reportsList = Array.isArray(payload.reports) ? payload.reports : [];
      const incomeList = Array.isArray(payload.income) ? payload.income : [];
      setReports(reportsList);
      setIncome(incomeList);

      calculateTotals(reportsList, incomeList, selectedYear, companiesList);
    } catch (err) {
      console.error("Xatolik:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedYear, calculateTotals, workspaceId]);

  useEffect(() => {
    async function load() {
      await loadDashboardData();
    }
    load();
  }, [loadDashboardData]);

  const getCompanyBriefStats = useCallback(
    (companyId: string) => {
      let tolov = 0;
      let faktura = 0;
      let saved = false;
      // Oxirgi sverka sanasi va farqi bor kontragentlar soni — ular
      // ENG SO'NGGI hisobotdan olinadi, yig'indidan emas: «nechtasida
      // farq bor» ni bir necha hisobot bo'yicha qo'shib bo'lmaydi
      // (bitta kontragent ikkala hisobotda ham sanaladi).
      let lastAt: Date | null = null;
      let lastMs = -1;
      let withDiff: number | null = null;

      reports.forEach((report) => {
        const at = report.savedAtMs ? new Date(report.savedAtMs) : null;
        const reportYear = at ? at.getFullYear() : new Date().getFullYear();
        if (report.companyId !== companyId || reportYear !== selectedYear) return;
        if (report.hasTotals) {
          tolov += report.debit;
          faktura += report.credit;
          saved = true;
        }
        const ms = at ? at.getTime() : 0;
        if (ms > lastMs) {
          lastMs = ms;
          lastAt = at;
          // Sanash SAQLASHDA bajarilgan. Eski hujjatda maydon yo'q → null.
          withDiff = report.diffCount;
        }
      });

      /* KIRIM yo'nalishi — AYNAN shu mantiq, boshqa ro'yxatdan.
         Alohida `kirimSaved`: bitta korxonada chiqim sverkasi
         saqlangan-u kirim yo'q bo'lishi ODATIY hol, va o'shanda
         kirim ustuni «0» emas, «—» ko'rsatishi kerak. */
      let yozilgan = 0;
      let tushgan = 0;
      let kirimSaved = false;
      income.forEach((report) => {
        const at = report.savedAtMs ? new Date(report.savedAtMs) : null;
        const reportYear = at ? at.getFullYear() : new Date().getFullYear();
        if (report.companyId !== companyId || reportYear !== selectedYear) return;
        if (report.hasTotals) {
          yozilgan += report.debit;
          tushgan += report.credit;
          kirimSaved = true;
        }
        const ms = at ? at.getTime() : 0;
        if (ms > lastMs) {
          lastMs = ms;
          lastAt = at;
        }
      });

      return {
        tolov,
        faktura,
        farq: tolov - faktura,
        saved,
        lastAt,
        withDiff,
        yozilgan,
        tushgan,
        kirimFarq: yozilgan - tushgan,
        kirimSaved,
      };
    },
    [reports, income, selectedYear]
  );

  // ➕ Yangi firma qo'shish
  const handleAddCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompanyName.trim() || !newCompanyInn.trim()) return;

    try {
      setSubmitting(true);
      setAddError("");
      setLimitHit(null);
      // Korxona SERVER orqali qo'shiladi: reja cheklovi hujjat sanog'iga
      // bog'liq va uni Firestore qoidalarida yozib bo'lmaydi.
      const res = await authFetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCompanyName.trim(), inn: newCompanyInn.trim() }),
      });
      const data = await res.json();

      if (!res.ok && data?.limitReached) {
        // Cheklov — bu XATO emas, HOLAT. Shuning uchun qizil xato
        // matni emas, tushuntirish va tugma ko'rsatiladi.
        setLimitHit({
          plan: String(data.plan || "free"),
          limit: Number(data.limit) || 0,
          current: Number(data.current) || 0,
        });
        setAddError("");
        return;
      }

      if (!res.ok) {
        // Хато ойнанинг ИЧИДА кўрсатилади. `alert()` ойнани ёпмасди ва
        // фойдаланувчи ёзганини кўрмай қоларди.
        setAddError(data.error ? t(data.error) : t("Хатолик юз берди. Қайта уриниб кўринг."));
        return;
      }

      setNewCompanyName("");
      setNewCompanyInn("");
      setIsModalOpen(false);

      await loadDashboardData();
    } catch (error) {
      console.error("Firmani saqlashda xatolik:", error);
      setAddError(t("Хатолик юз берди. Қайта уриниб кўринг."));
    } finally {
      setSubmitting(false);
    }
  };

  /** «Ko'proq kerak» bosildi. Bu — TALAB O'LCHOVI: to'lov
   *  ulanmasidan oldin nechta odam chegaraga urilganini bilish
   *  kerak. Yozuv yozilmasa, keyin bu raqamni tiklab bo'lmaydi. */
  /** A'zolar cheklovi uchun talab o'lchovi. Korxona cheklovidan
   *  alohida sanaladi — `reason` maydoni ikkalasini ajratadi. */
  const handleNeedMoreMembers = async () => {
    if (!workspaceId) return;
    try {
      await addDoc(collection(db, "plan_interest"), {
        workspaceId,
        email: user?.email || null,
        reason: "members",
        createdAt: serverTimestamp(),
      });
      notify.ok(t("Раҳмат! Тариф тайёр бўлганда хабар берамиз."));
    } catch (err) {
      console.error("Talabni yozishda xatolik:", err);
      notify.warn(t("Хабарингиз юборилмади, лекин биз билан боғланишингиз мумкин."));
    }
  };

  const handleNeedMore = async () => {
    if (!workspaceId || !limitHit) return;
    try {
      await addDoc(collection(db, "plan_interest"), {
        workspaceId,
        email: user?.email || null,
        plan: limitHit.plan,
        companiesAtRequest: limitHit.current,
        createdAt: serverTimestamp(),
      });
      setInterestSent(true);
      notify.ok(t("Раҳмат! Тариф тайёр бўлганда хабар берамиз."));
    } catch (err) {
      console.error("Talabni yozishda xatolik:", err);
      // Foydalanuvchi uchun bu ish TO'XTAMAYDI — u baribir bog'lana oladi
      setInterestSent(true);
      notify.warn(t("Хабарингиз юборилмади, лекин биз билан боғланишингиз мумкин."));
    }
  };

  // 🗑️ Firmani va unga tegishli HAMMA narsani o'chirish.
  //
  // Butun kaskad SERVERDA (`DELETE /api/companies`). Ilgari u shu yerda
  // `writeBatch` bilan bajarilardi va faqat ikkita hisobot kolleksiyasini
  // tozalardi. Klient yeta olmaydigan joylar jimgina qolib ketardi:
  // `companies/{id}` ostidagi subkolleksiyalar (birlashtirish, toifa)
  // uchun qoida umuman yo'q, `opening_balances` ni esa faqat admin
  // o'chira olardi. Sabablar to'liq route ichida yozilgan.
  const handleDeleteCompany = async (companyId: string, companyName: string) => {
    if (!confirm(`"${companyName}" — ${t("корхонасини ва унинг барча сверка ҳисоботларини бутунлай ўчириб ташламоқчимисиз?")}`)) {
      return;
    }

    try {
      setLoading(true);

      const res = await authFetch(`/api/companies?id=${encodeURIComponent(companyId)}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      await loadDashboardData();
    } catch (error) {
      console.error("O'chirishda xatolik:", error);
      notify.error(t("Ўчириб бўлмади, қайта уриниб кўринг."));
      setLoading(false);
    }
  };

  /** Нечта корхонада иш бор — йиғма қатордаги «N корхонада» шундан.
   *  Тийиндаги фарқ фарқ эмас: 1 сўмдан кичиги юмалоқлаш хатоси. */
  const attention = useMemo(() => {
    let weOwe = 0;
    let needInvoice = 0;
    let theyOwe = 0;
    let advance = 0;
    companies.forEach((c) => {
      const st = getCompanyBriefStats(c.id);
      if (st.saved && st.farq < -1) weOwe += 1;
      if (st.saved && st.farq > 1) needInvoice += 1;
      if (st.kirimSaved && st.kirimFarq > 1) theyOwe += 1;
      if (st.kirimSaved && st.kirimFarq < -1) advance += 1;
    });
    return { weOwe, needInvoice, theyOwe, advance };
  }, [companies, getCompanyBriefStats]);

  // 🔍 Qidiruv + statistika + sort - bitta zanjirda, xatosiz
  const tableRows = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const enriched = companies
      .filter((c) => c.name?.toLowerCase().includes(q) || c.inn?.includes(searchQuery.trim()))
      .map((c) => ({ ...c, ...getCompanyBriefStats(c.id) }));

    const dir = sortDir === "asc" ? 1 : -1;
    enriched.sort((a, b) => {
      switch (sortKey) {
        case "name":
          return dir * (a.name || "").localeCompare(b.name || "", "ru");
        case "inn":
          return dir * (a.inn || "").localeCompare(b.inn || "");
        case "tolov":
          return dir * (a.tolov - b.tolov);
        case "faktura":
          return dir * (a.faktura - b.faktura);
        case "farq":
          return dir * (a.farq - b.farq);
        case "kirimFarq":
          return dir * (a.kirimFarq - b.kirimFarq);
        default:
          return 0;
      }
    });
    return enriched;
  }, [companies, searchQuery, getCompanyBriefStats, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      // Raqamli ustunlar odatda kattadan-kichikka qulay
      setSortDir(key === "name" || key === "inn" ? "asc" : "desc");
    }
  };

  if (loading) {
    // Jadval SHAKLI bilan: kelayotgan narsaning o'lchami darhol ko'rinadi
    return <PageLoader shape="table" cols={6} text={t("Корхоналар юкланмоқда...")} />;
  }

  return (
    <div className={`${layout.container} ${layout.stack}`}>
      <PageHeader
        title={t("Корхоналар")}
        description={t("Мижозни танланг — ичида чиқим ва кирим сверкаси ёнма-ён туради.")}
        actions={
          <>
            <Select
              aria-label={t("Йил")}
              value={selectedYear}
              onChange={(e) => {
                setLoading(true);
                setSelectedYear(Number(e.target.value));
              }}
              className="w-auto"
            >
              <option value={2026}>2026</option>
              <option value={2025}>2025</option>
              <option value={2024}>2024</option>
            </Select>
            {/* ЖАМОА — «Бюро» режаси 5 фойдаланувчи ваъда қилади,
                лекин одам қўшиш йўли йўқ эди. */}
            <Button
              variant="secondary"
              onClick={() => setTeamOpen(true)}
              icon={<Users className="h-4 w-4" />}
              title={t("Иш майдони аъзолари")}
            >
              <span className="hidden sm:inline">{t("Жамоа")}</span>
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setAddError("");
                setIsModalOpen(true);
              }}
              icon={<Plus className="h-4 w-4" />}
            >
              {t("Корхона қўшиш")}
            </Button>
          </>
        }
      />

      {/* ============================================================
          ЙИҒМА — ЙЎНАЛИШ ТАНЛАНАДИ
          ------------------------------------------------------------
          Иккита ёндашув синаб кўрилди ва иккови ҳам ярамади:
            1. ҳар йўналиш учун учтадан карта (жами олтита) —
               саҳифа узайиб кетди, жадвалгача суриш керак бўлди;
            2. тўртта аралаш катак — қисқа бўлди, лекин қайси сон
               қайси йўналишдан экани кўринмасди.

          Энди ЙЎНАЛИШ ТАНЛАНАДИ: учала сон ҳам биттa манбадан,
          устидаги тугма қайси манба эканини айтиб туради. Ранг ҳам
          ўша йўналишники (`data-module`), яъни бухгалтер сайтнинг
          қолган жойидаги билан бир хил рангни кўради.
          ============================================================ */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-md border border-line bg-surface p-0.5">
          {(["out", "in"] as const).map((k) => (
            <button
              key={k}
              type="button"
              data-module={k}
              aria-pressed={sumDir === k}
              onClick={() => setSumDir(k)}
              className={cx(
                "rounded px-3.5 py-1.5 text-body transition-colors",
                sumDir === k
                  ? "bg-accent-soft font-medium text-accent-ink"
                  : "text-ink-2 hover:text-ink"
              )}
            >
              {t(k === "out" ? "Чиқим сверкаси" : "Кирим сверкаси")}
            </button>
          ))}
        </div>
        <p className="text-caption text-ink-3">
          {sumDir === "out"
            ? t("биз тўладикми, фактура келдими")
            : t("бизга тўлашдими, фактура ёздикми")}
        </p>
      </div>

      <SumStrip cols={3}>
        <SumCell
          label={sumDir === "out" ? t("Тўланган пул") : t("Тушган пул")}
          value={formatMoney(sumDir === "out" ? totals.tolov : totals.tushgan)}
          tone="cash"
        />
        <SumCell
          label={sumDir === "out" ? t("Келган фактура") : t("Ёзилган фактура")}
          value={formatMoney(sumDir === "out" ? totals.faktura : totals.yozilgan)}
          tone="invoice"
        />
        <SumCell
          label={t("Фарқ")}
          value={formatMoney(sumDir === "out" ? totals.farq : totals.kirimFarq)}
          tone={
            sumDir === "out"
              ? totals.farq === 0
                ? "ok"
                : totals.farq > 0
                  ? "warn"
                  : "bad"
              : totals.kirimFarq === 0
                ? "ok"
                : totals.kirimFarq > 0
                  ? "warn"
                  : "info"
          }
          /* ИЗОҲ ФАРҚНИНГ ИШОРАСИГА ҚАРАЙДИ.
             Илгари у фақат МАНФИЙ фарқни санарди: жонли синовда
             фарқ +242 млн бўлса ҳам «тўлов бўйича иш йўқ» деб
             турарди, ҳолбуки бу «фактура олиш керак» дегани.
             Энди иккала ишора ҳам ўз номи билан аталади. */
          hint={
            sumDir === "out"
              ? totals.farq < -1
                ? `${t("биз қарздормиз")} · ${attention.weOwe} ${t("корхонада")}`
                : totals.farq > 1
                  ? `${t("фактура олиш керак")} · ${attention.needInvoice} ${t("корхонада")}`
                  : t("тўлов бўйича иш йўқ")
              : totals.kirimFarq > 1
                ? `${t("бизга қарздор")} · ${attention.theyOwe} ${t("корхонада")}`
                : totals.kirimFarq < -1
                  ? `${t("аванс тушган")} · ${attention.advance} ${t("корхонада")}`
                  : t("тушум бўйича иш йўқ")
          }
        />
      </SumStrip>

      <Card padded={false}>
        <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center sm:justify-between">
          <SearchInput
            placeholder={t("Фирма номи ёки СТИР бўйича излаш...")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            wrapClassName="w-full sm:w-96"
          />
          <p className="text-caption text-ink-3">
            {t("Рақамлар САҚЛАНГАН сверкалардан олинган.")}
          </p>
        </div>

        <TableFrame className="rounded-none border-0">
          <Table>
            <Thead>
              <tr>
                <Th>
                  <SortHeader label={t("Корхона Номи")} k="name" activeKey={sortKey} dir={sortDir} onToggle={toggleSort} />
                </Th>
                <Th width="w-36">
                  <SortHeader label={t("СТИР (ИНН)")} k="inn" activeKey={sortKey} dir={sortDir} onToggle={toggleSort} />
                </Th>
                <Th align="right" width="w-48">
                  <SortHeader label={t("Тўланган пул")} k="tolov" align="right" activeKey={sortKey} dir={sortDir} onToggle={toggleSort} />
                </Th>
                <Th align="right" width="w-48">
                  <SortHeader label={t("Келган фактура")} k="faktura" align="right" activeKey={sortKey} dir={sortDir} onToggle={toggleSort} />
                </Th>
                <Th align="right" width="w-44">
                  <SortHeader label={t("Чиқим фарқи")} k="farq" align="right" activeKey={sortKey} dir={sortDir} onToggle={toggleSort} />
                </Th>
                <Th align="right" width="w-44">
                  <SortHeader label={t("Кирим фарқи")} k="kirimFarq" align="right" activeKey={sortKey} dir={sortDir} onToggle={toggleSort} />
                </Th>
                <Th align="center" width="w-44">
                  {t("Ҳолат")}
                </Th>
                <Th align="center" width="w-36">
                  {t("Ҳаракат")}
                </Th>
              </tr>
            </Thead>
            <Tbody>
              {tableRows.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <EmptyState
                      icon={<FolderOpen className="h-8 w-8" />}
                      title={t("Фирма топилмади")}
                      hint={t("Сверка қилиш учун аввал корхона қўшинг.")}
                      action={
                        <Button
                          variant="primary"
                          onClick={() => {
                            setAddError("");
                            setIsModalOpen(true);
                          }}
                          icon={<Plus className="h-4 w-4" />}
                        >
                          {t("Корхона қўшиш")}
                        </Button>
                      }
                    />
                  </td>
                </tr>
              ) : (
                tableRows.map((company) => (
                  <Tr key={company.id}>
                    <Td main>
                      <div className="flex items-center gap-2.5">
                        <Building2 className="h-4 w-4 shrink-0 text-ink-3" />
                        <span className="font-medium">{company.name}</span>
                      </div>
                    </Td>
                    <Td>
                      <Code>{company.inn}</Code>
                    </Td>
                    {company.saved ? (
                      <>
                        <NumTd tone="cash">{formatMoney(company.tolov)}</NumTd>
                        <NumTd tone="invoice">{formatMoney(company.faktura)}</NumTd>
                        <NumTd
                          strong
                          tone={company.farq === 0 ? "muted" : company.farq > 0 ? "warn" : "bad"}
                        >
                          {formatMoney(company.farq)}
                        </NumTd>
                      </>
                    ) : (
                      // Ҳисобот сақланмаган корхонада «0» кўрсатиш — жимгина
                      // ёлғон: 0 сўм айланма билан «ҳали сверка қилинмаган»
                      // бир хил кўринарди.
                      <Td colSpan={3} align="center" className="text-caption text-ink-3">
                        {t("бу йил учун сақланган сверка йўқ")}
                      </Td>
                    )}
                    {/* КИРИМ фарқи АЛОҲИДА: чиқим сверкаси сақланган-у
                        кирим сақланмаган бўлиши одатий ҳол, ва ўшанда
                        бу катакда «0» эмас, «—» туриши керак. */}
                    {company.kirimSaved ? (
                      <NumTd
                        strong
                        tone={
                          company.kirimFarq === 0
                            ? "muted"
                            : company.kirimFarq > 0
                              ? "warn"
                              : "info"
                        }
                      >
                        {formatMoney(company.kirimFarq)}
                      </NumTd>
                    ) : (
                      <Td align="center" className="text-caption text-ink-3">
                        —
                      </Td>
                    )}
                    {/* ҲОЛАТ — «шу мижозга қараш керакми». Бухгалтер
                        рўйхатни очганда биринчи кўрадиган нарса шу
                        бўлиши керак, ҳар бирига кириб чиқиш эмас. */}
                    <Td align="center" className="whitespace-nowrap">
                      {company.saved || company.kirimSaved ? (
                        <div className="flex flex-col items-center gap-1">
                          {/* НИМА ҚИЛИШ КЕРАК — сўз билан. Иккала
                              йўналишда ҳам иш бўлиши мумкин, шунинг
                              учун белги биттадан ортиқ бўлиши мумкин. */}
                          <div className="flex flex-wrap justify-center gap-1">
                            {verdicts(
                              company.farq,
                              company.kirimFarq,
                              company.saved,
                              company.kirimSaved
                            ).map((v) => (
                              <Badge key={v.text} tone={v.tone}>
                                {t(v.text)}
                              </Badge>
                            ))}
                          </div>
                          {/* Нечта контрагентда фарқ борлиги — қўшимча
                              тафсилот, шунинг учун пастда ва кичик */}
                          {company.withDiff !== null && company.withDiff > 0 && (
                            <span className="text-caption text-ink-3">
                              {company.withDiff} {t("тасида фарқ")}
                            </span>
                          )}
                          {company.lastAt && (
                            <span className="text-caption text-ink-3">
                              {(company.lastAt as Date).toLocaleDateString("ru-RU")}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-caption text-ink-3">—</span>
                      )}
                    </Td>
                    <Td align="center">
                      <div className="flex items-center justify-center gap-2">
                        <NextLink
                          href={clientPath(company.id, locale)}
                          className={buttonClasses("secondary", "sm")}
                        >
                          {t("Сверка")} <ArrowRight className="h-3.5 w-3.5" />
                        </NextLink>
                        <Button
                          variant="danger"
                          size="sm"
                          iconOnly
                          onClick={() => handleDeleteCompany(company.id, company.name)}
                          title={t("Корхонани ўчириш")}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </Td>
                  </Tr>
                ))
              )}
            </Tbody>
          </Table>
        </TableFrame>
      </Card>

      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={t("Янги Корхона Қўшиш")}
        icon={<Building2 className="h-5 w-5" />}
      >
        <form onSubmit={handleAddCompany} className="space-y-4">
          <Field label={t("Корхона Номи")} htmlFor="company-name">
            <Input
              id="company-name"
              type="text"
              required
              value={newCompanyName}
              onChange={(e) => setNewCompanyName(e.target.value)}
              placeholder="Masalan: 'Premium Trade' MChJ"
            />
          </Field>

          <Field label={t("СТИР (ИНН)")} htmlFor="company-inn">
            <Input
              id="company-inn"
              type="text"
              mono
              required
              maxLength={9}
              pattern="[0-9]{9}"
              value={newCompanyInn}
              onChange={(e) => setNewCompanyInn(e.target.value.replace(/\D/g, ""))}
              placeholder="9 xonali STIR raqami"
            />
          </Field>

          {addError && <Alert tone="bad">{addError}</Alert>}

          {/* ЧЕКЛОВГА ЕТИЛДИ — хато эмас, ҲОЛАТ */}
          {limitHit && (
            <Alert tone="info" title={t("Режа чекловига етдингиз")}>
              <p>
                {t("Ҳозирги режада")} <b>{limitHit.limit}</b> {t("тагача корхона қўшиш мумкин.")}{" "}
                {t("Сизда")} <b>{limitHit.current}</b> {t("та бор.")}
              </p>
              <p className="mt-1.5">
                {t("Корхона сонини чеклашсиз қилиш учун режани очинг:")}
              </p>
              <div className="mt-2.5">
                <PaymentBox plan="buxgalter" />
              </div>
              {/* ТЎЛАМАЙДИГАН ОДАМ ҲАМ ЙЎҚОТИЛМАЙДИ. Кимлар деворга
                  урилиб, лекин тўламагани — энг қимматли рақам: у
                  нарх юқорилигини ёки вақт эмаслигини кўрсатади. */}
              <div className="mt-2.5">
                {interestSent ? (
                  <span className="text-caption font-medium text-ok">
                    ✓ {t("Сўровингиз қайд этилди")}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleNeedMore}
                    className="text-caption text-ink-3 underline hover:text-ink-2"
                  >
                    {t("Ҳозир тўлай олмайман — кейинроқ хабар беринг")}
                  </button>
                )}
              </div>
            </Alert>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              {t("Бекор қилиш")}
            </Button>
            <Button type="submit" variant="primary" loading={submitting}>
              {t("Сақлаш")}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ИШ МАЙДОНИ АЪЗОЛАРИ */}
      <TeamModal
        open={teamOpen}
        onClose={() => setTeamOpen(false)}
        onNeedMore={handleNeedMoreMembers}
      />
    </div>
  );
}
