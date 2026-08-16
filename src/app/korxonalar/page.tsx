// ============================================================
// КОРХОНАЛАР — ИККАЛА сверка учун БИТТА рўйхат
// ------------------------------------------------------------
// Илгари корхоналар фақат чиқим сверкасида бор эди (`/excel-audit`),
// кирим сверкаси эса корхонасиз мустақил саҳифа эди. Буxгалтер учун
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
import { useAuth } from "@/context/AuthContext";
import { collection, getDocs, query, doc, where, writeBatch } from "firebase/firestore";
import NextLink from "next/link";
import { Building2, Plus, ArrowRight, FolderOpen, Trash2 } from "lucide-react";
import SortHeader from "@/components/SortHeader";
import { useT } from "@/context/LanguageContext";
import {
  Alert,
  Button,
  Card,
  Code,
  EmptyState,
  Field,
  Input,
  Modal,
  NumTd,
  PageHeader,
  PageLoader,
  SearchInput,
  Select,
  StatCard,
  Table,
  TableFrame,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  buttonClasses,
  layout,
} from "@/components/ui";

interface Company {
  id: string;
  name: string;
  inn: string;
  createdAt?: { toMillis?: () => number };
}

interface SverkaReport {
  id: string;
  companyId: string;
  savedAt: { toDate?: () => Date } | null;
  totals: { debit: number; credit: number; diff: number };
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
}

type SortKey = "name" | "inn" | "tolov" | "faktura" | "farq";
type SortDir = "asc" | "desc";

