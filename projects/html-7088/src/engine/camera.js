/**
 * Smooth Tracking Camera with NES-Style Rightward Locking
 * Studio: B2.st
 */
import { GAME_CONFIG } from '../../config/game_config.js';

export class Camera {
    constructor(viewportWidth, viewportHeight) {
        this.x = 0;
        this.y = 0;
        this.width = viewportWidth;
        this.height = viewportHeight;
        this.minX = 0;
        this.maxX = 0;
    }

    /**
     * Bounds camera to level constraints
     * @param {number} levelPixelWidth
     */
    setBounds(levelPixelWidth) {
        this.maxX = Math.max(0, levelPixelWidth - this.width);
    }

    /**
     * Focuses on target entity, only moving forward (Classic Mario style)
     * @param {Entity} target
     */
    update(target) {
        if (!target) return;

        // Mario stays at roughly 40% of the screen width
        const desiredX = target.x - this.width * 0.4;

        if (desiredX > this.x) {
            this.x = desiredX;
        }

        // Clamp to level bounds
        if (this.x < this.minX) this.x = this.minX;
        if (this.x > this.maxX) this.x = this.maxX;

        // Standard 1-1 does not scroll vertically
        this.y = 0;
    }

    /**
     * Determines if an entity or tile is inside the camera's active frustum
     * @param {number} x
     * @param {number} y
     * @param {number} w
     * @param {number} h
     * @param {number} [margin=32]
     * @returns {boolean}
     */
    isVisible(x, y, w, h, margin = 32) {
        return (
            x + w >= this.x - margin &&
            x <= this.x + this.width + margin &&
            y + h >= this.y - margin &&
            y <= this.y + this.height + margin
        );
    }

    reset() {
        this.x = 0;
        this.y = 0;
    }
}