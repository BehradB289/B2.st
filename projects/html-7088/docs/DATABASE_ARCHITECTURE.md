# مستندات فنی لایه دیتابیس بازی سوپر ماریو - استودیو B2.st

## ۱. ساختار معماری (Database Architecture)
لایه داده در پروژه Super Mario مبتنی بر **IndexedDB استاندارد مرورگر** طراحی شده و دارای سه لایه تفکیک‌شده است:
1. **Schema & Migration Engine (`src/db/migrations.js` & `src/db/schema.js`)**: مدیریت چرخه ارتقای اسکیمای جداول با شماره‌گذاری متوالی نسخه‌ها (Version 1 تا 3) همراه با لاگ سابقه اجرای هر مایگریشن در جدول `_migrations`.
2. **Security & Anti-Tamper Guard (`DataIntegrityGuard`)**: با استفاده از Web Crypto API بومی مرورگر (`crypto.subtle`) و الگوریتم `SHA-256` به همراه کلید نمک امنیتی (Security Salt)، داده‌های ذخیره بازی و رکوردهای برتر امضای دیجیتال می‌شوند. در صورت هرگونه تغییر در DevTools مرورگر، اعتبارسنجی شکست خورده و اکشن امنیتی فعال می‌شود.
3. **Repository Facade (`src/db/database_layer.js`)**: درگاه دسترسی و تراکنش‌های ایزوله (`readonly` و `readwrite`) با قابلیت Rollback خودکار هنگام بروز استثنا.

## ۲. توزیع جداول (Object Stores)
- `player_profiles`: اطلاعات پروفایل و سوابق زمان بازی کاربر.
- `save_states`: وضعیت ذخیره فیزیکی و مرحله بازی (موقعیت ماریو، سکه‌ها، جان‌ها، امتیاز و امضای دیجیتال).
- `high_scores`: رکوردهای امتیازی با ایندکس ترکیبی `idx_score_desc` برای استخراج بهینه لیدربورد.
- `game_settings`: تنظیمات کنترلر، صدا و فیلتر نوستالژیک CRT.
- `security_audit_logs`: مانیتورینگ رویدادهای سیستم و موارد تلاش برای تقلب (Tamper Detection).

## ۳. قابلیت‌های افزوده
- **بک‌آپ و بازیابی رمزنگاری‌شده (Export / Restore)** با اعتبارسنجی چک‌سام تجمیعی.
- **تست‌های واحد کامل در Jest / Runner مدرن (`tests/database.test.js`)**.
- **پایش سهمیه ذخیره‌سازی (Storage Quota)** با استفاده از `navigator.storage.estimate`.