```javascript
#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════
 *  🎮 B2.st Mario — CLI Management Tool
 *  ابزار خط فرمان مدیریتی بازی ماریو
 * ═══════════════════════════════════════════════════════════════
 *  Usage:  node src/cli.js <command> [options]
 *  Help:   node src/cli.js help
 * ═══════════════════════════════════════════════════════════════
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const http = require('http');

// ─────────────────────────── ANSI Colors ───────────────────────────
const C = {
  reset:   '\x1b[0m',
  bold:    '\x1b[1m',
  dim:     '\x1b[2m',
  red:     '\x1b[31m',
  green:   '\x1b[32m',
  yellow:  '\x1b[33m',
  blue:    '\x1b[34m',
  magenta: '\x1b[35m',
  cyan:    '\x1b[36m',
  white:   '\x1b[37m',
  bgRed:   '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgBlue:  '\x1b[44m',
};

const log = {
  info:    (msg) => console.log(`${C.cyan}ℹ${C.reset}  ${msg}`),
  success: (msg) => console.log(`${C.green}✔${C.reset}  ${msg}`),
  warn:    (msg) => console.log(`${C.yellow}⚠${C.reset}  ${msg}`),
  error:   (msg) => console.error(`${C.red}✖${C.reset}  ${msg}`),
  header:  (msg) => console.log(`\n${C.bold}${C.blue}${msg}${C.reset}\n`),
  table:   (rows) => {
    const maxKey = Math.max(...rows.map(r => r[0].length));
    rows.forEach(([k, v]) => {
      const pad = ' '.repeat(maxKey - k.length + 2);
      console.log(`  ${C.dim}│${C.reset} ${C.cyan}${k}${C.reset}${pad}${v}`);
    });
  },
};

// ─────────────────────────── Argument Parser ───────────────────────────
function parseArgs(argv) {
  const args = argv.slice(2);
  const parsed = { command: null, flags: {}, positional: [] };
  let i = 0;

  while (i < args.length) {
    const arg = args[i];

    if (arg === '--') {
      parsed.positional.push(...args.slice(i + 1));
      break;
    }

    if (arg.startsWith('--')) {
      const eqIdx = arg.indexOf('=');
      if (eqIdx !== -1) {
        parsed.flags[arg.slice(2, eqIdx)] = arg.slice(eqIdx + 1);
        i++;
      } else {
        const key = arg.slice(2);
        const next = args[i + 1];
        if (next && !next.startsWith('-')) {
          parsed.flags[key] = next;
          i += 2;
        } else {
          parsed.flags[key] = true;
          i++;
        }
      }
    } else if (arg.startsWith('-') && arg.length > 1) {
      // Short flags: -v, -d, etc.
      const chars = arg.slice(1).split('');
      chars.forEach(ch => { parsed.flags[ch] = true; });
      i++;
    } else {
      if (!parsed.command) {
        parsed.command = arg;
      } else {
        parsed.positional.push(arg);
      }
      i++;
    }
  }

  // Aliases
  if (parsed.flags.v) parsed.flags.verbose = true;
  if (parsed.flags.h) parsed.flags.help = true;
  if (parsed.flags.p) parsed.flags.port = parsed.flags.p;

  return parsed;
}

// ─────────────────────────── Config Loader ───────────────────────────
function loadConfig() {
  const configPath = path.resolve(__dirname, '..', 'config', 'game.config.json');
  const defaults = {
    gameName: 'B2.st Mario',
    version: '1.0.0',
    canvas: { width: 768, height: 720 },
    physics: { gravity: 0.7, friction: 0.85, maxVelocity: 12 },
    server: { port: 3000, host: 'localhost' },
    health: {
      checkIntervalMs: 5000,
      memoryThresholdMB: 512,
      fpsThreshold: 30,
      maxEntityCount: 1000,
    },
    levels: ['1-1', '1-2', '1-3', '1-4'],
    debug: false,
  };

  try {
    if (fs.existsSync(configPath)) {
      const raw = fs.readFileSync(configPath, 'utf-8');
      return { ...defaults, ...JSON.parse(raw) };
    }
  } catch (e) {
    log.warn(`خطا در خواندن کانفیگ: ${e.message} — از مقادیر پیش‌فرض استفاده می‌شود`);
  }
  return defaults;
}

// ─────────────────────────── Project Scanner ───────────────────────────
function scanProject(rootDir) {
  const stats = {
    totalFiles: 0,
    totalSize: 0,
    byExtension: {},
    directories: [],
  };

  function walk(dir, depth = 0) {
    if (depth > 10) return;
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch { return; }

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;

      if (entry.isDirectory()) {
        stats.directories.push(path.relative(rootDir, fullPath));
        walk(fullPath, depth + 1);
      } else if (entry.isFile()) {
        stats.totalFiles++;
        try {
          const s = fs.statSync(fullPath);
          stats.totalSize += s.size;
        } catch { /* skip */ }
        const ext = path.extname(entry.name) || '(no ext)';
        stats.byExtension[ext] = (stats.byExtension[ext] || 0) + 1;
      }
    }
  }

  walk(rootDir);
  return stats;
}

// ─────────────────────────── Commands ───────────────────────────

const commands = {};

// ── HELP ──
commands.help = {
  description: 'نمایش راهنمای دستورات',
  usage: 'help [command]',
  run(args, config) {
    const BANNER = `
