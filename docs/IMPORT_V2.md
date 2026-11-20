# مركز الاستيراد (المرحلة 3)

## الإعداد (مرة واحدة)
1. نفّذ في Supabase SQL Editor (على نسخة تجريبية أولاً): `supabase/migrations/20261120_blog_footer.sql` ثم `supabase/migrations/20261121_import_v2.sql`.
2. لا متغيرات بيئة جديدة. رفع ZIP يتطلب `experimental.serverActions.bodySizeLimit = 30mb` (مضبوط في `next.config.mjs`).

## الاستعمال
لوحة الإدارة ← «استيراد وتصدير» ← «مركز الاستيراد».
1. اختر **متخصص** (نوع واحد بملف JSON) أو **عام** (ملف ZIP).
2. اضغط «قراءة ومعاينة»: يتحقق النظام من البنية ويعرض جدولاً: صالح / جديد / مكرر / غير صالح، والتحذيرات، وقائمة الأخطاء.
3. اختر سياسة التكرار: **تخطّي الموجود** (الافتراضي) أو **تحديث الموجود**.
4. «تأكيد الاستيراد» ثم يظهر تقرير: مضاف / محدَّث / متجاهَل / فاشل. كل عملية تُسجَّل في «سجل الاستيراد» وفي سجل العمليات الإدارية.

## الأنواع (ملف JSON لكل نوع)
| النوع | الملف في ZIP | المفتاح الفريد |
|---|---|---|
| شعب البكالوريا | `bac-series.json` | `slug` |
| الولايات | `wilayas.json` | `code` (خانتان) |
| الجامعات | `universities.json` | `slug` |
| الكليات والمعاهد | `faculties.json` | `university_slug` + `name_ar` |
| التخصصات | `specialties.json` (نفس صيغة ملف التخصصات، مع `seuils`) | `slug` |
| العتبات ومعدلات القبول | `thresholds.json` | جامعة + تخصص + شعبة + سنة |
| تصنيفات المقالات | `categories.json` | `slug` |
| المقالات | `articles.json` | `slug` |
الملف إما مصفوفة مباشرة أو كائن بمفتاح النوع (`{"universities":[...]}`).

حقول `thresholds.json`: `university_slug`, `specialty_slug`, `bac_branch` (أو `serie`), `year` (أو `annee`), `score` (0..20 أو null)، `source_url`, `source_title`, `is_official` (يتطلب `source_url`), `notes`. إن لم يكن ربط الجامعة بالتخصص موجوداً يُنشأ تلقائياً.
حقول `articles.json`: `slug`, `title`, `excerpt`, `content_md` (Markdown)، `category_slug`, `tags`, `author_name`, `cover_image_url`, `cover_image_alt`, `seo_title`, `seo_description`, `og_image_url`, `canonical_url`, `keywords`, `related_specialties`, `related_universities`. **تُنشأ دائماً كمسودة** حتى لو ذُكرت حالة نشر.

## ملف ZIP العام
```
university-data.zip
├── manifest.json      (مطلوب)
├── universities.json  ├── faculties.json  ├── specialties.json  ├── thresholds.json
├── bac-series.json    ├── wilayas.json    ├── categories.json   ├── articles.json
└── sources.json       (اختياري: مصادر البيانات)
```
`manifest.json`:
```json
{ "schema_version": 1, "created_at": "2026-11-20T10:00:00Z",
  "counts": { "universities": 59, "thresholds": 845 },
  "sources": [ { "title": "منشور التوجيه 2026", "url": "https://..." } ] }
```
- `counts` يُقارَن بعدد سجلات كل ملف؛ عدم التطابق خطأ مانع.
- نموذج جاهز: `public/templates/university-data-sample.zip` (تصنيفات المدونة الثمانية ومقال مثال كمسودة).

## الأمان
- ZIP: JSON فقط (أي امتداد آخر، تنفيذي أو غيره، يُرفض)، ولا مسارات مطلقة ولا `..` ولا `\`، حد 50 ملفاً و10MB للملف و30MB مجموعاً و25MB للأرشيف، فحص CRC، رفض الملفات المشفرة وZIP64، وحد على حجم فك الضغط.
- التحقق من البنية والقيم قبل أي حفظ، وكشف التكرار داخل الملف وأمام قاعدة البيانات، والتحقق من المراجع (جامعة/تخصص/تصنيف موجودة).
- **لا نشر تلقائي**: الجامعات تُنشأ `is_published=false`، والتخصصات `published=false`، والمقالات مسودة. حالة المنشور الموجود لا تتغير.
- **لا حذف تلقائي** لسجلات غير موجودة في الملف.
- الحفظ في **معاملة SQL واحدة** (`apply_import_v2`): أي خطأ = تراجع كامل.
- التراجع بعد النجاح (`undo_import_v2`) يحذف **فقط السجلات الجديدة** التي أنشأها ذلك الاستيراد؛ لا يُعيد قيم السجلات التي حدّثها. احذر: حذف جامعة جديدة يحذف معدلاتها وروابطها.

## ما لم يُنفَّذ بعد
CSV وExcel (البنية جاهزة لإضافتهما دون تعطيل JSON). والمسار القديم (JSON للتخصصات وللجامعات) ما زال يعمل أسفل الصفحة.
