/**
 * Pixel-Perfect Procedural NES Canvas Renderer
 * Guaranteed standalone operation: Draws Mario, Enemies, Pipes, and Props in pure vector/pixel art.
 */

import { CONFIG } from '../../config/game.config.js';

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;
  }

  clear(bgColor = CONFIG.COLORS.SKY_BLUE) {
    this.ctx.fillStyle = bgColor;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  // --- DRAWING ENTITIES ---

  drawMario(mario, camera) {
    const screenX = Math.round(mario.x - camera.x);
    const screenY = Math.round(mario.y - camera.y + (camera.shakeOffset || 0));

    // Invulnerability blinking
    if (mario.isInvulnerable && Math.floor(Date.now() / 50) % 2 === 0) {
      return;
    }

    this.ctx.save();
    this.ctx.translate(screenX, screenY);

    if (mario.facing === -1) {
      this.ctx.translate(mario.width, 0);
      this.ctx.scale(-1, 1);
    }

    // Determine colors (Normal, Fire, or Star flashing)
    let outfitColor = CONFIG.COLORS.MARIO_OVERALL;
    let shirtColor = CONFIG.COLORS.MARIO_RED;
    let skinColor = CONFIG.COLORS.MARIO_SKIN;

    if (mario.isStarPowered) {
      const pIdx = Math.floor(Date.now() / 80) % CONFIG.COLORS.STAR_PALETTES.length;
      const pal = CONFIG.COLORS.STAR_PALETTES[pIdx];
      shirtColor = pal[0];
      outfitColor = pal[1];
      skinColor = pal[2];
    } else if (mario.powerState === 'FIRE') {
      outfitColor = CONFIG.COLORS.MARIO_RED;
      shirtColor = CONFIG.COLORS.FIRE_WHITE;
    }

    const isBig = mario.powerState !== 'SMALL';
    const isCrouching = mario.isCrouching && isBig;

    if (!isBig) {
      // Small Mario 16x16
      this._drawSmallMarioSprite(this.ctx, shirtColor, outfitColor, skinColor, mario.animFrame, !mario.onGround);
    } else if (isCrouching) {
      // Crouch Super/Fire Mario 16x22
      this._drawCrouchMarioSprite(this.ctx, shirtColor, outfitColor, skinColor);
    } else {
      // Super or Fire Mario 16x32
      this._drawSuperMarioSprite(this.ctx, shirtColor, outfitColor, skinColor, mario.animFrame, !mario.onGround);
    }

    this.ctx.restore();
  }

  _drawSmallMarioSprite(ctx, shirt, outfit, skin, frame, inAir) {
    // Hat & Hair
    ctx.fillStyle = shirt;
    ctx.fillRect(3, 1, 6, 2);
    ctx.fillRect(2, 3, 9, 2);

    // Face / Skin
    ctx.fillStyle = skin;
    ctx.fillRect(2, 5, 8, 3);
    ctx.fillRect(8, 4, 2, 2);

    // Eyes & Mustache
    ctx.fillStyle = '#000';
    ctx.fillRect(7, 5, 1, 2); // eye
    ctx.fillRect(5, 7, 4, 1); // mustache

    // Torso / Overalls
    ctx.fillStyle = outfit;
    ctx.fillRect(3, 8, 6, 4);

    // Arms
    ctx.fillStyle = shirt;
    if (inAir) {
      ctx.fillRect(1, 6, 2, 4);
      ctx.fillRect(9, 7, 3, 3);
    } else {
      ctx.fillRect(2, 9, 2, 3);
      ctx.fillRect(8, 9, 2, 3);
    }

    // Legs / Feet
    ctx.fillStyle = '#6b3600';
    if (inAir) {
      ctx.fillRect(2, 12, 3, 3);
      ctx.fillRect(7, 13, 4, 3);
    } else if (frame % 2 === 0) {
      ctx.fillRect(2, 12, 3, 4);
      ctx.fillRect(7, 12, 3, 4);
    } else {
      ctx.fillRect(1, 12, 4, 3);
      ctx.fillRect(7, 11, 4, 4);
    }
  }

  _drawSuperMarioSprite(ctx, shirt, outfit, skin, frame, inAir) {
    // Big Mario (16 x 32)
    // Hat
    ctx.fillStyle = shirt;
    ctx.fillRect(4, 2, 8, 3);
    ctx.fillRect(3, 5, 11, 3);

    // Face
    ctx.fillStyle = skin;
    ctx.fillRect(3, 8, 10, 5);
    ctx.fillRect(10, 6, 3, 3);

    // Eyes / Mustache
    ctx.fillStyle = '#000';
    ctx.fillRect(9, 8, 2, 3);
    ctx.fillRect(7, 11, 6, 2);

    // Torso Shirt
    ctx.fillStyle = shirt;
    ctx.fillRect(4, 13, 8, 5);

    // Overalls
    ctx.fillStyle = outfit;
    ctx.fillRect(3, 17, 10, 8);
    ctx.fillStyle = '#ffcc00'; // Buckles
    ctx.fillRect(4, 18, 2, 2);
    ctx.fillRect(10, 18, 2, 2);

    // Shoes
    ctx.fillStyle = '#6b3600';
    if (inAir) {
      ctx.fillRect(1, 24, 5, 6);
      ctx.fillRect(10, 26, 5, 5);
    } else if (frame % 2 === 0) {
      ctx.fillRect(2, 25, 5, 7);
      ctx.fillRect(9, 25, 5, 7);
    } else {
      ctx.fillRect(0, 25, 6, 6);
      ctx.fillRect(10, 24, 6, 7);
    }
  }

  _drawCrouchMarioSprite(ctx, shirt, outfit, skin) {
    ctx.fillStyle = shirt;
    ctx.fillRect(3, 6, 10, 4);
    ctx.fillStyle = skin;
    ctx.fillRect(3, 10, 10, 4);
    ctx.fillStyle = '#000';
    ctx.fillRect(9, 10, 2, 2);
    ctx.fillRect(7, 12, 5, 2);
    ctx.fillStyle = outfit;
    ctx.fillRect(2, 14, 12, 6);
    ctx.fillStyle = '#6b3600';
    ctx.fillRect(1, 20, 14, 4);
  }

  drawGoomba(enemy, camera) {
    const screenX = Math.round(enemy.x - camera.x);
    const screenY = Math.round(enemy.y - camera.y);

    this.ctx.save();
    this.ctx.translate(screenX, screenY);

    if (enemy.squished) {
      // Squished state
      this.ctx.fillStyle = '#a84400';
      this.ctx.fillRect(0, 8, 16, 8);
      this.ctx.fillStyle = '#000';
      this.ctx.fillRect(3, 11, 3, 2);
      this.ctx.fillRect(10, 11, 3, 2);
    } else {
      // Brown body
      this.ctx.fillStyle = '#a84400';
      this.ctx.fillRect(3, 1, 10, 9);
      this.ctx.fillRect(1, 4, 14, 6);

      // Cream face
      this.ctx.fillStyle = '#fce0a8';
      this.ctx.fillRect(4, 9, 8, 4);

      // Angry Eyes & Eyebrows
      this.ctx.fillStyle = '#000';
      this.ctx.fillRect(3, 5, 3, 4);
      this.ctx.fillRect(10, 5, 3, 4);
      this.ctx.fillStyle = '#fff';
      this.ctx.fillRect(4, 6, 1, 2);
      this.ctx.fillRect(11, 6, 1, 2);

      // Feet animation
      this.ctx.fillStyle = '#000';
      if (enemy.animFrame === 0) {
        this.ctx.fillRect(0, 12, 5, 4);
        this.ctx.fillRect(9, 13, 5, 3);
      } else {
        this.ctx.fillRect(2, 13, 5, 3);
        this.ctx.fillRect(11, 12, 5, 4);
      }
    }

    this.ctx.restore();
  }

  drawKoopa(enemy, camera) {
    const screenX = Math.round(enemy.x - camera.x);
    const screenY = Math.round(enemy.y - camera.y);

    this.ctx.save();
    this.ctx.translate(screenX, screenY);

    if (enemy.facing === -1) {
      this.ctx.translate(16, 0);
      this.ctx.scale(-1, 1);
    }

    if (enemy.inShell) {
      // Shell only
      this.ctx.fillStyle = '#00a800';
      this.ctx.fillRect(2, 3, 12, 11);
      this.ctx.fillStyle = '#ffffff';
      this.ctx.fillRect(4, 5, 8, 7);
      this.ctx.fillStyle = '#000000';
      this.ctx.fillRect(6, 7, 4, 3);
      this.ctx.fillRect(1, 12, 14, 3);
    } else {
      // Full Koopa Walking
      // Head
      this.ctx.fillStyle = '#fcbc38';
      this.ctx.fillRect(7, 1, 8, 7);
      this.ctx.fillStyle = '#000';
      this.ctx.fillRect(12, 3, 2, 3);

      // Green Shell
      this.ctx.fillStyle = '#00a800';
      this.ctx.fillRect(2, 8, 11, 10);
      this.ctx.fillStyle = '#ffffff';
      this.ctx.fillRect(3, 10, 9, 6);

      // Feet
      this.ctx.fillStyle = '#fcbc38';
      if (enemy.animFrame === 0) {
        this.ctx.fillRect(2, 19, 5, 5);
        this.ctx.fillRect(9, 20, 5, 4);
      } else {
        this.ctx.fillRect(1, 20, 5, 4);
        this.ctx.fillRect(8, 19, 5, 5);
      }
    }

    this.ctx.restore();
  }

  drawPowerUp(item, camera) {
    const screenX = Math.round(item.x - camera.x);
    const screenY = Math.round(item.y - camera.y);

    this.ctx.save();
    this.ctx.translate(screenX, screenY);

    if (item.type === 'MUSHROOM') {
      // Cap
      this.ctx.fillStyle = '#f83800';
      this.ctx.fillRect(2, 1, 12, 9);
      this.ctx.fillStyle = '#ffffff';
      this.ctx.fillRect(4, 2, 4, 3);
      this.ctx.fillRect(9, 4, 4, 3);
      this.ctx.fillRect(3, 7, 3, 2);

      // Stem
      this.ctx.fillStyle = '#fce0a8';
      this.ctx.fillRect(4, 10, 8, 6);
      this.ctx.fillStyle = '#000';
      this.ctx.fillRect(5, 11, 2, 2);
      this.ctx.fillRect(9, 11, 2, 2);
    } else if (item.type === 'FIRE_FLOWER') {
      const flash = Math.floor(Date.now() / 80) % 2 === 0;
      this.ctx.fillStyle = flash ? '#f83800' : '#ffa044';
      this.ctx.fillRect(4, 1, 8, 8);
      this.ctx.fillStyle = '#ffffff';
      this.ctx.fillRect(6, 3, 4, 4);
      this.ctx.fillStyle = '#00a800';
      this.ctx.fillRect(7, 9, 2, 7);
      this.ctx.fillRect(3, 11, 10, 2);
    } else if (item.type === 'STAR') {
      const pIdx = Math.floor(Date.now() / 60) % 3;
      const starColors = ['#fcbc38', '#f83800', '#00a800'];
      this.ctx.fillStyle = starColors[pIdx];
      this.ctx.fillRect(6, 1, 4, 14);
      this.ctx.fillRect(1, 5, 14, 6);
      this.ctx.fillStyle = '#000';
      this.ctx.fillRect(6, 6, 1, 3);
      this.ctx.fillRect(9, 6, 1, 3);
    }

    this.ctx.restore();
  }

  drawFireball(fb, camera) {
    const screenX = Math.round(fb.x - camera.x);
    const screenY = Math.round(fb.y - camera.y);

    const colors = ['#f83800', '#fcbc38', '#ffffff'];
    const col = colors[Math.floor(Date.now() / 40) % colors.length];

    this.ctx.fillStyle = col;
    this.ctx.fillRect(screenX, screenY, fb.width, fb.height);
  }

  // --- DRAWING ENVIRONMENT & TILES ---

  drawTile(tileId, tx, ty, camera, bumpOffsetY = 0) {
    const size = CONFIG.TILES.SIZE;
    const x = Math.round(tx * size - camera.x);
    const y = Math.round(ty * size - camera.y + bumpOffsetY);

    const ctx = this.ctx;

    switch (tileId) {
      case CONFIG.TILES.GROUND:
        ctx.fillStyle = CONFIG.COLORS.GROUND_BROWN;
        ctx.fillRect(x, y, size, size);
        ctx.fillStyle = '#fce0a8';
        ctx.fillRect(x, y, size, 2);
        ctx.fillStyle = '#000000';
        ctx.fillRect(x, y + 2, size, 1);
        break;

      case CONFIG.TILES.BRICK:
        ctx.fillStyle = CONFIG.COLORS.BRICK_BROWN;
        ctx.fillRect(x, y, size, size);
        ctx.fillStyle = '#000000';
        ctx.fillRect(x, y + 7, size, 1);
        ctx.fillRect(x + 7, y, 1, 7);
        ctx.fillRect(x + 3, y + 8, 1, 8);
        ctx.fillRect(x + 11, y + 8, 1, 8);
        break;

      case CONFIG.TILES.QUESTION_COIN:
      case CONFIG.TILES.QUESTION_POWERUP: {
        const pulse = Math.floor(Date.now() / 150) % 3;
        ctx.fillStyle = pulse === 0 ? '#fc9838' : pulse === 1 ? '#e45c10' : '#ffa044';
        ctx.fillRect(x, y, size, size);
        ctx.fillStyle = '#000000';
        ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);
        // Draw '?' glyph
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + 5, y + 3, 6, 2);
        ctx.fillRect(x + 9, y + 5, 2, 3);
        ctx.fillRect(x + 6, y + 7, 4, 2);
        ctx.fillRect(x + 6, y + 11, 3, 2);
        break;
      }

      case CONFIG.TILES.USED_BLOCK:
        ctx.fillStyle = '#8b5a2b';
        ctx.fillRect(x, y, size, size);
        ctx.strokeStyle = '#3e1e0a';
        ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);
        break;

      case CONFIG.TILES.HARD_BLOCK:
        ctx.fillStyle = '#808080';
        ctx.fillRect(x, y, size, size);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x, y, size, 2);
        ctx.fillRect(x, y, 2, size);
        ctx.fillStyle = '#333333';
        ctx.fillRect(x, y + size - 2, size, 2);
        ctx.fillRect(x + size - 2, y, 2, size);
        break;

      case CONFIG.TILES.PIPE_TOP_LEFT:
        ctx.fillStyle = '#00a800';
        ctx.fillRect(x, y, size, size);
        ctx.fillStyle = '#a8e4a8';
        ctx.fillRect(x + 1, y, 3, size);
        ctx.fillStyle = '#000';
        ctx.fillRect(x, y, 1, size);
        ctx.fillRect(x, y, size, 2);
        break;

      case CONFIG.TILES.PIPE_TOP_RIGHT:
        ctx.fillStyle = '#00a800';
        ctx.fillRect(x, y, size, size);
        ctx.fillStyle = '#005000';
        ctx.fillRect(x + size - 4, y, 3, size);
        ctx.fillStyle = '#000';
        ctx.fillRect(x + size - 1, y, 1, size);
        ctx.fillRect(x, y, size, 2);
        break;

      case CONFIG.TILES.PIPE_SHAFT_LEFT:
        ctx.fillStyle = '#00a800';
        ctx.fillRect(x + 2, y, size - 2, size);
        ctx.fillStyle = '#a8e4a8';
        ctx.fillRect(x + 3, y, 3, size);
        ctx.fillStyle = '#000';
        ctx.fillRect(x + 2, y, 1, size);
        break;

      case CONFIG.TILES.PIPE_SHAFT_RIGHT:
        ctx.fillStyle = '#00a800';
        ctx.fillRect(x, y, size - 2, size);
        ctx.fillStyle = '#005000';
        ctx.fillRect(x + size - 5, y, 3, size);
        ctx.fillStyle = '#000';
        ctx.fillRect(x + size - 3, y, 1, size);
        break;

      case CONFIG.TILES.FLAG_POLE_TOP:
        ctx.fillStyle = '#00a800';
        ctx.beginPath();
        ctx.arc(x + 8, y + 8, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + 7, y + 10, 2, 6);
        break;

      case CONFIG.TILES.FLAG_POLE:
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + 7, y, 2, size);
        break;

      case CONFIG.TILES.FLAG_BASE:
        ctx.fillStyle = '#00a800';
        ctx.fillRect(x + 2, y + 4, 12, 12);
        break;
    }
  }

  // --- HUD OVERLAY ---
  drawHUD(hudData) {
    this.ctx.save();
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '8px "Press Start 2P", monospace, sans-serif';
    this.ctx.textBaseline = 'top';

    // MARIO & SCORE
    this.ctx.fillText('MARIO', 24, 10);
    this.ctx.fillText(String(hudData.score).padStart(6, '0'), 24, 20);

    // COINS
    this.ctx.fillStyle = '#fcbc38';
    this.ctx.fillRect(96, 20, 6, 8);
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillText(`x${String(hudData.coins).padStart(2, '0')}`, 106, 20);

    // WORLD
    this.ctx.fillText('WORLD', 152, 10);
    this.ctx.fillText(hudData.world, 160, 20);

    // TIME
    this.ctx.fillText('TIME', 208, 10);
    this.ctx.fillText(String(Math.ceil(hudData.time)).padStart(3, '0'), 216, 20);

    this.ctx.restore();
  }
}