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
- تم رفع Next.js إلى إصدار 15.5.29 لأن دليل OpenNext الحالي لم يعد يدعم Next.js 14. يتطلب App Router في Next.js 15 إصدار React 19 كحد أدنى، لذلك أصبح المشروع على `react@^19.2.1` ويستخدم `useActionState` بدل `useFormState` المهمل.
- `wrangler.jsonc` يحدد Worker باسم `dalil-takhasosat-dz-main`؛ يمكن تغييره قبل أول نشر، ويجب أن يطابق اسم خدمة `WORKER_SELF_REFERENCE`.
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

## مراجعة 16-11-2026: إصلاحات
**نفّذ مرة واحدة في Supabase SQL Editor:** `supabase/migrations/20261118_specialty_enrichment_fields.sql`
(كانت دالة `save_specialty_bundle` لا تحفظ `nom_en` و`description_fr` و`description_en` و`subjects` و`study_fields`؛ الملف يصلحها، وأُلحق أيضاً بنهاية `schema.sql`).

- الشعب التي تضيفها من `/admin/series` أصبحت صالحة فعلاً داخل نموذج التخصص والاستيراد (كانت مقيّدة بست شعب ثابتة).
- نموذج التخصص يتيح الآن تحرير الاسم الإنجليزي والوصف بالفرنسية والإنجليزية والمواد ومجالات الدراسة.
- التذييل لا يعرض بريداً أو هاتفاً أو روابط وهمية؛ اضبطها عبر `NEXT_PUBLIC_CONTACT_EMAIL` و`NEXT_PUBLIC_CONTACT_PHONE` و`NEXT_PUBLIC_SOCIAL_*` (انظر `.env.example`).
- الإعلان يحترم حقل `locale`، وصفحات الإدارة تعدّ أحداث الإعلانات على الخادم (حد PostgREST الافتراضي 1000 صف).
- راجع `REVIEW_AR.md` لقائمة الإصلاحات الكاملة والاقتراحات.



## رفع الجامعات ومعدلات القبول (JSON) والطباعة
- رفع الجامعات ومعدلات القبول يتم من `/admin/import` بملف JSON واحد؛ التفاصيل والصيغة في `docs/UNIVERSITIES_JSON_IMPORT.md`. نفّذ `supabase/migrations/20261119_import_universities_bundle.sql` أولاً.
- لم تعد لوحة الإدارة تحتوي نموذج إدخال/حذف معدلات القبول يدوياً؛ التعديل بتصدير الجامعة ثم إعادة رفعها.
- الطباعة / حفظ PDF تعرض ورقة A4 مختصرة (`components/PrintSheet.tsx`) بدل الصفحة الكاملة: صفحة التخصص (الحقائق، المهارات، الآفاق، الجامعات) وصفحة الجامعة (جدول المعدلات حسب الشعبة والسنة).

## صفحات الجامعات والباحث (تحديث 2026-11)
- `/universities`: كل الجامعات المنشورة مع بحث وتصفية بالولاية والنوع.
- `/universities/[slug]`: معلومات الجامعة (الولاية، العنوان، الموقع الرسمي، الخريطة) وكل التخصصات المتوفرة فيها مجمّعة بالمجال، مع إدخال الشعبة والمعدل لترتيب فرصك، وشارة حداثة البيانات، وورقة طباعة مختصرة.
- `/finder` («أين أقبل؟»): شعبة + معدل (+ ولاية اختيارية) ⇒ التخصصات والجامعات التي يكفيك فيها المعدل حسب آخر معدل مسجل، وقائمة «قريبة» (ينقصك ≤ 1).
- صفحة معدلات تخصص في جامعة: عمود «الاتجاه» (رسم مصغر وفرق آخر سنتين) وتنبيه عند تقادم البيانات (> 18 شهراً).
- في الاستيراد: زر «معاينة بدون حفظ» يعرض عدد الجديد والمحدَّث والمحذوف قبل الرفع.

