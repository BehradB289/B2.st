/**
 * Base Game Entity (ECS-Lite hybrid model)
 * Studio: B2.st
 */

import { Vector2D } from '../engine/Vector2D.js';
import { GameConfig } from '../../config/game.config.js';

export class Entity {
    constructor(x = 0, y = 0, width = 16, height = 16) {
        this.pos = new Vector2D(x, y);
        this.vel = new Vector2D(0, 0);
        this.size = new Vector2D(width, height);
        
        this.gravity = GameConfig.physics.gravity;
        this.maxFallSpeed = GameConfig.physics.terminalVelocity;
        this.hasGravity = true;
        this.isGrounded = false;
        this.isAlive = true;
        this.isStatic = false;
        this.facing = 1; // 1 = Right, -1 = Left

        this.animTimer = 0;
        this.currentFrame = 0;
        this.tag = 'entity';
    }

    update(dt) {
        this.animTimer += dt;
    }

    render(ctx, camera) {
        // Base placeholder render if not overridden
        const screenX = Math.floor(this.pos.x - camera.x);
        const screenY = Math.floor(this.pos.y - camera.y);
        ctx.fillStyle = '#ff00ff';
        ctx.fillRect(screenX, screenY, this.size.x, this.size.y);
    }

    onGroundLand(tile) {}
    onCeilingHit(tile) {}
    onWallCollide(direction, tile) {}
    onEntityCollision(other, side) {}
}