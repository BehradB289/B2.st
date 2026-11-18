# معماری لایه ذخیره‌سازی، اسکیمای داده و موتور میگریشن (Mario B2 Engine)

این سند، مشخصات فنی لایه پایگاه‌داده و سیستم مدیریت پایداری داده‌ها (Persistence Layer) بازی سوپر ماریو در استودیو **B2.st** را تشریح می‌کند.

---

## ۱. اهداف معماری
1. **استقلال کامل (Decoupling):** جداسازی ۱۰۰٪ موتور فیزیک و رندرر ۲ بعدی از نحوه ذخیره‌سازی و پایداری داده.
2. **امنیت و ضد تقلب (Anti-Tamper & Cryptographic Verification):** جلوگیری از تغییر مقادیر جان (Lives)، سکه‌ها (Coins) و امتیازات در محیط ابزارهای توسعه مرورگر (DevTools/IndexedDB Inspector) از طریق ایجاد امضای دیجیتال HMAC-SHA256 بر روی رکوردهای حساس.
3. **مهاجرت و نسخه‌بندی خودکار (Automated Migrations):** پیاده‌سازی گام‌به‌گام ارتقای اسکیما به شکل خطی بر مبنای `IDBOpenDBRequest.onupgradeneeded` با ثبت لاگ مدت زمان اجرا.
4. **تراکنش‌پذیری امن (ACID Transactions):** زمان‌بندی و مدیریت خروج خودکار در صورت بروز خطای Timeout جهت جلوگیری از قفل شدن نخ مرورگر.

---

## ۲. طراحی جداول (Stores & Schema)

| نام جدول (ObjectStore) | کلید اصلی (KeyPath) | ایندکس‌ها (Indexes) | هدف |
| :--- | :--- | :--- | :--- |
| `profiles` | `id` | `username_idx`, `createdAt_idx` | اطلاعات هویت و نام کاربری بازیکن |
| `game_saves` | `id` | `profileId_idx`, `slotIndex_idx`, `profile_slot_idx`, `world_idx` | ذخیره وضعیت ماریو، چک‌پوینت، اندازه و توانایی‌ها |
| `leaderboard` | `id` | `score_idx`, `profileId_idx`, `timestamp_idx` | برترین رکوردهای بازی به همراه هش تایید شده |
| `settings` | `key` | - | تنظیمات گرافیک، صدا و شیدرهای رترو CRT |
| `audit_logs` | `id` | `action_idx`, `timestamp_idx` | ثبت تقلب‌های کشف‌شده و خطاهای بحرانی |
| `_migrations_meta` | `version` | - | تاریخچه نسخه‌های میگریشن اعمال‌شده |

---

## ۳. چرخه حیات میگریشن خودکار (Migration Lifecycle)

```
IndexedDB.open(NAME, TARGET_VERSION)
          │
          ▼
   [onupgradeneeded]
          │
          ├─► بررسی جدول _migrations_meta
          ├─► فیلتر کردن میگریشن‌هایی که version > oldVersion هستند
          ├─► اجرای توالی Up() به شکل ترتیبی
          ├─► ثبت رکورد موفقیت و زمان صرف‌شده (ms)
          └─► ارتقا موفق و ورود به چرخه اجرایی نرمال
```

---

## ۴. لایه امنیت و تصدیق داده (Anti-Tampering Flow)

1. پیش از ارسال رکورد به متد `put`:
   - تمامی کلیدهای آبجکت به صورت دترمینستیک مرتب می‌شوند (`_normalizeData`).
   - یک هش SHA-256 بر اساس داده و نمک امنیتی استودیو B2.st تولید و به کلید `checksum` متصل می‌شود.
2. هنگام فراخوانی متد `get`:
   - امضا استخراج و مجدداً از روی داده محاسبه می‌شود.
   - در صورت هرگونه عدم تطابق، رکورد نادیده گرفته شده و یک رخداد امنیتی با شناسه `TAMPER_DETECTED` در جدول `audit_logs` ذخیره می‌شود.

---

## ۵. راهنمای استفاده و نمونه کد

```javascript
import { DatabaseLayer } from './src/db/database_layer.js';
import { SaveRepository } from './src/db/repositories/save_repository.js';

// مقداردهی
const db = new DatabaseLayer();
await db.initialize();

const saveRepo = new SaveRepository(db);

// ذخیره وضعیت چک‌پوینت ماریو
await saveRepo.saveGameState({
  profileId: 'usr_player1',
  slotIndex: 0,
  world: 1,
  level: 1,
  score: 1000,
  coins: 15,
  lives: 3,
  marioState: 'super',
  checkpointX: 480,
  checkpointY: 180
});

// بازخوانی وضعیت
const savedGame = await saveRepo.loadGameState('usr_player1', 0);
console.log('Mario State:', savedGame.marioState);
```