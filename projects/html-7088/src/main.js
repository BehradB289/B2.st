/**
 * @file main.js
 * @description Application Orchestrator and Game Bootstrap.
 * Integrates PerformanceCache, RateLimiter, ECS loop, HUD, and Canvas rendering.
 */
import { PerformanceCache, RateLimiter } from './core/performance_cache.js';
import { Physics } from './engine/Physics.js';
import { Camera } from './engine/Camera.js';
import { InputHandler } from './engine/InputHandler.js';
import { GameLoop } from './engine/GameLoop.js';
import { Mario } from './entities/Mario.js';
import { createLevel1 } from './levels/Level1.js';

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  // Core Caching and Rate Limiting Systems
  const engineCache = new PerformanceCache({ maxSize: 1000, defaultTTL: 180000 });
  const inputRateLimiter = new RateLimiter(5, 4); // 5 tokens max, refills 4 tokens/sec

  // Physics, Level, and Viewport Setup
  const physics = new Physics();
  const { tileMap, enemies } = createLevel1(engineCache);
  const camera = new Camera(canvas.width, canvas.height, tileMap.width, tileMap.height);
  const input = new InputHandler(inputRateLimiter);
  const mario = new Mario(40, 100, engineCache, inputRateLimiter);

  camera.follow(mario);

  // HUD elements
  const scoreEl = document.getElementById('hudScore');
  const coinsEl = document.getElementById('hudCoins');
  const timeEl = document.getElementById('hudTime');
  const fpsEl = document.getElementById('hudFps');
  const cacheHitEl = document.getElementById('hudCacheHits');

  let remainingTime = 400;
  let timeTicker = 0;

  // Fixed Physics Update Tick
  function update(dt) {
    timeTicker += dt;
    if (timeTicker >= 1.0) {
      if (remainingTime > 0 && mario.isAlive) remainingTime--;
      timeTicker -= 1.0;
    }

    // Input & Mario physics
    mario.handleInput(input, dt);
    mario.update(dt, physics);

    // Collision with solid blocks
    const marioSolids = tileMap.getSurroundingSolids(mario.getBounds());
    mario.isGrounded = false;
    for (const solid of marioSolids) {
      physics.resolveCollision(mario, solid);
    }

    // Enemies update & collisions
    for (const enemy of enemies) {
      if (!enemy.isAlive) continue;

      enemy.update(dt, physics);
      const enemySolids = tileMap.getSurroundingSolids(enemy.getBounds());
      for (const solid of enemySolids) {
        physics.resolveCollision(enemy, solid);
      }

      // Enemy vs Mario collision
      if (Physics.checkAABB(mario.getBounds(), enemy.getBounds())) {
        if (mario.velocity.y > 50 && mario.y + mario.height - enemy.y < 12) {
          // Stomped enemy!
          enemy.squish();
          mario.velocity.y = -260; // Mario bounce
          mario.score += 100;
        } else if (!enemy.isSquished) {
          // Mario took damage/died
          mario.die();
        }
      }
    }

    // Camera track
    camera.update();

    // Check for game reset on death
    if (mario.y > 600) {
      mario.x = 40;
      mario.y = 100;
      mario.velocity.set(0, 0);
      mario.state = 'IDLE';
      mario.isAlive = true;
    }
  }

  // Render Pass
  function render(interpolation) {
    // NES Sky Blue
    ctx.fillStyle = '#6B8CFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Render TileMap (Offscreen cache accelerated)
    tileMap.render(ctx, camera);

    // Render Enemies
    for (const enemy of enemies) {
      if (enemy.isAlive) {
        enemy.render(ctx, camera);
      }
    }

    // Render Mario
    mario.render(ctx, camera);

    // Update HUD Stats
    scoreEl.textContent = String(mario.score).padStart(6, '0');
    coinsEl.textContent = `x${String(mario.coins).padStart(2, '0')}`;
    timeEl.textContent = String(remainingTime).padStart(3, '0');
    fpsEl.textContent = `${loop.fps}`;
    
    const stats = engineCache.getStats();
    cacheHitEl.textContent = `${stats.hitRatio}% (${stats.hits} hits)`;
  }

  // Launch GameLoop
  const loop = new GameLoop(update, render, engineCache);
  loop.start();
});