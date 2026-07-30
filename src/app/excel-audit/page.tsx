"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, addDoc, serverTimestamp, doc, where, writeBatch } from "firebase/firestore";
import NextLink from "next/link";
import {
  Building2,
  Search,
  Plus,
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowRight,
  Calendar,
  FolderOpen,
  Loader2,
  ArrowLeft,
  X,
  Trash2,
} from "lucide-react";
import SortHeader from "@/components/SortHeader";
import ThemeToggle from "@/components/ThemeToggle";

interface Company {
  id: string;
  name: string;
  inn: string;
  createdAt: unknown;
}

interface SverkaReport {
  id: string;
  companyId: string;
  savedAt: { toDate?: () => Date } | null;
  totals: { debit: number; credit: number; diff: number };
}

interface Stats {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
}

type SortKey = "name" | "inn" | "rev" | "exp" | "profit";
type SortDir = "asc" | "desc";

export default function ExcelAuditPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [reports, setReports] = useState<SverkaReport[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);

  // 🔽 Jadval sortlash holati
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  // 🪟 Modal oynasi va form uchun steytlar
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newCompanyInn, setNewCompanyInn] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [stats, setStats] = useState<Stats>({ totalRevenue: 0, totalExpenses: 0, netProfit: 0 });

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
  const calculateFinancials = useCallback(
    (reportsList: SverkaReport[], year: number, companiesList: Company[]) => {
      const liveCompanyIds = new Set(companiesList.map((c) => c.id));
      let revenue = 0;
      let expenses = 0;
      reportsList.forEach((report) => {
        if (!liveCompanyIds.has(report.companyId)) return;
        const reportYear = report.savedAt?.toDate ? report.savedAt.toDate().getFullYear() : new Date().getFullYear();
        if (reportYear === year && report.totals) {
          revenue += Number(report.totals.credit) || 0;
          expenses += Number(report.totals.debit) || 0;
        }
      });
      setStats({ totalRevenue: revenue, totalExpenses: expenses, netProfit: revenue - expenses });
    },
    []
  );

  // Ma'lumotlarni Firestore'dan yuklash funksiyasi.
  // MUHIM: setLoading(true) bu yerda chaqirilmaydi (effect ichida sinxron
  // setState taqiqlangan) - spinner kerak joyda event handler yoqadi.
  const loadDashboardData = useCallback(async () => {
    try {
      const companiesQuery = query(collection(db, "companies"), orderBy("createdAt", "desc"));
      const companiesSnapshot = await getDocs(companiesQuery);
      const companiesList = companiesSnapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Company));
      setCompanies(companiesList);

      const reportsSnapshot = await getDocs(collection(db, "sverka_reports"));
      const reportsList = reportsSnapshot.docs.map((d) => ({ id: d.id, ...d.data() } as SverkaReport));
      setReports(reportsList);

      calculateFinancials(reportsList, selectedYear, companiesList);
    } catch (err) {
      console.error("Xatolik:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedYear, calculateFinancials]);

  useEffect(() => {
    async function load() {
      await loadDashboardData();
    }
    load();
  }, [loadDashboardData]);

  const getCompanyBriefStats = useCallback(
    (companyId: string) => {
      let rev = 0;
      let exp = 0;
      reports.forEach((report) => {
        const reportYear = report.savedAt?.toDate ? report.savedAt.toDate().getFullYear() : new Date().getFullYear();
        if (report.companyId === companyId && reportYear === selectedYear && report.totals) {
          rev += Number(report.totals.credit) || 0;
          exp += Number(report.totals.debit) || 0;
        }
      });
      return { rev, exp, profit: rev - exp };
    },
    [reports, selectedYear]
  );

  // ➕ To'g'ridan-to'g'ri Firestore'ga yangi firma qo'shish funksiyasi
  const handleAddCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompanyName.trim() || !newCompanyInn.trim()) return;

    try {
      setSubmitting(true);
      await addDoc(collection(db, "companies"), {
        name: newCompanyName.trim(),
        inn: newCompanyInn.trim(),
        createdAt: serverTimestamp(),
      });

      setNewCompanyName("");
      setNewCompanyInn("");
      setIsModalOpen(false);

      await loadDashboardData();
    } catch (error) {
      console.error("Firmani saqlashda xatolik:", error);
      alert("Xatolik yuz berdi. Qayta urinib ko'ring.");
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
    if (!confirm(`Ҳақиқатан ҳам "${companyName}" корхонасини ва унинг барча сверка ҳисоботларини бутунлай ўчириб ташламоқчимисиз?`)) {
      return;
    }

    try {
      setLoading(true);

      const reportsSnap = await getDocs(
        query(collection(db, "sverka_reports"), where("companyId", "==", companyId))
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
      alert("O'chirish imkoni bo'lmadi, qayta urinib ko'ring.");
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
        case "rev":
          return dir * (a.rev - b.rev);
        case "exp":
          return dir * (a.exp - b.exp);
        case "profit":
          return dir * (a.profit - b.profit);
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
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white">
        <Loader2 className="h-12 w-12 text-indigo-500 animate-spin" />
        <p className="mt-4 font-semibold text-sm animate-pulse text-slate-500 dark:text-slate-400">Аудит маълумотлари юкланмоқда...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 md:p-8 relative overflow-hidden">
      {/* Orqa fon bezaklari */}
      <div className="anim-blob absolute top-[-100px] right-[-100px] w-[600px] h-[300px] bg-indigo-500/[0.07] blur-[130px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        {/* HEADER BAR */}
        <div className="anim-fade flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-5 border-b border-slate-200 dark:border-slate-800/80">
          <div className="flex items-center gap-4">
            <NextLink href="/">
              <button className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 hover:-translate-x-0.5">
                <ArrowLeft className="w-4 h-4" />
              </button>
            </NextLink>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                📊 Excel Smart-Audit Муҳити
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">Пул маблағлари ва счёт-фактуралар фарқи таҳлили</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 rounded-xl text-sm">
              <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <select
                value={selectedYear}
                onChange={(e) => {
                  setLoading(true);
                  setSelectedYear(Number(e.target.value));
                }}
                className="focus:outline-none bg-transparent font-bold cursor-pointer text-slate-700 dark:text-slate-200"
              >
                <option value={2026} className="bg-slate-100 dark:bg-slate-900">2026 йил</option>
                <option value={2025} className="bg-slate-100 dark:bg-slate-900">2025 йил</option>
                <option value={2024} className="bg-slate-100 dark:bg-slate-900">2024 йил</option>
              </select>
            </div>
            <ThemeToggle />
          </div>
        </div>

        {/* 📊 STATS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="anim-fade-up delay-1 surface p-6 flex items-center justify-between transition-all duration-300 hover:border-emerald-500/30 hover:-translate-y-1">
            <div className="space-y-1.5">
              <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Умумий Кирим (Кредит)</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tabular">{formatMoney(stats.totalRevenue)} <span className="text-sm text-slate-500 font-bold">UZS</span></h3>
            </div>
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          <div className="anim-fade-up delay-2 surface p-6 flex items-center justify-between transition-all duration-300 hover:border-rose-500/30 hover:-translate-y-1">
            <div className="space-y-1.5">
              <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-widest">Умумий Чиқим (Дебет)</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tabular">{formatMoney(stats.totalExpenses)} <span className="text-sm text-slate-500 font-bold">UZS</span></h3>
            </div>
            <div className="p-3.5 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>

          <div className="anim-fade-up delay-3 surface p-6 flex items-center justify-between transition-all duration-300 hover:border-indigo-500/30 hover:-translate-y-1">
            <div className="space-y-1.5">
              <p className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Қолдиқ (Сальдо)</p>
              <h3 className={`text-2xl font-black tabular ${stats.netProfit >= 0 ? "text-indigo-600 dark:text-indigo-400" : "text-amber-600 dark:text-amber-400"}`}>
                {formatMoney(stats.netProfit)} <span className="text-sm text-slate-500 font-bold">UZS</span>
              </h3>
            </div>
            <div className={`p-3.5 rounded-2xl border ${stats.netProfit >= 0 ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20" : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"}`}>
              <Wallet className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* 🏢 TABLE */}
        <div className="anim-fade-up delay-4 surface overflow-hidden">
          <div className="p-5 border-b border-slate-200 dark:border-slate-800/80 bg-slate-100/60 dark:bg-slate-900/40 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
              <input
                type="text"
                placeholder="Фирма номи ёки СТИР бўйича излаш..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/70 rounded-xl text-sm font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 transition-all duration-300 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-5 rounded-xl text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 active:scale-95"
            >
              <Plus className="w-4 h-4" /> Янги Фирма Қўшиш
            </button>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60">
                  <th className="p-4 pl-6"><SortHeader label="Корхона Номи" k="name" activeKey={sortKey} dir={sortDir} onToggle={toggleSort} /></th>
                  <th className="p-4"><SortHeader label="СТИР (ИНН)" k="inn" activeKey={sortKey} dir={sortDir} onToggle={toggleSort} /></th>
                  <th className="p-4 text-right"><SortHeader label="Кирим (Фактура)" k="rev" align="right" activeKey={sortKey} dir={sortDir} onToggle={toggleSort} /></th>
                  <th className="p-4 text-right"><SortHeader label="Чиқим (Банк)" k="exp" align="right" activeKey={sortKey} dir={sortDir} onToggle={toggleSort} /></th>
                  <th className="p-4 text-right"><SortHeader label="Сальдо" k="profit" align="right" activeKey={sortKey} dir={sortDir} onToggle={toggleSort} /></th>
                  <th className="p-4 text-center pr-6 uppercase tracking-wider text-[11px] font-bold text-slate-500">Ҳаракат</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-medium text-sm text-slate-700 dark:text-slate-300">
                {tableRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center p-16 text-slate-500">
                      <div className="anim-fade flex flex-col items-center justify-center space-y-2">
                        <FolderOpen className="w-10 h-10 text-slate-400 dark:text-slate-600" />
                        <p className="text-sm">Фирма топилмади</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  tableRows.map((company, idx) => (
                    <tr
                      key={company.id}
                      className="anim-fade transition-colors group hover:bg-indigo-500/[0.04]"
                      style={{ animationDelay: `${Math.min(idx, 10) * 0.03}s` }}
                    >
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-slate-200 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 group-hover:bg-indigo-500/15 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            <Building2 className="w-4 h-4" />
                          </div>
                          <span className="font-bold text-base text-slate-900 dark:text-slate-100">{company.name}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/70 px-2.5 py-1 rounded-md font-mono text-xs text-slate-500 dark:text-slate-400">
                          {company.inn}
                        </span>
                      </td>
                      <td className="p-4 text-right text-emerald-600 dark:text-emerald-400 font-bold tabular">+{formatMoney(company.rev)}</td>
                      <td className="p-4 text-right text-rose-600 dark:text-rose-400 font-bold tabular">-{formatMoney(company.exp)}</td>
                      <td className={`p-4 text-right font-black text-base tabular ${company.profit >= 0 ? "text-indigo-600 dark:text-indigo-400" : "text-amber-600 dark:text-amber-400"}`}>
                        {formatMoney(company.profit)}
                      </td>
                      <td className="p-4 text-center pr-6">
                        <div className="flex items-center justify-center gap-2">
                          <NextLink href={`excel-audit/companies/${company.id}`}>
                            <button className="inline-flex items-center gap-1.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 font-semibold py-1.5 px-3.5 rounded-lg text-xs text-slate-500 dark:text-slate-400 transition-all duration-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-500/40 hover:-translate-y-0.5">
                              Сверка <ArrowRight className="w-3 h-3" />
                            </button>
                          </NextLink>

                          <button
                            onClick={() => handleDeleteCompany(company.id, company.name)}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 text-slate-500 transition-all duration-300 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-500/30"
                            title="Корхонани ўчириш"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 📥 YANGI FIRMA QO'SHISH MODAL OYNASI */}
      {isModalOpen && (
        <div className="anim-fade fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="anim-scale w-full max-w-md p-6 surface glow-indigo space-y-4 text-slate-900 dark:text-white">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-lg font-bold tracking-tight">Янги Корхона Қўшиш</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCompany} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider block mb-2 text-slate-500 dark:text-slate-400">Корхона Номи</label>
                <input
                  type="text"
                  required
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                  placeholder="Masalan: 'Premium Trade' MChJ"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/70 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 outline-none transition-all duration-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider block mb-2 text-slate-500 dark:text-slate-400">СТИР (ИНН)</label>
                <input
                  type="text"
                  required
                  maxLength={9}
                  pattern="[0-9]{9}"
                  value={newCompanyInn}
                  onChange={(e) => setNewCompanyInn(e.target.value.replace(/\D/g, ""))}
                  placeholder="9 xonali STIR raqami"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/70 font-mono text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 outline-none transition-all duration-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all duration-300"
                >
                  Бекор қилиш
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-500 disabled:opacity-50 transition-all duration-300 shadow-lg shadow-indigo-600/25 flex items-center gap-1.5 active:scale-95"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Сақлаш
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
