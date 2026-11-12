/** تطبيع النص العربي/الفرنسي للبحث: إزالة التشكيل والتمييز بين الهمزات وغيرها. */
export function norm(s: string): string {
  return s
    .normalize("NFKD")
    .replace(/[\u064B-\u065F\u0670\u0640\u0300-\u036f]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .toLowerCase()
    .trim();
}
