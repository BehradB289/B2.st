import { Vector2D } from './Vector2D.js';
import { EventEmitter } from './EventEmitter.js';

/**
 * BoundingBox - مدل ریاضی جعبه محدودکننده جهت تشخیص برخورد AABB
 */
export class BoundingBox {
  /**
   * @param {number} x
   * @param {number} y
   * @param {number} width
   * @param {number} height
   */
  constructor(x = 0, y = 0, width = 16, height = 16) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  get left() { return this.x; }
  get right() { return this.x + this.width; }
  get top() { return this.y; }
  get bottom() { return this.y + this.height; }

  get centerX() { return this.x + this.width / 2; }
  get centerY() { return this.y + this.height / 2; }

  /**
   * بررسی تداخل دو جعبه دو بعدی (AABB Collision)
   * @param {BoundingBox|Object} other
   * @returns {boolean}
   */
  intersects(other) {
    return (
      this.left < other.right &&
      this.right > other.left &&
      this.top < other.bottom &&
      this.bottom > other.top
    );
  }

  /**
   * بررسی این‌که آیا یک نقطه در داخل این جعبه قرار دارد
   * @param {number} px
   * @param {number} py
   * @returns {boolean}
   */
  contains(px, py) {
    return (
      px >= this.left &&
      px <= this.right &&
      py >= this.top &&
      py <= this.bottom
    );
  }
}

/**
 * RigidBody - کامپوننت فیزیکی اشیاء موجود در دنیای بازی
 */
export class RigidBody {
  /**
   * @param {Object} config
   */
  constructor(config = {}) {
    this.id = config.id || Math.random().toString(36).substring(2, 9);
    this.tag = config.tag || 'entity';

    // مقادیر برداری
    this.position = new Vector2D(config.x || 0, config.y || 0);
    this.velocity = new Vector2D(config.vx || 0, config.vy || 0);
    this.acceleration = new Vector2D(0, 0);
    this.size = new Vector2D(config.width || 16, config.height || 16);

    // ویژگی‌های فیزیکی
    this.isStatic = config.isStatic || false;
    this.gravityScale = config.gravityScale ?? 1.0;
    this.friction = config.friction ?? 1.0;
    this.isGrounded = false;
    this.wasGrounded = false;
    this.collidesWithWorld = config.collidesWithWorld ?? true;
    this.collisionGroup = config.collisionGroup || 'default';

    // کش کمکی برای محاسبه BoundingBox بدون تخصیص حافظه مکرر
    this.bounds = new BoundingBox(this.position.x, this.position.y, this.size.x, this.size.y);
  }

  /**
   * به‌روزرسانی جعبه محدودکننده بر اساس موقعیت فعلی
   * @returns {BoundingBox}
   */
  updateBounds() {
    this.bounds.x = this.position.x;
    this.bounds.y = this.position.y;
    this.bounds.width = this.size.x;
    this.bounds.height = this.size.y;
    return this.bounds;
  }

  /**
   * اعمال تکانه لحظه‌ای (مانند پریدن ماریو)
   * @param {number} ix
   * @param {number} iy
   */
  applyImpulse(ix, iy) {
    this.velocity.x += ix;
    this.velocity.y += iy;
  }

  /**
   * اعمال نیروی پیوسته
   * @param {number} fx
   * @param {number} fy
   */
  applyForce(fx, fy) {
    this.acceleration.x += fx;
    this.acceleration.y += fy;
  }
}

/**
 * PhysicsEngine - موتور فیزیک جامع AABB با تفکیک بردار حرکت محورهای X و Y
 * رفع مشکلات نفوذ به لایه‌ها و مدیریت اصطکاک و گرانش برای پلتفرمرهای کلاسیک
 */
export class PhysicsEngine extends EventEmitter {
  /**
   * @param {Object} [options={}]
   */
  constructor(options = {}) {
    super();

    // پارامترهای پیش‌فرض شبیه‌سازی گرانش و سرعت مجاز متناسب با نرخ پیکسل‌های NES
    this.gravity = options.gravity ?? 1050; // پیکسل بر مجذور ثانیه
    this.terminalVelocity = options.terminalVelocity ?? 620; // حداکثر سرعت سقوط
    this.groundFriction = options.groundFriction ?? 950; // نرخ کاهش سرعت افقی روی زمین
    this.airResistance = options.airResistance ?? 120; // مقاومت هوا هنگام پرش

    /** @type {Set<RigidBody>} لیست تمام اجسام ثبت‌شده */
    this.bodies = new Set();

    /** @type {Array<BoundingBox>} لیست موانع استاتیک زمین و آجرها */
    this.staticObstacles = [];
  }

  /**
   * اضافه کردن جسم به شبیه‌ساز فیزیک
   * @param {RigidBody} body
   */
  addBody(body) {
    this.bodies.add(body);
  }

  /**
   * حذف جسم از شبیه‌ساز
   * @param {RigidBody} body
   */
  removeBody(body) {
    this.bodies.delete(body);
  }

  /**
   * اضافه کردن مانع محیطی استاتیک (کاشی، سکو یا بلوک)
   * @param {number} x
   * @param {number} y
   * @param {number} width
   * @param {number} height
   * @returns {BoundingBox}
   */
  addObstacle(x, y, width, height) {
    const box = new BoundingBox(x, y, width, height);
    this.staticObstacles.push(box);
    return box;
  }

  /**
   * پاک‌سازی تمامی موانع محیطی
   */
  clearObstacles() {
    this.staticObstacles = [];
  }

