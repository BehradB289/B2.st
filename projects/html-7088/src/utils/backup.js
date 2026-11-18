/**
 * @file backup.js
 * @description موتور بکاپ‌گیری خودکار، اعتبارسنجی رمزنگاری و بازیابی وضعیت بازی ماریو
 * @author B2.st Cyber Defense & Reliability Unit
 * @version 2.4.0
 */

class MarioBackupEngine {
    constructor(options = {}) {
        this.storageKey = options.storageKey || 'mario_secure_save_v1';
        this.backupSlotPrefix = options.backupSlotPrefix || 'mario_bk_slot_';
        this.maxRollingBackups = options.maxRollingBackups || 5;
        this.autoBackupIntervalMs = options.autoBackupIntervalMs || 60000; // هر ۱ دقیقه
        this.cryptoKey = null;
        this.intervalHandle = null;
        this.lastSnapshotHash = null;
    }

    /**
     * مقداردهی اولیه کلید رمزنگاری محلی با استفاده از Web Crypto API
     */
    async initialize() {
        try {
            const rawKey = new TextEncoder().encode("B2st-Mario-Quantum-Guarded-Key-2025");
            const hashBuffer = await crypto.subtle.digest('SHA-256', rawKey);
            this.cryptoKey = await crypto.subtle.importKey(
                'raw',
                hashBuffer,
                { name: 'HMAC', hash: 'SHA-256' },
                false,
                ['sign', 'verify']
            );
            this.startAutoBackup();
            console.info("[B2.st Backup Engine] با موفقیت فعال و امن‌سازی شد.");
        } catch (err) {
            console.error("[B2.st Backup Engine] خطا در راه‌اندازی Web Crypto API:", err);
        }
    }

