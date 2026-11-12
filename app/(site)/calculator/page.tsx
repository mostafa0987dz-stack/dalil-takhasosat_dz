"use client";
import { useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import data from "@/data/specialties.json";
import type { Specialty } from "@/types";

const items = data as Specialty[];

// 1. تحديد المواد المطلوبة لكل شعبة (مادة واحدة فقط أو معدل عام)
const simpleFormulas: Record<string, { label: string; subject: string }> = {
  "علوم تجريبية": { label: "علامة علوم الطبيعة", subject: "science" },
  "رياضيات": { label: "علامة الرياضيات", subject: "math" },
  "تقني رياضي": { label: "علامة المادة التقنية", subject: "tech" },
  "آداب وفلسفة": { label: "علامة اللغة العربية", subject: "arabic" },
  "لغات أجنبية": { label: "علامة اللغة الفرنسية", subject: "french" },
  "تسيير واقتصاد": { label: "علامة التسيير المحاسبي", subject: "economy" },
};

function CalculatorContent() {
  const params = useSearchParams();
  const [serie, setSerie] = useState("علوم تجريبية");
  const [chosen, setChosen] = useState(params.get("specialty") || "");
  
  // حالة لحفظ علامة المعدل العام وعلامة المادة الأساسية
  const [generalMark, setGeneralMark] = useState<string>("");
  const [specificMark, setSpecificMark] = useState<string>("");

  // الحصول على المادة المطلوبة للشعبة الحالية
  const currentFormula = simpleFormulas[serie] || { label: "علامة المادة", subject: "other" };

  // حساب المعدل الموزون (معادلة 2× المعدل + 1× المادة الأساسية / 3)
  // يمكنك تعديل الأرقام هنا إذا أردت تغيير المعاملات
  const weightedAverage = useMemo(() => {
    const g = parseFloat(generalMark);
    const s = parseFloat(specificMark);
    
    if (!Number.isFinite(g) && !Number.isFinite(s)) return null;
    
    // إذا أدخل الطالب المعدل العام فقط
    if (Number.isFinite(g) && !Number.isFinite(s)) return g;
    // إذا أدخل علامة المادة فقط
    if (!Number.isFinite(g) && Number.isFinite(s)) return s;
    
    // إذا أدخل الاثنين معاً (معدل × 2 + مادة × 1) / 3
    if (Number.isFinite(g) && Number.isFinite(s)) {
       return ((g * 2) + (s * 1)) / 3;
    }
    return null;
  }, [generalMark, specificMark]);

  const recommendations = items.filter(s => s.filiere.includes(serie)).sort((a, b) => {
    const aa = a.seuil_2025.find(x => x.serie === serie)?.moyenne ?? 0;
    const bb = b.seuil_2025.find(x => x.serie === serie)?.moyenne ?? 0;
    return bb - aa;
  });

  return (
    <section className="container-page max-w-4xl py-12">
      <h1 className="section-title mb-3">حاسبة المعدل الموزون</h1>
      <p className="mb-8 text-slate-500">اختر شعبتك، وأدخل علامتك.</p>
      
      <div className="grid gap-5 rounded-3xl border bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <label className="font-bold">شعبة البكالوريا
          <select className="input mt-2 font-bold text-lg" value={serie} onChange={e => {setSerie(e.target.value); setGeneralMark(""); setSpecificMark("");}}>
            {Object.keys(simpleFormulas).map(x => <option key={x}>{x}</option>)}
          </select>
        </label>
        
        <div className="grid gap-4 sm:grid-cols-2 mt-4">
          {/* حقل المعدل العام */}
          <label className="font-bold flex flex-col">
            <span className="flex justify-between items-center">
              <span>المعدل العام (البكالوريا)</span>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-md">معامل 2</span>
            </span>
            <input 
              type="number" min="0" max="20" step=".01" className="input mt-2" placeholder="0 - 20" 
              value={generalMark} onChange={e => setGeneralMark(e.target.value)} 
            />
          </label>

          {/* حقل المادة الأساسية بناءً على الشعبة */}
          <label className="font-bold flex flex-col">
            <span className="flex justify-between items-center">
              <span>{currentFormula.label}</span>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-md">معامل 1</span>
            </span>
            <input 
              type="number" min="0" max="20" step=".01" className="input mt-2" placeholder="0 - 20" 
              value={specificMark} onChange={e => setSpecificMark(e.target.value)} 
            />
          </label>
        </div>
        
        <label className="font-bold mt-4">التخصص المراد مقارنته
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
