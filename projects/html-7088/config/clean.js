```javascript
/**
 * B2.st Studio - Clean Script
 * پاکسازی فایل‌های بیلد
 */

const fs = require('fs');
const path = require('path');

const CLEAN_DIRS = ['dist', 'build', '.cache'];

console.log('🧹 پاکسازی...');

for (const dir of CLEAN_DIRS) {
    const fullPath = path.resolve(__dirname, '..', dir);
    if (fs.existsSync(fullPath)) {
        fs.rmSync(fullPath, { recursive: true, force: true });
        console.log(`  🗑️  حذف: ${dir}/`);
    }
}

console.log('✅ پاکسازی انجام شد!');
```