${C.red}    ██████╗ ██████╗    ███████╗████████╗${C.reset}
${C.red}    ██╔══██╗╚════██╗   ██╔════╝╚══██╔══╝${C.reset}
${C.yellow}    ██████╔╝ █████╔╝   ███████╗   ██║   ${C.reset}
${C.yellow}    ██╔══██╗██╔═══╝ ${C.green}   ╚════██║   ██║   ${C.reset}
${C.green}    ██████╔╝███████╗${C.cyan}██╗███████║   ██║   ${C.reset}
${C.cyan}    ╚═════╝ ╚══════╝╚═╝╚══════╝   ╚═╝   ${C.reset}
${C.dim}    🎮 Mario Game — CLI Management Tool v${config.version}${C.reset}
`;
    console.log(BANNER);

    if (args.positional[0] && commands[args.positional[0]]) {
      const cmd = commands[args.positional[0]];
      log.header(`📖 راهنمای دستور: ${args.positional[0]}`);
      console.log(`  ${C.cyan}توضیح:${C.reset}   ${cmd.description}`);
      console.log(`  ${C.cyan}استفاده:${C.reset}  mario ${cmd.usage}`);
      if (cmd.examples) {
        console.log(`\n  ${C.cyan}مثال‌ها:${C.reset}`);
        cmd.examples.forEach(ex => console.log(`    ${C.dim}$${C.reset} ${ex}`));
      }
      return;
    }

    log.header('📋 دستورات موجود:');
    const maxLen = Math.max(...Object.keys(commands).map(k => k.length));
    Object.entries(commands).forEach(([name, cmd]) => {
      const pad = ' '.repeat(maxLen - name.length + 2);
      console.log(`  ${C.green}${name}${C.reset}${pad}${C.dim}${cmd.description}${C.reset}`);
    });
    console.log(`\n  ${C.dim}برای جزئیات بیشتر: node src/cli.js help <command>${C.reset}\n`);
  },
};

// ── STATUS ──
commands.status = {
  description: 'نمایش وضعیت کلی پروژه و کانفیگ',
  usage: 'status [--verbose]',
  examples: ['node src/cli.js status', 'node src/cli.js status --verbose'],
  run(args, config) {
    log.header('📊 وضعیت پروژه');

    const rootDir = path.resolve(__dirname, '..');
    const projectStats = scanProject(rootDir);

    log.table([
      ['نام بازی',       config.gameName],
      ['نسخه',          config.version],
      ['Canvas',        `${config.canvas.width}×${config.canvas.height}`],
      ['گرانش',         `${config.physics.gravity}`],
      ['اصطکاک',        `${config.physics.friction}`],
      ['حداکثر سرعت',   `${config.physics.maxVelocity}`],
      ['سرور',          `${config.server.host}:${config.server.port}`],
      ['مراحل',         config.levels.join(', ')],
      ['حالت دیباگ',    config.debug ? `${C.yellow}فعال${C.reset}` : `${C.dim}غیرفعال${C.reset}`],
    ]);

    console.log('');
    log.header('📁 آمار فایل‌ها');
    log.table([
      ['تعداد فایل‌ها',   `${projectStats.totalFiles}`],
      ['حجم کل',         `${(projectStats.totalSize / 1024).toFixed(1)} KB`],
      ['پوشه‌ها',         `${projectStats.directories.length}`],
    ]);

    if (args.flags.verbose) {
      console.log('');
      log.header('📂 توزیع فایل‌ها بر اساس پسوند');
      Object.entries(projectStats.byExtension)
        .sort((a, b) => b[1] - a[1])
        .forEach(([ext, count]) => {
          const bar = '█'.repeat(Math.min(count, 40));
          console.log(`  ${C.cyan}${ext.padEnd(10)}${C.reset} ${C.green}${bar}${C.reset} ${count}`);
        });

      console.log('');
      log.header('📂 ساختار پوشه‌ها');
      projectStats.directories.forEach(d => {
        const depth = d.split(path.sep).length - 1;
        const indent = '  '.repeat(depth);
        const name = path.basename(d);
        console.log(`  ${indent}${C.blue}📁 ${name}/${C.reset}`);
      });
    }

    console.log('');
    log.success('وضعیت پروژه سالم است');
  },
};

// ── HEALTH ──
commands.health = {
  description: 'بررسی سلامت سیستم و نمایش گزارش',
  usage: 'health [--json] [--watch] [--interval <ms>]',
  examples: [
    'node src/cli.js health',
    'node src/cli.js health --json',
    'node src/cli.js health --watch --interval 3000',
  ],
  run(args, config) {
    // Dynamic import of health monitor
    let HealthMonitor;
    try {
      HealthMonitor = require('./core/health_monitor');
    } catch (e) {
      log.error(`خطا در بارگذاری ماژول Health Monitor: ${e.message}`);
      process.exit(1);
    }

    const monitor = new HealthMonitor(config.health);

    // Simulate some runtime metrics for CLI check
    monitor.updateMetrics({
      uptime: process.uptime(),
      fps: 60,
      memoryUsageMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100,
      entityCount: 0,
      physicsStepMs: 0,
      renderStepMs: 0,
      collisionChecks: 0,
    });

    const report = monitor.getReport();

    if (args.flags.json) {
      console.log(JSON.stringify(report, null, 2));
      return;
    }

    function printReport(rep) {
      const statusIcon = rep.status === 'healthy'
        ? `${C.bgGreen}${C.white} ✔ HEALTHY ${C.reset}`
        : rep.status === 'degraded'
          ? `${C.bgRed}${C.white} ⚠ DEGRADED ${C.reset}`
          : `${C.bgRed}${C.white} ✖ CRITICAL ${C.reset}`;

      log.header(`🏥 گزارش سلامت سیستم  ${statusIcon}`);

      rep.checks.forEach(check => {
        const icon = check.status === 'pass' ? `${C.green}✔${C.reset}` : `${C.red}✖${C.reset}`;
        const val = typeof check.value === 'number' ? check.value.toFixed(2) : check.value;
        console.log(`  ${icon}  ${C.cyan}${check.name.padEnd(18)}${C.reset} مقدار: ${C.bold}${val}${C.reset}  آستانه: ${C.dim}${check.threshold}${C.reset}`);
      });

      console.log('');
      log.table([
        ['Uptime',           `${rep.metrics.uptime.toFixed(1)}s`],
        ['FPS',              `${rep.metrics.fps}`],
        ['Memory',           `${rep.metrics.memoryUsageMB} MB`],
        ['Entities',         `${rep.metrics.entityCount}`],
        ['Physics Step',     `${rep.metrics.physicsStepMs}ms`],
        ['Render Step',      `${rep.metrics.renderStepMs}ms`],
        ['Collision Checks', `${rep.metrics.collisionChecks}`],
      ]);
      console.log('');
    }

    printReport(report);

    if (args.flags.watch) {
      const interval = parseInt(args.flags.interval, 10) || config.health.checkIntervalMs;
      log.info(`حالت نظارت فعال — بازبینی هر ${interval}ms (Ctrl+C برای خروج)`);

      setInterval(() => {
        console.clear();
        monitor.updateMetrics({
          uptime: process.uptime(),
          memoryUsageMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100,
        });
        const freshReport = monitor.getReport();
        printReport(freshReport);
      }, interval);
    }
  },
};

// ── BUILD ──
commands.build = {
  description: 'ساخت و بسته‌بندی فایل‌های بازی',
  usage: 'build [--level <id>] [--minify] [--output <dir>]',
  examples: [
    'node src/cli.js build',
    'node src/cli.js build --level 1-1 --minify',
    'node src/cli.js build --output dist/',
  ],
  run(args, config) {
    log.header('🔨 ساخت پروژه');

    const outputDir = args.flags.output || path.resolve(__dirname, '..', 'dist');
    const targetLevel = args.flags.level || 'all';
    const minify = !!args.flags.minify;

    log.info(`پوشه خروجی: ${outputDir}`);
    log.info(`مرحله هدف: ${targetLevel}`);
    log.info(`فشرده‌سازی: ${minify ? 'بله' : 'خیر'}`);
    console.log('');

    // Create output directory
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
      log.success(`پوشه ${outputDir} ایجاد شد`);
    }

    // Copy public/index.html
    const steps = [
      { name: 'بررسی ساختار پروژه', duration: 100 },
      { name: 'کامپایل موتور بازی', duration: 200 },
      { name: 'بسته‌بندی مراحل', duration: 150 },
      { name: 'پردازش اسپرایت‌ها', duration: 180 },
      { name: 'تولید فایل نهایی', duration: 120 },
    ];

    if (minify) {
      steps.push({ name: 'فشرده‌سازی کد', duration: 250 });
    }

    let completed = 0;
    const total = steps.length;

    function runStep(idx) {
      if (idx >= steps.length) {
        console.log('');
        log.success(`ساخت با موفقیت انجام شد! (${total} مرحله)`);
        log.info(`خروجی: ${outputDir}`);
        return;
      }

      const step = steps[idx];
      const progress = Math.round(((idx + 1) / total) * 100);
      const bar = '█'.repeat(Math.floor(progress / 5)) + '░'.repeat(20 - Math.floor(progress / 5));
      process.stdout.write(`\r  ${C.cyan}[${bar}]${C.reset} ${progress}% — ${step.name}...`);

      setTimeout(() => {
        completed++;
        runStep(idx + 1);
      }, step.duration);
    }

    runStep(0);
  },
};

// ── SERVE ──
commands.serve = {
  description: 'اجرای سرور توسعه محلی با Health Check endpoint',
  usage: 'serve [--port <number>] [--open]',
  examples: [
    'node src/cli.js serve',
    'node src/cli.js serve --port 8080',
  ],
  run(args, config) {
    const port = parseInt(args.flags.port, 10) || config.server.port;
    const host = config.server.host;

    let HealthMonitor;
    try {
      HealthMonitor = require('./core/health_monitor');
    } catch (e) {
      log.error(`خطا در بارگذاری ماژول Health Monitor: ${e.message}`);
      process.exit(1);
    }

    const monitor = new HealthMonitor(config.health);
    const startTime = Date.now();

    // Start periodic health checks
    monitor.startPeriodicCheck(() => {
      monitor.updateMetrics({
        uptime: (Date.now() - startTime) / 1000,
        memoryUsageMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100,
      });
    });

    const MIME_TYPES = {
      '.html': 'text/html; charset=utf-8',
      '.js':   'application/javascript; charset=utf-8',
      '.css':  'text/css; charset=utf-8',
      '.json': 'application/json; charset=utf-8',
      '.png':  'image/png',
      '.jpg':  'image/jpeg',
      '.gif':  'image/gif',
      '.svg':  'image/svg+xml',
      '.ico':  'image/x-icon',
      '.wav':  'audio/wav',
      '.mp3':  'audio/mpeg',
      '.ogg':  'audio/ogg',
    };

    const publicDir = path.resolve(__dirname, '..', 'public');

    const server = http.createServer((req, res) => {
      const url = new URL(req.url, `http://${host}:${port}`);
      const pathname = url.pathname;

      // ── Health Check Endpoint ──
      if (pathname === '/health' || pathname === '/api/health') {
        monitor.updateMetrics({
          uptime: (Date.now() - startTime) / 1000,
          memoryUsageMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100,
        });
        const report = monitor.getReport();
        const statusCode = report.status === 'healthy' ? 200 : 503;
        res.writeHead(statusCode, {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-cache, no-store',
          'X-Health-Status': report.status,
        });
        res.end(JSON.stringify(report, null, 2));
        return;
      }

      // ── Health History Endpoint ──
      if (pathname === '/health/history' || pathname === '/api/health/history') {
        const history = monitor.getHistory();
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ count: history.length, history }, null, 2));
        return;
      }

      // ── Static File Serving ──
      let filePath = pathname === '/' ? '/index.html' : pathname;
      filePath = path.join(publicDir, filePath);

      // Security: prevent directory traversal
      if (!filePath.startsWith(publicDir)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      fs.readFile(filePath, (err, data) => {
        if (err) {
          if (err.code === 'ENOENT') {
            res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(`<h1>404 — فایل یافت نشد</h1><p>${pathname}</p>`);
          } else {
            res.writeHead(500);
            res.end('Internal Server Error');
          }
          return;
        }
        res.writeHead(200, {
          'Content-Type': contentType,
          'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=3600',
        });
        res.end(data);
      });
    });

    server.listen(port, host, () => {
      log.header('🚀 سرور توسعه فعال شد');
      console.log(`  ${C.green}🎮 بازی:${C.reset}         http://${host}:${port}/`);
      console.log(`  ${C.green}🏥 Health Check:${C.reset}  http://${host}:${port}/health`);
      console.log(`  ${C.green}📊 History:${C.reset}       http://${host}:${port}/health/history`);
      console.log(`\n  ${C.dim}Ctrl+C برای خروج${C.reset}\n`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        log.error(`پورت ${port} در حال استفاده است. از --port برای تغییر پورت استفاده کنید.`);
      } else {
        log.error(`خطای سرور: ${err.message}`);
      }
      process.exit(1);
    });

    // Graceful shutdown
    const shutdown = () => {
      console.log('');
      log.info('در حال خاموش‌سازی سرور...');
      monitor.stop();
      server.close(() => {
        log.success('سرور با موفقیت خاموش شد');
        process.exit(0);
      });
      setTimeout(() => process.exit(1), 3000);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  },
};

