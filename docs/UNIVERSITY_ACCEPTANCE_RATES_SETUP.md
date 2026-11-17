# نظام الجامعات ومعدلات القبول حسب المؤسسة

## ما الذي تغير؟
- صفحة التخصص لم تعد تعرض عتبات عامة؛ تعرض الجامعات المرتبطة به.
- اختيار الجامعة يفتح `/specialties/{specialtySlug}/{universitySlug}`.
- صفحة الجامعة تعرض السجلات لكل سنة وشعبة دون حد أقصى لعدد السنوات.
- كل سجل يقبل `score = NULL` عند عدم توفر معدل موثق، ويحتفظ برابط المصدر وعنوانه وتاريخ التحقق.
- لا يتم تحويل أسماء الجامعات النصية القديمة في `specialties.universites` تلقائياً إلى سجلات؛ بعضها قد يكون وصفاً عاماً أو غير محدد.

## تطبيق قاعدة البيانات
في Supabase > SQL Editor شغّل الملف:
`supabase/migrations/20261117_university_acceptance_rates.sql`

لا تشغّل migration قبل أخذ نسخة احتياطية ومراجعة المشروع المستهدف.

## إضافة جامعة وربطها بتخصص
مثال بنيوي فقط؛ استبدل القيم بمعلومات رسمية متحقق منها:

```sql
insert into universities (slug, name_ar, name_fr, type, wilaya, city, website_url, is_published)
values ('university-example', 'اسم الجامعة الرسمي', null, 'جامعة', 'الولاية', 'المدينة', 'https://official.example.dz', true)
on conflict (slug) do nothing;

insert into university_specialties (university_id, specialty_slug, is_active)
select u.id, 'medicine', true
from universities u
where u.slug = 'university-example'
on conflict (university_id, specialty_slug) do update set is_active = excluded.is_active;
```

## إضافة معدل موثق
كل سنة/شعبة لها سجل مستقل. لا تضع قيمة تخمينية. إذا لم يتوفر المعدل اترك `score` فارغاً، ولا تسجلها كقيمة رسمية.

```sql
insert into acceptance_rates
(university_id, specialty_slug, bac_branch, year, score, source_url, source_title, verified_at, is_official, notes)
select u.id, 'medicine', 'علوم تجريبية', 2025, null,
       'https://official.example.dz/document.pdf', 'عنوان الوثيقة الرسمية',
       current_date, true, 'المعدل غير منشور في المصدر'
from universities u
where u.slug = 'university-example';
```

## ملاحظات مهمة
- الواجهة العامة لا تعرض إلا الجامعات المنشورة والتخصصات المفعلة.
- لا توجد صلاحية كتابة عامة في هذه الجداول؛ عمليات الإضافة والتعديل والحذف تتم من لوحة الإدارة عبر الخادم ومفتاح `service_role` فقط.
- أصبحت لوحة الإدارة تتضمن `/admin/universities` لإضافة الجامعات، وصفحة تفصيلية لكل جامعة لإدارة بياناتها وربطها بالتخصصات وإضافة/حذف سجلات معدلات القبول.
- قبل إدخال معدلات، اربط التخصص بالجامعة. ويمكن إعادة حفظ السجل نفسه (الجامعة + التخصص + الشعبة + السنة) لتحديثه بدلاً من إنشاء نسخة مكررة.
- لا تصنّف السجل كمصدر رسمي إلا بعد إضافة رابط مصدر والتحقق منه يدوياً. الواجهة لا تتحقق آلياً من صحة محتوى الوثيقة.
- بيانات المعدلات القديمة في جدول `thresholds` لم تُحذف، لكنها لم تعد تُعرض كمعدلات خاصة بجامعة؛ يلزم تدقيقها وإعادة إدخال ما يمكن إسناده إلى جامعة ومصدر.
