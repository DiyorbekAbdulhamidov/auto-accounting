"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, addDoc, serverTimestamp, doc, deleteDoc } from "firebase/firestore";
import Link from "next/navigation"; // To'g'rilandi: Next.js navigation qoidalari uchun
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
  Sun,
  Moon,
  ArrowLeft,
  X,
  Trash2
} from "lucide-react";

interface Company {
  id: string;
  name: string;
  inn: string;
  createdAt: any;
}

interface SverkaReport {
  id: string;
  companyId: string;
  savedAt: any;
  totals: { debit: number; credit: number; diff: number };
}

interface Stats {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
}

export default function ExcelAuditPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [reports, setReports] = useState<SverkaReport[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

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
      maximumFractionDigits: 2
    });
  };

  // Ma'lumotlarni Firestore'dan yuklash funksiyasi
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const companiesQuery = query(collection(db, "companies"), orderBy("createdAt", "desc"));
      const companiesSnapshot = await getDocs(companiesQuery);
      const companiesList = companiesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Company));
      setCompanies(companiesList);

      const reportsSnapshot = await getDocs(collection(db, "sverka_reports"));
      const reportsList = reportsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SverkaReport));
      setReports(reportsList);

      calculateFinancials(reportsList, selectedYear);
    } catch (err) {
      console.error("Xatolik:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [selectedYear]);

  const calculateFinancials = (reportsList: SverkaReport[], year: number) => {
    let revenue = 0;
    let expenses = 0;
    reportsList.forEach((report) => {
      const reportYear = report.savedAt?.toDate ? report.savedAt.toDate().getFullYear() : new Date().getFullYear();
      if (reportYear === year && report.totals) {
        revenue += Number(report.totals.credit) || 0;
        expenses += Number(report.totals.debit) || 0;
      }
    });
    setStats({ totalRevenue: revenue, totalExpenses: expenses, netProfit: revenue - expenses });
  };

  const getCompanyBriefStats = (companyId: string) => {
    let rev = 0;
    let exp = 0;
    reports.forEach(report => {
      const reportYear = report.savedAt?.toDate ? report.savedAt.toDate().getFullYear() : new Date().getFullYear();
      if (report.companyId === companyId && reportYear === selectedYear && report.totals) {
        rev += Number(report.totals.credit) || 0;
        exp += Number(report.totals.debit) || 0;
      }
    });
    return { rev, exp, profit: rev - exp };
  };

  // ➕ To'g'ridan-to'g'ri Firestore'ga yangi firma qo'shish funksiyasi
  const handleAddCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompanyName.trim() || !newCompanyInn.trim()) return;

    try {
      setSubmitting(true);
      await addDoc(collection(db, "companies"), {
        name: newCompanyName.trim(),
        inn: newCompanyInn.trim(),
        createdAt: serverTimestamp()
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

  // 🗑️ Firmani Firestore'dan o'chirish funksiyasi
  const handleDeleteCompany = async (companyId: string, companyName: string) => {
    if (confirm(`Ҳақиқатан ҳам "${companyName}" корхонасини тизимдан бутунлай ўчириб ташламоқчимисиз?`)) {
      try {
        setLoading(true);
        // Firestore'dan o'chirish
        await deleteDoc(doc(db, "companies", companyId));
        // Ma'lumotlarni qayta yuklash
        await loadDashboardData();
      } catch (error) {
        console.error("O'chirishda xatolik:", error);
        alert("O'chirish imkoni bo'lmadi, qayta urinib ko'ring.");
        setLoading(false);
      }
    }
  };

  const filteredCompanies = companies.filter(c =>
    c.name?.toLowerCase().includes(searchQuery.toLowerCase().trim()) || c.inn?.includes(searchQuery.trim())
  );

  if (loading) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-screen ${darkMode ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-900"}`}>
        <Loader2 className="h-12 w-12 text-indigo-600 animate-spin" />
        <p className="mt-4 font-semibold text-sm animate-pulse">Аудит маълумотлари юкланмоқда...</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50/70 text-slate-800"} p-4 md:p-8`}>
      <div className="max-w-7xl mx-auto space-y-8">

        {/* HEADER BAR */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-4">
            <NextLink href="/dashboard">
              <button className={`p-2.5 rounded-xl border transition ${darkMode ? "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </NextLink>
            <div>
              <h1 className={`text-2xl font-black ${darkMode ? "text-white" : "text-slate-900"}`}>📊 Excel Smart-Audit Муҳити</h1>
              <p className="text-xs text-slate-400">Пул маблағлари ва счёт-фактуралар фарқи таҳлили</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-1.5 border rounded-xl text-sm ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
              <Calendar className="w-4 h-4 text-slate-400" />
              <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="focus:outline-none bg-transparent font-bold cursor-pointer">
                <option value={2026} className={darkMode ? "bg-slate-900" : "bg-white"}>2026 йил</option>
                <option value={2025} className={darkMode ? "bg-slate-900" : "bg-white"}>2025 йил</option>
                <option value={2024} className={darkMode ? "bg-slate-900" : "bg-white"}>2024 йил</option>
              </select>
            </div>

            <button onClick={() => setDarkMode(!darkMode)} className={`p-2 rounded-xl border ${darkMode ? "bg-slate-900 border-slate-800 text-amber-400" : "bg-white border-slate-200 text-slate-700"}`}>
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* 📊 STATS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className={`p-6 rounded-2xl border flex items-center justify-between transition-all ${darkMode ? "bg-slate-900/50 border-slate-800/80" : "bg-white border-slate-200"}`}>
            <div className="space-y-1">
              <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Умумий Кирим (Кредит)</p>
              <h3 className={`text-2xl font-black ${darkMode ? "text-white" : "text-slate-900"}`}>{formatMoney(stats.totalRevenue)} UZS</h3>
            </div>
            <div className={`p-3 rounded-xl ${darkMode ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-50 text-emerald-600"}`}><TrendingUp className="w-5 h-5" /></div>
          </div>

          <div className={`p-6 rounded-2xl border flex items-center justify-between transition-all ${darkMode ? "bg-slate-900/50 border-slate-800/80" : "bg-white border-slate-200"}`}>
            <div className="space-y-1">
              <p className="text-xs font-bold text-rose-500 uppercase tracking-widest">Умумий Чиқим (Дебет)</p>
              <h3 className={`text-2xl font-black ${darkMode ? "text-white" : "text-slate-900"}`}>{formatMoney(stats.totalExpenses)} UZS</h3>
            </div>
            <div className={`p-3 rounded-xl ${darkMode ? "bg-rose-500/10 text-rose-400" : "bg-rose-50 text-rose-600"}`}><TrendingDown className="w-5 h-5" /></div>
          </div>

          <div className={`p-6 rounded-2xl border flex items-center justify-between transition-all ${darkMode ? "bg-slate-900/50 border-slate-800/80" : "bg-white border-slate-200"}`}>
            <div className="space-y-1">
              <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest">Қолдиқ (Сальдо)</p>
              <h3 className={`text-2xl font-black ${stats.netProfit >= 0 ? "text-indigo-600 dark:text-indigo-400" : "text-amber-500"}`}>{formatMoney(stats.netProfit)} UZS</h3>
            </div>
            <div className={`p-3 rounded-xl ${stats.netProfit >= 0 ? (darkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600') : 'bg-amber-500/10 text-amber-500'}`}><Wallet className="w-5 h-5" /></div>
          </div>
        </div>

        {/* 🏢 TABLE CONTEXT */}
        <div className={`border rounded-2xl shadow-xl overflow-hidden ${darkMode ? "bg-slate-900/30 border-slate-800/80" : "bg-white border-slate-200"}`}>
          <div className={`p-5 border-b flex flex-col sm:flex-row justify-between items-center gap-4 ${darkMode ? "border-slate-800 bg-slate-900/50" : "border-slate-100 bg-slate-50/50"}`}>
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Фирма номи ёки СТИР бўйича излаш..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-11 pr-4 py-2.5 border rounded-xl text-sm transition font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/40 ${darkMode ? "bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-500" : "bg-white border-slate-200 text-slate-800 placeholder-slate-400"}`}
              />
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 px-5 rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-md"
            >
              <Plus className="w-4 h-4" /> Янги Фирма Қўшиш
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={`font-semibold uppercase tracking-wider text-[11px] border-b ${darkMode ? "bg-slate-900/80 text-slate-400 border-slate-800" : "bg-slate-100 text-slate-500 border-slate-200"}`}>
                  <th className="p-4 pl-6">Корхона Номи</th>
                  <th className="p-4">СТИР (ИНН)</th>
                  <th className="p-4 text-right">Кирим (Фактура)</th>
                  <th className="p-4 text-right">Чиқим (Банк)</th>
                  <th className="p-4 text-right">Сальдо</th>
                  <th className="p-4 text-center pr-6">Ҳаракат</th>
                </tr>
              </thead>
              <tbody className={`divide-y font-medium text-sm ${darkMode ? "divide-slate-800/60 text-slate-300" : "divide-slate-100 text-slate-700"}`}>
                {filteredCompanies.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center p-16 text-slate-400">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <FolderOpen className="w-10 h-10 text-slate-400" />
                        <p className="text-sm">Фирма топилмади</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredCompanies.map((company) => {
                    const companyStats = getCompanyBriefStats(company.id);
                    return (
                      <tr key={company.id} className={`transition-colors group ${darkMode ? "hover:bg-slate-900/40" : "hover:bg-indigo-50/30"}`}>
                        <td className="p-4 pl-6">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${darkMode ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-500"}`}>
                              <Building2 className="w-4 h-4" />
                            </div>
                            <span className={`font-bold text-base ${darkMode ? "text-slate-100" : "text-slate-900"}`}>{company.name}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`border px-2.5 py-1 rounded-md font-mono text-xs ${darkMode ? "bg-slate-950 border-slate-800 text-slate-400" : "bg-white border-slate-200 text-slate-600"}`}>
                            {company.inn}
                          </span>
                        </td>
                        <td className={`p-4 text-right text-emerald-500 font-bold ${darkMode ? "bg-emerald-500/[0.02]" : "bg-emerald-50/[0.2]"}`}>
                          +{formatMoney(companyStats.rev)}
                        </td>
                        <td className={`p-4 text-right text-rose-500 font-bold ${darkMode ? "bg-rose-500/[0.02]" : "bg-rose-50/[0.2]"}`}>
                          -{formatMoney(companyStats.exp)}
                        </td>
                        <td className={`p-4 text-right font-black text-base ${companyStats.profit >= 0 ? (darkMode ? 'text-indigo-400' : 'text-indigo-600') : 'text-amber-500'}`}>
                          {formatMoney(companyStats.profit)}
                        </td>
                        <td className="p-4 text-center pr-6">
                          <div className="flex items-center justify-center gap-2">
                            <NextLink href={`excel-audit/companies/${company.id}`}>
                              <button className={`inline-flex items-center gap-1.5 border font-semibold py-1.5 px-3.5 rounded-lg text-xs transition-all ${darkMode ? "bg-slate-900 border-slate-800 text-slate-400 hover:text-indigo-400" : "bg-white border-slate-200 text-slate-600 hover:text-indigo-600"}`}>
                                Сверка <ArrowRight className="w-3 h-3" />
                              </button>
                            </NextLink>

                            {/* 🗑️ O'chirish tugmasi */}
                            <button
                              onClick={() => handleDeleteCompany(company.id, company.name)}
                              className={`p-1.5 rounded-lg border transition-all ${darkMode
                                  ? "bg-slate-900 border-slate-800 text-slate-500 hover:text-rose-400 hover:border-rose-500/30"
                                  : "bg-white border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200"
                                }`}
                              title="Корхонани ўчириш"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* 📥 YANGI FIRMA QO'SHISH MODAL OYNASI (POPUP) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-md p-6 rounded-2xl border shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200 ${darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
            }`}>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-500" />
                <h3 className="text-lg font-bold tracking-tight">Янги Корхона Қўшиш</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-500/10 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCompany} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider block mb-2 opacity-70">Корхона Номи</label>
                <input
                  type="text"
                  required
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                  placeholder="Masalan: 'Premium Trade' MChJ"
                  className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all ${darkMode
                      ? "bg-slate-950 border-slate-800 focus:border-indigo-500 text-white placeholder-slate-600"
                      : "bg-slate-50 border-slate-200 focus:border-indigo-600 text-slate-900 placeholder-slate-400"
                    }`}
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider block mb-2 opacity-70">СТИР (ИНН)</label>
                <input
                  type="text"
                  required
                  maxLength={9}
                  pattern="[0-9]{9}"
                  value={newCompanyInn}
                  onChange={(e) => setNewCompanyInn(e.target.value.replace(/\D/g, ""))}
                  placeholder="9 xonali STIR raqami"
                  className={`w-full px-4 py-3 rounded-xl border font-mono text-sm outline-none transition-all ${darkMode
                      ? "bg-slate-950 border-slate-800 focus:border-indigo-500 text-white placeholder-slate-600"
                      : "bg-slate-50 border-slate-200 focus:border-indigo-600 text-slate-900 placeholder-slate-400"
                    }`}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition ${darkMode ? "border-slate-800 hover:bg-slate-800" : "border-slate-200 hover:bg-slate-50"
                    }`}
                >
                  Бекор қилиш
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-500 disabled:opacity-50 transition-colors shadow-lg shadow-indigo-600/20 flex items-center gap-1.5"
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