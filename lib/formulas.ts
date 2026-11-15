import type { Specialty } from "@/types";

export const SUBJECTS = {
  general: "المعدل العام (البكالوريا)",
  math: "الرياضيات",
  science: "علوم الطبيعة والحياة",
  physics: "الفيزياء",
  arabic: "اللغة العربية",
  french: "اللغة الفرنسية",
  tech: "المادة التقنية",
  economy: "التسيير المحاسبي والمالي",
  lang3: "اللغة الأجنبية الثالثة",
} as const;

export type Term = { subject: string; coef: number };
const G = (c: number): Term => ({ subject: SUBJECTS.general, coef: c });
const T = (k: keyof typeof SUBJECTS, c: number): Term => ({ subject: SUBJECTS[k], coef: c });

/** صيغ الميدان حسب الشعبة (قابلة للتعديل هنا فقط؛ راجع دليل التوجيه الرسمي للسنة الجارية). */
export const FORMULAS: Record<string, Record<string, Term[]>> = {
  "علوم تجريبية": {
    "علوم طبية": [G(2), T("science", 2), T("math", 1)],
    "علوم دقيقة وتكنولوجيا": [G(1)],
    "علوم المادة": [G(2), T("physics", 2), T("math", 1)],
    "مدارس الرياضيات": [G(1)],
  },
  "رياضيات": {
    "علوم طبية": [G(2), T("math", 2), T("science", 1)],
    "علوم دقيقة وتكنولوجيا": [G(1)],
    "علوم المادة": [G(2), T("math", 2), T("physics", 1)],
    "مدارس الرياضيات": [G(1)],
  },
  "تقني رياضي": {
    "علوم دقيقة وتكنولوجيا": [G(2), T("math", 2), T("physics", 1)],
    "علوم طبية": [G(1)],
    "علوم وتكنولوجيا (هندسة طرائق)": [G(2), T("tech", 1), T("math", 1)],
    "هندسة معمارية، عمران ومدينة": [G(2), T("math", 2), T("physics", 1)],
  },
  "آداب وفلسفة": {
    "مدارس اللغة العربية": [G(2), T("arabic", 1)],
    "مدارس الترجمة": [G(2), T("lang3", 1)],
    "علوم إنسانية واجتماعية": [G(1)],
    "حقوق وعلوم سياسية": [G(1)],
  },
  "لغات أجنبية": {
    "مدارس اللغة الفرنسية": [G(2), T("french", 1)],
    "مدارس الترجمة": [G(2), T("lang3", 1)],
    "علوم إنسانية واجتماعية": [G(1)],
    "حقوق وعلوم سياسية": [G(1)],
  },
  "تسيير واقتصاد": {
    "اقتصادي وتسيير وعلوم تجارية": [G(2), T("economy", 1)],
    "علوم إنسانية واجتماعية": [G(1)],
    "حقوق وعلوم سياسية": [G(1)],
  },
};

/** ربط مجال التخصص في الدليل بميدان الصيغة. */
export const DOMAIN_TO_FIELDS: Record<string, string[]> = {
  "علوم الصحة": ["علوم طبية"],
  "علوم وتكنولوجيا": ["علوم دقيقة وتكنولوجيا", "علوم وتكنولوجيا (هندسة طرائق)", "هندسة معمارية، عمران ومدينة", "علوم المادة"],
  "علوم إنسانية واجتماعية": ["علوم إنسانية واجتماعية", "حقوق وعلوم سياسية"],
  "علوم اقتصادية وتجارية وتسيير": ["اقتصادي وتسيير وعلوم تجارية"],
};

export function specialtyMatchesField(s: Specialty, field: string): boolean {
  const fields = DOMAIN_TO_FIELDS[s.domaine];
  return !fields || fields.includes(field);
}

/** المعدل الموزون؛ يرجع null إذا نقصت أي مادة مطلوبة أو كانت قيمة غير صالحة. */
export function weighted(terms: Term[], marks: Record<string, string>): number | null {
  let sum = 0;
  let coefs = 0;
  for (const t of terms) {
    const raw = (marks[t.subject] ?? "").replace(",", ".");
    const v = raw === "" ? NaN : Number(raw);
    if (!Number.isFinite(v) || v < 0 || v > 20) return null;
    sum += v * t.coef;
    coefs += t.coef;
  }
  return coefs ? sum / coefs : null;
}