    /**
     * ایجاد امضای دیجیتال برای جلوگیری از دستکاری داده‌ها (Tamper-proof)
     */
    async generateSignature(payloadString) {
        if (!this.cryptoKey) return null;
        const data = new TextEncoder().encode(payloadString);
        const signature = await crypto.subtle.sign('HMAC', this.cryptoKey, data);
        return Array.from(new Uint8Array(signature))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    /**
     * صحت‌سنجی یکپارچگی داده‌ها بر اساس امضای HMAC
     */
    async verifySignature(payloadString, hexSignature) {
        if (!this.cryptoKey || !hexSignature) return false;
        try {
            const sigBytes = new Uint8Array(
                hexSignature.match(/.{1,2}/g).map(byte => parseInt(byte, 16))
            );
            const data = new TextEncoder().encode(payloadString);
            return await crypto.subtle.verify('HMAC', this.cryptoKey, sigBytes, data);
        } catch {
            return false;
        }
    }

    /**
     * تولید اسنپ‌شات کامل از متغیرهای حیاتی بازی
     */
    captureState(gameState) {
        return {
            timestamp: Date.now(),
            version: '2.4.0',
            player: {
                lives: Number(gameState.lives) || 3,
                score: Number(gameState.score) || 0,
                coins: Number(gameState.coins) || 0,
                power: gameState.power || 0, // 0: Normal, 1: Super
                x: Math.round(gameState.playerX || 0),
                y: Math.round(gameState.playerY || 0)
            },
            level: {
                world: gameState.world || '1-1',
                timeRemaining: Math.round(gameState.timeRemaining || 400),
                scrollOffset: Math.round(gameState.cameraX || 0)
            },
            entropy: crypto.getRandomValues(new Uint32Array(1))[0]
        };
    }

    /**
     * ذخیره‌سازی داده با مکانیزم چرخش اسلات‌ها (Rolling Backup)
     */
    async save(gameState) {
        try {
            const rawState = this.captureState(gameState);
            const serialized = JSON.stringify(rawState);
            const signature = await this.generateSignature(serialized);

            const record = {
                data: rawState,
                signature: signature
            };

            const recordString = JSON.stringify(record);

            // ذخیره در اسلات اصلی
            localStorage.setItem(this.storageKey, recordString);

            // اضافه کردن به اسنپ‌شات‌های چرخشی
            this.rotateBackupSlots(recordString);

            this.lastSnapshotHash = signature;
            return { success: true, timestamp: rawState.timestamp };
        } catch (error) {
            console.error("[B2.st Backup Engine] خطا در ذخیره‌سازی بکاپ:", error);
            return { success: false, error: error.message };
        }
    }

    rotateBackupSlots(serializedRecord) {
        try {
            for (let i = this.maxRollingBackups - 1; i >= 1; i--) {
                const prev = localStorage.getItem(`${this.backupSlotPrefix}${i}`);
                if (prev) {
                    localStorage.setItem(`${this.backupSlotPrefix}${i + 1}`, prev);
                }
            }
            localStorage.setItem(`${this.backupSlotPrefix}1`, serializedRecord);
        } catch (e) {
            // حافظه LocalStorage تکمیل شده باشد
            this.purgeOldBackups();
        }
    }

    /**
     * بازیابی و راستی‌آزمایی آخرین اسنپ‌شات سالم
     */
    async loadLatest() {
        try {
            const primary = localStorage.getItem(this.storageKey);
            if (primary) {
                const parsed = JSON.parse(primary);
                const isValid = await this.verifySignature(JSON.stringify(parsed.data), parsed.signature);
                if (isValid) {
                    return { success: true, state: parsed.data, slot: 'primary' };
                }
                console.warn("[B2.st Backup Engine] هشدار: داده اسلات اصلی مخدوش است. جستجو در نسخه‌های پشتیبان...");
            }

            // فال‌بک به اسلات‌های چرخشی
            for (let i = 1; i <= this.maxRollingBackups; i++) {
                const slotKey = `${this.backupSlotPrefix}${i}`;
                const slotData = localStorage.getItem(slotKey);
                if (!slotData) continue;

                const parsed = JSON.parse(slotData);
                const isValid = await this.verifySignature(JSON.stringify(parsed.data), parsed.signature);
                if (isValid) {
                    console.info(`[B2.st Backup Engine] بازیابی موفق از اسلات شماره ${i}`);
                    return { success: true, state: parsed.data, slot: slotKey };
                }
            }

            return { success: false, reason: 'هیچ نسخه پشتیبان معتبری یافت نشد.' };
        } catch (err) {
            console.error("[B2.st Backup Engine] خطا در بازخوانی بکاپ:", err);
            return { success: false, error: err.message };
        }
    }

    /**
     * تخلیه اسلات‌های قدیمی در صورت اتمام ظرفیت
     */
    purgeOldBackups() {
        for (let i = Math.floor(this.maxRollingBackups / 2); i <= this.maxRollingBackups; i++) {
            localStorage.removeItem(`${this.backupSlotPrefix}${i}`);
        }
    }

    /**
     * زمان‌بندی بکاپ خودکار پیوسته
     */
    startAutoBackup() {
        if (this.intervalHandle) clearInterval(this.intervalHandle);
        this.intervalHandle = setInterval(() => {
            if (window.MarioGameInstance && window.MarioGameInstance.isRunning) {
                this.save(window.MarioGameInstance.getStateSnapshot());
            }
        }, this.autoBackupIntervalMs);
    }

    stopAutoBackup() {
        if (this.intervalHandle) clearInterval(this.intervalHandle);
    }

    /**
     * خروجی فایل دانلودی جهت پشتیبان‌گیری سرد
     */
    exportToFile() {
        const primary = localStorage.getItem(this.storageKey);
        if (!primary) throw new Error("هیچ دادهای برای ذخیره‌سازی ابری موجود نیست.");
        const blob = new Blob([primary], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mario_backup_${Date.now()}.b2st`;
        a.click();
        URL.revokeObjectURL(url);
    }
}

// ثبت به عنوان ماژول سراسری محافظت‌شده
if (typeof window !== 'undefined') {
    window.MarioBackupEngine = MarioBackupEngine;
}