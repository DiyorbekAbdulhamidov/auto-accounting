"use client";

import { CloudUpload } from "lucide-react";
import { useT } from "@/context/LanguageContext";
import { FAQ } from "@/lib/faq";
import {
  FaqItem,
  Code,
  NumTd,
  Num,
  Table,
  TableFrame,
  Tbody,
  Td,
  Tfoot,
  Th,
  Thead,
  Tr,
} from "@/components/ui";
import { Reveal } from "@/components/ui";
import { Highlight, MockFrame, Step } from "./Annotate";
import ReconciliationAnimation, { ReconciliationAnimationText } from "./ReconciliationAnimation";

/* ============================================================
   QO'LLANMA — «bu tizim nima qiladi» degan savolga javob
   ------------------------------------------------------------
   Kimga: 20 ta mijozi bor, oyiga bir marta sverka qiladigan,
   Excel'dan boshqa dastur ko'rmagan buxgalter.

   NEGA KARUSEL EMAS. Karusel matnni bosish ortiga yashiradi:
   o'qiydigan odam nechta slayd borligini bilmaydi, orqaga
   qaytolmaydi, telefonda surish qiyin va Ctrl+F ishlamaydi.
   Bir marta yuqoridan pastga o'qiladigan sahifa esa hech qanday
   harakatsiz to'liq ko'rinadi — bu auditoriya uchun shu muhim.
   ============================================================ */

/** 1-qadam: fayl yuklash oynasining kichik nusxasi */
function MockUpload() {
  const t = useT();
  return (
    <MockFrame title={t("Чиқим сверкаси")}>
      <div className="flex flex-col gap-2.5">
        <Highlight n={1} label={t("файлларни шу ерга")}>
          <div className="flex items-center gap-3 rounded-md border border-dashed border-line bg-surface-2 p-3">
            <CloudUpload className="h-5 w-5 shrink-0 text-ink-3" />
            <div className="min-w-0">
              <p className="truncate text-body font-medium text-ink">
                {t("Excel / CSV файлларни танланг")}
              </p>
              <p className="truncate text-caption text-ink-3">.xls · .xlsx · .csv</p>
            </div>
          </div>
        </Highlight>
        <div className="h-9 w-full rounded-md bg-accent text-center text-body font-medium leading-9 text-accent-fg">
          {t("Таҳлил")}
        </div>
      </div>
    </MockFrame>
  );
}

