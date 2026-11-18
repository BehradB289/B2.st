```markdown
# 🎮 B2.st Mario — راهنمای ابزار CLI

## نصب و راه‌اندازی

```bash
# کلون پروژه
git clone https://github.com/B2-st/mario.git
cd mario

# اجرای CLI
node src/cli.js help
```

## دستورات موجود

### `help` — راهنما
```bash
node src/cli.js help              # لیست تمام دستورات
node src/cli.js help status       # راهنمای دستور خاص
```

### `status` — وضعیت پروژه
```bash
node src/cli.js status            # نمایش خلاصه
node src/cli.js status --verbose  # نمایش کامل با آمار فایل‌ها
```

### `health` — بررسی سلامت
```bash
node src/cli.js health                        # گزارش سلامت
node src/cli.js health --json                 # خروجی JSON
node src/cli.js health --watch                # نظارت مداوم
node src/cli.js health --watch --interval 2000 # نظارت هر ۲ ثانیه
```

### `serve` — سرور توسعه
```bash
node src/cli.js serve              # اجرا روی پورت پیش‌فرض (3000)
node src/cli.js serve --port 8080  # اجرا روی پورت دلخواه
```

**اندپوینت‌های سرور:**
| مسیر | توضیح |
|------|-------|
| `/` | صفحه اصلی بازی |
| `/health` | گزارش سلامت (JSON) |
| `/health/history` | تاریخچه بررسی‌ها |

### `build` — ساخت پروژه
```bash
node src/cli.js build                          # ساخت کامل
node src/cli.js build --level 1-1              # ساخت مرحله خاص
node src/cli.js build --minify                 # با فشرده‌سازی
node src/cli.js build --output ./my-dist       # پوشه خروجی دلخواه
```

### `config` — مدیریت تنظیمات
```bash
node src/cli.js config                         # نمایش تنظیمات فعلی
node src/cli.js config --set debug=true        # تغییر تنظیم
node src/cli.js config --set physics.gravity=0.5  # تنظیم تو در تو
node src/cli.js config --reset                 # بازنشانی
```

### `test` — اجرای تست‌ها
```bash
node src/cli.js test                           # اجرای همه تست‌ها
node src/cli.js test --filter health           # فیلتر بر اساس نام
node src/cli.js test --verbose                 # با جزئیات خطا
```

### `clean` — پاکسازی
```bash
node src/cli.js clean              # حذف dist/ و cache/
node src/cli.js clean --all        # حذف node_modules/ هم
```

### `version` — نسخه
```bash
node src/cli.js version
```

## Health Check API

### پاسخ نمونه (`GET /health`)

```json
{
  "timestamp": 1700000000000,
  "isoTime": "2024-01-01T00:00:00.000Z",
  "status": "healthy",
  "checks": [
    {
      "name": "fps",
      "label": "نرخ فریم (FPS)",
      "status": "pass",
      "value": 60,
      "threshold": 30,
      "message": "نرخ فریم (FPS): 60 — سالم"
    }
  ],
  "metrics": {
    "uptime": 42.5,
    "fps": 60,
    "memoryUsageMB": 85.2,
    "entityCount": 23,
    "physicsStepMs": 1.5,
    "renderStepMs": 4.2,
    "collisionChecks": 156
  },
  "summary": "✅ سالم: تمام 5 بررسی موفق"
}
```

### کدهای وضعیت HTTP
| کد | وضعیت | توضیح |
|----|-------|-------|
| `200` | Healthy | همه بررسی‌ها موفق |
| `503` | Degraded | یک یا دو بررسی ناموفق |
| `500` | Critical | سه یا بیشتر بررسی ناموفق |

## ساختار پروژه

```
mario/
├── src/
│   ├── cli.js                    # ← ابزار CLI (این فایل)
│   ├── core/
│   │   └── health_monitor.js     # ← سرویس Health Check
│   ├── engine/
│   │   ├── game_loop.js
│   │   ├── camera.js
│   │   └── physics.js
│   ├── entities/
│   │   ├── mario.js
│   │   ├── goomba.js
│   │   └── block.js
│   └── levels/
│       └── level_1_1.js
├── public/
│   └── index.html
├── config/
│   └── game.config.json
├── tests/
│   ├── health_monitor.test.js
│   └── cli.test.js
└── docs/
    └── CLI_GUIDE.md
```
```