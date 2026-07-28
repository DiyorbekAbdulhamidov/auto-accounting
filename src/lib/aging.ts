// ДЕБИТОРЛИК ЁШИ (aging)
//
// Кирим сверкаси маълумоти устида ишлайди: биз ёзиб берган фактураларни
// келган тўловлар билан FIFO усулида ёпади ва тўланмай қолган қолдиқни
// фактура ёшига қараб гуруҳлайди.
//
// Модул МУСТАҚИЛ: incomeParser/incomeExcel га тегмайди, фақат уларнинг
// натижасидаги майдонларни (structural typing) талаб қилади.

export type BucketKey = "d0_30" | "d31_60" | "d61_90" | "d90plus" | "noDate";

export const BUCKET_KEYS: BucketKey[] = ["d0_30", "d31_60", "d61_90", "d90plus", "noDate"];

export type AgingBuckets = Record<BucketKey, number>;

export interface AgingInput {
  key: string;
  inn: string;
  name: string;
  payments: { date: string | null; amount: number }[];
  invoices: { date: string | null; number: string; amount: number }[];
}

export interface AgingOpenInvoice {
  date: string | null;
  number: string;
  amount: number;
  paid: number;
  outstanding: number;
  days: number | null;
  bucket: BucketKey;
}

export interface AgingParty {
  key: string;
  inn: string;
  name: string;
  invoiced: number;
  paid: number;
  /** Тўланмаган фактура қолдиғи — бизга қарз */
  receivable: number;
  /** Фактурадан ортиқча келган пул — аванс */
  advance: number;
  buckets: AgingBuckets;
  oldestDays: number | null;
  oldestDate: string | null;
  openInvoices: AgingOpenInvoice[];
}

export interface AgingReport {
  asOf: string;
  parties: AgingParty[];
  totals: {
    invoiced: number;
    paid: number;
    receivable: number;
    advance: number;
    buckets: AgingBuckets;
  };
}

const DAY_MS = 86_400_000;
const EPS = 0.01;

function emptyBuckets(): AgingBuckets {
  return { d0_30: 0, d31_60: 0, d61_90: 0, d90plus: 0, noDate: 0 };
}

/** 'YYYY-MM-DD' -> UTC ms. Нотўғри/бўш қиймат учун null. */
function toMs(iso: string | null): number | null {
  if (!iso) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return null;
  const ms = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isFinite(ms) ? ms : null;
}

function todayIso(): string {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const d = String(now.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function bucketOf(days: number | null): BucketKey {
  if (days === null) return "noDate";
  if (days <= 30) return "d0_30"; // келажак саналар ҳам шу ерда
  if (days <= 60) return "d31_60";
  if (days <= 90) return "d61_90";
  return "d90plus";
}

/**
 * Ҳар бир контрагент учун тўланмаган фактура қолдиғини ҳисоблайди.
 *
 * FIFO: келган пулнинг умумий ҳажми энг эски фактурадан бошлаб ёпилади.
 * Саналари йўқ фактуралар охирида ёпилади ва "noDate" гуруҳига тушади.
 *
 * @param asOfIso — қайси кунга ҳисобланади ('YYYY-MM-DD'). Кўрсатилмаса бугун.
 */
export function buildAging(parties: AgingInput[], asOfIso?: string | null): AgingReport {
  const asOf = asOfIso && toMs(asOfIso) !== null ? asOfIso : todayIso();
  const asOfMs = toMs(asOf) as number;

  const totals = {
    invoiced: 0,
    paid: 0,
    receivable: 0,
    advance: 0,
    buckets: emptyBuckets(),
  };

  const result: AgingParty[] = parties.map((p) => {
    const invoiced = p.invoices.reduce((s, inv) => s + (inv.amount || 0), 0);
    const paidTotal = p.payments.reduce((s, pay) => s + (pay.amount || 0), 0);

    // Энг эскисидан бошлаб; санасизлар охирида
    const ordered = [...p.invoices].sort((a, b) => {
      const am = toMs(a.date);
      const bm = toMs(b.date);
      if (am === null && bm === null) return 0;
      if (am === null) return 1;
      if (bm === null) return -1;
      return am - bm;
    });

    let pool = paidTotal;
    const buckets = emptyBuckets();
    const openInvoices: AgingOpenInvoice[] = [];
    let oldestDays: number | null = null;
    let oldestDate: string | null = null;

    for (const inv of ordered) {
      const amount = inv.amount || 0;
      const applied = Math.min(pool, amount);
      pool -= applied;
      const outstanding = amount - applied;
      if (outstanding <= EPS) continue;

      const ms = toMs(inv.date);
      const days = ms === null ? null : Math.floor((asOfMs - ms) / DAY_MS);
      const bucket = bucketOf(days);

      buckets[bucket] += outstanding;
      openInvoices.push({
        date: inv.date,
        number: inv.number,
        amount,
        paid: applied,
        outstanding,
        days,
        bucket,
      });

      if (days !== null && (oldestDays === null || days > oldestDays)) {
        oldestDays = days;
        oldestDate = inv.date;
      }
    }

    const receivable = BUCKET_KEYS.reduce((s, k) => s + buckets[k], 0);
    // Барча фактура ёпилгандан кейин ортиб қолган пул — аванс
    const advance = pool > EPS ? pool : 0;

    totals.invoiced += invoiced;
    totals.paid += paidTotal;
    totals.receivable += receivable;
    totals.advance += advance;
    for (const k of BUCKET_KEYS) totals.buckets[k] += buckets[k];

    return {
      key: p.key,
      inn: p.inn,
      name: p.name,
      invoiced,
      paid: paidTotal,
      receivable,
      advance,
      buckets,
      oldestDays,
      oldestDate,
      openInvoices,
    };
  });

  // Қарздорлар юқорида, улар ичида суммаси каттаси биринчи.
  //
  // Ёш бўйича эмас, СУММА бўйича сараланади: акс ҳолда 200 кунлик 1 000 сўмлик
  // қолдиқ 45 кунлик 54 миллионлик қарздан юқорида турар эди (ҳақиқий
  // маълумотда шундай ҳолат чиқди). Ёш ҳар қаторда алоҳида кўрсатилади.
  result.sort((a, b) => {
    const aHas = a.receivable > EPS;
    const bHas = b.receivable > EPS;
    if (aHas !== bHas) return aHas ? -1 : 1;
    if (!aHas) return b.advance - a.advance;
    const bySum = b.receivable - a.receivable;
    return bySum !== 0 ? bySum : (b.oldestDays ?? -1) - (a.oldestDays ?? -1);
  });

  return { asOf, parties: result, totals };
}
