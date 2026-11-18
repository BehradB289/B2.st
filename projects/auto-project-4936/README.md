# لینک‌باکس – کوتاه‌کننده لینک هوشمند با صفحه بیو و آنالیتیکس لحظه‌ای

> 🚀 Autonomously Architected, Designed, Coded & Verified by **B2.st 6-Agent & 10-Debugger Studio v9.0**

## 📐 Architecture
لینک‌باکس یک مونولیت سبک Node.js (Express) با دیتابیس فایلی SQLite (از طریق Drizzle ORM) است. سرور یک فایل اصلی دارد که هم API‌های CRUD لینک، هم احراز هویت JWT، هم ریدایرکت ۳۰۲ با ثبت کلیک و هم سرو فایل‌های استاتیک فرانت (public/) را انجام می‌دهد. فرانت یک SPA ساده با فایل‌های HTML + Tailwind CDN + Vanilla JS (یا Alpine.js) است که مستقیماً از همان سرور سرو می‌شود. لایه آنالیتیکس با کوئری‌های GROUP BY روی جدول clicks پیاده‌سازی می‌شود. Rate-limiter روی مسیر ریدایرکت اعمال می‌شود. کل پروژه بدون build step خاصی قابل اجراست و با یک Dockerfile یا دستور node src/server.js روی Railway/Render دیپلوی می‌شود. مدل داده سه‌جدولی (users → links → clicks) با روابط one-to-many ساده. احراز هویت stateless با JWT و بدون refresh token برای سادگی MVP.

## 🗂️ Folder Structure
```text
projects/auto-project-4936/
├── .env.example
├── .gitignore
├── Dockerfile
├── README.md
├── config/default.json
├── data/.gitkeep
├── docs/API.md
├── docs/SETUP.md
├── package.json
├── public/index.html
├── src/.dockerignore
├── src/config.js
├── src/db/index.js
├── src/db/migrate.js
├── src/db/schema.js
├── src/middleware/authGuard.js
├── src/middleware/errorHandler.js
├── src/routes/auth.js
├── src/server.js
├── src/utils/response.js
├── src/utils/validators.js
├── src/vitest.config.js
├── tests/auth.test.js
```
