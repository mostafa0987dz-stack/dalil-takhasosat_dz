export const SERIES = [
  { slug: "sciences-experimentales", name: "علوم تجريبية" },
  { slug: "mathematiques", name: "رياضيات" },
  { slug: "technique-mathematique", name: "تقني رياضي" },
  { slug: "lettres-philosophie", name: "آداب وفلسفة" },
  { slug: "langues-etrangeres", name: "لغات أجنبية" },
  { slug: "gestion-economie", name: "تسيير واقتصاد" },
] as const;

export const SERIE_NAMES: string[] = SERIES.map((s) => s.name);
export const SITE_NAME = "دليل التخصصات الجامعية الجزائرية";
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
