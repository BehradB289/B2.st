```javascript
/**
 * B2.st Studio - Build Script
 * اسکریپت ساده بیلد برای بازی ماریو
 */

const fs = require('fs');
const path = require('path');

const BUILD_DIR = path.resolve(__dirname, '..', 'dist');
const SRC_DIR = path.resolve(__dirname, '..');

const COPY_FILES = [
    'index.html',
    'assets'
];

console.log('🔨 شروع بیلد...');

// ساخت پوشه dist
if (!fs.existsSync(BUILD_DIR)) {
    fs.mkdirSync(BUILD_DIR, { recursive: true });
}

function copyRecursive(src, dest) {
    if (!fs.existsSync(src)) {
        console.warn(`⚠️  ${src} یافت نشد، رد شد.`);
        return;
    }

    const stat = fs.statSync(src);
    if (stat.isDirectory()) {
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
        }
        const entries = fs.readdirSync(src);
        for (const entry of entries) {
            if (entry === 'node_modules' || entry === '.git' || entry === 'dist') continue;
            copyRecursive(path.join(src, entry), path.join(dest, entry));
        }
    } else {
        fs.copyFileSync(src, dest);
    }
}

for (const file of COPY_FILES) {
    const src = path.join(SRC_DIR, file);
    const dest = path.join(BUILD_DIR, file);
    console.log(`  📁 کپی: ${file}`);
    copyRecursive(src, dest);
}

// کپی فایل‌های JS و CSS از src
const srcDir = path.join(SRC_DIR, 'src');
if (fs.existsSync(srcDir)) {
    copyRecursive(srcDir, path.join(BUILD_DIR, 'src'));
    console.log('  📁 کپی: src/');
}

// کپی config
const configSrc = path.join(SRC_DIR, 'config', 'env_config.js');
if (fs.existsSync(configSrc)) {
    const configDest = path.join(BUILD_DIR, 'config');
    if (!fs.existsSync(configDest)) fs.mkdirSync(configDest, { recursive: true });
    fs.copyFileSync(configSrc, path.join(configDest, 'env_config.js'));
    console.log('  📁 کپی: config/env_config.js');
}

console.log('');
console.log('✅ بیلد با موفقیت انجام شد!');
console.log(`📂 خروجی: ${BUILD_DIR}`);
```