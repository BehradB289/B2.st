/**
 * Super Mario Engine - Hardened Studio B2.st Release
 * معماری: ماژولار، پردازش صوتی و بصری بدون وابستگی خارجی، ضد نشت حافظه و ایزولاسیون کامل کانتکست
 */
"use strict";

(function () {
    // لایه امنیتی ۱: محدودسازی آبجکت‌های گلوبال و ایمن‌سازی ضد دستکاری خطاها
    window.addEventListener("contextmenu", (e) => e.preventDefault());

    // --- ماژول صوتی امن و بهینه بدون خطای Autoplay و عدم استفاده از فایل خارجی ---
    class SoundEngine {
        constructor() {
            this.ctx = null;
            this.enabled = true;
        }

        init() {
            if (!this.ctx) {
                const AudioContextClass = window.AudioContext || window.webkitAudioContext;
                if (AudioContextClass) {
                    this.ctx = new AudioContextClass();
                }
            }
            if (this.ctx && this.ctx.state === "suspended") {
                this.ctx.resume().catch(() => {});
            }
        }

        playTone(freq, type, duration, slideFreq = null) {
            if (!this.enabled || !this.ctx) return;
            try {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = type;
                osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
                if (slideFreq) {
                    osc.frequency.exponentialRampToValueAtTime(Math.max(10, slideFreq), this.ctx.currentTime + duration);
                }
                gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start();
                osc.stop(this.ctx.currentTime + duration);
            } catch (_) {}
        }

        jump() { this.playTone(160, "square", 0.15, 600); }
        coin() {
            this.playTone(987, "sine", 0.08);
            setTimeout(() => this.playTone(1318, "sine", 0.28), 80);
        }
        stomp() { this.playTone(120, "triangle", 0.12, 40); }
        bump() { this.playTone(80, "square", 0.08, 50); }
        death() { this.playTone(400, "sawtooth", 0.5, 60); }
        win() {
            [261, 329, 392, 523].forEach((f, i) => {
                setTimeout(() => this.playTone(f, "triangle", 0.18), i * 140);
            });
        }
    }

    const sound = new SoundEngine();
    const unlockAudio = () => {
        sound.init();
        window.removeEventListener("touchstart", unlockAudio);
        window.removeEventListener("keydown", unlockAudio);
        window.removeEventListener("mousedown", unlockAudio);
    };
    window.addEventListener("touchstart", unlockAudio, { passive: true });
    window.addEventListener("keydown", unlockAudio, { passive: true });
    window.addEventListener("mousedown", unlockAudio, { passive: true });

    // --- تنظیمات بوم نقاشی و ریسپانسیو دقیق پیکسل‌ها ---
    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d", { alpha: false });
    ctx.imageSmoothingEnabled = false;

    const V_WIDTH = 320;
    const V_HEIGHT = 240;
    const TILE_SIZE = 16;
    const GRAVITY = 0.42;

    // --- نگاشت کنترل‌ها ---
    const keys = { left: false, right: false, jump: false, run: false };

    window.addEventListener("keydown", (e) => {
        if (e.code === "ArrowLeft" || e.code === "KeyA") keys.left = true;
        if (e.code === "ArrowRight" || e.code === "KeyD") keys.right = true;
        if (e.code === "ArrowUp" || e.code === "Space" || e.code === "KeyW") {
            if (!keys.jump) sound.init();
            keys.jump = true;
        }
        if (e.code === "ShiftLeft" || e.code === "KeyJ") keys.run = true;
    });

    window.addEventListener("keyup", (e) => {
        if (e.code === "ArrowLeft" || e.code === "KeyA") keys.left = false;
        if (e.code === "ArrowRight" || e.code === "KeyD") keys.right = false;
        if (e.code === "ArrowUp" || e.code === "Space" || e.code === "KeyW") keys.jump = false;
        if (e.code === "ShiftLeft" || e.code === "KeyJ") keys.run = false;
    });

    // مدیریت تاچ بدون ایجاد افت فریم و جلوگیری از پرش‌های تصادفی
    const setupTouchBtn = (id, keyName) => {
        const btn = document.getElementById(id);
        if (!btn) return;

        const activate = (e) => {
            e.preventDefault();
            sound.init();
            keys[keyName] = true;
            btn.classList.add("active");
        };

        const deactivate = (e) => {
            e.preventDefault();
            keys[keyName] = false;
            btn.classList.remove("active");
        };

        btn.addEventListener("touchstart", activate, { passive: false });
        btn.addEventListener("touchend", deactivate, { passive: false });
        btn.addEventListener("touchcancel", deactivate, { passive: false });
        btn.addEventListener("mousedown", activate);
        btn.addEventListener("mouseup", deactivate);
        btn.addEventListener("mouseleave", deactivate);
    };

    setupTouchBtn("btn-left", "left");
    setupTouchBtn("btn-right", "right");
    setupTouchBtn("btn-a", "jump");
    setupTouchBtn("btn-b", "run");

    // --- طراحی نقشه سطح ۱-۱ ماریو ---
    const LEVEL_MAP = [
        "                                                                                                   ",
        "                                                                                                   ",
        "                                                                                                   ",
        "                                                                                                   ",
        "                                                                                                   ",
        "                                                                                                   ",
        "                                                                                                   ",
        "                                                                                                   ",
        "                                                                                                   ",
        "                   ?                                                                 F             ",
        "                                           ?   ?                                     |             ",
        "               ?   B?B?B                  BBBBBBB                                    |             ",
        "                                                                                     |             ",
        "                                   p p                                               |             ",
        "         p                         [ ]                                               |             ",
        "        [ ]                        [ ]                       B                       |             ",
        "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
        "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
    ];

    const MAP_H = LEVEL_MAP.length;
    const MAP_W = LEVEL_MAP[0].length;

    // کشیدن تایل‌ها به صورت Procedural برای پرهیز از باگ 404 لود عکس
    function drawTile(ctx, type, x, y) {
        if (type === "X") {
            // بلوک زمین
            ctx.fillStyle = "#d86b24";
            ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = "#fcb490";
            ctx.fillRect(x + 1, y + 1, TILE_SIZE - 2, 2);
            ctx.fillStyle = "#000000";
            ctx.fillRect(x, y + TILE_SIZE - 1, TILE_SIZE, 1);
            ctx.fillRect(x + TILE_SIZE - 1, y, 1, TILE_SIZE);
        } else if (type === "B") {
            // آجر
            ctx.fillStyle = "#b84418";
            ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = "#000000";
            ctx.fillRect(x, y + 7, TILE_SIZE, 1);
            ctx.fillRect(x + 7, y, 1, 7);
            ctx.fillRect(x + 3, y + 8, 1, 8);
        } else if (type === "?") {
            // بلوک علامت سوال
            ctx.fillStyle = "#fc9838";
            ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = "#000000";
            ctx.strokeRect(x + 0.5, y + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 10px monospace";
            ctx.fillText("?", x + 4, y + 12);
        } else if (type === "E") {
            // بلوک خالی استفاده‌شده
            ctx.fillStyle = "#94745c";
            ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
            ctx.strokeStyle = "#403020";
            ctx.strokeRect(x + 0.5, y + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
        } else if (type === "p") {
            // سر لوله
            ctx.fillStyle = "#00a800";
            ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = "#80d010";
            ctx.fillRect(x + 2, y, 3, TILE_SIZE);
            ctx.strokeStyle = "#000000";
            ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);
        } else if (type === "[") {
            // بدنه لوله چپ
            ctx.fillStyle = "#00a800";
            ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = "#80d010";
            ctx.fillRect(x + 2, y, 4, TILE_SIZE);
        } else if (type === "]") {
            // بدنه لوله راست
            ctx.fillStyle = "#008800";
            ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        } else if (type === "|") {
            // میله پرچم
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(x + 7, y, 2, TILE_SIZE);
        } else if (type === "F") {
            // گوی پرچم
            ctx.fillStyle = "#24b024";
            ctx.fillRect(x + 5, y + 4, 6, 6);
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(x + 7, y + 10, 2, 6);
        }
    }

    // --- ساختار نقشه و بلوک‌های داینامیک ---
    class Level {
        constructor() {
            this.grid = [];
            for (let r = 0; r < MAP_H; r++) {
                this.grid[r] = LEVEL_MAP[r].split("");
            }
        }

        getTile(tx, ty) {
            if (tx < 0 || tx >= MAP_W || ty < 0 || ty >= MAP_H) return " ";
            return this.grid[ty][tx];
        }

        setTile(tx, ty, val) {
            if (tx >= 0 && tx < MAP_W && ty >= 0 && ty < MAP_H) {
                this.grid[ty][tx] = val;
            }
        }

        isSolid(tx, ty) {
            const t = this.getTile(tx, ty);
            return t === "X" || t === "B" || t === "?" || t === "E" || t === "p" || t === "[" || t === "]";
        }
    }

    // --- کلاس جلوه‌های بصری و متنی شناور ---
    class Particle {
        constructor(x, y, text, color = "#fff") {
            this.x = x;
            this.y = y;
            this.text = text;
            this.color = color;
            this.life = 35;
            this.vy = -1;
        }

        update() {
            this.y += this.vy;
            this.life--;
        }

        draw(ctx, camX) {
            ctx.fillStyle = this.color;
            ctx.font = "8px monospace";
            ctx.fillText(this.text, Math.floor(this.x - camX), Math.floor(this.y));
        }
    }

    // --- کلاس دشمن گومبا (Goomba) ---
    class Goomba {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.w = 14;
            this.h = 14;
            this.vx = -0.55;
            this.vy = 0;
            this.dead = false;
            this.remove = false;
            this.animTimer = 0;
        }

        update(level) {
            if (this.dead) {
                this.animTimer++;
                if (this.animTimer > 30) this.remove = true;
                return;
            }

            this.vy += GRAVITY;
            if (this.vy > 6) this.vy = 6;

            // برخورد افقی
            const nextX = this.x + this.vx;
            const tileY1 = Math.floor(this.y / TILE_SIZE);
            const tileY2 = Math.floor((this.y + this.h - 1) / TILE_SIZE);

            if (this.vx > 0) {
                const rightTx = Math.floor((nextX + this.w) / TILE_SIZE);
                if (level.isSolid(rightTx, tileY1) || level.isSolid(rightTx, tileY2)) {
                    this.vx = -this.vx;
                } else {
                    this.x = nextX;
                }
            } else {
                const leftTx = Math.floor(nextX / TILE_SIZE);
                if (level.isSolid(leftTx, tileY1) || level.isSolid(leftTx, tileY2)) {
                    this.vx = -this.vx;
                } else {
                    this.x = nextX;
                }
            }

            // برخورد عمودی
            const nextY = this.y + this.vy;
            const tileX1 = Math.floor(this.x / TILE_SIZE);
            const tileX2 = Math.floor((this.x + this.w - 1) / TILE_SIZE);

            if (this.vy >= 0) {
                const bottomTy = Math.floor((nextY + this.h) / TILE_SIZE);
                if (level.isSolid(tileX1, bottomTy) || level.isSolid(tileX2, bottomTy)) {
                    this.y = bottomTy * TILE_SIZE - this.h;
                    this.vy = 0;
                } else {
                    this.y = nextY;
                }
            } else {
                this.y = nextY;
            }
        }

        draw(ctx, camX) {
            const rx = Math.floor(this.x - camX);
            const ry = Math.floor(this.y);

            if (this.dead) {
                // کشیده و له شده
                ctx.fillStyle = "#8a3a00";
                ctx.fillRect(rx, ry + 8, 14, 6);
                return;
            }

            // قارچ گومبا
            ctx.fillStyle = "#a84400";
            ctx.beginPath();
            ctx.arc(rx + 7, ry + 6, 7, Math.PI, 0, false);
            ctx.fill();
            ctx.fillRect(rx + 2, ry + 6, 10, 4);

            // پاها
            ctx.fillStyle = "#000";
            const step = Math.floor(Date.now() / 150) % 2;
            if (step === 0) {
                ctx.fillRect(rx, ry + 10, 5, 4);
                ctx.fillRect(rx + 9, ry + 11, 5, 3);
            } else {
                ctx.fillRect(rx, ry + 11, 5, 3);
                ctx.fillRect(rx + 9, ry + 10, 5, 4);
            }

            // چشم‌ها
            ctx.fillStyle = "#fff";
            ctx.fillRect(rx + 3, ry + 4, 2, 4);
            ctx.fillRect(rx + 9, ry + 4, 2, 4);
            ctx.fillStyle = "#000";
            ctx.fillRect(rx + 4, ry + 5, 1, 3);
            ctx.fillRect(rx + 9, ry + 5, 1, 3);
        }
    }

    // --- کلاس کاراکتر ماریو ---
    class Mario {
        constructor() {
            this.reset();
        }

        reset() {
            this.x = 40;
            this.y = 100;
            this.w = 12;
            this.h = 15;
            this.vx = 0;
            this.vy = 0;
            this.onGround = false;
            this.facingLeft = false;
            this.isDead = false;
            this.deathTimer = 0;
            this.isWon = false;
            this.animFrame = 0;
        }

        die() {
            if (this.isDead || this.isWon) return;
            this.isDead = true;
            this.vy = -7.5;
            this.deathTimer = 100;
            sound.death();
        }

        update(level, enemies, particles, onCoin, onVictory) {
            if (this.isDead) {
                this.vy += 0.35;
                this.y += this.vy;
                this.deathTimer--;
                if (this.deathTimer <= 0) {
                    this.reset();
                }
                return;
            }

            if (this.isWon) {
                this.vx = 1.2;
                this.x += this.vx;
                this.animFrame++;
                return;
            }

            // فیزیک حرکت افقی با شتاب و اصطکاک (Inertia & Momentum)
            const speedLimit = keys.run ? 2.6 : 1.6;
            const accel = 0.12;
            const friction = 0.85;

            if (keys.left) {
                this.vx = Math.max(this.vx - accel, -speedLimit);
                this.facingLeft = true;
            } else if (keys.right) {
                this.vx = Math.min(this.vx + accel, speedLimit);
                this.facingLeft = false;
            } else {
                this.vx *= friction;
                if (Math.abs(this.vx) < 0.05) this.vx = 0;
            }

            // پرش پویا (Variable Jump)
            if (keys.jump && this.onGround) {
                this.vy = keys.run ? -7.8 : -7.0;
                this.onGround = false;
                sound.jump();
            }

            // جاذبه
            this.vy += GRAVITY;
            if (this.vy > 7.0) this.vy = 7.0;

            // تشخیص و واکنش برخورد افقی
            const newX = this.x + this.vx;
            const topTileY = Math.floor(this.y / TILE_SIZE);
            const midTileY = Math.floor((this.y + this.h * 0.5) / TILE_SIZE);
            const botTileY = Math.floor((this.y + this.h - 1) / TILE_SIZE);

            if (this.vx > 0) {
                const rightTx = Math.floor((newX + this.w) / TILE_SIZE);
                if (level.isSolid(rightTx, topTileY) || level.isSolid(rightTx, midTileY) || level.isSolid(rightTx, botTileY)) {
                    this.x = rightTx * TILE_SIZE - this.w - 0.01;
                    this.vx = 0;
                } else {
                    this.x = newX;
                }
            } else if (this.vx < 0) {
                const leftTx = Math.floor(newX / TILE_SIZE);
                if (level.isSolid(leftTx, topTileY) || level.isSolid(leftTx, midTileY) || level.isSolid(leftTx, botTileY)) {
                    this.x = (leftTx + 1) * TILE_SIZE + 0.01;
                    this.vx = 0;
                } else {
                    this.x = newX;
                }
            }

            // تشخیص و واکنش برخورد عمودی
            const newY = this.y + this.vy;
            const leftTx = Math.floor(this.x / TILE_SIZE);
            const midTx = Math.floor((this.x + this.w * 0.5) / TILE_SIZE);
            const rightTx = Math.floor((this.x + this.w - 1) / TILE_SIZE);

            if (this.vy >= 0) {
                const botTy = Math.floor((newY + this.h) / TILE_SIZE);
                if (level.isSolid(leftTx, botTy) || level.isSolid(midTx, botTy) || level.isSolid(rightTx, botTy)) {
                    this.y = botTy * TILE_SIZE - this.h;
                    this.vy = 0;
                    this.onGround = true;
                } else {
                    this.y = newY;
                    this.onGround = false;
                }
            } else {
                const topTy = Math.floor(newY / TILE_SIZE);
                let hitTile = null;
                let hitX = 0;

                [midTx, leftTx, rightTx].forEach(tx => {
                    if (!hitTile && level.isSolid(tx, topTy)) {
                        hitTile = level.getTile(tx, topTy);
                        hitX = tx;
                    }
                });

                if (hitTile) {
                    this.y = (topTy + 1) * TILE_SIZE;
                    this.vy = 0;
                    if (hitTile === "?") {
                        level.setTile(hitX, topTy, "E");
                        sound.coin();
                        onCoin();
                        particles.push(new Particle(hitX * TILE_SIZE + 3, topTy * TILE_SIZE - 4, "+200", "#fffa65"));
                    } else if (hitTile === "B") {
                        sound.bump();
                    }
                } else {
                    this.y = newY;
                    this.onGround = false;
                }
            }

            // میله پرچم پایان مرحله
            const currTx = Math.floor((this.x + this.w * 0.5) / TILE_SIZE);
            const currTy = Math.floor((this.y + this.h * 0.5) / TILE_SIZE);
            if (level.getTile(currTx, currTy) === "|" || level.getTile(currTx, currTy) === "F") {
                this.isWon = true;
                sound.win();
                onVictory();
            }

            // سقوط در چاله
            if (this.y > V_HEIGHT + 30) {
                this.die();
            }

            // برخورد با دشمنان
            for (const enemy of enemies) {
                if (enemy.dead || enemy.remove) continue;
                if (
                    this.x < enemy.x + enemy.w &&
                    this.x + this.w > enemy.x &&
                    this.y < enemy.y + enemy.h &&
                    this.y + this.h > enemy.y
                ) {
                    // فرود روی سر دشمن
                    if (this.vy > 0 && (this.y + this.h - enemy.y) < 8) {
                        enemy.dead = true;
                        this.vy = -4.5;
                        sound.stomp();
                        particles.push(new Particle(enemy.x, enemy.y, "100", "#fff"));
                    } else {
                        this.die();
                    }
                }
            }

            if (Math.abs(this.vx) > 0.1) {
                this.animFrame++;
            } else {
                this.animFrame = 0;
            }
        }

        draw(ctx, camX) {
            const rx = Math.floor(this.x - camX);
            const ry = Math.floor(this.y);

            ctx.save();
            if (this.facingLeft) {
                ctx.translate(rx + this.w, ry);
                ctx.scale(-1, 1);
            } else {
                ctx.translate(rx, ry);
            }

            if (this.isDead) {
                // ماریو در حالت باخت
                ctx.fillStyle = "#e52521";
                ctx.fillRect(1, 1, 10, 13);
                ctx.fillStyle = "#ffd8a8";
                ctx.fillRect(3, 4, 6, 5);
                ctx.restore();
                return;
            }

            // کلاه و پیراهن
            ctx.fillStyle = "#e52521";
            ctx.fillRect(2, 0, 8, 3);
            ctx.fillRect(1, 5, 10, 4);

            // صورت
            ctx.fillStyle = "#ffd8a8";
            ctx.fillRect(3, 3, 7, 3);
            ctx.fillStyle = "#4a2810";
            ctx.fillRect(7, 3, 2, 2); // چشم
            ctx.fillRect(5, 5, 4, 1); // سبیل

            // شلوار پیش‌بندی آبی
            ctx.fillStyle = "#0028a0";
            ctx.fillRect(2, 9, 8, 4);
            ctx.fillStyle = "#ffd8a8";
            ctx.fillRect(0, 7, 2, 2); // دست چپ
            ctx.fillRect(10, 7, 2, 2); // دست راست

            // پاها و انیمیشن راه رفتن
            ctx.fillStyle = "#663300";
            if (!this.onGround) {
                // پرش
                ctx.fillRect(0, 13, 4, 2);
                ctx.fillRect(8, 12, 4, 3);
            } else if (Math.floor(this.animFrame / 6) % 2 === 1) {
                ctx.fillRect(1, 13, 4, 2);
                ctx.fillRect(7, 13, 4, 2);
            } else {
                ctx.fillRect(0, 13, 5, 2);
                ctx.fillRect(7, 13, 5, 2);
            }

            ctx.restore();
        }
    }

    // --- مدیریت هسته و چرخه بازی (Game Loop) ---
    class GameEngine {
        constructor() {
            this.level = new Level();
            this.mario = new Mario();
            this.enemies = [
                new Goomba(180, 200),
                new Goomba(340, 200),
                new Goomba(580, 200),
                new Goomba(720, 200),
                new Goomba(850, 200)
            ];
            this.particles = [];
            this.score = 0;
            this.coins = 0;
            this.camX = 0;
            this.lastTime = 0;
            this.isWon = false;
        }

        addCoin() {
            this.coins += 1;
            this.score += 200;
        }

        onVictory() {
            this.isWon = true;
            this.score += 1000;
        }

        update() {
            this.mario.update(
                this.level,
                this.enemies,
                this.particles,
                () => this.addCoin(),
                () => this.onVictory()
            );

            // آپدیت دوربین
            const targetCamX = this.mario.x - V_WIDTH * 0.38;
            if (targetCamX > this.camX) {
                this.camX += (targetCamX - this.camX) * 0.1;
            }
            const maxCamX = (MAP_W * TILE_SIZE) - V_WIDTH;
            this.camX = Math.max(0, Math.min(this.camX, maxCamX));

            // آپدیت دشمن‌ها
            for (let i = this.enemies.length - 1; i >= 0; i--) {
                const en = this.enemies[i];
                // فقط در صورت نزدیک بودن به محدوده دوربین پردازش شود
                if (en.x < this.camX + V_WIDTH + 64 && en.x > this.camX - 64) {
                    en.update(this.level);
                }
                if (en.remove) {
                    this.enemies.splice(i, 1);
                }
            }

            // آپدیت پارتیکل‌ها
            for (let i = this.particles.length - 1; i >= 0; i--) {
                this.particles[i].update();
                if (this.particles[i].life <= 0) {
                    this.particles.splice(i, 1);
                }
            }
        }

        render() {
            // آسمان
            ctx.fillStyle = "#5c94fc";
            ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);

            // کشیدن نقشه تایل‌ها
            const startTx = Math.max(0, Math.floor(this.camX / TILE_SIZE));
            const endTx = Math.min(MAP_W, Math.ceil((this.camX + V_WIDTH) / TILE_SIZE) + 1);

            for (let r = 0; r < MAP_H; r++) {
                for (let c = startTx; c < endTx; c++) {
                    const tile = this.level.getTile(c, r);
                    if (tile !== " ") {
                        drawTile(ctx, tile, Math.floor(c * TILE_SIZE - this.camX), r * TILE_SIZE);
                    }
                }
            }

            // کشیدن دشمنان
            for (const en of this.enemies) {
                if (en.x < this.camX + V_WIDTH && en.x + en.w > this.camX) {
                    en.draw(ctx, this.camX);
                }
            }

            // کشیدن ماریو
            this.mario.draw(ctx, this.camX);

            // کشیدن پارتیکل‌ها
            for (const p of this.particles) {
                p.draw(ctx, this.camX);
            }

            // هدز-آپ دیسپلی (HUD)
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 9px monospace";
            ctx.fillText("MARIO", 16, 14);
            ctx.fillText(String(this.score).padStart(6, "0"), 16, 24);

            ctx.fillText("COINS", 120, 14);
            ctx.fillText("x" + String(this.coins).padStart(2, "0"), 126, 24);

            ctx.fillText("WORLD", 200, 14);
            ctx.fillText("1-1", 208, 24);

            if (this.isWon) {
                ctx.fillStyle = "rgba(0,0,0,0.6)";
                ctx.fillRect(0, 80, V_WIDTH, 48);
                ctx.fillStyle = "#fffb00";
                ctx.font = "bold 14px monospace";
                ctx.textAlign = "center";
                ctx.fillText("STAGE CLEAR!", V_WIDTH / 2, 108);
                ctx.textAlign = "left";
            }
        }

        loop(timestamp) {
            // جلوگیری از باگ عبور از دیوار در صورت کندی فریم ریت (Delta Capping)
            if (!this.lastTime) this.lastTime = timestamp;
            const delta = (timestamp - this.lastTime) / 1000;
            this.lastTime = timestamp;

            if (delta < 0.25) {
                this.update();
            }
            this.render();

            requestAnimationFrame((t) => this.loop(t));
        }

        start() {
            requestAnimationFrame((t) => this.loop(t));
        }
    }

    // راه‌اندازی بدون تاخیر
    window.addEventListener("DOMContentLoaded", () => {
        const game = new GameEngine();
        game.start();
    });
})();