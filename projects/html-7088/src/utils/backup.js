/**
 * ============================================================================
 * Studio B2.st - Autonomous Backup & State Integrity Engine
 * Module: src/utils/backup.js
 * Version: 2.4.0-STABLE
 * Security Level: Class-3 Resilient Anti-Tampering Snapshot System
 * ============================================================================
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.B2BackupEngine = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    // تنظیمات فوق‌امنیتی هسته بکاپ
    const CONFIG = Object.freeze({
        STORAGE_KEY: 'B2_MARIO_BACKUP_SLOTS_V2',
        MAX_SLOTS: 5,
        AUTO_INTERVAL_MS: 30000, // هر ۳۰ ثانیه بکاپ خودکار
        SALT: 'B2.st::MarioSecureKernel::2025'
    });

    /**
     * سیستم رمزنگاری و هش سبک جهت تایید تمامیت داده (Data Integrity Hash)
     * پیاده‌سازی سریع FNV-1a 32-bit ارتقایافته برای جلوگیری از دستکاری LocalStorage
     */
    function generateChecksum(dataString) {
        let hash = 2166136261;
        const combined = dataString + CONFIG.SALT;
        for (let i = 0; i < combined.length; i++) {
            hash ^= combined.charCodeAt(i);
            hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
        }
        return (hash >>> 0).toString(16).padStart(8, '0');
    }

    class BackupEngine {
        constructor() {
            this.intervalId = null;
            this.currentSlot = 0;
            this._listeners = new Set();
            this._ensureStorageSanity();
        }

        /**
         * بررسی و اعتبارسنجی اولیه ساختار ذخیره‌سازی محلی
         */
        _ensureStorageSanity() {
            try {
                const raw = localStorage.getItem(CONFIG.STORAGE_KEY);
                if (!raw) {
                    this._writeSlots([]);
                } else {
                    const parsed = JSON.parse(raw);
                    if (!Array.isArray(parsed)) {
                        console.warn('[B2.st Backup] Corrupted storage structure detected. Resetting.');
                        this._writeSlots([]);
                    }
                }
            } catch (err) {
                console.error('[B2.st Backup] LocalStorage inaccessible or blocked:', err);
            }
        }

        _readSlots() {
            try {
                const raw = localStorage.getItem(CONFIG.STORAGE_KEY);
                return raw ? JSON.parse(raw) : [];
            } catch (e) {
                return [];
            }
        }

        _writeSlots(slots) {
            try {
                localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(slots));
            } catch (e) {
                console.error('[B2.st Backup] Quota exceeded or storage error:', e);
            }
        }

        /**
         * ایجاد یک اسنپ‌شات فوق امن با هشینگ تمامیت و متادیتای زمانی
         */
        createSnapshot(gameState, tag = 'AutoSnapshot') {
            if (!gameState || typeof gameState !== 'object') {
                throw new Error('[B2.st Backup] Invalid game state provided.');
            }

            // فیلتر کردن مقادیر ناامن و غیرقابل سریال‌سازی
            const sanitizedState = {
                score: Math.max(0, Number(gameState.score) || 0),
                coins: Math.max(0, Number(gameState.coins) || 0),
                lives: Math.max(0, Number(gameState.lives) || 0),
                world: String(gameState.world || '1-1'),
                checkpoint: {
                    x: Number(gameState.checkpoint?.x || 100),
                    y: Number(gameState.checkpoint?.y || 400)
                },
                powerState: String(gameState.powerState || 'small'),
                timeRemaining: Math.max(0, Number(gameState.timeRemaining) || 400)
            };

            const payload = JSON.stringify(sanitizedState);
            const checksum = generateChecksum(payload);

            const snapshot = {
                id: 'snap_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
                timestamp: Date.now(),
                tag: String(tag).substring(0, 30),
                checksum: checksum,
                payload: payload
            };

            let slots = this._readSlots();
            slots.unshift(snapshot);

            // مدیریت حافظه حلقه‌ای (Circular Storage Rotation)
            if (slots.length > CONFIG.MAX_SLOTS) {
                slots = slots.slice(0, CONFIG.MAX_SLOTS);
            }

            this._writeSlots(slots);
            this._notify('created', snapshot);
            return snapshot;
        }

        /**
         * بازیابی و بازرسی امنیتی آخرین اسنپ‌شات معتبر
         */
        restoreLatest() {
            const slots = this._readSlots();
            for (let i = 0; i < slots.length; i++) {
                const snap = slots[i];
                if (this.verifyIntegrity(snap)) {
                    try {
                        const parsed = JSON.parse(snap.payload);
                        this._notify('restored', { snapshot: snap, state: parsed });
                        return parsed;
                    } catch (e) {
                        console.error('[B2.st Backup] Failed to deserialize payload:', e);
                    }
                } else {
                    console.warn(`[B2.st Backup] Tampered or corrupt snapshot detected: ${snap.id}. Skipping.`);
                }
            }
            return null;
        }

        /**
         * اعتبارسنجی امضای ریاضی اسنپ‌شات علیه حملات دستکاری حافظه
         */
        verifyIntegrity(snapshot) {
            if (!snapshot || !snapshot.payload || !snapshot.checksum) return false;
            const expected = generateChecksum(snapshot.payload);
            return expected === snapshot.checksum;
        }

        /**
         * آغاز چرخه ذخیره‌سازی خودکار پیوسته
         */
        startAutoBackup(stateProviderFn, intervalMs = CONFIG.AUTO_INTERVAL_MS) {
            this.stopAutoBackup();
            this.intervalId = setInterval(() => {
                try {
                    const state = stateProviderFn();
                    if (state) {
                        this.createSnapshot(state, 'PeriodicAutoSave');
                    }
                } catch (err) {
                    console.error('[B2.st Backup] Auto-backup interval tick failed:', err);
                }
            }, Math.max(5000, intervalMs));
        }

        /**
         * توقف امن چرخه خودکار
         */
        stopAutoBackup() {
            if (this.intervalId) {
                clearInterval(this.intervalId);
                this.intervalId = null;
            }
        }

        /**
         * صادرات کامل بکاپ‌ها به صورت فایل JSON امن
         */
        exportToBlob() {
            const slots = this._readSlots();
            const jsonStr = JSON.stringify({
                version: 'B2.st-Mario-1.0',
                exportedAt: new Date().toISOString(),
                snapshots: slots
            }, null, 2);
            return new Blob([jsonStr], { type: 'application/json' });
        }

        /**
         * وارد کردن بکاپ از فایل خارجی با بررسی تک‌تک چکسام‌ها
         */
        importFromJSON(jsonString) {
            try {
                const data = JSON.parse(jsonString);
                if (!data || !Array.isArray(data.snapshots)) return false;
                
                const validSlots = data.snapshots.filter(snap => this.verifyIntegrity(snap));
                if (validSlots.length === 0) return false;

                this._writeSlots(validSlots.slice(0, CONFIG.MAX_SLOTS));
                this._notify('imported', validSlots);
                return true;
            } catch (e) {
                console.error('[B2.st Backup] Import failed:', e);
                return false;
            }
        }

        subscribe(listenerFn) {
            this._listeners.add(listenerFn);
            return () => this._listeners.delete(listenerFn);
        }

        _notify(event, data) {
            this._listeners.forEach(fn => {
                try { fn(event, data); } catch (e) { console.error(e); }
            });
        }
    }

    return new BackupEngine();
}));