# دليل التخصصات الجامعية الجزائرية (v2)

Next.js 14 (App Router) + Tailwind + Supabase (اختياري) مع لوحة تحكم للمشرف.

## التشغيل المحلي
```bash
npm install
npm run dev
```
افتح http://localhost:3000. **بدون Supabase** يعمل الموقع مباشرة من `data/specialties.json` (وضع العرض فقط، لوحة التحكم غير متاحة).

## تفعيل لوحة التحكم (Supabase)
1. أنشئ مشروعاً مجانياً في https://supabase.com
2. افتح **SQL Editor** والصق محتوى `supabase/schema.sql` ثم نفّذه.
3. من **Authentication > Users** أنشئ مستخدماً (بريد + كلمة مرور) للمشرف.
4. انسخ `.env.example` إلى `.env.local` واملأ:
   - `NEXT_PUBLIC_SUPABASE_URL` و`NEXT_PUBLIC_SUPABASE_ANON_KEY` من Project Settings > API
   - `SUPABASE_SERVICE_ROLE_KEY` (سرّي، لا تنشره ولا تضعه في GitHub)
   - `ADMIN_EMAILS` بريد المشرف نفسه
5. شغّل الموقع وافتح `/admin/login`، ثم من **استيراد** ارفع `data/specialties.json` (انشرها مباشرة أو كمسودات).

## النشر على Vercel
ارفع المشروع إلى GitHub واستورده في Vercel، ثم أضف نفس متغيرات `.env.local` في Settings > Environment Variables (ومعها `NEXT_PUBLIC_SITE_URL` برابط موقعك).
تُحدَّث الصفحات تلقائياً بعد كل تعديل من اللوحة.

## بنية البيانات
- `specialties`: التخصص (المنشور فقط يظهر للزوار عبر RLS).
- `thresholds`: عتبات لكل تخصص/شعبة/سنة، مع `is_demo` لإظهار تنبيه التجريبية.
- `audit_log`: سجل عمليات المشرف.
قائمة الشعب ثابتة في `lib/constants.ts`.

## الأمان
- الكتابة تتم فقط من الخادم بمفتاح `service_role` بعد التحقق من رمز Supabase وأن البريد ضمن `ADMIN_EMAILS`.
- مفتاح `anon` يقرأ المنشور فقط بفضل سياسات RLS.
- لا تفعّل التسجيل العام للمستخدمين في Supabase Auth (Disable sign ups) إن لم تحتجه.

## ملاحظات قبل الإنتاج
- العتبات الحالية **تجريبية**. استبدلها ببيانات منشور التوجيه الرسمي وألغِ علامة "تجريبية".
- الحاسبة تقارن بمتوسط بسيط وليس بالمعدل الموزون الرسمي؛ أضف معاملات موثقة قبل اعتمادها.
- حفظ التخصص يحذف عتباته ثم يعيد إدخالها (غير ذري). للأتمتة الكاملة يمكن نقله إلى دالة SQL (RPC).
