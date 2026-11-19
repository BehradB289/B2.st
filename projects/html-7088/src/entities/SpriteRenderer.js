import { GameConfig } from '../../config/game.config.js';
import { TILES } from '../levels/TileMap.js';

/**
 * Studio B2.st - Standalone NES Procedural Pixel-Art Renderer
 * Draws genuine 8-bit sprites without external image asset dependencies.
 */
export class SpriteRenderer {
  static drawTile(ctx, tileId, screenX, screenY, animTimer = 0) {
    const s = GameConfig.WORLD.TILE_SIZE;

    switch (tileId) {
      case TILES.GROUND: {
        ctx.fillStyle = GameConfig.PALETTE.GROUND_BROWN;
        ctx.fillRect(screenX, screenY, s, s);
        ctx.fillStyle = GameConfig.PALETTE.GROUND_ORANGE;
        ctx.fillRect(screenX, screenY, s, 2);
        ctx.fillRect(screenX + 2, screenY + 4, 4, 3);
        ctx.fillRect(screenX + 9, screenY + 8, 4, 3);
        break;
      }
      case TILES.BRICK: {
        ctx.fillStyle = GameConfig.PALETTE.BRICK_BROWN;
        ctx.fillRect(screenX, screenY, s, s);
        ctx.fillStyle = '#000000';
        ctx.fillRect(screenX, screenY + 7, s, 1);
        ctx.fillRect(screenX + 7, screenY, 1, 7);
        ctx.fillRect(screenX + 3, screenY + 8, 1, 8);
        ctx.fillRect(screenX + 11, screenY + 8, 1, 8);
        break;
      }
      case TILES.QUESTION_COIN:
      case TILES.QUESTION_MUSHROOM: {
        const frame = Math.floor(animTimer * 4) % 4;
        const color = frame === 3 ? '#b8860b' : GameConfig.PALETTE.COIN_GOLD;
        ctx.fillStyle = color;
        ctx.fillRect(screenX, screenY, s, s);
        ctx.fillStyle = '#000000';
        ctx.strokeRect(screenX + 0.5, screenY + 0.5, s - 1, s - 1);
        // Draw question mark '?'
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(screenX + 5, screenY + 3, 6, 2);
        ctx.fillRect(screenX + 9, screenY + 5, 2, 3);
        ctx.fillRect(screenX + 6, screenY + 8, 3, 2);
        ctx.fillRect(screenX + 6, screenY + 11, 2, 2);
        break;
      }
      case TILES.EMPTY_BLOCK: {
        ctx.fillStyle = '#8b6914';
        ctx.fillRect(screenX, screenY, s, s);
        ctx.strokeStyle = '#3a2703';
        ctx.strokeRect(screenX + 0.5, screenY + 0.5, s - 1, s - 1);
        ctx.fillStyle = '#3a2703';
        ctx.fillRect(screenX + 2, screenY + 2, 2, 2);
        ctx.fillRect(screenX + 12, screenY + 2, 2, 2);
        ctx.fillRect(screenX + 2, screenY + 12, 2, 2);
        ctx.fillRect(screenX + 12, screenY + 12, 2, 2);
        break;
      }
      case TILES.PIPE_TL:
      case TILES.PIPE_TR:
      case TILES.PIPE_BL:
      case TILES.PIPE_BR: {
        const isTop = tileId === TILES.PIPE_TL || tileId === TILES.PIPE_TR;
        const isLeft = tileId === TILES.PIPE_TL || tileId === TILES.PIPE_BL;
        ctx.fillStyle = isLeft ? GameConfig.PALETTE.PIPE_LIGHT_GREEN : GameConfig.PALETTE.PIPE_DARK_GREEN;
        ctx.fillRect(screenX, screenY, s, s);
        ctx.fillStyle = '#000000';
        if (isTop) {
          ctx.fillRect(screenX, screenY, s, 2);
        }
        if (isLeft) {
          ctx.fillRect(screenX, screenY, 2, s);
        } else {
          ctx.fillRect(screenX + s - 2, screenY, 2, s);
        }
        break;
      }
      case TILES.FLAGPOLE: {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(screenX + 7, screenY, 2, s);
        break;
      }
      case TILES.FLAGPOLE_TOP: {
        ctx.fillStyle = '#00e800';
        ctx.beginPath();
        ctx.arc(screenX + 8, screenY + 8, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(screenX + 7, screenY + 8, 2, 8);
        break;
      }
      case TILES.CASTLE: {
        ctx.fillStyle = '#808080';
        ctx.fillRect(screenX, screenY, s, s);
        ctx.fillStyle = '#000000';
        ctx.fillRect(screenX, screenY + 7, s, 1);
        ctx.fillRect(screenX + 8, screenY, 1, 7);
        break;
      }
    }
  }

  static drawMario(ctx, screenX, screenY, mario) {
    ctx.save();
    const isSuper = mario.isSuper;
    const height = isSuper ? 32 : 16;
    const width = 16;

    if (mario.isFacingLeft) {
      ctx.translate(screenX + width, screenY);
      ctx.scale(-1, 1);
    } else {
      ctx.translate(screenX, screenY);
    }

    if (mario.invulnerableTimer > 0) {
      // Blinking effect
      if (Math.floor(mario.invulnerableTimer * 20) % 2 === 0) {
        ctx.restore();
        return;
      }
    }

    const red = GameConfig.PALETTE.MARIO_RED;
    const blue = GameConfig.PALETTE.MARIO_OVERALL_BLUE;
    const peach = GameConfig.PALETTE.GROUND_ORANGE;
    const brown = '#6b4423';

    if (!isSuper) {
      // Small Mario
      ctx.fillStyle = red; // Cap
      ctx.fillRect(3, 1, 7, 2);
      ctx.fillRect(2, 3, 10, 2);

      ctx.fillStyle = peach; // Face
      ctx.fillRect(2, 5, 8, 3);
      ctx.fillStyle = brown; // Hair & Mustache
      ctx.fillRect(2, 5, 3, 2);
      ctx.fillRect(6, 6, 3, 1);

      ctx.fillStyle = red; // Shirt
      ctx.fillRect(2, 8, 10, 4);

      ctx.fillStyle = blue; // Overalls
      ctx.fillRect(4, 10, 6, 4);

      ctx.fillStyle = brown; // Shoes
      if (mario.grounded && Math.abs(mario.velocity.x) > 5) {
        const step = Math.floor(mario.animTimer * 12) % 2;
        if (step === 0) {
          ctx.fillRect(1, 14, 5, 2);
          ctx.fillRect(9, 13, 5, 2);
        } else {
          ctx.fillRect(2, 13, 5, 2);
          ctx.fillRect(10, 14, 5, 2);
        }
      } else {
        ctx.fillRect(2, 14, 4, 2);
        ctx.fillRect(9, 14, 4, 2);
      }
    } else {
      // Super Mario (32px high)
      ctx.fillStyle = red; // Hat
      ctx.fillRect(3, 1, 9, 3);
      ctx.fillRect(2, 4, 12, 3);

      ctx.fillStyle = peach; // Face
      ctx.fillRect(3, 7, 10, 5);
      ctx.fillStyle = brown; // Mustache
      ctx.fillRect(7, 10, 5, 2);

      ctx.fillStyle = red; // Shirt
      ctx.fillRect(2, 12, 12, 7);

      ctx.fillStyle = blue; // Overalls
      ctx.fillRect(3, 17, 10, 10);

      ctx.fillStyle = brown; // Shoes
      ctx.fillRect(2, 28, 5, 4);
      ctx.fillRect(9, 28, 5, 4);
    }

    ctx.restore();
  }

  static drawGoomba(ctx, screenX, screenY, goomba) {
    if (goomba.isSquished) {
      // Squished state
      ctx.fillStyle = '#8b4513';
      ctx.fillRect(screenX + 1, screenY + 9, 14, 7);
      ctx.fillStyle = '#000000';
      ctx.fillRect(screenX + 3, screenY + 11, 2, 2);
      ctx.fillRect(screenX + 10, screenY + 11, 2, 2);
      return;
    }

    // Walking body
    ctx.fillStyle = '#8b4513'; // Head
    ctx.beginPath();
    ctx.arc(screenX + 8, screenY + 6, 7, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(screenX + 1, screenY + 6, 14, 5);

    // Face / Eyes
    ctx.fillStyle = '#fce4c8';
    ctx.fillRect(screenX + 3, screenY + 6, 3, 4);
    ctx.fillRect(screenX + 10, screenY + 6, 3, 4);
    ctx.fillStyle = '#000000';
    ctx.fillRect(screenX + 4, screenY + 7, 2, 2);
    ctx.fillRect(screenX + 10, screenY + 7, 2, 2);

    // Feet animation
    ctx.fillStyle = '#000000';
    const step = Math.floor(goomba.animTimer * 6) % 2;
    if (step === 0) {
      ctx.fillRect(screenX, screenY + 12, 5, 4);
      ctx.fillRect(screenX + 9, screenY + 13, 5, 3);
    } else {
      ctx.fillRect(screenX + 2, screenY + 13, 5, 3);
      ctx.fillRect(screenX + 11, screenY + 12, 5, 4);
    }
  }

  static drawKoopa(ctx, screenX, screenY, koopa) {
    if (koopa.isShell) {
      ctx.fillStyle = '#00a800';
      ctx.beginPath();
      ctx.arc(screenX + 8, screenY + 8, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fce4c8';
      ctx.fillRect(screenX + 3, screenY + 7, 10, 3);
      return;
    }

    // Koopa walking
    ctx.fillStyle = '#00e800';
    ctx.fillRect(screenX + 4, screenY + 2, 7, 6); // Head
    ctx.fillStyle = '#000000';
    ctx.fillRect(screenX + 5, screenY + 4, 2, 2); // Eye

    ctx.fillStyle = '#00a800'; // Green Shell
    ctx.beginPath();
    ctx.arc(screenX + 8, screenY + 14, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fc9838'; // Feet
    ctx.fillRect(screenX + 2, screenY + 20, 5, 4);
    ctx.fillRect(screenX + 9, screenY + 20, 5, 4);
  }

  static drawSuperMushroom(ctx, screenX, screenY) {
    ctx.fillStyle = '#d82800'; // Cap
    ctx.beginPath();
    ctx.arc(screenX + 8, screenY + 7, 7, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(screenX + 1, screenY + 7, 14, 3);

    // White dots
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(screenX + 6, screenY + 2, 4, 3);
    ctx.fillRect(screenX + 2, screenY + 5, 3, 3);
    ctx.fillRect(screenX + 11, screenY + 5, 3, 3);

    // Stem
    ctx.fillStyle = '#fce4c8';
    ctx.fillRect(screenX + 4, screenY + 10, 8, 6);
  }

  static drawCoin(ctx, screenX, screenY, timer = 0) {
    const scale = Math.abs(Math.sin(timer * 8));
    const width = Math.max(2, Math.floor(10 * scale));
    const offsetX = Math.floor((16 - width) * 0.5);

    ctx.fillStyle = GameConfig.PALETTE.COIN_GOLD;
    ctx.fillRect(screenX + offsetX, screenY + 2, width, 12);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(screenX + offsetX + 1, screenY + 3, Math.max(1, width - 2), 2);
  }
}