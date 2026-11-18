# وایت‌اودیت (WhiteAudit) - ژنراتور فوری ممیزی سئو و امنیت با برند اختصاصی برای فریلنسرها

> 🚀 Autonomously Architected, Designed, Coded & Verified by **B2.st 6-Agent & 10-Debugger Studio v9.0**

## 📐 Architecture
معماری وایت‌اودیت (WhiteAudit) بر پایه یک ساختار سرورلس، بدون حالت (Stateless) و با کارایی فوق‌العاده بالا روی Next.js 14 App Router طراحی شده است. هسته تحلیلی بک‌اند با ترکیب Cheerio (جهت استخراج داده‌های متادیتا، ساختار سلسله‌مراتبی تگ‌های H1-H6 و بررسی تگ‌های Alt تصاویر در DOM) و Axios (جهت سنجش هدرهای امنیتی نظیر HSTS، CSP، بررسی فشرده‌سازی Gzip/Brotli و هندشیک SSL) سایت هدف را ارزیابی می‌کند. هم‌زمان، متریک‌های Core Web Vitals از طریق فراخوانی موازی API عمومی Google PageSpeed دریافت می‌شوند. امنیت صدور گزارش و مدل درآمدی خرد بدون نیاز به دیتابیس با مکانیزم امضای دیجیتال HMAC در URL کنترل می‌شود. در لایه فرانت‌اند، طراحی Glassmorphism دارک در پس‌زمینه Obsidian با افکت‌های نئونی، کارت‌های شیشه‌ای بلور و نمودارهای دایره‌ای انیمیشنی پیاده‌سازی شده و با تعبیه استایل‌های دقیق @media print، پرزنتیشن اجراییِ آماده تبدیل به PDF با سربرگ اختصاصی فریلنسر ارائه می‌گردد.

## 🗂️ Folder Structure
```text
projects/whiteaudit-5673/
├── src/lib/crawler.ts
├── src/lib/security-headers.ts
├── src/types/audit.ts
├── tests/crawler.test.ts
├── tests/security-headers.test.ts
```