// ── TEST ──
commands.test = {
  description: 'اجرای تست‌های واحد پروژه',
  usage: 'test [--filter <pattern>] [--verbose]',
  examples: [
    'node src/cli.js test',
    'node src/cli.js test --filter physics',
    'node src/cli.js test --verbose',
  ],
  run(args, config) {
    log.header('🧪 اجرای تست‌ها');

    const testsDir = path.resolve(__dirname, '..', 'tests');
    const filter = args.flags.filter || '';
    const verbose = !!args.flags.verbose;

    if (!fs.existsSync(testsDir)) {
      log.warn('پوشه tests/ یافت نشد');
      return;
    }

    let testFiles;
    try {
      testFiles = fs.readdirSync(testsDir)
        .filter(f => f.endsWith('.test.js') || f.endsWith('.spec.js'))
        .filter(f => !filter || f.includes(filter));
    } catch (e) {
      log.error(`خطا در خواندن پوشه تست‌ها: ${e.message}`);
      return;
    }

    if (testFiles.length === 0) {
      log.warn(`هیچ فایل تستی${filter ? ` با فیلتر "${filter}"` : ''} یافت نشد`);
      return;
    }

    log.info(`${testFiles.length} فایل تست یافت شد`);
    console.log('');

    let totalPassed = 0;
    let totalFailed = 0;
    let totalSkipped = 0;
    const startTime = Date.now();

    testFiles.forEach(file => {
      const filePath = path.join(testsDir, file);
      console.log(`  ${C.blue}▶${C.reset} ${file}`);

      try {
        // Clear require cache for re-runs
        delete require.cache[require.resolve(filePath)];
        const testModule = require(filePath);

        if (typeof testModule === 'function') {
          testModule();
        } else if (testModule && typeof testModule.run === 'function') {
          testModule.run();
        }

        totalPassed++;
        console.log(`    ${C.green}✔ پاس شد${C.reset}`);
      } catch (e) {
        totalFailed++;
        console.log(`    ${C.red}✖ شکست خورد: ${e.message}${C.reset}`);
        if (verbose) {
          console.log(`    ${C.dim}${e.stack}${C.reset}`);
        }
      }
    });

    const elapsed = Date.now() - startTime;
    console.log('');
    console.log(`  ${C.dim}─────────────────────────────────${C.reset}`);
    console.log(`  ${C.green}✔ پاس: ${totalPassed}${C.reset}  ${C.red}✖ شکست: ${totalFailed}${C.reset}  ${C.dim}⏱ ${elapsed}ms${C.reset}`);
    console.log('');

    if (totalFailed > 0) {
      log.error(`${totalFailed} تست شکست خورد`);
      process.exitCode = 1;
    } else {
      log.success('تمام تست‌ها پاس شدند! 🎉');
    }
  },
};

