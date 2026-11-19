# مستندات فنی لایه دیتابیس، اسکیما و مایگریشن بازی B2 Mario

## ۱. مرور کلی معماری (Architecture Overview)
لایه دیتابیس در استودیو **B2.st** به عنوان یک ماژول مجزا و مستقل از موتور فیزیک و رندرینگ Canvas طراحی شده است. این لایه ذخیره‌سازی داده‌های پایدار بازی (پروفایل‌ها، اسلات‌های ذخیره، رکوردهای برتر، و تنظیمات) را با رعایت اصول **Zero-Trust Client Security** مدیریت می‌کند.

### ساختار اجزا:
1. **`DATABASE_CONFIG`**: مدیریت نام جداول، نسخه‌ها و مقادیر آستانه‌ای امنیتی.
2. **`DatabaseSecurity`**: موتور اعتبارسنجی دیجیتال مبتنی بر الگوریتم `SHA-256` و Web Crypto API برای مقابله با دستکاری دستی مقادیر در حافظه یا مرورگر.
3. **`SCHEMAS` & `SchemaValidator`**: تعریف اسکیمای مدل‌های ذخیره‌سازی با قابلیت Type Checking و محدودسازی بازه‌ها (مانند تعداد سکه‌ها بین ۰ تا ۹۹).
4. **`DatabaseMigrator`**: پایپ‌لاین ارتقای خودکار نسخه پایگاه‌داده بدون تخریب داده‌های قبلی کاربران.
5. **`DatabaseLayer`**: هسته دسترسی داده با الگوی Transactional Data Access Object (DAO).

---

## ۲. دیاگرام جریان امنیت داده (Data Integrity Flow)

```
[Game Engine / Player Action]
             │
             ▼
   [SchemaValidator.validate] ──── (Invalid) ───► [Reject Operation & Log]
             │
             ▼ (Valid)
   [DatabaseSecurity.sealRecord]
             │ (Computes SHA-256 with Salt)
             ▼
   [IndexedDB ObjectStore.put]
             │
             ▼
  ┌────────────────────────────────────────────────────────┐
  │ هنگام خواندن (DatabaseLayer.get):                       │
  │ 1. خواندن رکورد از جدول                               │
  │ 2. ارزیابی `verifyRecordIntegrity(record)`             │
  │ 3. تطابق هش: اگر هماهنگ نباشد، داده باطل و مسدود می‌شود │
  └────────────────────────────────────────────────────────┘
```

---

## ۳. نگاشت جداول (Object Stores) و شاخص‌ها

| نام جدول (Store) | کلید اصلی (KeyPath) | شاخص‌ها (Indexes) | هدف |
| :--- | :--- | :--- | :--- |
| `profiles` | `id` | `by_username`, `by_lastActive` | مدیریت هویت بازیکنان |
| `game_saves` | `slotId` | `by_profile`, `by_updatedAt` | ذخیره وضعیت فیزیکی و چک‌پوینت‌ها |
| `high_scores` | `id` | `by_score`, `by_profile`, `by_timestamp` | سیستم تابلوی رده‌بندی کلاسیک رترو |
| `settings` | `id` | - | نگاشت کلیدهای کنترلر و تنظیمات CRT |
| `level_progress` | `id` | `by_profile`, `by_world_stage` | ثبت عبور از مراحل و ستاره‌ها |
| `audit_logs` | `id` (Auto-inc) | `by_type`, `by_timestamp` | رصد تقلب‌ها و نقض‌های امنیتی |

---

## ۴. چرخه ارتقای اسکیمای خودکار (Automated Migration)
- هنگامی که مقدار `DB_VERSION` افزایش یابد، رویداد `onupgradeneeded` مرورگر برانگیخته می‌شود.
- متد `DatabaseMigrator.executeMigrations(db, oldVersion, newVersion, transaction)` به شکل خطی تمامی تغییرات مابین نسخه‌ها را پله‌به‌پله بدون توقف اجرا می‌نماید.