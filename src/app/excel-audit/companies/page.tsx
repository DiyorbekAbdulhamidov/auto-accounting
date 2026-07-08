// src/app/companies/page.tsx
"use client";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, query, orderBy } from "firebase/firestore";
import Link from "next/link";

export default function CompaniesPage() {
  const [name, setName] = useState("");
  const [inn, setInn] = useState("");
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Firmalarni yuklab olish
  const fetchCompanies = async () => {
    const q = query(collection(db, "companies"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    const list = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setCompanies(list);
  };

  useEffect(() => { fetchCompanies(); }, []);

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !inn) return;
    setLoading(true);

    try {
      await addDoc(collection(db, "companies"), {
        name: name.trim(),
        inn: inn.trim(),
        createdAt: new Date().toISOString()
      });
      setName("");
      setInn("");
      fetchCompanies(); // Ro'yxatni yangilash
    } catch (err) {
      console.error("Firma qo'shishda xato:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6">
      <div className="bg-white p-6 rounded-xl shadow-md border mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4">🏢 Yangi Firma Qoʻshish</h2>
        <form onSubmit={handleCreateCompany} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700">Firma Nomi</label>
            <input
              type="text" required value={name} onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="MCHJ Best Alfa"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Firma INN</label>
            <input
              type="text" required value={inn} onChange={(e) => setInn(e.target.value)}
              className="mt-1 w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="123456789"
            />
          </div>
          <button
            type="submit" disabled={loading}
            className="bg-indigo-600 text-white p-2.5 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:bg-gray-400"
          >
            {loading ? "Saqlanmoqda..." : "Firmani Bazaga Qo'shish"}
          </button>
        </form>
      </div>

      <h3 className="text-lg font-bold text-gray-700 mb-4">Mavjud Firmalar Ro'yxati ({companies.length} ta)</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {companies.map((company) => (
          <Link href={`/companies/${company.id}`} key={company.id}>
            <div className="p-4 bg-white rounded-xl border hover:border-indigo-500 transition cursor-pointer shadow-sm flex justify-between items-center group">
              <div>
                <h4 className="font-bold text-gray-800 group-hover:text-indigo-600">{company.name}</h4>
                <p className="text-sm text-gray-500">INN: {company.inn}</p>
              </div>
              <span className="text-gray-400 group-hover:translate-x-1 transition-transform">➡️</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}