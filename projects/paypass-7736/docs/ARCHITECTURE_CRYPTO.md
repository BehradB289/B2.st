# PayPass Architecture & Security Specification
**استودیو B2.st | پلتفرم میکرومانتایز فوری و فروش تک‌محتوایی**

این سند جزئیات اسکیما، مدل امنیتی Zero-Trust و منطق رمزنگاری ماژول پایگاه‌داده پی‌پاس (PayPass) را تبیین می‌کند.

---

### ۱. معماری رمزنگاری محتوا (Zero-Trust Cryptography)
محتوای دیجیتال اختصاصی (لینک‌های دانلود خصوصی، دوره‌ها، کلیدهای دسترسی API، اسناد متنی) پیش از رسیدن به دیسک پایگاه‌داده Supabase رمزنگاری می‌شوند:

- **الگوریتم:** `AES-256-GCM` (Galois/Counter Mode)
- **بردار مقداردهی اولیه (IV):** ۱۲ بایت تصادفی به ازای هر آیتم مجزا (تولید شده توسط `crypto.randomBytes`)
- **تگ احراز اصالت (Auth Tag):** ۱۶ بایت (۱۲۸ بیت) جهت تایید تمامیت داده و جلوگیری از تغییرات عمدی یا تصادفی (Tampering Attacks)
- **ساختار ذخیره‌سازی در دیتابیس:** 
  ```text
  base64url(iv) . base64url(authTag) . base64url(ciphertext)
  ```
- **چرخه حیات رمزگشایی:** متن محتوا صرفاً و منحصراً پس از اعتبارسنجی قطعی تراکنش در وب‌هوک وریفای یا Server Action روی رم سرور رمزگشایی و تحویل داده می‌شود. کلاینت هرگز کلید مستر یا داده دکریپت نشده را لمس نمی‌کند.

---

### ۲. ساختار جداول پایگاه‌داده Supabase

```
+-------------------------------------------------------+
|                       items                           |
+-------------------------------------------------------+
| id (UUID, PK)                                         |
| slug (TEXT, UNIQUE, LOWERCASE)                        |
| title (TEXT)                                          |
| encrypted_content (TEXT, AES-256-GCM)                 |
| price (BIGINT, >= 10000)                              |
| seller_iban (VARCHAR(34), IR...)                      |
| is_active (BOOLEAN)                                   |
| created_at / updated_at (TIMESTAMPTZ)                 |
+-------------------------------------------------------+
                           | 1
                           |
                           | N
+-------------------------------------------------------+
|                       orders                          |
+-------------------------------------------------------+
| id (UUID, PK)                                         |
| item_id (UUID, FK -> items.id)                        |
| gateway_authority (VARCHAR(64), UNIQUE)               |
| amount (BIGINT)                                       |
| platform_fee (BIGINT, 5%)                             |
| status (ENUM: pending | completed | failed)           |
| customer_identifier (TEXT, NULLABLE)                  |
| payment_metadata (JSONB)                              |
| created_at / updated_at (TIMESTAMPTZ)                 |
+-------------------------------------------------------+
```

---

### ۳. ایزولاسیون و سیاست‌های RLS (Row Level Security)

1. **جدول `items`:**
   - **عمومی (Anon):** فقط از طریق ویوی `items_public` به متادیتای عمومی (`id`, `slug`, `title`, `price`) دسترسی دارد. فیلدهای `encrypted_content` و `seller_iban` مخفی هستند.
   - **سرویس سرور (Service Role):** دسترسی کامل برای ثبت آیتم جدید و فراخوانی متن رمزنگاری‌شده جهت تحویل پس از خرید.

2. **جدول `orders`:**
   - ساخت رکورد، آپدیت وضعیت تراکنش و کسر کارمزد مستقیماً از داخل Server Actions با توکن معتمد صورت می‌پذیرد.
   - کلاینت‌ها امکان درج مستقیم یا ویرایش مبالغ و وضعیت فاکتور را ندارند.

---

### ۴. منطق مالی کارمزد (Platform Fee)
- طبق سیاست مالی B2.st، در زمان پرداخت **۵٪ کارمزد خودکار** کسر و مابقی ۹۵٪ در فیلدهای تحلیلی سفارش ثبت می‌گردد:
  $$\text{Platform Fee} = \lfloor \text{Amount} \times 0.05 \rfloor$$
  $$\text{Seller Payout} = \text{Amount} - \text{Platform Fee}$$