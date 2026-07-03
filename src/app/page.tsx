"use client";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import Link from "next/link";

// TypeScript типлари
interface Company {
  id: string;
  name: string;
  inn: string;
  createdAt: any;
}

interface SverkaReport {
  id: string;
  companyId: string;
  savedAt: any; // Firebase Timestamp
  totals: {
    debit: number;   // Чиқим (Банк)
    credit: number;  // Кирим (Счёт-фактура)
    diff: number;
  };
}

interface Stats {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
}

export default function DashboardPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [reports, setReports] = useState<SverkaReport[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);

  // Молия кўрсаткичлари
  const [stats, setStats] = useState<Stats>({ totalRevenue: 0, totalExpenses: 0, netProfit: 0 });

  // Пулларни чиройли форматда чиқариш (Масалан: 12 500 000)
  const formatMoney = (amount: number) => {
    if (!amount) return "0";
    return amount.toLocaleString("ru-RU", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
  };

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);

        // 1. Фирмаларни юклаш
        const companiesQuery = query(collection(db, "companies"), orderBy("createdAt", "desc"));
        const companiesSnapshot = await getDocs(companiesQuery);
        const companiesList = companiesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Company));
        setCompanies(companiesList);

        // 2. Сверка ҳисоботларини юклаш (sverka_reports)
        const reportsSnapshot = await getDocs(collection(db, "sverka_reports"));
        const reportsList = reportsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as SverkaReport));
        setReports(reportsList);

        // 3. Умумий молиявий таҳлилни ҳисоблаш
        calculateFinancials(reportsList, selectedYear);

      } catch (err) {
        console.error("Dashboard маълумотларини юклашда хатолик:", err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [selectedYear]);

  // Глобал ҳисоб-китоб (Барча фирмалар учун жами)
  const calculateFinancials = (reportsList: SverkaReport[], year: number) => {
    let revenue = 0; // Кирим (Credit)
    let expenses = 0; // Чиқим (Debit)

    reportsList.forEach((report) => {
      // Firebase timestamp'дан йилни ажратиб олиш
      const reportYear = report.savedAt?.toDate
        ? report.savedAt.toDate().getFullYear()
        : new Date().getFullYear();

      if (reportYear === year && report.totals) {
        revenue += Number(report.totals.credit) || 0;
        expenses += Number(report.totals.debit) || 0;
      }
    });

    setStats({
      totalRevenue: revenue,
      totalExpenses: expenses,
      netProfit: revenue - expenses
    });
  };

  // Ҳар бир фирма учун алоҳида айланмани ҳисоблаш (Жадвал учун)
  const getCompanyBriefStats = (companyId: string) => {
    let rev = 0;
    let exp = 0;

    reports.forEach(report => {
      const reportYear = report.savedAt?.toDate
        ? report.savedAt.toDate().getFullYear()
        : new Date().getFullYear();

      if (report.companyId === companyId && reportYear === selectedYear && report.totals) {
        rev += Number(report.totals.credit) || 0;
        exp += Number(report.totals.debit) || 0;
      }
    });

    return { rev, exp, profit: rev - exp };
  };

  // Қидирув бўйича филтрланган фирмалар
  const filteredCompanies = companies.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
    c.inn.includes(searchQuery.trim())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50/50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600 mb-4"></div>
        <p className="text-gray-600 font-semibold">Аудит маълумотлари юкланмоқда...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 md:p-10 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900">📊 Асосий Панель</h1>
          <p className="text-gray-500 mt-1 font-medium">Корхоналарнинг умумий молиявий ҳолати ва айланмаси</p>
        </div>

        {/* Йил фильтри */}
        <div className="flex items-center gap-3 bg-white px-5 py-2.5 border border-gray-200 rounded-xl shadow-sm">
          <span className="text-sm font-semibold text-gray-500">Ҳисобот йили:</span>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="font-bold text-gray-800 focus:outline-none cursor-pointer bg-transparent text-lg"
          >
            <option value={2026}>2026-йил</option>
            <option value={2025}>2025-йил</option>
            <option value={2024}>2024-йил</option>
          </select>
        </div>
      </div>

      {/* 📊 ГЛОБАЛ АНАЛИТИКА */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-2xl border border-green-100 shadow-sm flex items-center justify-between group hover:shadow-md transition">
          <div>
            <p className="text-sm font-bold text-green-500 uppercase tracking-wider mb-1">Умумий Кирим (Кредит)</p>
            <h3 className="text-2xl font-black text-gray-800">{formatMoney(stats.totalRevenue)} сўм</h3>
          </div>
          <div className="p-4 bg-green-50 rounded-2xl text-green-500 group-hover:scale-110 transition-transform">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-red-100 shadow-sm flex items-center justify-between group hover:shadow-md transition">
          <div>
            <p className="text-sm font-bold text-red-500 uppercase tracking-wider mb-1">Умумий Чиқим (Дебет)</p>
            <h3 className="text-2xl font-black text-gray-800">{formatMoney(stats.totalExpenses)} сўм</h3>
          </div>
          <div className="p-4 bg-red-50 rounded-2xl text-red-500 group-hover:scale-110 transition-transform">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6"></path></svg>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-sm flex items-center justify-between group hover:shadow-md transition">
          <div>
            <p className="text-sm font-bold text-indigo-500 uppercase tracking-wider mb-1">Қолдиқ (Сальдо)</p>
            <h3 className={`text-2xl font-black ${stats.netProfit >= 0 ? "text-indigo-600" : "text-amber-600"}`}>
              {formatMoney(stats.netProfit)} сўм
            </h3>
          </div>
          <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-500 group-hover:scale-110 transition-transform">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
        </div>
      </div>

      {/* 🏢 ФИРМАЛАР РЎЙХАТИ */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="relative w-full md:w-96">
            <span className="absolute inset-y-0 left-4 flex items-center text-gray-400">🔍</span>
            <input
              type="text"
              placeholder="Фирма номи ёки СТИР бўйича излаш..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition shadow-sm font-medium"
            />
          </div>

          <Link href="/companies" className="w-full md:w-auto">
            <button className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl text-sm transition shadow-md hover:shadow-lg flex items-center justify-center gap-2">
              ➕ Янги Фирма Қўшиш
            </button>
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 text-gray-500 font-bold uppercase tracking-wider text-[11px] border-b border-gray-200">
                <th className="p-5">Корхона Номи</th>
                <th className="p-5">СТИР (ИНН)</th>
                <th className="p-5 text-right">Кирим (Фактура)</th>
                <th className="p-5 text-right">Чиқим (Банк)</th>
                <th className="p-5 text-right">Сальдо</th>
                <th className="p-5 text-center">Ҳаракат</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700 font-medium text-sm">
              {filteredCompanies.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center p-12 text-gray-400">
                    <div className="text-4xl mb-3">📭</div>
                    Сиз қидирган фирма топилмади ёки ҳали фирмалар қўшилмаган.
                  </td>
                </tr>
              ) : (
                filteredCompanies.map((company) => {
                  const companyStats = getCompanyBriefStats(company.id);
                  return (
                    <tr key={company.id} className="hover:bg-indigo-50/40 transition-colors">
                      <td className="p-5">
                        <div className="font-bold text-gray-900 text-base">{company.name}</div>
                      </td>
                      <td className="p-5">
                        <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-lg font-mono tracking-wide text-xs">
                          {company.inn}
                        </span>
                      </td>
                      <td className="p-5 text-right text-green-600 font-bold whitespace-nowrap bg-green-50/30">
                        +{formatMoney(companyStats.rev)}
                      </td>
                      <td className="p-5 text-right text-red-600 font-bold whitespace-nowrap bg-red-50/30">
                        -{formatMoney(companyStats.exp)}
                      </td>
                      <td className={`p-5 text-right font-black whitespace-nowrap text-base ${companyStats.profit >= 0 ? 'text-indigo-600' : 'text-amber-600'} bg-indigo-50/20`}>
                        {formatMoney(companyStats.profit)}
                      </td>
                      <td className="p-5 text-center">
                        <Link href={`/companies/${company.id}`}>
                          <button className="bg-white border border-gray-200 hover:border-indigo-500 hover:text-indigo-600 text-gray-600 font-bold py-2 px-4 rounded-xl text-xs transition shadow-sm hover:shadow">
                            Сверкани кўриш ➡️
                          </button>
                        </Link>
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
  );
}