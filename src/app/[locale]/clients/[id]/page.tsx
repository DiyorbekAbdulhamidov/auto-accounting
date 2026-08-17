// ============================================================
// БИТТА КОРХОНА — иккала сверка ёнма-ён
// ------------------------------------------------------------
// Йўналиш энди САҲИФА эмас, ТАБ. Бухгалтер учун «шу мижозни
// солиштир» — битта иш; илгари эса чиқим бир саҳифада, кирим
// бутунлай бошқасида, ўз луғати ва ўз кўриниши билан эди.
//
// Ранг табга қараб алмашади: чиқим кўк, кирим яшил. Ранг
// `ModuleScope` орқали БИР ЖОЙДА берилади, компонентлар ичида
// ҳеч қандай ранг ёзилмаган.
// ============================================================
"use client";

import { use, useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useLocale, useT } from "@/context/LanguageContext";
import { path } from "@/lib/routes";
import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import ChiqimSverka from "@/components/sverka/ChiqimSverka";
import KirimSverka from "@/components/sverka/KirimSverka";
import {
  Alert,
  Card,
  Code,
  ModuleScope,
  PageHeader,
  PageLoader,
  Tabs,
  layout,
  type TabItem,
} from "@/components/ui";

type Yonalish = "OUT" | "IN";

interface Company {
  name: string;
  inn: string;
  workspaceId?: string;
}

export default function ClientPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id } = use(params);
  const t = useT();
  const locale = useLocale();
  const { user } = useAuth();
  const workspaceId: string | undefined = user?.workspaceId;

  const [company, setCompany] = useState<Company | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [yonalish, setYonalish] = useState<Yonalish>("OUT");

  useEffect(() => {
    let alive = true;
    async function load() {
      if (!workspaceId) return;
      try {
        const snap = await getDoc(doc(db, "companies", id));
        if (!alive) return;
        // Бошқа иш майдонининг корхонаси — қоида ўқишни рад этади ва
        // бу ерга «мавжуд эмас» бўлиб келади. Иккаласи ҳам бир хил
        // жавоб: «топилмади».
        if (!snap.exists() || snap.data()?.workspaceId !== workspaceId) {
          setNotFound(true);
        } else {
          setCompany(snap.data() as Company);
        }
      } catch {
        if (alive) setNotFound(true);
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, [id, workspaceId]);

  if (loading) {
    return <PageLoader text={t("Корхона юкланмоқда...")} />;
  }

  if (notFound || !company) {
    return (
      <div className={`${layout.container} ${layout.stack}`}>
        <PageHeader
          backHref={path("clients", locale)}
          title={t("Корхона топилмади")}
          description={t("Бу корхона ўчирилган ёки сизнинг иш майдонингизга тегишли эмас.")}
        />
        <Alert tone="bad">
          {t("Рўйхатга қайтинг ва корхонани қайтадан танланг.")}
        </Alert>
      </div>
    );
  }

  const TABS: TabItem<Yonalish>[] = [
    { key: "OUT", label: t("Чиқим сверкаси"), icon: ArrowUpFromLine },
    { key: "IN", label: t("Кирим сверкаси"), icon: ArrowDownToLine },
  ];

  return (
    <ModuleScope
      module={yonalish === "OUT" ? "out" : "in"}
      className={`${layout.containerWide} ${layout.stack}`}
    >
      <PageHeader
        backHref={path("clients", locale)}
        title={company.name}
        description={
          yonalish === "OUT"
            ? t("Тўланган пул ↔ келган фактура: фарқни топади")
            : t("Тушган пул ↔ ёзилган фактура: фарқни топади")
        }
        actions={<Code>{company.inn}</Code>}
      />

      <Card padded={false}>
        <Tabs items={TABS} value={yonalish} onChange={setYonalish} />
      </Card>

      {/* ИККАЛА КОМПОНЕНТ ҲАМ МОНТАЖДА ҚОЛАДИ, кўринмагани фақат
          яширилади. Сабаб: таб алмаштирилса компонент ўчиб кетарди ва
          юкланган файл, ўқилган ҳисобот, белгиланган қаторлар —
          ҳаммаси йўқоларди. Бухгалтер эса иккала йўналишни кетма-кет
          қилади ва орқага қайтади. */}
      <div className={yonalish === "OUT" ? undefined : "hidden"} aria-hidden={yonalish !== "OUT"}>
        <ChiqimSverka companyId={id} companyName={company.name} />
      </div>
      <div className={yonalish === "IN" ? undefined : "hidden"} aria-hidden={yonalish !== "IN"}>
        <KirimSverka companyName={company.name} />
      </div>
    </ModuleScope>
  );
}
