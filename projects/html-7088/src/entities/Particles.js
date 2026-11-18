/**
 * Particle Engine for Brick Shatters, Coin Bounce, and Combat Dust
 */

export class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  spawnBrickDebris(x, y) {
    const velocities = [
      { vx: -70, vy: -280 },
      { vx: 70, vy: -280 },
      { vx: -90, vy: -180 },
      { vx: 90, vy: -180 }
    ];

    velocities.forEach((v) => {
      this.particles.push({
        type: 'BRICK',
        x,
        y,
        vx: v.vx,
        vy: v.vy,
        width: 8,
        height: 8,
        gravity: 900,
        rotation: 0,
        life: 1.2
      });
    });
  }

  spawnFloatingCoin(x, y) {
    this.particles.push({
      type: 'COIN_BOUNCE',
      x,
      y: y - 16,
      vx: 0,
      vy: -260,
      width: 8,
      height: 14,
      gravity: 800,
      startY: y,
      life: 0.65
    });
  }

  spawnScorePopup(text, x, y) {
    this.particles.push({
      type: 'SCORE_TEXT',
      text,
      x,
      y,
      vx: 0,
      vy: -50,
      life: 0.75
    });
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      if (p.gravity) {
        p.vy += p.gravity * dt;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      if (p.type === 'BRICK') {
        p.rotation += 15 * dt;
      }
    }
  }

  draw(ctx, camera) {
    this.particles.forEach((p) => {
      const sx = Math.round(p.x - camera.x);
      const sy = Math.round(p.y - camera.y);

      if (p.type === 'BRICK') {
        ctx.save();
        ctx.translate(sx + 4, sy + 4);
        ctx.rotate(p.rotation);
        ctx.fillStyle = '#b84418';
        ctx.fillRect(-4, -4, 8, 8);
        ctx.restore();
      } else if (p.type === 'COIN_BOUNCE') {
        ctx.fillStyle = '#fcbc38';
        ctx.fillRect(sx, sy, 8, 14);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(sx + 2, sy + 2, 4, 10);
      } else if (p.type === 'SCORE_TEXT') {
        ctx.fillStyle = '#ffffff';
        ctx.font = '7px "Press Start 2P", monospace';
        ctx.fillText(p.text, sx, sy);
      }
    });
  }
}