# دليل التخصصات الجامعية الجزائرية

تطبيق Next.js لإدارة وعرض التخصصات الجامعية والعتبات حسب شعبة البكالوريا، ومجهز للنشر على Cloudflare Workers عبر OpenNext.

## المتطلبات
- Node.js 18.17 أو أحدث (يفضل Node 20 LTS)
- npm
- Supabase لتفعيل لوحة الإدارة وتخزين البيانات مركزياً. الموقع العام يعمل ببيانات JSON حتى دون إعداد Supabase.

## التشغيل المحلي
```bash
npm install
cp .env.example .env.local
npm run dev
```
ثم افتح `http://localhost:3000`.

## إعداد Supabase (اختياري للموقع العام، مطلوب للوحة الإدارة)
1. أنشئ مشروعاً في Supabase.
2. نفّذ محتوى `supabase/schema.sql` من SQL Editor.
3. انسخ Project URL و anon key إلى `NEXT_PUBLIC_SUPABASE_URL` و`NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. انسخ service_role key إلى `SUPABASE_SERVICE_ROLE_KEY`، ولا تضعه أبداً في متغير يبدأ بـ `NEXT_PUBLIC_` أو في كود المتصفح.
5. أنشئ مستخدماً من Authentication ثم ضع بريده في `ADMIN_EMAILS` (يمكن وضع أكثر من بريد مفصول بفاصلة).
6. شغّل التطبيق وسجّل الدخول عبر `/admin/login`.

> إذا لم تضبط Supabase، يبقى الموقع العام يقرأ `data/specialties.json`. أما لوحة الإدارة فتتطلب Supabase Auth وقاعدة البيانات.

## النشر
- اضبط متغيرات البيئة نفسها في منصة الاستضافة.
- اجعل `NEXT_PUBLIC_SITE_URL` عنوان الموقع الحقيقي مع https.
- لا تشارك service role key ولا ترفع `.env.local` إلى Git.
- بعد تعديل البيانات تأكد من مراجعة العتبات التجريبية قبل نشرها.

## فحوصات الجودة
```bash
npm run typecheck
npm run lint
npm run build
```

## المرحلة الثانية: الإعلانات والإعدادات والتحليلات

- لوحة الإعلانات: `/admin/ads` لإنشاء حملات Direct وAdSense وSponsored وإرسالها للمراجعة ثم الموافقة أو الرفض أو الإيقاف.
- إعدادات الموقع: `/admin/settings` لحفظ اسم الموقع واللغات المفعّلة واللغة الافتراضية وسياسة الإعلانات.
- لوحة الإدارة تعرض توزيع التخصصات حسب المجال، وتقرأ إحصائيات الظهور والنقرات من جدول `ad_events` عند توفر بياناته.
- يمكن عرض إعلان معتمد في مساحة الصفحة الرئيسية `home` عبر مكوّن `AdSlot`.
- حقول إثراء التخصصات والترجمة أضيفت إلى المخطط: `nom_en`, `description_fr`, `description_en`, `subjects`, `study_fields`, `translations`.

### ترقية قاعدة البيانات

نفّذ ملف `supabase/schema.sql` كاملاً في Supabase SQL Editor بعد أخذ نسخة احتياطية. جداول الإعلانات والإعدادات خاصة بالخادم، ولا تملك سياسات كتابة عامة. القراءة العامة للإعلانات محصورة بالحملات النشطة وضمن فترة صلاحيتها.

### ملاحظات تشغيلية

- يلزم إعداد `NEXT_PUBLIC_SUPABASE_URL` و`NEXT_PUBLIC_SUPABASE_ANON_KEY` و`SUPABASE_SERVICE_ROLE_KEY` لإدارة الإعلانات والإعدادات.
- موافقة المشرف يدوياً مطلوبة قبل عرض الإعلان.
- تسجيل أحداث الظهور والنقرات يتطلب تكامل تتبع آمن إضافياً قبل الاعتماد على تقارير الأداء أو الفوترة حسب الأداء.
- إعدادات اللغات تحفظ التفضيلات والبنية اللازمة للمحتوى متعدد اللغات؛ ترجمة كامل واجهات الموقع ومحتوى جميع التخصصات عملية تحرير محتوى مستقلة ولم تُملأ تلقائياً.

### المرحلة التالية: تتبع الإعلانات وسلامة إنشاء الحملات
- أصبح إنشاء الحملة والإعلان يتم عبر دالة `create_ad_campaign_bundle` داخل معاملة PostgreSQL واحدة.
- عند اعتماد الحملة، يتم ختم الإعلان بحقول `approved_by` و`approved_at`، ولا تظهر الإعلانات العامة إلا إذا كان الإعلان معتمداً والحملة نشطة وضمن فترة العرض.
- يسجل مكوّن الإعلان مرات الظهور، ويسجل رابط الإعلان النقرات عبر `/api/ads/events`، مع تحقق خادمي من UUID ونوع الحدث وحالة الإعلان.
- يجب إعادة تشغيل ملف `supabase/schema.sql` كاملاً في SQL Editor بعد أخذ نسخة احتياطية. هذه الدوال والسياسات جزء مطلوب من التحديث.
- بيانات الأحداث هي عدادات أولية وليست نظام فوترة نهائياً: لا يوجد حتى الآن منع قوي للتكرار أو مقاومة متقدمة للروبوتات، ولا ينبغي اعتمادها وحدها لإصدار فواتير حسب النقرات/الظهور.

## النشر على Cloudflare Workers (النسخة المجهزة)

تم تجهيز المشروع للنشر على Cloudflare باستخدام OpenNext؛ وهذا هو المسار المتوافق مع تطبيق Next.js كامل (App Router وServer Actions) بدلاً من تصدير HTML ثابت.

### المتطلبات
- Node.js 20 أو أحدث.
- حساب Cloudflare.
- حساب Supabase عند استخدام لوحة الإدارة (اختياري للموقع العام).

### التثبيت والبناء محلياً
```bash
npm install
cp .dev.vars.example .dev.vars
cp .env.example .env.local
npm run preview
```

### متغيرات البيئة في Cloudflare
من لوحة Cloudflare Worker ثم Settings → Variables and Secrets أضف القيم التالية:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (Secret فقط، لا تجعله متغيراً عاماً)
- `ADMIN_EMAILS`
- `NEXT_PUBLIC_SITE_URL`

لا تضع مفاتيح Supabase السرية في Git أو في متغيرات `NEXT_PUBLIC_`.

### النشر
```bash
npx wrangler login
npm run deploy
```

أو اربط مستودع GitHub في Cloudflare Workers Builds، واجعل أمر البناء `npm run deploy` وفق إعدادات OpenNext. لا تستخدم إعدادات Cloudflare Pages الثابتة (`next export`) لهذا المشروع؛ لأنه يعتمد على Server Components وServer Actions وواجهات API.

### ملاحظات توافق مهمة
- تم رفع Next.js إلى إصدار 15.5.29 لأن دليل OpenNext الحالي لم يعد يدعم Next.js 14.
- `wrangler.jsonc` يحدد Worker باسم `dalil-takhasosat-dz`؛ يمكن تغييره قبل أول نشر، ويجب أن يطابق اسم خدمة `WORKER_SELF_REFERENCE`.
- لا توجد بيانات اعتماد Cloudflare داخل المشروع. يلزم تسجيل الدخول إلى حسابك ثم تنفيذ `npm run deploy` لنشره فعلياً.
- لم يتم تأكيد بناء Worker أو نشره من هذه البيئة؛ يجب تشغيل `npm install` ثم `npm run preview` أولاً، وبعد نجاح المعاينة تنفيذ `npm run deploy`.

## Cloudflare / Next.js 15 compatibility fix

Dynamic App Router pages now await the `params` Promise required by Next.js 15:
- `app/(site)/bac/[serie]/page.tsx`
- `app/(site)/specialties/[slug]/page.tsx`
- `app/admin/(panel)/specialties/[slug]/page.tsx`

After installing dependencies, run `npm run typecheck` and `npm run preview` before deploying.

## تحديث لوحة الإدارة (16-11-2026)
لتفعيل إدارة شعب البكالوريا الجديدة، شغّل مرة واحدة ملف `supabase/migrations/20261116_admin_enhancements.sql` من Supabase SQL Editor. ينشئ جدول `bac_series` مع سياسات القراءة العامة للشعب النشطة، ويضيف الشعب الست الأساسية دون حذف بيانات سابقة. بعدها ستظهر صفحة «إدارة الشعب» في لوحة `/admin/series`.

اختيار اللغة من شريط الموقع يحفظ اللغة في Cookie. تمت ترجمة شريط التنقل والصفحة الرئيسية وصفحات عرض الشعب إلى العربية والفرنسية والإنجليزية؛ أما بقية صفحات المحتوى فتحتاج استكمال ترجمتها قبل اعتبار تغطية اللغات كاملة.