/** 2-qadam: «Ўқиш ҳисоботи» — tizim nimani o'qiganini aytadi */
function MockReport() {
  const t = useT();
  /* УСТУНЛАР ва ҚИЙМАТЛАР — жонли маҳсулотдан кўчирилган
     (2026-08-24). Илгари бу ерда «белги» лар турарди (банк номи,
     қатор сони) — ҳақиқий экранда эса ЖАДВАЛ бор ва бухгалтер
     аввало «файл ўз якуни билан мос келдими?» деган устунга
     қарайди. Намуна ҳақиқатдан фарқ қилса, қўлланма ёрдам
     бермайди — одам бошқа экранни кутади. */
  const rows = [
    {
      file: "bank ko'chirmasi.xlsx",
      sheet: "01-06 январ-июн",
      fmt: "BANK_TURNOVER",
      n: "209",
      sum: "650 043 832",
      end: "650 074 152",
      ok: true,
    },
    {
      file: "bank ko'chirmasi.xlsx",
      sheet: "07 июл",
      fmt: "BANK_TURNOVER",
      n: "48",
      sum: "698 696 560",
      end: "698 784 815",
      ok: true,
    },
    {
      file: "fakturalar.xlsx",
      sheet: "",
      fmt: "FAKTURA",
      n: "128",
      sum: "472 747 910",
      end: "—",
      ok: false,
    },
  ];

  return (
    <MockFrame title={t("✓ Ўқиш ҳисоботи")}>
      <Highlight n={2} label={t("файл ўзини текширди")}>
        <TableFrame className="border-0">
          <Table>
            <Thead>
              <tr>
                {/* УСТУН ТЎРТТА. Ҳақиқий экранда бешта, лекин
                    қўлланмадаги рамка ЯРИМ кенгликда: бешинчиси
                    қўшилса рақамлар икки қаторга бўлиниб кетади ва
                    жадвал ўқилмай қолади (браузерда кўрилган).
                    Мазмун ўзгармади: «чиққан» ва «келган» битта
                    «сумма» бўлди, чунки ҳар қаторда фақат биттаси
                    тўлади. */}
                <Th>{t("Файл / варақ")}</Th>
                <Th align="right">{t("Қатор")}</Th>
                <Th align="right">{t("Сумма")}</Th>
                <Th align="right">{t("Файл якуни")}</Th>
              </tr>
            </Thead>
            <Tbody>
              {rows.map((r) => (
                <Tr key={r.file + r.sheet}>
                  <Td main>
                    <div className="truncate font-medium">{r.file}</div>
                    <div className="text-caption text-ink-3">
                      {r.sheet ? `${r.sheet} · ` : ""}
                      <Code>{r.fmt}</Code>
                    </div>
                  </Td>
                  <NumTd>{r.n}</NumTd>
                  <NumTd tone={r.ok ? "cash" : "invoice"}>{r.sum}</NumTd>
                  <NumTd tone={r.ok ? "ok" : "muted"}>
                    {r.ok ? `\u2713 ${r.end}` : r.end}
                  </NumTd>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableFrame>
      </Highlight>
      {/* ҚОЛДИҚ ТЕНГЛАМАСИ — «Файл якуни» устуни аслида шу
          текширувнинг натижаси. Формула остида ёзилади. */}
      <p className="mt-2.5 text-caption text-ink-3">
        <span className="font-medium text-ink-2">{t("Қолдиқ тенгламаси")}</span>
        {" — "}
        {t("бошланғич қолдиқ + кирим − чиқим = охирги қолдиқ")}
      </p>
    </MockFrame>
  );
}

/** 3-qadam: natija jadvali — asosiy javob shu yerda */
function MockTable() {
  const t = useT();
  const rows = [
    { name: "SAMO SAVDO", inn: "300100100", d: "473 954 000", c: "473 954 000", diff: "0", tone: "muted" as const, note: "-" },
    { name: "ORIENT TEXNIKA", inn: "300200200", d: "0", c: "50 278 000", diff: "−50 278 000", tone: "bad" as const, note: "Қарзмиз" },
    { name: "BARKAMOL QURILISH", inn: "300300300", d: "8 271 000", c: "6 036 948", diff: "2 234 052", tone: "warn" as const, note: "Ҳисоб фактура олиш керак" },
  ];

  return (
    <MockFrame title={t("Далолатнома (Сверка)")}>
      <Highlight n={3} label={t("жавоб шу устунда")}>
        <TableFrame className="border-0">
          <Table>
            <Thead>
              <tr>
                <Th>{t("Фирма номлари")}</Th>
                <Th align="right">{t("Тўланган пул")}</Th>
                <Th align="right">{t("Келган фактура")}</Th>
                <Th align="right">{t("Фарқи")}</Th>
                {/* «ИЗОҲ» устуни бу ерда ЙЎҚ — ҳақиқий экранда бор,
                    лекин қўлланмадаги рамка ярим кенгликда ва бешинчи
                    устун қўшилса рақамлар уч қаторга бўлиниб кетади
                    (браузерда кўрилган). У ҳақда ёнидаги матн айтади. */}
              </tr>
            </Thead>
            <Tbody>
              {rows.map((r) => (
                <Tr key={r.inn}>
                  <Td main>
                    <div className="font-medium">{r.name}</div>
                    <Code>{r.inn}</Code>
                  </Td>
                  <NumTd tone="cash">{r.d}</NumTd>
                  <NumTd tone="invoice">{r.c}</NumTd>
                  <NumTd tone={r.tone} strong>
                    {r.diff}
                  </NumTd>
                </Tr>
              ))}
            </Tbody>
            <Tfoot>
              <tr>
                <Td className="text-caption text-ink-3">{t("ЖАМИ")}</Td>
                <NumTd>482 225 000</NumTd>
                <NumTd>530 268 948</NumTd>
                <NumTd tone="bad">−48 043 948</NumTd>
              </tr>
            </Tfoot>
          </Table>
        </TableFrame>
      </Highlight>
    </MockFrame>
  );
}

/** Rang nimani anglatishi — bir marta aytiladi, keyin hamma joyda shu */
export function ColourKey() {
  const t = useT();
  const items: { tone: "cash" | "invoice" | "warn" | "bad"; label: string; meaning: string }[] = [
    { tone: "cash", label: t("Тўланган / тушган пул"), meaning: t("банк кўчирмасидан") },
    { tone: "invoice", label: t("Келган / ёзилган фактура"), meaning: t("Э-фактурадан") },
    { tone: "warn", label: t("Фарқ бор — иш қилиш керак"), meaning: t("фактура сўраш ёки ёзиш") },
    { tone: "bad", label: t("Қарз"), meaning: t("пул ёки фактура етишмайди") },
  ];
  /* ИККИ УСТУН ЭМАС, БИТТА УСТУН. Ўлчанган (браузерда): тор
     устунда «Фарқ бор — иш қилиш керак» сарлавҳаси ҳам, изоҳи
     ҳам иккига бўлиниб, тўртта қатор бир-бирига кириб кетарди.
     Энди ҳар банд битта қатор: белги, ном, изоҳ. */
  return (
    <ul className="space-y-1.5">
      {items.map((i) => (
        <li key={i.label} className="flex items-baseline gap-2 text-body">
          <Num tone={i.tone} strong>
            ●
          </Num>
          <span className="shrink-0 text-ink">{i.label}</span>
          <span className="truncate text-caption text-ink-3">— {i.meaning}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Бўлимлар АЛОҲИДА экспорт қилинади.
 *
 * Сабаб: очиқ бош саҳифа ҳам, `/qollanma` ҳам айнан шу матнни
 * кўрсатади. Иккита нусха бўлса, биттаси албатта эскириб қоларди.
 * Бош саҳифада ўз hero'си бор, шунинг учун у қуйидаги бўлимларни
 * танлаб олади.
 */
export function GuideHero() {
  const t = useT();
  return (
    <div className="border-b border-line pb-10">
      <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-2">
        <div>
          <h2 className="text-h1 font-semibold tracking-tight text-ink">
            {t("Бу тизим нима қилади")}
          </h2>
          <p className="mt-3 max-w-xl text-lead text-ink-2">
            {t("Банк кўчирмангизни ва фактура рўйхатини юкласангиз, тизим ҳар бир контрагент бўйича пул билан фактурани солиштиради ва ФАРҚ борларини ажратиб беради. Қўлда бир неча кун кетадиган иш — бир неча сонияда.")}
          </p>
          <ReconciliationAnimationText />
          <div className="mt-5">
            <ColourKey />
          </div>
        </div>
        <ReconciliationAnimation />
      </div>
    </div>
  );
}

export function GuideSteps() {
  const t = useT();
  return (
    <>
      {/* --- Уч қадам. Ҳар қадам экранга кирганда очилади: пастга
              сурган одам «яна бор экан» деб тушунади. --- */}
      <div className="border-b border-line pb-10">
        <h2 className="text-title font-semibold text-ink">{t("Уч қадамда")}</h2>
        <div className="mt-5 space-y-8">
          <Reveal>
            <Step n={1} title={t("Файлларни юкланг")} mock={<MockUpload />}>
              <p>
                {t("Иккита файл керак: банкдан олинган кўчирма ва Э-фактурадан юкланган фактуралар рўйхати. Иккаласини бирга танласангиз ҳам бўлади.")}
              </p>
              <p className="text-caption text-ink-3">
                {t("Форматлар: .xls, .xlsx, .csv. Банкнинг ўз файлини ўзгартирмасдан, қандай бўлса шундай юкланг.")}
              </p>
            </Step>
          </Reveal>

          <Reveal>
            <Step n={2} title={t("Тизим нимани ўқиганини кўрсатади")} mock={<MockReport />}>
              <p>
                {t("Юклангандан кейин биринчи кўринадиган нарса — натижа эмас, ТЕКШИРУВ: қайси файлдан қайси варақ, нечта қатор ўқилди ва файлнинг ўз якуни билан мос келдими.")}
              </p>
              <p>
                {t("Қолдиқ тенгламаси файлнинг ўзини текширади: бошланғич қолдиқ + кирим − чиқим охирги қолдиққа тенг чиқмаса, тизим буни АЙТАДИ ва натижани жимгина кўрсатавермайди.")}
              </p>
            </Step>
          </Reveal>

          <Reveal>
            <Step n={3} title={t("Фарқни кўринг")} mock={<MockTable />}>
              <p>
                {t("Жадвалда ҳар бир контрагент бўйича: қанча пул ўтган, қанча фактура бор ва орадаги фарқ. Охирги устун нима қилиш кераклигини сўз билан ёзади.")}
              </p>
              <p>
                {t("Натижани Excel'га юклаб олиш ва битта контрагент учун Акт сверки тайёрлаш мумкин.")}
              </p>
            </Step>
          </Reveal>
        </div>
      </div>

    </>
  );
}

export function GuideDirections() {
  const t = useT();
  return (
      /* --- Иккита йўналиш --- */
      <Reveal>
      <div className="border-b border-line pb-10">
        <h2 className="text-title font-semibold text-ink">{t("Иккита сверка — иккита савол")}</h2>
        <p className="mt-2 text-body text-ink-2">
          {t("Иккаласи ҳам битта корхона учун, лекин пулнинг йўналиши бошқа. Аралаштириб юбормаслик учун ҳар бирининг ўз ранги бор.")}
        </p>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Қути ЭМАС: юқорида 2px модуль чизиғи. Чап қиррали
              юмалоқ қути — андоза шакли; чизиқ эса АЙНАН шу
              йўналишнинг рангини айтади ва матнни қутига
              қамамайди. */}
          <div data-module="out" className="border-t-2 border-t-accent pt-4">
            <p className="text-h3 font-semibold text-ink">{t("Чиқим сверкаси")}</p>
            <p className="mt-1 text-body font-medium text-accent-ink">
              {t("Тўланган пул ↔ Келган фактура")}
            </p>
            <p className="mt-2 text-body text-ink-2">
              {t("Сиз пул тўладингиз. Етказиб берувчи фактура ёзиб бердими? Ким фактура бермаган — шу ерда кўринади.")}
            </p>
          </div>
          <div data-module="in" className="border-t-2 border-t-accent pt-4">
            <p className="text-h3 font-semibold text-ink">{t("Кирим сверкаси")}</p>
            <p className="mt-1 text-body font-medium text-accent-ink">
              {t("Тушган пул ↔ Ёзилган фактура")}
            </p>
            <p className="mt-2 text-body text-ink-2">
              {t("Сизга пул тушди. Сиз фактура ёзиб бердингизми? Ким тўламаган — шу ерда кўринади.")}
            </p>
          </div>
        </div>
      </div>
      </Reveal>
  );
}

export function GuideFindings() {
  const t = useT();
  return (
      /* --- Синовда нима топилган --- */
      <Reveal>
      <div className="border-b border-line pb-10">
        <h2 className="text-title font-semibold text-ink">{t("Синовда нима топилди")}</h2>
        <p className="mt-2 text-body text-ink-2">
          {t("Ҳақиқий 7 ойлик маълумотда — 1,37 млрд сўм айланма, 152 ўтказма, 159 фактура, 35 контрагент. Тизим бухгалтер ЎТКАЗИБ ЮБОРГАН фарқларни топди:")}
        </p>
        <ul className="mt-3 space-y-2">
          {[
            { name: "ORIENT TEXNIKA", sum: "50 278 000", note: t("фактура бор, тўлов йўқ") },
            { name: "ZAMIN LOGISTIKA", sum: "227 503", note: t("фактура бор, тўлов йўқ") },
            { name: "NUR PLASTIK", sum: "1 366 176", note: t("фарқ 28%") },
          ].map((r) => (
            <li key={r.name} className="flex flex-wrap items-baseline gap-x-2 text-body">
              <span className="font-medium text-ink">{r.name}</span>
              <Num tone="bad" strong>
                {r.sum}
              </Num>
              <span className="text-caption text-ink-3">— {r.note}</span>
            </li>
          ))}
        </ul>
        {/* Nomlar shartli: raqamlar haqiqiy sinovdan, firma nomlari esa
            almashtirilgan — mijozning kontragentlari ochiq sahifada
            turmasligi kerak. */}
        <p className="mt-3 text-caption text-ink-3">
          {t("Фирма номлари шартли — рақамлар ҳақиқий синовдан.")}
        </p>
      </div>
      </Reveal>
  );
}

export function GuideFaq() {
  const t = useT();
  return (
      /* --- ТСС ---
         Саволлар `src/lib/faq.ts` дан. Ўша рўйхатдан қидирув тизими
         учун `FAQPage` разметкаси ҳам чиқарилади — Google разметка
         саҳифадаги КЎРИНАДИГАН матнга айнан мос келишини талаб
         қилади, шунинг учун иккита нусха бўлмаслиги шарт. */
      <Reveal>
      <div className="pb-2">
        <h2 className="text-title font-semibold text-ink">{t("Тез-тез сўраладиган саволлар")}</h2>
        <div className="mt-3">
          {FAQ.map((item) => (
            <FaqItem key={item.q} q={t(item.q)}>
              {t(item.a)}
            </FaqItem>
          ))}
        </div>
      </div>
      </Reveal>
  );
}

/** To'liq qo'llanma — `/qollanma` sahifasi shuni ko'rsatadi. */
export default function Guide() {
  return (
    <div className="space-y-10">
      <GuideHero />
      <GuideSteps />
      <GuideDirections />
      <GuideFindings />
      <GuideFaq />
    </div>
  );
}
