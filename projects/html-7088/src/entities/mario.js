/**
 * هویت اصلی ماریو (Mario Character Entity & State Machine)
 * همراه با پشتیبانی از ذخیره و بازیابی وضعیت از طریق مدل SaveStateModel
 */
(function (global) {
  'use strict';

  const BBox = typeof BoundingBox !== 'undefined'
    ? BoundingBox
    : (typeof require !== 'undefined' ? require('../engine/physics').BoundingBox : null);

  const Vec = typeof Vector2D !== 'undefined'
    ? Vector2D
    : (typeof require !== 'undefined' ? require('../engine/physics').Vector2D : null);

  class Mario {
    constructor(x = 40, y = 180) {
      this.position = new Vec(x, y);
      this.velocity = new Vec(0, 0);
      this.width = 14;
      this.height = 16;
      this.powerState = 'small'; // 'small' | 'super'
      this.isGrounded = false;
      this.facingRight = true;
      this.isDead = false;
      this.deathTimer = 0;
      this.moveSpeed = 140;
      this.runSpeed = 210;
      this.jumpForce = -350;
      this.animFrame = 0;
      this.animTimer = 0;
    }

    getBounds() {
      return new BBox(this.position.x, this.position.y, this.width, this.height);
    }

    jump(audioEngine) {
      if (this.isGrounded && !this.isDead) {
        this.velocity.y = this.jumpForce;
        this.isGrounded = false;
        if (audioEngine) audioEngine.playJump();
      }
    }

    die(audioEngine) {
      if (this.isDead) return;
      this.isDead = true;
      this.velocity.set(0, -320);
      this.deathTimer = 2.5;
      if (audioEngine) audioEngine.playDie();
    }

    powerUp(audioEngine) {
      if (this.powerState === 'small') {
        this.powerState = 'super';
        this.height = 28;
        this.position.y -= 12;
        if (audioEngine) audioEngine.playPowerup();
      }
    }

    update(dt, inputState) {
      if (this.isDead) {
        this.position.y += this.velocity.y * dt;
        this.velocity.y += 980 * dt;
        this.deathTimer -= dt;
        return;
      }

      const speed = inputState.sprint ? this.runSpeed : this.moveSpeed;

      if (inputState.left) {
        this.velocity.x = -speed;
        this.facingRight = false;
      } else if (inputState.right) {
        this.velocity.x = speed;
        this.facingRight = true;
      } else {
        this.velocity.x = 0;
      }

      // انیمیشن قدم زدن
      if (Math.abs(this.velocity.x) > 10 && this.isGrounded) {
        this.animTimer += dt;
        if (this.animTimer > 0.12) {
          this.animFrame = (this.animFrame + 1) % 3;
          this.animTimer = 0;
        }
      } else {
        this.animFrame = 0;
      }

      // افتادن در چاله و مرگ
      if (this.position.y > 260) {
        this.die();
      }
    }

    render(ctx, camera) {
      const screenX = Math.round(this.position.x - camera.x);
      const screenY = Math.round(this.position.y - camera.y);

      ctx.save();
      if (!this.facingRight) {
        ctx.translate(screenX + this.width, screenY);
        ctx.scale(-1, 1);
      } else {
        ctx.translate(screenX, screenY);
      }

      const isSuper = this.powerState === 'super';

      // رسم کاراکتر رترو NES ماریو (قرمز و آبی کلاسیک)
      if (this.isDead) {
        // ماریو در حال پرش مرگ
        ctx.fillStyle = '#d82800';
        ctx.fillRect(2, 2, 10, 6);
        ctx.fillStyle = '#0028a0';
        ctx.fillRect(1, 8, 12, 8);
        ctx.restore();
        return;
      }

      if (!isSuper) {
        // ماریو کوچک (Small Mario)
        // کلاه و پیراهن قرمز
        ctx.fillStyle = '#d82800';
        ctx.fillRect(3, 0, 8, 3); // کلاه
        ctx.fillRect(2, 7, 10, 5); // لباس قرمز سینه

        // صورت هلویی
        ctx.fillStyle = '#fc9838';
        ctx.fillRect(3, 3, 7, 4);
        ctx.fillStyle = '#000000';
        ctx.fillRect(7, 4, 2, 2); // سبیل/چشم

        // شلوار سرهمی آبی (Overalls)
        ctx.fillStyle = '#0028a0';
        ctx.fillRect(3, 10, 8, 4);

        // کفش قهوه‌ای
        ctx.fillStyle = '#6c3400';
        ctx.fillRect(this.animFrame === 1 ? 0 : 2, 13, 4, 3);
        ctx.fillRect(this.animFrame === 2 ? 10 : 8, 13, 4, 3);
      } else {
        // سوپر ماریو (Super Mario)
        ctx.fillStyle = '#d82800';
        ctx.fillRect(3, 0, 8, 5);
        ctx.fillStyle = '#fc9838';
        ctx.fillRect(3, 5, 8, 6);
        ctx.fillStyle = '#000000';
        ctx.fillRect(7, 7, 2, 2);

        ctx.fillStyle = '#d82800';
        ctx.fillRect(1, 11, 12, 8);

        ctx.fillStyle = '#0028a0';
        ctx.fillRect(3, 18, 8, 6);

        ctx.fillStyle = '#6c3400';
        ctx.fillRect(1, 24, 5, 4);
        ctx.fillRect(8, 24, 5, 4);
      }

      ctx.restore();
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Mario };
  } else {
    global.Mario = Mario;
  }
})(typeof window !== 'undefined' ? window : globalThis);