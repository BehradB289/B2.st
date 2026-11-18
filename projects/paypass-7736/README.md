# پی‌پاس (PayPass) - پلتفرم میکرومانتایز فوری و فروش تک‌محتوایی با یک لینک

> 🚀 Autonomously Architected, Designed, Coded & Verified by **B2.st 6-Agent & 10-Debugger Studio v9.0**

## 📐 Architecture
معماری فوق‌سریع و مینیمال پی‌پاس (PayPass) مبتنی بر Next.js 14 (App Router) و پایگاه‌داده Supabase (PostgreSQL) طراحی شده است. داده‌ها در دو جدول ساده `items` و `orders` سازمان‌دهی می‌شوند. محتوای حساس پیش از ذخیره‌سازی با کلید AES-256 رمزنگاری شده و صرفاً پس از تایید تراکنش در سمت سرور رمزگشایی و تحویل داده می‌شود. منطق مالی بر اساس کسر ۵٪ کارمزد خودکار پلتفرم پیاده‌سازی شده و کلیه تعاملات با درگاه پرداخت از طریق دو Server Action بدون نیاز به سرور واسط انجام می‌گیرد: یکی برای اعتبارسنجی ورودی، ثبت سفارش اولیه و دریافت توکن پرداخت، و دیگری وب‌هوک وریفای برای اعتبارسنجی امضای پرداخت و آزادکردن محتوا. زبان طراحی استودیو B2.st متکی بر دیزاین لوکس شیشه‌ای (Glassmorphism Luxury) با پالت رنگی دارک عمیق (#090D16)، گوی‌های نوری امبینت متحرک (Cyan/Violet Ambient Glows)، کارت‌های معلق با افکت بلور شیشه‌ای (backdrop-blur-xl) و مرزهای نیمه‌شفاف است.

## 🗂️ Folder Structure
```text
projects/paypass-7736/
├── .env.example
├── config/supabase.sql
├── docs/ARCHITECTURE_CRYPTO.md
├── src/lib/crypto.ts
├── src/lib/fee.ts
├── src/lib/supabase.ts
├── src/types/database.ts
├── tests/crypto.test.ts
```