## تحسينات الهاتف (تحديث 2026-11)
- إصلاح تصغير الصفحة وإزاحتها في الهاتف: زخرفة الـHero كانت تتجاوز عرض الشاشة (‎-left-24‎) فتُنتج تمريراً أفقياً؛ حُصرت داخل حاوية مقصوصة، وأُضيف `overflow-x: clip` على `body` وتصدير `viewport` صريح.
- الهيدر: شعار مختصر على الشاشات الصغيرة بلا التفاف ولا قصّ، وأزرار بحجم لمس 40px، وقائمة قابلة للتمرير.
- شريط تنقل سفلي للهاتف: `components/MobileTabBar.tsx` (يراعي safe-area ويُخفى في الطباعة وعلى الشاشات الكبيرة).
- أول عمود ثابت في جداول المعدلات و«أين أقبل؟» أثناء التمرير الأفقي.
- تعطيل `backdrop-filter` على الشاشات ≤ 640px لتحسين السلاسة في الأجهزة المتوسطة.

## تقسيم الصفحات وتخفيف الموقع (تحديث 2026-11)
- **بحث الرئيسية**: لم تعد قائمة التخصصات كلها تُضمَّن في HTML الصفحة؛ الاقتراحات تُجلب عند الكتابة من `/api/suggest` (مخزّنة مؤقتاً 5 دقائق).
- **قائمة التخصصات** تُعرض 12 بطاقة ثم «عرض المزيد»؛ وروابط البطاقات الطويلة بلا prefetch (توفير بيانات الهاتف).
- **الرئيسية** مقسّمة إلى: Hero ← الأدوات (أُضيف «الجامعات» و«أين أقبل؟») ← تصفح حسب المجال ← المقترحة ← الإحصائيات. تبويبات صفحة التخصص صارت ثابتة تحت الهيدر أثناء التمرير.
- **هياكل تحميل** (`loading.tsx`) للموقع ولوحة الإدارة لتحسين الإحساس بالسرعة.
- **لوحة التحكم** مقسّمة إلى أقسام تُبثّ بشكل مستقل (`components/admin/DashboardSections.tsx`): المؤشرات (استعلامات count بدل تحميل كل الصفوف)، الرسم الزمني، توزيع المجالات، جدول التخصصات (حتى 300 صف، 25 في كل دفعة)، آخر العمليات.
- **نموذج التخصص** مقسّم إلى 4 أقسام بشريط تنقل ثابت (الأساسيات، الوصف والمحتوى، الشعب والعتبات، النشر) وشريط حفظ ثابت أسفل الشاشة.

## ما تم في هذه الجلسة («حزمة الأساس»)
1. **تجميد اللغات (دون حذف النظام):** `app/layout.tsx` صار `<html lang="ar" dir="rtl">` ثابتاً بلا قراءة كوكيز، وأُزيلت فروع fr/en ومحدّد اللغة من Header وFooter وMobileTabBar وHeroSearch وصفحتي `/bac`. بقي `lib/i18n.ts` و`app/api/locale/route.ts` وأعمدة قاعدة البيانات كما هي، مع تعليق «FROZEN» في أعلى الملفين. الصفحة الرئيسية استُبدل فيها `getLocale()` بقيمة ثابتة `"ar"` فقط (دون لمس بقية نصوصها).
2. **الكود الميت والأعمدة النائمة:** حُذف `components/SeuilsClient.tsx`. وصار `AdSlot` يفلتر حسب `ads.device` (يُحسم عند العميل عبر `components/AdDeviceGate.tsx` حتى لا تصير الصفحة ديناميكية) وحسب `ads.specialty_slug` عبر الخاصية `specialtySlug` (غير الممرَّرة = الإعلانات العامة فقط)، مع إبقاء فلترة placement وlocale.
3. **سقف PostgREST:** `getSpecialties()` في `lib/data.ts` تقرأ على دفعات من 1000 صف بـ `.range()` (مع ترتيب ثانوي بـ `slug` لثبات الترتيب).
4. **اختبارات vitest:** أُضيف `vitest` وسكربت `npm test` وثلاثة ملفات في `lib/__tests__/` (validate، formulas، validate-universities).

