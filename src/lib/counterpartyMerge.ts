// ============================================================
// KONTRAGENTLARNI QO'LDA BIRLASHTIRISH
// ------------------------------------------------------------
// Muammo — SOXTA FARQ. Bitta firma ikki xil yozilsa:
//
//   «МЧЖ "ИМАНМАКС"»  → bank ko'chirmasida
//   «IMANMAX MCHJ»    → faktura ro'yxatida
//
// tizim ularni IKKI kontragent deb ko'radi. Birinchisida faqat
// to'lov, ikkinchisida faqat faktura turadi — natijada ikkala qator
// ham katta farq ko'rsatadi, aslida esa hisob mukammal yopilgan.
// Bu «Итого» tekshiruvidan ham, qoldiq tenglamasidan ham O'TIB
// KETADI: yig'indi to'g'ri, faqat taqsimoti xato.
//
// Uch qoida:
//
//  1. BIRLASHTIRISH — QAYTA HISOB EMAS. Ikki qator qo'shiladi,
//     summalar YIG'ILADI, boshqa hech narsa o'zgarmaydi. Yig'indi
//     o'zgarmasligi harness'da invariant sifatida tekshiriladi.
//
//  2. AVTOMATIK EMAS. Nomlarni o'xshashligiga qarab o'zi qo'shish —
//     ikki HAR XIL firmani jimgina bir qilib qo'yish xavfi. Qaror
//     buxgalterniki; tizim faqat TAKLIF qiladi.
//
//  3. IKKI SVERKA ALOHIDA. Kalit shakli chiqim va kirim tomonida
//     boshqacha (`statementAudit` va `incomeParser` mustaqil), shu
//     sabab guruh `side` bilan yoziladi.
// ============================================================

export type MergeSide = 'in' | 'out';

/** Korxona ostidagi subkolleksiya. Toifalar bilan bir xil sabab: bir
 *  mijozdagi qaror boshqasiga tegishli emas. */
export const MERGES_COLLECTION = 'counterparty_merges';

/** Bitta guruh: bir necha kalit — bitta kontragent. */
export interface MergeGroup {
  /** ASOSIY kalit. Birlashgan qatorning kaliti, STIRi va (nom
   *  berilmagan bo'lsa) nomi shundan olinadi. */
  primary: string;
  /** Qo'shilgan qolgan kalitlar. `primary` bu ro'yxatda BO'LMAYDI. */
  members: string[];
  side: MergeSide;
  /** Ekranda ko'rsatiladigan nom. Bo'sh bo'lsa asosiy qatorniki. */
  name?: string;
  /** AUDIT IZI — byuroda «kim buni birlashtirgan?» degan savol chiqadi */
  updatedBy?: string;
  updatedAt?: string;
}

/** kalit → asosiy kalit */
export type MergeMap = Record<string, string>;

/** Firestore hujjati identifikatori. `counterpartyCategory.ts` dagi
 *  bilan bir xil qoida: kalitda `/` va `.` bo'lishi mumkin. */
export function mergeDocId(side: MergeSide, primary: string): string {
  return `${side}__${encodeURIComponent(primary).replace(/\./g, '%2E')}`;
}

/**
 * Guruh ro'yxatidan «kalit → asosiy kalit» jadvalini tuzadi.
 *
 * Bir kalit IKKI guruhda uchrasa — BIRINCHISI qoladi. Bu jimgina
 * emas: `conflicts` ro'yxatida qaytadi va chaqiruvchi uni
 * ogohlantirishga aylantiradi.
 */
export function buildMergeMap(
  groups: MergeGroup[],
  side: MergeSide
): { map: MergeMap; conflicts: string[] } {
  const map: MergeMap = {};
  const conflicts: string[] = [];
  for (const g of groups) {
    if (g.side !== side) continue;
    if (!g.primary) continue;
    for (const key of [g.primary, ...(g.members || [])]) {
      if (!key) continue;
      if (map[key] && map[key] !== g.primary) {
        conflicts.push(key);
        continue;
      }
      map[key] = g.primary;
    }
  }
  return { map, conflicts };
}

/* ============================================================
   SHAXSIY MAYDONLAR — ASOSIY QATORDAN
   ------------------------------------------------------------
   Birlashgan qator o'z «shaxsini» ASOSIY qatordan oladi: nom, STIR,
   hisob raqami va — eng muhimi — TOIFA.
   
   Nega bu muhim: guruhning birinchi uchragan qatori «kommunal» deb
   belgilangan bo'lsa, u butun guruhni asosiy sverkadan chiqarib
   yuborardi. Ya'ni bir bosishda millionlab so'm jadvaldan JIMGINA
   yo'qolishi mumkin edi. Foydalanuvchi «asosiy» deb kimni tanlagan
   bo'lsa — hammasi shuniki.
   ============================================================ */