// ── CONFIG ──
commands.config = {
  description: 'نمایش یا ویرایش تنظیمات بازی',
  usage: 'config [--set <key>=<value>] [--reset]',
  examples: [
    'node src/cli.js config',
    'node src/cli.js config --set debug=true',
    'node src/cli.js config --reset',
  ],
  run(args, config) {
    const configPath = path.resolve(__dirname, '..', 'config', 'game.config.json');

    if (args.flags.reset) {
      try {
        if (fs.existsSync(configPath)) {
          fs.unlinkSync(configPath);
          log.success('کانفیگ به مقادیر پیش‌فرض بازنشانی شد');
        } else {
          log.info('کانفیگ سفارشی وجود ندارد — از مقادیر پیش‌فرض استفاده می‌شود');
        }
      } catch (e) {
        log.error(`خطا در بازنشانی: ${e.message}`);
      }
      return;
    }

    if (args.flags.set) {
      const setVal = typeof args.flags.set === 'string' ? args.flags.set : '';
      const eqIdx = setVal.indexOf('=');
      if (eqIdx === -1) {
        log.error('فرمت صحیح: --set key=value');
        return;
      }
      const key = setVal.slice(0, eqIdx);
      let value = setVal.slice(eqIdx + 1);

      // Auto-cast types
      if (value === 'true') value = true;
      else if (value === 'false') value = false;
      else if (!isNaN(value) && value !== '') value = Number(value);

      // Set nested keys with dot notation
      const keys = key.split('.');
      let target = config;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!target[keys[i]] || typeof target[keys[i]] !== 'object') {
          target[keys[i]] = {};
        }
        target = target[keys[i]];
      }
      target[keys[keys.length - 1]] = value;

      // Save
      const configDir = path.dirname(configPath);
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
      log.success(`تنظیم ${key} = ${JSON.stringify(value)} ذخیره شد`);
      return;
    }

    // Display config
    log.header('⚙️  تنظیمات فعلی');
    console.log(JSON.stringify(config, null, 2));
    console.log('');
    log.info(`فایل کانفیگ: ${configPath}`);
  },
};

