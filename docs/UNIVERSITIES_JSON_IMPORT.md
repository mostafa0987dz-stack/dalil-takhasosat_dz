# رفع الجامعات ومعدلات القبول بملف JSON

## التفعيل (مرة واحدة)
نفّذ في Supabase > SQL Editor الملف:
`supabase/migrations/20261119_import_universities_bundle.sql`
(وهو مضاف أيضاً في نهاية `supabase/schema.sql`). خذ نسخة احتياطية قبل التنفيذ.

## الاستخدام
1. لوحة الإدارة > «استيراد وتصدير» > قسم «رفع الجامعات ومعدلات القبول».
2. حمّل «قالب جاهز» (`public/templates/universities-template.json`) أو صدّر البيانات الحالية.
3. ارفع الملف. أي خطأ يوقف العملية كاملة دون حفظ شيء، ويذكر الجامعة والتخصص والسجل المعيب.

## بنية الملف
```json
{ "universities": [ {
  "slug": "universite-alger-1", "name_ar": "جامعة الجزائر 1", "name_fr": null,
  "type": "جامعة", "wilaya": "الجزائر", "city": "الجزائر", "address": null,
  "website_url": "https://…", "latitude": null, "longitude": null,
  "description_ar": null, "is_published": true,
  "specialties": [ {
    "specialty_slug": "medecine", "faculty_name": "كلية الطب", "is_active": true,
    "rates": [ { "bac_branch": "علوم تجريبية", "year": 2025, "score": 15.25,
                 "source_url": "https://…", "source_title": "…", "is_official": true, "notes": null } ]
  } ]
} ] }
```
- المطلوب فقط: `slug` و`name_ar`. الباقي اختياري.
- `specialty_slug` يجب أن يكون موجوداً مسبقاً. يُنشأ ربط الجامعة بالتخصص تلقائياً.
- `bac_branch` يطابق اسم شعبة في «شعب البكالوريا». `score` بين 0 و20 أو `null`.
- `is_official: true` يتطلب `source_url`.
- الحقول الاختيارية الفارغة لا تمسح قيمة موجودة. المفتاح `is_published` الغائب يُبقي الحالة كما هي (والجديدة مسودة).
- تحتفظ المفاتيح البديلة `serie` و`annee` و`moyenne` بنفس المعنى مثل ملف التخصصات.

## خياراته
- **نشر كل الجامعات مباشرة**: يتجاوز `is_published` في الملف.
- **استبدال معدلات القبول**: يحذف معدلات الجامعات المذكورة في الملف ثم يضيف ما فيه فقط. هذه هي الطريقة لحذف سجلات قديمة، لأن إدخال/حذف المعدلات يدوياً أُزيل من لوحة الإدارة.
- التصدير: `/admin/export?type=universities` (الكل) أو `&slug=universite-alger-1` (جامعة واحدة)، بنفس صيغة الرفع.