export default function KorxonalarPage() {
  const t = useT();
  // Ish maydoni `allowed_users/{email}` hujjatidan keladi (AuthContext uni
  // foydalanuvchi obyektiga qo'shib beradi). Barcha o'qish/yozish shunga
  // bog'lanadi — ma'lumot egasiz qolmasligi kerak.
  const { user } = useAuth();
  const workspaceId: string | undefined = user?.workspaceId;
  const [companies, setCompanies] = useState<Company[]>([]);
  const [reports, setReports] = useState<SverkaReport[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);

  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newCompanyInn, setNewCompanyInn] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [addError, setAddError] = useState("");

  const [totals, setTotals] = useState<Totals>({ tolov: 0, faktura: 0, farq: 0 });

  const formatMoney = (amount: number) => {
    if (!amount) return "0";
    return amount.toLocaleString("ru-RU", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  // MUHIM: faqat MAVJUD firmalarning hisobotlari qo'shiladi. Firma o'chirilgan-u
  // hisoboti qolib ketgan bo'lsa ("yetim" hisobot), u umumiy summaga kirmasligi kerak —
  // aks holda ro'yxat bo'sh bo'lsa ham yuqorida raqam turaveradi.
  const calculateTotals = useCallback(
    (reportsList: SverkaReport[], year: number, companiesList: Company[]) => {
      const liveCompanyIds = new Set(companiesList.map((c) => c.id));
      let tolov = 0;
      let faktura = 0;
      reportsList.forEach((report) => {
        if (!liveCompanyIds.has(report.companyId)) return;
        const reportYear = report.savedAt?.toDate ? report.savedAt.toDate().getFullYear() : new Date().getFullYear();
        if (reportYear === year && report.totals) {
          tolov += Number(report.totals.debit) || 0;
          faktura += Number(report.totals.credit) || 0;
        }
      });
      setTotals({ tolov, faktura, farq: tolov - faktura });
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

      const reportsSnapshot = await getDocs(
        query(collection(db, "sverka_reports"), where("workspaceId", "==", workspaceId))
      );
      const reportsList = reportsSnapshot.docs.map((d) => ({ id: d.id, ...d.data() } as SverkaReport));
      setReports(reportsList);

      calculateTotals(reportsList, selectedYear, companiesList);
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
      reports.forEach((report) => {
        const reportYear = report.savedAt?.toDate ? report.savedAt.toDate().getFullYear() : new Date().getFullYear();
        if (report.companyId === companyId && reportYear === selectedYear && report.totals) {
          tolov += Number(report.totals.debit) || 0;
          faktura += Number(report.totals.credit) || 0;
          saved = true;
        }
      });
      return { tolov, faktura, farq: tolov - faktura, saved };
    },
    [reports, selectedYear]
  );

  // ➕ Yangi firma qo'shish
  const handleAddCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompanyName.trim() || !newCompanyInn.trim()) return;

    try {
      setSubmitting(true);
      setAddError("");
      // Korxona SERVER orqali qo'shiladi: reja cheklovi hujjat sanog'iga
      // bog'liq va uni Firestore qoidalarida yozib bo'lmaydi.
      const res = await authFetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCompanyName.trim(), inn: newCompanyInn.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        // Хато ойнанинг ИЧИДА кўрсатилади. `alert()` ойнани ёпмасди ва
        // фойдаланувчи ёзганини кўрмай қоларди.
        setAddError(data.error || t("Хатолик юз берди. Қайта уриниб кўринг."));
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

  // 🗑️ Firmani va uning BARCHA sverka hisobotlarini o'chirish.
  //
  // Firestore'da kaskad o'chirish YO'Q — firma hujjatini o'chirish uning
  // `sverka_reports` yozuvlarini o'chirmaydi. Ular qolib ketsa, firma
  // ro'yxatdan yo'qolgani bilan summalari tizimda osilib qoladi.
  const handleDeleteCompany = async (companyId: string, companyName: string) => {
    if (!confirm(`"${companyName}" — ${t("корхонасини ва унинг барча сверка ҳисоботларини бутунлай ўчириб ташламоқчимисиз?")}`)) {
      return;
    }

    try {
      setLoading(true);

      const reportsSnap = await getDocs(
        query(
          collection(db, "sverka_reports"),
          where("workspaceId", "==", workspaceId),
          where("companyId", "==", companyId)
        )
      );

      // Bitta batch'da 500 tagacha amal bo'ladi — bo'laklarga bo'lamiz
      const refs = reportsSnap.docs.map((d) => d.ref);
      const CHUNK = 450;
      for (let i = 0; i < refs.length; i += CHUNK) {
        const batch = writeBatch(db);
        refs.slice(i, i + CHUNK).forEach((ref) => batch.delete(ref));
        await batch.commit();
      }

      // Hisobotlar o'chgandan keyingina firmaning o'zini o'chiramiz —
      // oradan uzilib qolsa, yetim hisobot emas, qayta urinsa bo'ladigan holat qoladi
      const finalBatch = writeBatch(db);
      finalBatch.delete(doc(db, "companies", companyId));
      await finalBatch.commit();

      await loadDashboardData();
    } catch (error) {
      console.error("O'chirishda xatolik:", error);
      alert(t("Ўчириб бўлмади, қайта уриниб кўринг."));
      setLoading(false);
    }
  };

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
    return <PageLoader text={t("Корхоналар юкланмоқда...")} />;
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

      {/* Yig'ma ko'rsatkichlar — SAQLANGAN chiqim sverkalari bo'yicha */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          label={t("Тўланган пул")}
          value={formatMoney(totals.tolov)}
          unit="UZS"
          tone="cash"
        />
        <StatCard
          label={t("Келган фактура")}
          value={formatMoney(totals.faktura)}
          unit="UZS"
          tone="invoice"
        />
        <StatCard
          label={t("Фарқ")}
          value={formatMoney(totals.farq)}
          unit="UZS"
          tone={totals.farq === 0 ? "ok" : totals.farq > 0 ? "warn" : "bad"}
          hint={t("тўланган пул − келган фактура")}
        />
      </div>

      <Card padded={false}>
        <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center sm:justify-between">
          <SearchInput
            placeholder={t("Фирма номи ёки СТИР бўйича излаш...")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            wrapClassName="w-full sm:w-96"
          />
          <p className="text-caption text-ink-3">
            {t("Рақамлар САҚЛАНГАН чиқим сверкаларидан олинган.")}
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
                  <SortHeader label={t("Фарқ")} k="farq" align="right" activeKey={sortKey} dir={sortDir} onToggle={toggleSort} />
                </Th>
                <Th align="center" width="w-36">
                  {t("Ҳаракат")}
                </Th>
              </tr>
            </Thead>
            <Tbody>
              {tableRows.length === 0 ? (
                <tr>
                  <td colSpan={6}>
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
                    <Td align="center">
                      <div className="flex items-center justify-center gap-2">
                        <NextLink
                          href={`/korxonalar/${company.id}`}
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
    </div>
  );
}
