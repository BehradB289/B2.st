# B2.st Mario Engine - CLI Tool & Health Monitoring Service

## 1. Overview
این ماژول ابزار خط فرمان استودیو (`src/cli.js`) و زیرسیستم پایش سلامت و تحلیل رفتار موتور (`src/core/health_monitor.js`) را پیاده‌سازی می‌کند. این ابزار وظیفه مدیریت سرور توسعه، استخراج متریک‌های بلادرنگ (Telemetry)، ارزیابی پرفورمنس حلقه رندر و فیزیک ECS و سازگاری با پایپ‌لاین‌های CI/CD و کوبرنتیز (Liveness/Readiness Probes) را بر عهده دارد.

---

## 2. مشخصات فنی و اندپوینت‌های پایش سلامت

کلاس `HealthMonitor` اطلاعات زیر را جمع‌آوری و ارزیابی می‌کند:
- **وضعیت سلامت کلی:** `HEALTHY` ،`DEGRADED` ،`CRITICAL`
- **متریک‌های حافظه سیستم و پردازش:** مصرف Heap، RSS و سهم درصدی
- **تاخیر حلقه رویداد (Event Loop Lag):** محاسبه مستمر بر حسب میلی‌ثانیه با تایمرهای High-Resolution
- **تله‌متری بازی:** دریافت FPS، تعداد Entityهای فعال و زمان گام فیزیک

### اندپوینت‌های استاندارد:
1. `GET /health`: گزارش تشخیصی جامع شامل وضعیت سرور و جزئیات پایش
2. `GET /health/live`: پروب بررسی حیات (Liveness Probe)
3. `GET /health/ready`: پروب آمادگی جهت پاسخگویی به ترافیک (Readiness Probe)
4. `GET /health/telemetry`: اطلاعات زنده حلقه بازی ماریو (FPS و وضعیت هویت‌ها)

---

## 3. دستورات خط فرمان (CLI)

```bash
# مشاهده راهنمای دستورات
node src/cli.js help

# بررسی وضعیت سلامت و مصرف منابع به صورت مصور
node src/cli.js health
node src/cli.js status

# دریافت خروجی متنی JSON (مناسب اتوماسیون CI/CD)
node src/cli.js health --json

# اجرای سرور توسعه یکپارچه به همراه وب‌شل و اندپوینت‌های سلامت
node src/cli.js serve --port=8080

# اجرای پایپ‌لاین آزمون‌های واحد
node src/cli.js test

# بازرسی صحت فایل‌های مراحل
node src/cli.js inspect-levels
```

---

## 4. نمونه خروجی JSON از `/health`

```json
{
  "service": "b2st-mario-engine",
  "version": "1.4.0",
  "status": "HEALTHY",
  "timestamp": "2025-05-18T12:00:00.000Z",
  "uptimeSeconds": 142.5,
  "system": {
    "platform": "linux",
    "arch": "x64",
    "nodeVersion": "v20.11.0"
  },
  "process": {
    "pid": 4821,
    "heapUsedBytes": 18452112,
    "heapTotalBytes": 32112640,
    "heapUsedPercent": 57.46,
    "eventLoopLagMs": 1.25
  },
  "engineTelemetry": {
    "fps": 60,
    "activeEntities": 18,
    "activeLevel": "World 1-1",
    "isEngineResponsive": true
  },
  "issues": []
}
```