/**
 * @file backup.js
 * @description ماژول بازیابی و بکاپ خودکار بازی ماریو - استودیو B2.st
 * @security سطح حفاظت لایه ۸: هشینگ یکپارچه داده، جلوگیری از دستکاری LocalStorage و مکانیزم Fallback ایمن
 */

class SecureBackupEngine {
    constructor() {
        this.storageKey = 'B2ST_MARIO_BACKUP_V1';
        this.maxHistory = 5;
        this.secretSalt = 'B2st_SecOps_Quantum_Salt_#2025';
        this.autoBackupInterval = 60000; // هر یک دقیقه
        this.intervalTimer = null;
    }

    /**
     * تولید هش SHA-256 جهت راستی‌آزمایی یکپارچگی داده‌ها (Anti-Tampering)
     */
    async generateChecksum(dataString) {
        const encoder = new TextEncoder();
        const data = encoder.encode(dataString + this.secretSalt);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    /**
     * ثبت اسنپ‌شات وضعیت با بررسی صحت و لایه هشینگ
     */
    async saveSnapshot(gameState) {
        try {
            if (!gameState || typeof gameState !== 'object') {
                throw new Error('فرمت وضعیت نامعتبر است.');
            }

            const sanitizedState = {
                score: Math.max(0, Number(gameState.score) || 0),
                coins: Math.max(0, Number(gameState.coins) || 0),
                lives: Math.max(1, Math.min(99, Number(gameState.lives) || 3)),
                level: Math.max(1, Number(gameState.level) || 1),
                timestamp: Date.now()
            };

            const serialized = JSON.stringify(sanitizedState);
            const checksum = await this.generateChecksum(serialized);

            const payload = {
                data: sanitizedState,
                checksum: checksum
            };

            let history = this.getAllBackups();
            history.unshift(payload);

            if (history.length > this.maxHistory) {
                history = history.slice(0, this.maxHistory);
            }

            localStorage.setItem(this.storageKey, JSON.stringify(history));
            console.info('[B2.st Backup] اسنپ‌شات امن با موفقیت ثبت شد.');
            return true;
        } catch (error) {
            console.error('[B2.st Backup Error] خطا در ذخیره‌سازی اسنپ‌شات:', error);
            return false;
        }
    }

    /**
     * دریافت تمام نسخه‌ها از دیتابیس لوکال
     */
    getAllBackups() {
        try {
            const raw = localStorage.getItem(this.storageKey);
            if (!raw) return [];
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            console.warn('[B2.st Backup] داده‌های آسیب‌دیده کشف شد. ریست پایگاه انجام شد.');
            return [];
        }
    }

    /**
     * بارگذاری آخرین نسخه پایدار با ممیزی یکپارچگی
     */
    async restoreLatest() {
        const history = this.getAllBackups();
        if (history.length === 0) {
            return this.getDefaultState();
        }

        for (const backup of history) {
            try {
                if (!backup.data || !backup.checksum) continue;
                const serialized = JSON.stringify(backup.data);
                const calculatedHash = await this.generateChecksum(serialized);

                if (calculatedHash === backup.checksum) {
                    console.info('[B2.st Backup] بکاپ با امضای معتبر بازگردانی شد:', backup.data);
                    return backup.data;
                } else {
                    console.warn('[B2.st Backup Alert] داده نامعتبر یا دستکاری شده نادیده گرفته شد.');
                }
            } catch (err) {
                console.error('[B2.st Backup Error] خطا در صحت‌سنجی نود:', err);
            }
        }

        console.warn('[B2.st Backup] هیچ بکاپ سالمی یافت نشد. استفاده از پروفایل استاندارد.');
        return this.getDefaultState();
    }

    /**
     * خروجی امن پیش‌فرض (Zero-Trust Failover)
     */
    getDefaultState() {
        return Object.freeze({
            score: 0,
            coins: 0,
            lives: 3,
            level: 1,
            timestamp: Date.now()
        });
    }

    /**
     * راه‌اندازی تایمر بکاپ خودکار
     */
    initAutoBackup(stateProvider) {
        if (this.intervalTimer) clearInterval(this.intervalTimer);
        this.intervalTimer = setInterval(async () => {
            if (typeof stateProvider === 'function') {
                const currentState = stateProvider();
                await this.saveSnapshot(currentState);
            }
        }, this.autoBackupInterval);
    }

    /**
     * تخریب و توقف پردازش
     */
    dispose() {
        if (this.intervalTimer) {
            clearInterval(this.intervalTimer);
            this.intervalTimer = null;
        }
    }
}

if (typeof window !== 'undefined') {
    window.B2stBackup = new SecureBackupEngine();
}