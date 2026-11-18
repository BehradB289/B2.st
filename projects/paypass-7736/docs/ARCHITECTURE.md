# PayPass (پی‌پاس) - معماری سیستم و میکرومانتایز فوری

## ۱. ساختار داده در PostgreSQL (Supabase)

```sql
-- جدول آیتم‌ها
CREATE TABLE items (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    content_type TEXT NOT NULL,
    encrypted_content TEXT NOT NULL, -- AES-256-GCM (iv:authTag:cipher)
    price BIGINT NOT NULL,
    creator_sheba TEXT NOT NULL,
    platform_fee_percent INT DEFAULT 5,
    creator_net_share BIGINT NOT NULL,
    views_count BIGINT DEFAULT 0,
    purchases_count BIGINT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول تراکنش‌ها و سفارش‌ها
CREATE TABLE orders (
    id TEXT PRIMARY KEY,
    item_id TEXT REFERENCES items(slug),
    amount BIGINT NOT NULL,
    fee_amount BIGINT NOT NULL,
    seller_amount BIGINT NOT NULL,
    buyer_identifier TEXT,
    status TEXT DEFAULT 'pending',
    payment_ref_id TEXT,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## ۲. جریان رمزنگاری و امنیت (Cryptographic Security Flow)
1. محتوای خام سازنده هرگز در دیتابیس به صورت متن ساده ذخیره نمی‌شود.
2. با الگوریتم **AES-256-GCM** و یک بردار اولیه (IV) رندوم ۱۶ بایتی و تگ اعتبارسنجی (AuthTag) رمزنگاری می‌شود.
3. در صفحه خریدار قبل از پرداخت (`/[slug]`)، صرفاً متادیتا (عنوان، توضیحات و قیمت) واکشی می‌شود و محتوای حساس ارسال نمی‌شود.
4. پس از تایید تراکنش در Server Action سمت سرور، محتوا رمزگشایی و تحویل داده می‌شود.