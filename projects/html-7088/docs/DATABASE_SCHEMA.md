# مستندات لایه پایگاه داده و سیستم Migration خودکار (استودیو B2.st)

## ۱. نمای کلی معماری دیتابیس (Architecture Overview)
لایه داده در این بازی با هدف ذخیره‌سازی ماندگار، سریع و ضد تقلب در کلاینت طراحی شده است. از ویژگی‌های بارز این پیاده‌سازی می‌توان به موارد زیر اشاره کرد:
1. **سازگاری دوگانه (Isomorphic Support):** اجرای مستقیم بر پایه `IndexedDB` در مرورگرهای وب و سوئیچ خودکار به `MemoryStorageDriver` در محیط‌های ایزوله یا تست‌های خط فرمان Node.js بدون نیاز به کتابخانه‌های سنگین خارجی.
2. **سیستم مایگریشن خودکار (Automated Migrations):** مدیریت تغییرات ساختار استورها و ایندکس‌ها بر اساس شماره نسخه متوالی (v1 -> v2 -> v3).
3. **امضای ضد دستکاری دیجیتال (Anti-Tamper HMAC-SHA256):** هر فایل ذخیره و هر رکورد در جدول امتیازات دارای امضای هش اختصاصی است که در صورت ویرایش مستقیم از Developer Tools بلافاصله شناسایی می‌شود.

---

## ۲. مشخصات استورها و ایندکس‌ها (Schema Specifications)

```
+-------------------------------------------------------------------------------+
|                             MarioRetroDB (v3)                                 |
+----------------------+----------------------+---------------------------------+
| Store Name           | Key Path             | Indexes                         |
+----------------------+----------------------+---------------------------------+
| _migrations          | version              | -                               |
| player_settings      | id                   | -                               |
| player_profiles      | profileId            | -                               |
| save_states          | slotId               | idx_updatedAt, idx_worldLevel   |
| high_scores          | id (autoIncrement)   | idx_score, idx_world, idx_created|
| security_audit_logs  | id (autoIncrement)   | idx_timestamp                   |
+----------------------+----------------------+---------------------------------+
```

### فیلدهای مدل فایل ذخیره (`save_states`):
* `slotId` (String): شناسه اسلات نظیر `'quicksave'`, `'slot_1'`, `'slot_2'`
* `label` (String): عنوان توصیفی اسلات و زمان ذخیره
* `mario` (Object): مختصات `x, y`، سرعت‌های `vx, vy`، وضعیت قد `small|super`، جهت نگاه
* `stats` (Object): امتیاز، تعداد سکه‌ها، جان باقی‌مانده، مرحله فعلی
* `worldState` (Object): آرایه‌ای از شناسه‌های بلاک‌های باز شده و دشمنان مغلوب شده
* `updatedAt` (ISO Timestamp)
* `signature` (HMAC-SHA256): امضای یکپارچگی داده‌ها

---

## ۳. امنیت و مکانیزم ضد تقلب (Anti-Tamper & Security)
برای محاسبه امضا:
$$\text{Signature} = \text{HMAC-SHA256}(\text{SecretSalt}, \text{CanonicalJSON}(\text{Payload}))$$
* جهت خنثی‌سازی حملات زمان‌بندی (Timing Attacks)، متد `CryptoVault.constantTimeCompare` مقایسه بایت به بایت را در زمان ثابت انجام می‌دهد.
* در صورت مغایرت امضا، شیء با شناسه `isTampered: true` بارگذاری شده و به کاربر پیام هشدار نمایش داده می‌شود.

---

## ۴. نحوه اجرای آزمون‌ها (Testing Pipeline)
اجرای تست‌های اعتبارسنجی دیتابیس و مهاجرت‌ها:
```bash
node tests/database_layer.test.js
```
اجرای تست‌های موتور فیزیک:
```bash
node tests/physics.test.js
```