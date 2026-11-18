# ریویو‌شیلد (ReviewShield) - هدایت‌گر هوشمند نظرات گوگل مپس با سیستم دفاعی اعتبار

> 🚀 Autonomously Architected, Designed, Coded & Verified by **B2.st 6-Agent & 10-Debugger Studio v9.0**

## 📐 Architecture
معماری میکروسرویس ریویو‌شیلد (ReviewShield) با پترن Edge-first بر بستر Next.js 14 App Router طراحی شده است. هسته سیستم شامل یک روتینگ شرطی در لایه کلاینت/سرور بر پایه هویت بیزینس (Dynamic Route: `/[slug]`) است. دیتابیس Supabase وضعیت اشتراک و ترافیک (محدودیت سقف ۳۰ ریتینگ رایگان) و لاگ فیدبک‌ها را در PostgreSQL مدیریت می‌کند. ریتینگ‌های ۴ و ۵ ستاره بدون تأخیر مستقیماً به Intent URL گوگل مپس ریدایرکت می‌شوند تا شاخص محلی بیزینس در الگوریتم سئوی گوگل ارتقا یابد. ریتینگ‌های ۱ تا ۳ ستاره با اینترسپت کلاینتی وارد فرم Glassmorphic با ترنزیشن Framer Motion شده و پی‌لود انتقاد از طریق Route Handler اختصاصی مستقیماً با Fetch سبک به Bot API تلگرام ارسال می‌شود؛ کل سرویس بدون نیاز به پکیج‌های حجیم شخص ثالث و آماده دیپلوی زیر ۲ ساعت روی Vercel/Supabase است.

## 🗂️ Folder Structure
```text
projects/reviewshield-4015/
├── config/supabase-schema.sql
├── docs/DATABASE.md
├── src/lib/supabaseClient.ts
├── src/types/database.types.ts
├── tests/supabase.test.ts
```
