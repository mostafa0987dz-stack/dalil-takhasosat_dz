"use client";
import { useMemo, useState, Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import data from "@/data/specialties.json";
import type { Specialty } from "@/types";

const items = data as Specialty[];

// 1. المعرفات الأساسية
const GENERAL_AVG = "المعدل العام (البكالوريا)";
const MATH = "الرياضيات";
const SCIENCE = "علوم الطبيعة والحياة";
const PHYSICS = "الفيزياء";
const ARABIC = "اللغة العربية";
const FRENCH = "اللغة الفرنسية";
const TECH = "المادة التقنية";
const ECONOMY = "التسيير المحاسبي والمالي";
const LANG3 = "اللغة الأجنبية الثالثة";

// 2. المعادلات: نحدد فقط المواد التي تدخل في الحساب (مع معاملاتها من الجدول)
const formulas: Record<string, Record<string, { subject: string; coef: number }[]>> = {
  "علوم تجريبية": {
    "علوم طبية": [{ subject: GENERAL_AVG, coef: 2 }, { subject: SCIENCE, coef: 2 }, { subject: MATH, coef: 1 }],
    "علوم دقيقة وتكنولوجيا": [{ subject: GENERAL_AVG, coef: 1 }], // المعدل فقط
    "علوم المادة": [{ subject: GENERAL_AVG, coef: 2 }, { subject: PHYSICS, coef: 2 }, { subject: MATH, coef: 1 }],
    "مدارس الرياضيات": [{ subject: GENERAL_AVG, coef: 1 }],
  },
  "رياضيات": {
    "علوم طبية": [{ subject: GENERAL_AVG, coef: 2 }, { subject: MATH, coef: 2 }, { subject: SCIENCE, coef: 1 }],
    "علوم دقيقة وتكنولوجيا": [{ subject: GENERAL_AVG, coef: 1 }],
    "علوم المادة": [{ subject: GENERAL_AVG, coef: 2 }, { subject: MATH, coef: 2 }, { subject: PHYSICS, coef: 1 }],
    "مدارس الرياضيات": [{ subject: GENERAL_AVG, coef: 1 }],
  },
  "تقني رياضي": {
    "علوم دقيقة وتكنولوجيا": [{ subject: GENERAL_AVG, coef: 2 }, { subject: MATH, coef: 2 }, { subject: PHYSICS, coef: 1 }],
    "علوم طبية": [{ subject: GENERAL_AVG, coef: 1 }],
    "علوم وتكنولوجيا (هندسة طرائق)": [{ subject: GENERAL_AVG, coef: 2 }, { subject: TECH, coef: 1 }, { subject: MATH, coef: 1 }],
    "هندسة معمارية، عمران ومدينة": [{ subject: GENERAL_AVG, coef: 2 }, { subject: MATH, coef: 2 }, { subject: PHYSICS, coef: 1 }],
  },
  "آداب وفلسفة": {
    "مدارس اللغة العربية": [{ subject: GENERAL_AVG, coef: 2 }, { subject: ARABIC, coef: 1 }],
    "مدارس الترجمة": [{ subject: GENERAL_AVG, coef: 2 }, { subject: LANG3, coef: 1 }],
    "علوم إنسانية واجتماعية": [{ subject: GENERAL_AVG, coef: 1 }],
    "حقوق وعلوم سياسية": [{ subject: GENERAL_AVG, coef: 1 }],
  },
  "لغات أجنبية": {
    "مدارس اللغة الفرنسية": [{ subject: GENERAL_AVG, coef: 2 }, { subject: FRENCH, coef: 1 }],
    "مدارس الترجمة": [{ subject: GENERAL_AVG, coef: 2 }, { subject: LANG3, coef: 1 }],
    "علوم إنسانية واجتماعية": [{ subject: GENERAL_AVG, coef: 1 }],
    "حقوق وعلوم سياسية": [{ subject: GENERAL_AVG, coef: 1 }],
  },
  "تسيير واقتصاد": {
    "اقتصادي وتسيير وعلوم تجارية": [{ subject: GENERAL_AVG, coef: 2 }, { subject: ECONOMY, coef: 1 }],
    "علوم إنسانية واجتماعية": [{ subject: GENERAL_AVG, coef: 1 }],
    "حقوق وعلوم سياسية": [{ subject: GENERAL_AVG, coef: 1 }],
  },
};

function CalculatorContent() {
  const params = useSearchParams();
  const [serie, setSerie] = useState("علوم تجريبية");
  const [chosen, setChosen] = useState(params.get("specialty") || "");
  
  // الميدان المختار
  const fields = Object.keys(formulas[serie] || {});
  const [field, setField] = useState(fields[0] || "");

  // إعادة تعيين عند تغيير الشعبة
  useEffect(() => {
    const newFields = Object.keys(formulas[serie] || {});
    setField(newFields[0] || "");
    setMarks({});
  }, [serie]);

  const [marks, setMarks] = useState<Record<string, string>>({});

  // المواد المطلوبة لهذا الميدان (حقل أو حقلين فقط)
  const requiredSubjects = useMemo(() => {
    return formulas[serie]?.[field] || [];
  }, [serie, field]);

  // حساب المعدل الموزون
  const weightedAverage = useMemo(() => {
    let sumWeighted = 0;
    let sumCoefficients = 0;

    requiredSubjects.forEach((req) => {
      const markValue = parseFloat(marks[req.subject]);
      
      if (Number.isFinite(markValue) && markValue >= 0 && markValue <= 20) {
        sumWeighted += markValue * req.coef;
        sumCoefficients += req.coef;
      }
    });

    if (sumCoefficients === 0) return null;
    return sumWeighted / sumCoefficients;
  }, [marks, requiredSubjects]);

  const recommendations = items.filter(s => s.filiere.includes(serie)).sort((a, b) => {
    const aa = a.seuil_2025.find(x => x.serie === serie)?.moyenne ?? 0;
    const bb = b.seuil_2025.find(x => x.serie === serie)?.moyenne ?? 0;
    return bb - aa;
  });

  return (
    <section className="container-page max-w-4xl py-12">
      <h1 className="section-title mb-3">حاسبة المعدل الموزون</h1>
      <p className="mb-8 text-slate-500">اختر شعبتك والميدان، وأدخل العلامات المطلوبة فقط لحساب معدلك.</p>
      
      <div className="grid gap-5 rounded-3xl border bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <label className="font-bold">شعبة البكالوريا
          <select className="input mt-2 font-bold text-lg" value={serie} onChange={e => setSerie(e.target.value)}>
            {Object.keys(formulas).map(x => <option key={x}>{x}</option>)}
          </select>
        </label>

        <label className="font-bold">الميدان المراد التسجيل فيه
          <select className="input mt-2 font-bold" value={field} onChange={e => setField(e.target.value)}>
            {fields.map(x => <option key={x}>{x}</option>)}
          </select>
        </label>
        
        {/* عرض المواد المطلوبة فقط (حقل أو حقلين) */}
        <div className="grid gap-4 sm:grid-cols-2 mt-4">
          {requiredSubjects.map((req) => (
            <label key={req.subject} className="font-bold flex flex-col">
              <span className="flex justify-between items-center">
                <span>{req.subject}</span>
                <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-1 rounded-md">
                  معامل: {req.coef}
                </span>
              </span>
              <input 
                type="number" 
                min="0" 
                max="20" 
                step=".01" 
                className="input mt-2" 
                placeholder="0 - 20" 
                value={marks[req.subject] || ""} 
                onChange={e => setMarks({ ...marks, [req.subject]: e.target.value })} 
              />
            </label>
          ))}
        </div>
        
        <label className="font-bold mt-4">التخصص المراد مقارنته (اختياري)
          <select className="input mt-2" value={chosen} onChange={e => setChosen(e.target.value)}>
            <option value="">كل التخصصات المناسبة</option>
            {items.map(x => <option value={x.slug} key={x.slug}>{x.nom_ar}</option>)}
          </select>
        </label>
        
        <div className="rounded-2xl bg-blue-50 p-5 dark:bg-blue-950 mt-4">
          <p className="text-sm text-blue-700 dark:text-blue-200">المعدل الموزون</p>
          <p className="mt-1 text-4xl font-black text-blue-800 dark:text-blue-100">{weightedAverage === null ? "—" : weightedAverage.toFixed(2) + " / 20"}</p>
        </div>
      </div>
      
      <h2 className="mb-4 mt-10 text-2xl font-black">توصيات حسب الشعبة</h2>
      <div className="space-y-3">
        {recommendations.filter(x => !chosen || x.slug === chosen).map(x => (
          <div key={x.slug} className="flex items-center justify-between rounded-xl border bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div>
              <b>{x.nom_ar}</b>
              <p className="mt-1 text-xs text-slate-500">{x.domaine}</p>
            </div>
            <span className="text-sm text-slate-500">عتبة نموذجية: {x.seuil_2025.find(z => z.serie === serie)?.moyenne ?? "غير محددة"}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function Calculator() {
  return (
    <Suspense fallback={<div className="container-page py-12 text-center">جاري التحميل...</div>}>
      <CalculatorContent />
    </Suspense>
  );
                }