/** Yig'ilgan (qo'shilgan) maydonlar — ular asosiy qatordan OLINMAYDI */
const SUMMED_OUT = new Set([
  'monthlyData', 'transactions', 'totalDebit', 'totalCredit', 'difference', 'mergedFrom',
]);
const SUMMED_IN = new Set([
  'monthly', 'payments', 'invoices', 'aliases',
  'bankCredit', 'facturaSent', 'difference', 'mergedFrom',
]);

function applyIdentity(
  target: object,
  source: object | undefined,
  summed: Set<string>
): void {
  // Asosiy qator shu davrda umuman uchramagan bo'lishi mumkin
  // (masalan faqat fakturasi bor, to'lovi yo'q) — u holda birinchi
  // uchragan qatorning maydonlari qoladi.
  if (!source) return;
  const dst = target as Record<string, unknown>;
  for (const [k, v] of Object.entries(source)) {
    if (summed.has(k)) continue;
    dst[k] = v;
  }
}

/* ============================================================
   CHIQIM SVERKASI (statementAudit.ts → AggEntry)
   ============================================================ */

interface MonthlyBucketOut {
  debit: number;
  credit: number;
}

/** Birlashtirish uchun kerak bo'lgan MINIMAL shakl. To'liq `AggEntry`
 *  emas — modul `statementAudit.ts` ga bog'lanib qolmasligi uchun. */
export interface OutgoingMergeable {
  key: string;
  inn: string;
  name: string;
  monthlyData: Record<string, MonthlyBucketOut>;
  transactions: unknown[];
  totalDebit: number;
  totalCredit: number;
  difference?: number;
  /** Birlashtirishdan KEYIN qo'shiladi: qaysi kalitlardan yig'ilgani.
   *  Ekranda «ajratish» tugmasi shu bo'yicha chiqadi. */
  mergedFrom?: string[];
}

/**
 * Chiqim tomonidagi qatorlarni birlashtiradi.
 *
 * Tartib SAQLANADI: birlashgan qator asosiy qator turgan joyda
 * qoladi. Aks holda jadval har yuklashda qayta chalkashadi.
 */
export function mergeOutgoingRows<T extends OutgoingMergeable>(
  rows: T[],
  groups: MergeGroup[]
): T[] {
  const { map } = buildMergeMap(groups, 'out');
  if (Object.keys(map).length === 0) return rows;

  const nameOf = new Map<string, string>();
  for (const g of groups) {
    if (g.side === 'out' && g.name) nameOf.set(g.primary, g.name);
  }

  const out: T[] = [];
  const at = new Map<string, number>(); // asosiy kalit → out dagi o'rni
  const primaryRow = new Map<string, T>(); // asosiy kalit → o'sha qatorning O'ZI

  for (const row of rows) {
    const primary = map[row.key];
    // Guruhga kirmagan qator o'zgarishsiz o'tadi
    if (!primary) {
      out.push(row);
      continue;
    }
    if (row.key === primary) primaryRow.set(primary, row);

    const idx = at.get(primary);
    if (idx === undefined) {
      // Guruhning BIRINCHI uchragan qatori — o'rin egallaydi.
      // Asosiy qatorning o'zi keyinroq kelsa ham summa to'g'ri
      // yig'iladi, faqat kalit/nom asosiynikiga tenglanadi.
      const seed = {
        ...row,
        key: primary,
        mergedFrom: [row.key],
      } as unknown as T;
      at.set(primary, out.length);
      out.push(seed);
      continue;
    }

    const acc = out[idx] as unknown as OutgoingMergeable & { mergedFrom: string[] };
    acc.totalDebit += row.totalDebit;
    acc.totalCredit += row.totalCredit;
    acc.transactions = [...acc.transactions, ...row.transactions];
    for (const [period, b] of Object.entries(row.monthlyData || {})) {
      const cur = acc.monthlyData[period] || { debit: 0, credit: 0 };
      acc.monthlyData[period] = { debit: cur.debit + b.debit, credit: cur.credit + b.credit };
    }
    acc.mergedFrom.push(row.key);
  }

  // Yakuniy tozalash: shaxsiy maydonlar ASOSIY qatordan olinadi,
  // farq qayta hisoblanadi.
  for (const row of out) {
    const r = row as unknown as OutgoingMergeable & { mergedFrom?: string[] };
    if (!r.mergedFrom || r.mergedFrom.length < 2) {
      // Guruhda yagona qator qolgan — birlashtirish BO'LMAGAN
      delete r.mergedFrom;
      continue;
    }
    applyIdentity(r, primaryRow.get(r.key), SUMMED_OUT);
    const custom = nameOf.get(r.key);
    if (custom) r.name = custom;
    r.difference = r.totalDebit - r.totalCredit;
  }
  return out;
}

