/**
 * Smooth Tracking Camera with NES Clamping
 * Studio: B2.st
 */

export class Camera {
    /**
     * @param {number} viewWidth 
     * @param {number} viewHeight 
     */
    constructor(viewWidth, viewHeight) {
        this.x = 0;
        this.y = 0;
        this.viewWidth = viewWidth;
        this.viewHeight = viewHeight;
        this.minX = 0;
        this.maxX = 3200; // Updated by level width
        this.lookAheadDistance = 24;
        this.scrollLag = 0.12; // Smooth camera lerping
    }

    setLevelBounds(maxX) {
        this.maxX = Math.max(this.viewWidth, maxX);
    }

    /**
     * Track target entity with forward offset
     * Classic Mario rule: Camera never scrolls backwards!
     * @param {Entity} target 
     */
    update(target) {
        if (!target) return;

        // Target center with directional lookahead
        const targetX = target.pos.x + target.size.x * 0.5;
        const forwardOffset = target.vel.x > 0 ? this.lookAheadDistance : -this.lookAheadDistance * 0.3;
        const desiredX = (targetX + forwardOffset) - (this.viewWidth * 0.38);

        // Never scroll backward in classic mode
        if (desiredX > this.x) {
            this.x += (desiredX - this.x) * (1.0 - this.scrollLag);
        }

        // Clamp camera to boundaries
        this.x = Math.max(this.minX, Math.min(this.maxX - this.viewWidth, this.x));
        this.y = 0; // Vertical scroll fixed for classic 1-1 layout
    }

    /**
     * Check if a world-space coordinate is currently visible on canvas
     * @param {number} x 
     * @param {number} y 
     * @param {number} width 
     * @param {number} height 
     * @param {number} [padding=32]
     * @returns {boolean}
     */
    isInView(x, y, width, height, padding = 32) {
        return (
            x + width >= this.x - padding &&
            x <= this.x + this.viewWidth + padding &&
            y + height >= this.y - padding &&
            y <= this.y + this.viewHeight + padding
        );
    }

    reset() {
        this.x = 0;
        this.y = 0;
    }
}