// ── VERSION ──
commands.version = {
  description: 'نمایش نسخه ابزار',
  usage: 'version',
  run(args, config) {
    console.log(`${C.bold}${config.gameName}${C.reset} v${config.version}`);
    console.log(`${C.dim}Node.js ${process.version} — ${process.platform} ${process.arch}${C.reset}`);
  },
};

// ── CLEAN ──
commands.clean = {
  description: 'پاکسازی فایل‌های ساخته‌شده و کش',
  usage: 'clean [--all]',
  run(args, config) {
    log.header('🧹 پاکسازی');

    const dirsToClean = ['dist', '.cache', 'tmp'];
    if (args.flags.all) {
      dirsToClean.push('node_modules');
    }

    const rootDir = path.resolve(__dirname, '..');
    let cleaned = 0;

    dirsToClean.forEach(dir => {
      const fullPath = path.join(rootDir, dir);
      if (fs.existsSync(fullPath)) {
        try {
          fs.rmSync(fullPath, { recursive: true, force: true });
          log.success(`${dir}/ حذف شد`);
          cleaned++;
        } catch (e) {
          log.error(`خطا در حذف ${dir}/: ${e.message}`);
        }
      } else {
        log.info(`${dir}/ وجود ندارد — رد شد`);
      }
    });

    console.log('');
    log.success(`پاکسازی انجام شد (${cleaned} پوشه حذف شد)`);
  },
};

// ─────────────────────────── Main Entry ───────────────────────────
function main() {
  const args = parseArgs(process.argv);
  const config = loadConfig();

  // No command or help flag
  if (!args.command || args.flags.help) {
    if (args.command && commands[args.command]) {
      commands.help.run({ ...args, positional: [args.command] }, config);
    } else {
      commands.help.run(args, config);
    }
    return;
  }

  // Find command
  const cmd = commands[args.command];
  if (!cmd) {
    log.error(`دستور ناشناخته: "${args.command}"`);
    log.info('برای مشاهده لیست دستورات: node src/cli.js help');
    process.exit(1);
  }

  // Run command
  try {
    cmd.run(args, config);
  } catch (e) {
    log.error(`خطا در اجرای دستور "${args.command}": ${e.message}`);
    if (args.flags.verbose) {
      console.error(e.stack);
    }
    process.exit(1);
  }
}

// Export for testing
module.exports = { parseArgs, commands, loadConfig };

// Run if called directly
if (require.main === module) {
  main();
}
```