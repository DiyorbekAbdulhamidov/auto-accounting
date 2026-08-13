// ============================================================
// O'ZBEK KIRILL -> LOTIN transliteratsiyasi
//
// Nega lug'at emas, algoritm: kirill va lotin — bir tilning ikki
// yozuvi. Ular uchun alohida tarjima jadvali yuritilsa, har yangi
// matn ikki joyda yozilishi kerak bo'lardi va biri albatta eskirib
// qolardi. Algoritm esa MATNNING O'ZIni o'giradi — shu sababli u
// serverdan kelgan ogohlantirishlarni ham, raqamlarni ham, hali
// yozilmagan matnlarni ham qamrab oladi.
//
// Rus va ingliz tillari uchun buni qilib bo'lmaydi — ular boshqa
// til, ularga haqiqiy tarjima kerak (dictionary.ts).
// ============================================================

/** Ko'p harfli mosliklar — avval shular tekshiriladi */
const DIGRAPHS: Array<[string, string]> = [
  ['ё', 'yo'],
  ['ж', 'j'],
  ['ц', 'ts'],
  ['ч', 'ch'],
  ['ш', 'sh'],
  ['щ', 'sh'],
  ['ю', 'yu'],
  ['я', 'ya'],
  ['ў', "o'"],
  ['ғ', "g'"],
];

const SINGLES: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', з: 'z', и: 'i',
  й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
  с: 's', т: 't', у: 'u', ф: 'f', х: 'x', ъ: "'", ы: 'i', ь: '',
  э: 'e', қ: 'q', ҳ: 'h',
};

/** Unlilar — «е» boshida «ye» bo'lishini aniqlash uchun */
const VOWELS = new Set('аеёиоуўэюяaeiou');

function isUpper(ch: string): boolean {
  return ch !== ch.toLowerCase() && ch === ch.toUpperCase();
}

function isCyr(ch: string): boolean {
  return /[а-яёўқғҳ]/i.test(ch);
}

/**
 * Bosh harfni to'g'ri qo'yish. «Ш» dan «Sh» chiqadi, lekin «ШУ»
 * (butunlay katta harfli so'z) dan «SHU» chiqishi kerak — aks holda
 * «ЖАМИ» «JaMI» bo'lib ketardi.
 */
function applyCase(latin: string, upper: boolean, nextIsUpper: boolean): string {
  if (!upper) return latin;
  if (latin.length === 1) return latin.toUpperCase();
  return nextIsUpper ? latin.toUpperCase() : latin[0].toUpperCase() + latin.slice(1);
}

/** Kirill matnni o'zbek lotin yozuviga o'girish */
export function toLatin(text: string): string {
  if (!text) return text;
  let out = '';

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const lower = ch.toLowerCase();
    const upper = isUpper(ch) && isCyr(ch);

    // Keyingi kirill harfi ham katta bo'lsa - so'z butunlay katta
    // harfda yozilgan (ЖАМИ), demak natija ham katta bo'lsin
    let nextIsUpper = false;
    for (let j = i + 1; j < text.length; j++) {
      if (!isCyr(text[j])) break;
      nextIsUpper = isUpper(text[j]);
      break;
    }

    // «е»: so'z boshida yoki unlidan keyin — «ye», aks holda «e»
    if (lower === 'е') {
      const prev = i > 0 ? text[i - 1].toLowerCase() : '';
      const atStart = i === 0 || !isCyr(prev);
      const latin = atStart || VOWELS.has(prev) ? 'ye' : 'e';
      out += applyCase(latin, upper, nextIsUpper);
      continue;
    }

    const digraph = DIGRAPHS.find(([c]) => c === lower);
    if (digraph) {
      out += applyCase(digraph[1], upper, nextIsUpper);
      continue;
    }

    const single = SINGLES[lower];
    if (single !== undefined) {
      out += applyCase(single, upper, nextIsUpper);
      continue;
    }

    // Kirill bo'lmagan hamma narsa (raqam, tinish belgisi, lotin
    // harflar, firma nomlari) o'z holicha qoladi
    out += ch;
  }

  return out;
}