  /**
   * اجرای یک گام زمانی ثابت (Fixed Timestep Step)
   * @param {number} dt دلتا تایم بر حسب ثانیه
   */
  step(dt) {
    for (const body of this.bodies) {
      if (body.isStatic) continue;

      body.wasGrounded = body.isGrounded;

      // 1. اعمال شتاب‌ها و گرانش
      if (body.gravityScale > 0) {
        body.velocity.y += this.gravity * body.gravityScale * dt;
        if (body.velocity.y > this.terminalVelocity) {
          body.velocity.y = this.terminalVelocity;
        }
      }

      // 2. اعمال اصطکاک افقی (زمینی یا مقاومت هوا)
      const currentFriction = body.isGrounded ? this.groundFriction * body.friction : this.airResistance;
      if (body.acceleration.x === 0 && Math.abs(body.velocity.x) > 0) {
        const decay = currentFriction * dt;
        if (body.velocity.x > 0) {
          body.velocity.x = Math.max(0, body.velocity.x - decay);
        } else {
          body.velocity.x = Math.min(0, body.velocity.x + decay);
        }
      }

      // اعمال شتاب به سرعت افقی
      body.velocity.x += body.acceleration.x * dt;
      // ریست شتاب برای گام بعدی
      body.acceleration.zero();

      // 3. حرکت و حل برخورد در محور X (Separated X-Axis Movement)
      body.position.x += body.velocity.x * dt;
      body.updateBounds();

      if (body.collidesWithWorld) {
        this.resolveCollisionsX(body);
      }

      // 4. حرکت و حل برخورد در محور Y (Separated Y-Axis Movement)
      body.position.y += body.velocity.y * dt;
      body.updateBounds();
      body.isGrounded = false;

      if (body.collidesWithWorld) {
        this.resolveCollisionsY(body);
      }

      // رویداد فرود آمدن روی زمین (Landing Event)
      if (!body.wasGrounded && body.isGrounded) {
        this.emit('land', { body });
      }
    }

    // 5. تشخیص برخورد اجسام داینامیک با یکدیگر (Dynamic vs Dynamic)
    this.resolveBodyToBodyCollisions();
  }

  /**
   * حل برخوردهای افقی محور X و حذف تداخل AABB
   * @param {RigidBody} body
   */
  resolveCollisionsX(body) {
    for (let i = 0; i < this.staticObstacles.length; i++) {
      const obstacle = this.staticObstacles[i];

      if (body.bounds.intersects(obstacle)) {
        if (body.velocity.x > 0) {
          // حرکت به سمت راست و برخورد با سمت چپ مانع
          body.position.x = obstacle.left - body.size.x;
          body.velocity.x = 0;
          body.updateBounds();

          this.emit('wallHit', { body, obstacle, side: 'right' });
          this.emit('collision', { source: body, target: obstacle, side: 'right' });
        } else if (body.velocity.x < 0) {
          // حرکت به سمت چپ و برخورد با سمت راست مانع
          body.position.x = obstacle.right;
          body.velocity.x = 0;
          body.updateBounds();

          this.emit('wallHit', { body, obstacle, side: 'left' });
          this.emit('collision', { source: body, target: obstacle, side: 'left' });
        }
      }
    }
  }

  /**
   * حل برخوردهای عمودی محور Y و بررسی وضعیت زمینی یا سقف
   * @param {RigidBody} body
   */
  resolveCollisionsY(body) {
    for (let i = 0; i < this.staticObstacles.length; i++) {
      const obstacle = this.staticObstacles[i];

      if (body.bounds.intersects(obstacle)) {
        if (body.velocity.y > 0) {
          // سقوط به پایین و برخورد با سطح روی مانع (زمین / پلتفرم)
          body.position.y = obstacle.top - body.size.y;
          body.velocity.y = 0;
          body.isGrounded = true;
          body.updateBounds();

          this.emit('groundHit', { body, obstacle, side: 'bottom' });
          this.emit('collision', { source: body, target: obstacle, side: 'bottom' });
        } else if (body.velocity.y < 0) {
          // پرش به بالا و برخورد با زیر مانع (سقف / بلوک علامت سوال)
          body.position.y = obstacle.bottom;
          body.velocity.y = 0;
          body.updateBounds();

          this.emit('ceilingHit', { body, obstacle, side: 'top' });
          this.emit('collision', { source: body, target: obstacle, side: 'top' });
        }
      }
    }
  }

  /**
   * پردازش تداخل بین انتیتی‌های متحرک با یکدیگر
   */
  resolveBodyToBodyCollisions() {
    const bodiesArray = Array.from(this.bodies);
    const count = bodiesArray.length;

    for (let i = 0; i < count; i++) {
      const bodyA = bodiesArray[i];
      for (let j = i + 1; j < count; j++) {
        const bodyB = bodiesArray[j];

        if (bodyA.bounds.intersects(bodyB.bounds)) {
          // تعیین جهت برخورد بر اساس بردار تفاوت مراکز
          const dx = bodyA.bounds.centerX - bodyB.bounds.centerX;
          const dy = bodyA.bounds.centerY - bodyB.bounds.centerY;

          let side = 'unknown';
          if (Math.abs(dx) > Math.abs(dy)) {
            side = dx > 0 ? 'left' : 'right';
          } else {
            side = dy > 0 ? 'top' : 'bottom';
          }

          this.emit('entityCollision', {
            bodyA,
            bodyB,
            side
          });
        }
      }
    }
  }
}