/* ============================================================
   KIRIM SVERKASI (incomeParser.ts → PartyRow)
   ============================================================ */

interface MonthlyBucketIn {
  credit: number;
  factura: number;
}

export interface IncomingMergeable {
  key: string;
  inn: string;
  name: string;
  aliases: string[];
  bankCredit: number;
  facturaSent: number;
  difference: number;
  monthly: Record<string, MonthlyBucketIn>;
  payments: unknown[];
  invoices: unknown[];
  /** Birlashtirishdan KEYIN qo'shiladi — `OutgoingMergeable` dagi bilan bir xil */
  mergedFrom?: string[];
}

export function mergeIncomingRows<T extends IncomingMergeable>(
  rows: T[],
  groups: MergeGroup[]
): T[] {
  const { map } = buildMergeMap(groups, 'in');
  if (Object.keys(map).length === 0) return rows;

  const nameOf = new Map<string, string>();
  for (const g of groups) {
    if (g.side === 'in' && g.name) nameOf.set(g.primary, g.name);
  }

  const out: T[] = [];
  const at = new Map<string, number>();
  const primaryRow = new Map<string, T>();

  for (const row of rows) {
    const primary = map[row.key];
    if (!primary) {
      out.push(row);
      continue;
    }
    if (row.key === primary) primaryRow.set(primary, row);

    const idx = at.get(primary);
    if (idx === undefined) {
      const seed = {
        ...row,
        key: primary,
        aliases: [...(row.aliases || [])],
        mergedFrom: [row.key],
      } as unknown as T;
      at.set(primary, out.length);
      out.push(seed);
      continue;
    }

    const acc = out[idx] as unknown as IncomingMergeable & { mergedFrom: string[] };
    acc.bankCredit += row.bankCredit;
    acc.facturaSent += row.facturaSent;
    acc.payments = [...acc.payments, ...row.payments];
    acc.invoices = [...acc.invoices, ...row.invoices];
    // Nomlar YO'QOLMAYDI: qo'shilgan qatorning nomi taxallusga tushadi,
    // shunda buxgalter «bu yerda qaysi nomlar bor edi» deb ko'ra oladi.
    for (const a of [row.name, ...(row.aliases || [])]) {
      if (a && !acc.aliases.includes(a)) acc.aliases.push(a);
    }
    for (const [period, b] of Object.entries(row.monthly || {})) {
      const cur = acc.monthly[period] || { credit: 0, factura: 0 };
      acc.monthly[period] = { credit: cur.credit + b.credit, factura: cur.factura + b.factura };
    }
    acc.mergedFrom.push(row.key);
  }

  for (const row of out) {
    const r = row as unknown as IncomingMergeable & { mergedFrom?: string[] };
    if (!r.mergedFrom || r.mergedFrom.length < 2) {
      delete r.mergedFrom;
      continue;
    }
    applyIdentity(r, primaryRow.get(r.key), SUMMED_IN);
    const custom = nameOf.get(r.key);
    if (custom) r.name = custom;
    // Kirimda DEBET — yozilgan faktura, KREDIT — tushgan pul
    r.difference = r.facturaSent - r.bankCredit;
    r.aliases = r.aliases.filter((a) => a !== r.name);
  }
  return out;
}

/* ============================================================
   TAKLIF — o'xshash nomlarni topish
   ------------------------------------------------------------
   Taklif HECH QACHON o'zi qo'llanmaydi. U faqat «shu ikkitasiga
   qarang» deydi; birlashtirishni buxgalter bosadi.
   ============================================================ */

/**
 * Solishtirish uchun o'zak. Ekranga HECH QACHON chiqmaydi.
 *
 * Nima olib tashlanadi:
 *   · yozuv farqi — kirill va lotin bir shaklga keladi
 *     (o'zbek kirillidagi ў/қ/ғ/ҳ ham bor);
 *   · transliteratsiya variantlari — «MAX» va «МАКС» bitta o'zak,
 *     «Q» va «K», «W» va «V», «TS» va «S»;
 *   · tashkiliy-huquqiy shakl — МЧЖ / ООО / ЯТТ / ХК …;
 *   · tinish belgisi, bo'sh joy, qo'shtirnoq.
 *
 * Nima QILMAYDI: harf almashinuvini (Levenshtein) hisoblamaydi.
 * «ALFA» va «ALFO» har xil qoladi — bir harflik farq haqiqiy ikki
 * firma bo'lishi mumkin, taklif esa xato bo'lsa qimmatga tushadi.
 */
