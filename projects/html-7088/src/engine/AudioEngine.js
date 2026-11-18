/**
 * سینت سایزر صوتی بر پایه Web Audio API بدون نیاز به فایل‌های صوتی خارجی
 * ادغام‌شده با ریت لیمیتر کش جهت بهینه‌سازی بار پردازشی و ممانعت از دیستورشن صدا
 */
export class AudioEngine {
    /**
     * @param {import('../core/performance_cache.js').RateLimiter} rateLimiter 
     */
    constructor(rateLimiter) {
        this.rateLimiter = rateLimiter;
        this.ctx = null;
        this.enabled = true;
    }

    _initContext() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    /**
     * صدای پرش نوستالژیک ماریو
     */
    playJump() {
        this._initContext();
        if (!this.ctx || !this.enabled) return;

        // ممانعت از اجرای بیش از ۵ پرش در ثانیه با ریت‌لیمیتر
        this.rateLimiter.throttle('sound_jump', 90, () => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'square';
            const now = this.ctx.currentTime;
            osc.frequency.setValueAtTime(150, now);
            osc.frequency.exponentialRampToValueAtTime(600, now + 0.14);

            gain.gain.setValueAtTime(0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.14);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.15);
        });
    }

    /**
     * صدای جمع‌آوری سکه طلایی
     */
    playCoin() {
        this._initContext();
        if (!this.ctx || !this.enabled) return;

        this.rateLimiter.throttle('sound_coin', 60, () => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            const now = this.ctx.currentTime;
            osc.frequency.setValueAtTime(987.77, now); // نوت B5
            osc.frequency.setValueAtTime(1318.51, now + 0.08); // نوت E6

            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.36);
        });
    }

    /**
     * صدای له کردن گومبا (Stomp)
     */
    playStomp() {
        this._initContext();
        if (!this.ctx || !this.enabled) return;

        this.rateLimiter.throttle('sound_stomp', 80, () => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            const now = this.ctx.currentTime;
            osc.frequency.setValueAtTime(180, now);
            osc.frequency.exponentialRampToValueAtTime(40, now + 0.12);

            gain.gain.setValueAtTime(0.3, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.12);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.13);
        });
    }

    /**
     * صدای ضربه به بلوک
     */
    playBump() {
        this._initContext();
        if (!this.ctx || !this.enabled) return;

        this.rateLimiter.throttle('sound_bump', 80, () => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'square';
            const now = this.ctx.currentTime;
            osc.frequency.setValueAtTime(90, now);
            osc.frequency.linearRampToValueAtTime(45, now + 0.08);

            gain.gain.setValueAtTime(0.25, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.08);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.09);
        });
    }

    /**
     * صدای مرگ یا باخت
     */
    playDie() {
        this._initContext();
        if (!this.ctx || !this.enabled) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        const now = this.ctx.currentTime;
        osc.frequency.setValueAtTime(500, now);
        osc.frequency.linearRampToValueAtTime(80, now + 0.6);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.6);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.62);
    }
}