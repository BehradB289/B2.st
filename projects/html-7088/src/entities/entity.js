/**
 * Base Game Entity Class (Lightweight ECS representation)
 * Studio: B2.st
 */
export class Entity {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;

        // Kinematics
        this.vx = 0;
        this.vy = 0;

        // State Flags
        this.isDynamic = true;
        this.onGround = false;
        this.isDead = false;
        this.markedForRemoval = false;
        this.facing = 1; // 1 = Right, -1 = Left
    }

    update(dt) {
        // Implemented by subclasses
    }

    render(ctx, camera) {
        // Implemented by subclasses
    }

    onCollideSide(side) {
        // Hook for wall bounce or halt
    }

    onCollideTop(tileX, tileY) {
        // Hook for ceiling impact
    }

    onCollideBottom() {
        // Hook for landing
    }

    kill(reason = 'default') {
        this.isDead = true;
    }
}