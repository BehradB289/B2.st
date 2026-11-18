/**
 * سازنده هوشمند آرت‌های پیکسلی رترو NES به صورت درونی در حافظه
 * تمامی بافت‌ها به عنوان Canvas در ماژول PerformanceCache کش می‌شوند تا از لود فایل‌های خارجی بی‌نیاز باشیم
 */
export class SpriteSheet {
    /**
     * @param {import('../core/performance_cache.js').PerformanceCache} cache 
     */
    constructor(cache) {
        this.cache = cache;
        this._palette = {
            sky: '#5c94fc',
            marioRed: '#d82800',
            marioBrown: '#887000',
            skin: '#fc9838',
            groundBrown: '#c84c0c',
            groundLight: '#fc9c5c',
            goombaBrown: '#a81000',
            white: '#ffffff',
            black: '#000000',
            pipeGreen: '#00a800',
            pipeLight: '#80d010',
            pipeDark: '#005000',
            brickMain: '#b84418',
            brickDark: '#000000',
            coinYellow: '#fcbc3c'
        };
    }

    /**
     * بازیابی یا ساخت کانوَس کش‌شده
     * @param {string} spriteKey 
     * @param {number} width 
     * @param {number} height 
     * @param {Function} drawCallback 
     * @returns {HTMLCanvasElement}
     */
    getOrCreateSprite(spriteKey, width, height, drawCallback) {
        const cached = this.cache.get(spriteKey);
        if (cached) {
            return cached;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;

        drawCallback(ctx);

        // کش دائمی برای تکسچرهای بازی (یک ساعت)
        this.cache.set(spriteKey, canvas, 3600000);
        return canvas;
    }

    /** تایل زمین پایه */
    getGroundTile() {
        return this.getOrCreateSprite('tile_ground', 16, 16, (ctx) => {
            ctx.fillStyle = this._palette.groundBrown;
            ctx.fillRect(0, 0, 16, 16);
            ctx.fillStyle = this._palette.groundLight;
            ctx.fillRect(0, 0, 16, 2);
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 15, 16, 1);
            ctx.fillRect(15, 0, 1, 16);
        });
    }

    /** تایل آجر تخریب‌پذیر */
    getBrickTile() {
        return this.getOrCreateSprite('tile_brick', 16, 16, (ctx) => {
            ctx.fillStyle = this._palette.brickMain;
            ctx.fillRect(0, 0, 16, 16);

            ctx.fillStyle = '#000000';
            // درزهای آجرچینی
            ctx.fillRect(0, 7, 16, 1);
            ctx.fillRect(0, 15, 16, 1);
            ctx.fillRect(7, 0, 1, 7);
            ctx.fillRect(15, 0, 1, 7);
            ctx.fillRect(3, 8, 1, 7);
            ctx.fillRect(11, 8, 1, 7);
        });
    }

    /** جعبه اسرارآمیز دارای علامت سوال */
    getQuestionBlock(frame = 0) {
        return this.getOrCreateSprite(`tile_question_${frame}`, 16, 16, (ctx) => {
            ctx.fillStyle = '#fc9838';
            ctx.fillRect(0, 0, 16, 16);

            ctx.fillStyle = '#000000';
            ctx.strokeRect(0.5, 0.5, 15, 15);

            // نقطه گوشه‌ها
            ctx.fillRect(1, 1, 1, 1);
            ctx.fillRect(14, 1, 1, 1);
            ctx.fillRect(1, 14, 1, 1);
            ctx.fillRect(14, 14, 1, 1);

            // کاراکتر علامت سوال
            ctx.fillStyle = '#802000';
            ctx.fillRect(6, 3, 5, 2);
            ctx.fillRect(10, 5, 2, 3);
            ctx.fillRect(7, 7, 3, 2);
            ctx.fillRect(7, 11, 2, 2);
        });
    }

    /** بلوک خالی/استفاده‌شده */
    getEmptyBlock() {
        return this.getOrCreateSprite('tile_empty_block', 16, 16, (ctx) => {
            ctx.fillStyle = '#887000';
            ctx.fillRect(0, 0, 16, 16);
            ctx.fillStyle = '#000000';
            ctx.strokeRect(0.5, 0.5, 15, 15);
        });
    }

    /** بافت لوله سبز نوستالژیک (بالا، چپ) */
    getPipeTopLeft() {
        return this.getOrCreateSprite('pipe_top_left', 16, 16, (ctx) => {
            ctx.fillStyle = this._palette.pipeGreen;
            ctx.fillRect(0, 0, 16, 16);
            ctx.fillStyle = this._palette.pipeLight;
            ctx.fillRect(2, 0, 4, 16);
            ctx.fillStyle = this._palette.pipeDark;
            ctx.fillRect(0, 0, 2, 16);
            ctx.fillStyle = '#000000';
            ctx.strokeRect(0.5, 0.5, 15, 15);
        });
    }

    /** بافت لوله سبز (بالا، راست) */
    getPipeTopRight() {
        return this.getOrCreateSprite('pipe_top_right', 16, 16, (ctx) => {
            ctx.fillStyle = this._palette.pipeGreen;
            ctx.fillRect(0, 0, 16, 16);
            ctx.fillStyle = this._palette.pipeDark;
            ctx.fillRect(12, 0, 4, 16);
            ctx.fillStyle = '#000000';
            ctx.strokeRect(0.5, 0.5, 15, 15);
        });
    }

