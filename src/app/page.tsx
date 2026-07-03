"use client";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import Link from "next/link";

export default function DashboardPage() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);

  // Moliya ko'rsatkichlari statelari
  const [stats, setStats] = useState({ totalRevenue: 0, totalExpenses: 0, netProfit: 0 });

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);

        // 1. Firmalarni yuklash
        const companiesQuery = query(collection(db, "companies"), orderBy("createdAt", "desc"));
        const companiesSnapshot = await getDocs(companiesQuery);
        const companiesList = companiesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCompanies(companiesList);

        // 2. Tranzaksiyalarni yuklash
        const txSnapshot = await getDocs(collection(db, "transactions"));
        const txList = txSnapshot.docs.map(doc => doc.data());
        setTransactions(txList);

        // 3. Umumiy moliya tahlilini hisoblash (Tanlangan yil uchun)
        calculateFinancials(txList, selectedYear);

      } catch (err) {
        console.error("Dashboard yuklanishida xatolik:", err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [selectedYear]);

  // Moliyaviy hisob-kitob funksiyasi
  const calculateFinancials = (txList: any[], year: number) => {
    let revenue = 0;
    let expenses = 0;

    txList.forEach((tx) => {
      if (Number(tx.periodYear) === year) {
        revenue += Number(tx.creditAmount) || 0;
        expenses += Number(tx.debitAmount) || 0;
      }
    });

    setStats({
      totalRevenue: revenue,
      totalExpenses: expenses,
      netProfit: revenue - expenses
    });
  };

  // Har bir firma uchun alohida aylanmani hisoblash yordamchisi
  const getCompanyBriefStats = (companyId: string) => {
    let rev = 0;
    let exp = 0;
    transactions.forEach(tx => {
      if (tx.companyId === companyId && Number(tx.periodYear) === selectedYear) {
        rev += Number(tx.creditAmount) || 0;
        exp += Number(tx.debitAmount) || 0;
      }
    });
    return { rev, exp, profit: rev - exp };
  };

  // Qidiruv bo'yicha filtrlangan firmalar
  const filteredCompanies = companies.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.inn.includes(searchQuery)
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <p className="mt-4 text-gray-600 font-medium">Buxgalteriya tizimi yuklanmoqda...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 md:p-10 max-w-7xl mx-auto">

      {/* Sahifa Tepasi (Header) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">👋 Xush kelibsiz!</h1>
          {/* <p className="text-gray-500 text-sm">30-40 ta firmaning 6 oylik va yillik moliyaviy audit platformasi</p> */}
        </div>

        {/* Yil bo'yicha global filtr */}
        <div className="flex items-center gap-2 bg-white px-4 py-2 border rounded-xl shadow-sm">
          <span className="text-sm font-semibold text-gray-500">Hisobot yili:</span>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="font-bold text-gray-800 focus:outline-none cursor-pointer bg-transparent"
          >
            <option value={2026}>2026-yil</option>
            <option value={2025}>2025-yil</option>
            <option value={2024}>2024-yil</option>
          </select>
        </div>
      </div>

      {/* 📊 GLOBAL ANALITIKA VIDJETLARI (Barcha firmalar bo'yicha jami) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {/* Kirim Kartasi */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-400 uppercase tracking-wider">Umumiy Tushum (Kirim)</p>
            <h3 className="text-2xl font-bold text-green-600 mt-1">{stats.totalRevenue.toLocaleString()} UZS</h3>
          </div>
          <span className="p-3 bg-green-50 rounded-xl text-2xl">📈</span>
        </div>

        {/* Chiqim Kartasi */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-400 uppercase tracking-wider">Umumiy Xarajatlar (Chiqim)</p>
            <h3 className="text-2xl font-bold text-red-600 mt-1">{stats.totalExpenses.toLocaleString()} UZS</h3>
          </div>
          <span className="p-3 bg-red-50 rounded-xl text-2xl">📉</span>
        </div>

        {/* Sof Foyda Kartasi */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-400 uppercase tracking-wider">Sof Foyda (Balans)</p>
            <h3 className={`text-2xl font-bold mt-1 ${stats.netProfit >= 0 ? "text-indigo-600" : "text-amber-600"}`}>
              {stats.netProfit.toLocaleString()} UZS
            </h3>
          </div>
          <span className="p-3 bg-indigo-50 rounded-xl text-2xl">💰</span>
        </div>
      </div>

      {/* 🏢 FIRMALARNI BOSHQARISH BO'LIMI */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">

        {/* Qidiruv va Yangi Firma Qo'shish Tugmasi */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
          <div className="relative w-full md:w-96">
            <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">🔍</span>
            <input
              type="text"
              placeholder="Firma nomi yoki INN bo'yicha qidirish..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-gray-50/50"
            />
          </div>

          <Link href="/companies" className="w-full md:w-auto">
            <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-5 rounded-xl text-sm transition shadow-md shadow-indigo-600/10 flex items-center justify-center gap-2">
              ➕ Yangi Firma Qoʻshish
            </button>
          </Link>
        </div>

        {/* Firmalar Ro'yxati Jadvali */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400 font-semibold uppercase tracking-wider text-xs bg-gray-50/70">
                <th className="p-4 rounded-l-xl">Kompaniya Nomi</th>
                <th className="p-4">INN</th>
                <th className="p-4 text-right">Kirim ({selectedYear})</th>
                <th className="p-4 text-right">Chiqim ({selectedYear})</th>
                <th className="p-4 text-right">Sof Foyda</th>
                <th className="p-4 rounded-r-xl text-center">Harakat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-gray-700 font-medium">
              {filteredCompanies.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center p-8 text-gray-400">
                    Siz qidirgan firma topilmadi yoki hali firmalar qo'shilmagan.
                  </td>
                </tr>
              ) : (
                filteredCompanies.map((company) => {
                  const companyStats = getCompanyBriefStats(company.id);
                  return (
                    <tr key={company.id} className="hover:bg-gray-50/80 transition">
                      <td className="p-4">
                        <div className="font-bold text-gray-900">{company.name}</div>
                        <span className="text-xs text-gray-400">Tizimga kiritilgan: {new Date(company.createdAt).toLocaleDateString()}</span>
                      </td>
                      <td className="p-4 text-gray-500 font-mono">{company.inn}</td>
                      <td className="p-4 text-right text-green-600 font-semibold">+{companyStats.rev.toLocaleString()} UZS</td>
                      <td className="p-4 text-right text-red-600 font-semibold">-{companyStats.exp.toLocaleString()} UZS</td>
                      <td className={`p-4 text-right font-bold ${companyStats.profit >= 0 ? 'text-indigo-600' : 'text-amber-600'}`}>
                        {companyStats.profit.toLocaleString()} UZS
                      </td>
                      <td className="p-4 text-center">
                        <Link href={`/companies/${company.id}`}>
                          <button className="bg-gray-100 hover:bg-indigo-50 hover:text-indigo-600 text-gray-600 font-bold py-1.5 px-4 rounded-lg text-xs transition">
                            Ichiga kirish & Excel yuklash ➡️
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