## ما تم في هذه الجلسة (الحزم 3 ← 1 ← 2 ← 4)
**الحزمة 3 — إدارة المعدلات يدوياً:** صفحة `/admin/universities/[id]/rates` (جدول تخصص × شعبة × آخر 8 سنوات، تحرير داخل الخانة: Enter/blur حفظ، Esc إلغاء، زر × للحذف، لوحة «تفاصيل» للمصدر والرسمي، فلاتر وإحصائيات) + دالتان `saveAcceptanceRate` و`deleteAcceptanceRate` في `app/admin/actions.ts` (requireAdmin، تحقق كامل، upsert، audit_log، revalidatePath). زر «إدارة المعدلات يدوياً» في صفحة الجامعة مع إبقاء رفع JSON وربط التخصصات.

**الحزمة 1 — صفحة التخصص:** قسم «المواد الأساسية»، رسم تطور أدنى معدل (Sparkline) بتبديل الشعبة، «أسئلة شائعة» (details + JSON-LD FAQPage) مولَّدة من البيانات، ووصف مولَّد للعرض فقط إن كان الوصف فارغاً.

**الحزمة 2 — صفحة الجامعة:** ملخص في الـ Hero، تجميع التخصصات حسب الكلية، بطاقة «أسهل القبول»، «جامعات أخرى في نفس الولاية»، `ScoreWidget` موحّد (نطاقا التخصص والجامعة)، ووصف مولَّد للعرض فقط. لم تُنفَّذ الخريطة SVG (اختيارية).

**الحزمة 4 — جدول المقارنة السريعة** داخل تبويب «تخصصات مشابهة» + JSON-LD ItemList.

ملفات مساعدة: `lib/autotext.ts`، ودوال `latestMin/minByYear/admissionStatus` في `lib/rates.ts`، و`getRatesForSpecialties` في `lib/universities.ts`، واختبارات `lib/__tests__/rates.test.ts`.

## ما تم في هذه الجلسة (S1 وS2 وS6)
- **S1:** `metadataBase` كان موجوداً في `app/layout.tsx` فلم يُكرَّر. صارت كل canonical مطلقة (`${SITE_URL}/...`) في الصفحات العامة، وأُضيفت للصفحات التي لم تكن لها canonical (الرئيسية، `/bac`، `/bac/[serie]`، `/about`، `/privacy`). canonical الرئيسية في صفحتها وليست في الـ layout حتى لا تتسرب إلى بقية الصفحات.
- **S2:** `generateStaticParams` لصفحات `/universities/[slug]` و`/bac/[serie]` (revalidate 3600) و`/specialties/[slug]/[universitySlug]` (revalidate 600 و`dynamicParams = true`) عبر الدالة الجديدة `getAllPublishedUniversitySpecialties()` في `lib/universities.ts` (استعلام واحد مع pagination).
- **S6:** إعداد `openGraph` (images/siteName/locale/type) و`twitter: summary_large_image` في الـ layout. **الملف `public/og-image.png` غير موجود (TODO في layout.tsx)**؛ أضفه قبل النشر وإلا يعطي رابط الصورة 404.

## ما تم في هذه الجلسة (تدقيق SEO: S3 وS4 وS5 وS7 + اكتمال S1 وS2 وS6)
- **S3 sitemap:** يضم كل أزواج `[slug]/[universitySlug]` مع `lastModified` حقيقي (أحدث `updated_at` لمعدلات الزوج، وإلا `created_at` للربط)، وتواريخ تحديث التخصصات والجامعات، وتواتر/أولويات حسب الجدول. حد 50000 رابط بقطع احتياطي وTODO للتقسيم.
- **S4 metadata ديناميكية:** عناوين ووصف وOG (`article`/`website`) وTwitter `summary_large_image` لصفحات التخصص والتخصص-في-جامعة والجامعة، مع صورة المشاركة. استعلامات `generateMetadata` مشتركة مع الصفحة عبر `React.cache` (دوال `lib/data.ts` و`lib/universities.ts`).
- **S5:** JSON-LD من نوع Organization في الـ layout، و`robots.ts` يحظر `/api/` و`/admin/export` دون `/_next/`.
- **S7:** كل صفحة عامة فيها `<h1>` واحد (تم التحقق)، وصورة الإعلان لها alt وصفي.
- `public/og-image.png` غير موجود بعد (TODO).