    /** بافت بدنه پایینی لوله */
    getPipeBodyLeft() {
        return this.getOrCreateSprite('pipe_body_left', 16, 16, (ctx) => {
            ctx.fillStyle = this._palette.pipeGreen;
            ctx.fillRect(0, 0, 16, 16);
            ctx.fillStyle = this._palette.pipeLight;
            ctx.fillRect(3, 0, 3, 16);
            ctx.fillStyle = this._palette.pipeDark;
            ctx.fillRect(0, 0, 2, 16);
        });
    }

    getPipeBodyRight() {
        return this.getOrCreateSprite('pipe_body_right', 16, 16, (ctx) => {
            ctx.fillStyle = this._palette.pipeGreen;
            ctx.fillRect(0, 0, 16, 16);
            ctx.fillStyle = this._palette.pipeDark;
            ctx.fillRect(12, 0, 4, 16);
        });
    }

    /** اسپرایت ماریو ایستاده */
    getMarioIdle() {
        return this.getOrCreateSprite('mario_idle', 16, 16, (ctx) => {
            // کلاه و لباس قرمز
            ctx.fillStyle = this._palette.marioRed;
            ctx.fillRect(3, 1, 5, 1);
            ctx.fillRect(2, 2, 9, 1);
            ctx.fillRect(2, 7, 8, 3);
            ctx.fillRect(1, 8, 2, 3);
            ctx.fillRect(9, 8, 2, 3);

            // صورت و دست پوست
            ctx.fillStyle = this._palette.skin;
            ctx.fillRect(2, 3, 8, 3);
            ctx.fillRect(1, 10, 2, 2);
            ctx.fillRect(9, 10, 2, 2);

            // مو و سیبیل قهوه‌ای
            ctx.fillStyle = this._palette.marioBrown;
            ctx.fillRect(1, 3, 3, 2);
            ctx.fillRect(6, 4, 4, 1);

            // شلوار آبی/قهوه‌ای کلاسیک
            ctx.fillStyle = this._palette.marioBrown;
            ctx.fillRect(3, 10, 6, 3);
            // کفش‌ها
            ctx.fillRect(2, 13, 3, 2);
            ctx.fillRect(7, 13, 3, 2);
        });
    }

    /** اسپرایت ماریو در حال دویدن فریم یک */
    getMarioRun(frame) {
        return this.getOrCreateSprite(`mario_run_${frame}`, 16, 16, (ctx) => {
            ctx.drawImage(this.getMarioIdle(), 0, 0);
            if (frame === 1) {
                ctx.fillStyle = this._palette.marioBrown;
                ctx.fillRect(1, 12, 4, 3);
            }
        });
    }

    /** اسپرایت ماریو در حال پرش */
    getMarioJump() {
        return this.getOrCreateSprite('mario_jump', 16, 16, (ctx) => {
            ctx.fillStyle = this._palette.marioRed;
            ctx.fillRect(2, 1, 7, 2);
            ctx.fillRect(1, 6, 10, 3);

            ctx.fillStyle = this._palette.skin;
            ctx.fillRect(3, 3, 6, 3);
            ctx.fillRect(0, 5, 2, 3);
            ctx.fillRect(10, 4, 2, 3);

            ctx.fillStyle = this._palette.marioBrown;
            ctx.fillRect(2, 3, 2, 2);
            ctx.fillRect(2, 9, 8, 4);
            ctx.fillRect(0, 12, 4, 3);
            ctx.fillRect(8, 10, 3, 3);
        });
    }

    /** اسپرایت دشمن گومبا */
    getGoomba(frame = 0) {
        return this.getOrCreateSprite(`goomba_${frame}`, 16, 16, (ctx) => {
            // سر کلاه قارچی
            ctx.fillStyle = this._palette.goombaBrown;
            ctx.fillRect(4, 1, 8, 2);
            ctx.fillRect(2, 3, 12, 5);
            ctx.fillRect(1, 8, 14, 3);

            // چشم‌ها
            ctx.fillStyle = this._palette.white;
            ctx.fillRect(4, 5, 2, 3);
            ctx.fillRect(10, 5, 2, 3);
            ctx.fillStyle = this._palette.black;
            ctx.fillRect(5, 6, 1, 2);
            ctx.fillRect(10, 6, 1, 2);

            // پاها متحرک
            ctx.fillStyle = '#000000';
            if (frame === 0) {
                ctx.fillRect(2, 12, 4, 3);
                ctx.fillRect(10, 13, 4, 2);
            } else {
                ctx.fillRect(2, 13, 4, 2);
                ctx.fillRect(10, 12, 4, 3);
            }
        });
    }

    /** گومبای له‌شده */
    getGoombaSquished() {
        return this.getOrCreateSprite('goomba_squished', 16, 16, (ctx) => {
            ctx.fillStyle = this._palette.goombaBrown;
            ctx.fillRect(1, 10, 14, 5);
            ctx.fillStyle = '#000000';
            ctx.fillRect(3, 12, 2, 2);
            ctx.fillRect(11, 12, 2, 2);
        });
    }
}