export function normalizeName(raw: string): string {
  let s = (raw || '').toLowerCase();

  // 1) Kirill → lotin. O'zbek kirilli (ў, қ, ғ, ҳ) ham kiradi —
  //    ularsiz «ЎЗБЕКҚУРИЛИШ» umuman tanilmaydi.
  const CYR: Record<string, string> = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'j', з: 'z',
    и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
    с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh',
    щ: 'sh', ъ: '', ы: 'i', ь: '', э: 'e', ю: 'yu', я: 'ya',
    ў: 'o', қ: 'q', ғ: 'g', ҳ: 'h',
  };
  s = [...s].map((ch) => (ch in CYR ? CYR[ch] : ch)).join('');

  // 2) Lotin yozuvidagi variantlar bitta shaklga
  s = s.replace(/[qk]/g, 'k').replace(/w/g, 'v').replace(/['’`ʻʼ]/g, '');

  // 3) Tashkiliy-huquqiy shakl. Bu qadam bo'sh joyga tayanadi,
  //    shuning uchun harflarni tozalashdan OLDIN bajariladi.
  s = s.replace(
    /\b(mchj|ooo|oao|zao|kmj|hk|xk|aj|ak|yatt|ip|ycht|cht|dk|mfy|filial|ltd|llc|jsc)\b/g,
    ' '
  );

  // 4) Faqat harf va raqam
  s = s.replace(/[^a-z0-9]+/g, '');

  // 5) Digraflar. Lotin «x» O'ZBEKCHADA ikki xil o'qiladi:
  //      · «ТЕХНО» → tehno,  «TEXNO» → texno   (х tovushi)
  //      · «ИМАНМАКС» → imanmaks, «IMANMAX»    (кс tovushi)
  //    Ya'ni «x» ni bitta tomonga o'girish YETMAYDI — h, ks va x
  //    UCHALASI ham bitta belgiga keltiriladi. Bu ataylab keng:
  //    maqsad — TAKLIF berish, qaror baribir buxgalterniki.
  s = s.replace(/ks/g, 'x').replace(/h/g, 'x').replace(/ts/g, 's');

  return s;
}

export interface MergeSuggestion {
  keys: string[];
  names: string[];
  /** Nega taklif qilindi: bir xil STIR yoki bir xil normal nom */
  reason: 'inn' | 'name';
}

/**
 * Birlashtirishga NOMZOD juftliklarni topadi.
 *
 * Ikki asos:
 *   · bir xil STIR, har xil kalit — deyarli har doim to'g'ri;
 *   · normal nomi bir xil — tekshirish kerak.
 *
 * Allaqachon birlashtirilganlari chiqarib tashlanadi.
 */
export function suggestMerges(
  rows: Array<{ key: string; inn: string; name: string }>,
  groups: MergeGroup[],
  side: MergeSide
): MergeSuggestion[] {
  const { map } = buildMergeMap(groups, side);
  const byInn = new Map<string, typeof rows>();
  const byName = new Map<string, typeof rows>();

  for (const r of rows) {
    if (r.inn && r.inn !== '-') {
      const list = byInn.get(r.inn) || [];
      list.push(r);
      byInn.set(r.inn, list);
    }
    const n = normalizeName(r.name);
    // Juda qisqa o'zak («ooo» dan keyin 3 harf qolsa) tasodifan
    // to'qnashadi — taklif berilmaydi.
    if (n.length >= 4) {
      const list = byName.get(n) || [];
      list.push(r);
      byName.set(n, list);
    }
  }

  const seen = new Set<string>();
  const out: MergeSuggestion[] = [];

  const collect = (groupsOf: Map<string, typeof rows>, reason: 'inn' | 'name') => {
    for (const list of groupsOf.values()) {
      if (list.length < 2) continue;
      // Hammasi allaqachon bitta guruhda bo'lsa — taklif kerak emas
      const primaries = new Set(list.map((r) => map[r.key] || r.key));
      if (primaries.size < 2) continue;
      const keys = list.map((r) => r.key).sort();
      const id = keys.join('|');
      if (seen.has(id)) continue;
      seen.add(id);
      out.push({ keys, names: list.map((r) => r.name), reason });
    }
  };

  collect(byInn, 'inn');
  collect(byName, 'name');
  return out;
}
