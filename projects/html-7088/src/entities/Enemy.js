/**
 * دشمنان بازی: گومبا (Goomba)، لاک‌پشت کوپا (Koopa Troopa) با حالت لاک چرخان، و غول مرحله (Bowser)
 */
export class Enemy {
  constructor(x, y, type = 'goomba') {
    this.x = x;
    this.y = y;
    this.type = type;
    this.width = 28;
    this.height = type === 'koopa' ? 36 : 28;
    this.vx = -1.2;
    this.vy = 0;
    this.onGround = false;
    this.isDead = false;
    this.isShell = false;
    this.isSpinning = false;
    this.remove = false;
  }

  update(physics, level) {
    if (this.isDead) return;

    physics.updateEntityX(this, level);
    physics.updateEntityY(this, level);
  }

  onCollideWall(side) {
    if (side === 'left') {
      this.vx = Math.abs(this.vx);
    } else {
      this.vx = -Math.abs(this.vx);
    }
  }

  stomp(player, soundEngine, particleSystem) {
    if (this.type === 'goomba') {
      this.isDead = true;
      this.remove = true;
      soundEngine?.playStomp();
      player.bounce();
      player.score += 100;
      particleSystem?.emitFloatingScore(this.x, this.y, '100');
    } else if (this.type === 'koopa') {
      if (!this.isShell) {
        this.isShell = true;
        this.height = 24;
        this.vx = 0;
        soundEngine?.playStomp();
        player.bounce();
      } else if (!this.isSpinning) {
        this.isSpinning = true;
        this.vx = player.facing * 7.5; // شلیک لاک
        soundEngine?.playStomp();
      } else {
        this.isSpinning = false;
        this.vx = 0;
        player.bounce();
      }
    }
  }

  draw(ctx) {
    if (this.isDead) return;

    if (this.type === 'goomba') {
      // اسپرایت گومبا
      ctx.fillStyle = '#a84400';
      ctx.beginPath();
      ctx.arc(this.x + 14, this.y + 12, 13, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fce4a0';
      ctx.fillRect(this.x + 5, this.y + 18, 18, 10);

      // پاها
      ctx.fillStyle = '#000';
      ctx.fillRect(this.x + 2, this.y + 24, 7, 4);
      ctx.fillRect(this.x + 19, this.y + 24, 7, 4);

      // چشم‌های خشمگین
      ctx.fillStyle = '#fff';
      ctx.fillRect(this.x + 7, this.y + 10, 4, 7);
      ctx.fillRect(this.x + 17, this.y + 10, 4, 7);
      ctx.fillStyle = '#000';
      ctx.fillRect(this.x + 9, this.y + 12, 2, 4);
      ctx.fillRect(this.x + 17, this.y + 12, 2, 4);
    } else if (this.type === 'koopa') {
      // لاک پشت کوپا
      ctx.fillStyle = this.isShell ? '#00b800' : '#00a800';
      ctx.fillRect(this.x + 2, this.y + (this.isShell ? 0 : 10), 24, 24);

      ctx.fillStyle = '#fff';
      ctx.fillRect(this.x + 6, this.y + (this.isShell ? 4 : 14), 16, 16);
      ctx.fillStyle = '#00a800';
      ctx.fillRect(this.x + 9, this.y + (this.isShell ? 7 : 17), 10, 10);

      if (!this.isShell) {
        // سر کوپا
        ctx.fillStyle = '#fcb000';
        ctx.fillRect(this.x + (this.vx > 0 ? 14 : 2), this.y, 12, 12);
        ctx.fillStyle = '#000';
        ctx.fillRect(this.x + (this.vx > 0 ? 22 : 4), this.y + 3, 3, 3);
      }
    }
  }
}