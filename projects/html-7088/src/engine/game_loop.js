/**
 * Fixed Timestep Game Loop with Accumulator & FPS Telemetry
 * Studio: B2.st
 */
import { GAME_CONFIG } from '../../config/game_config.js';

export class GameLoop {
    /**
     * @param {Function} updateFn (dt) => void
     * @param {Function} renderFn (interpolation) => void
     */
    constructor(updateFn, renderFn) {
        this.updateFn = updateFn;
        this.renderFn = renderFn;

        this.fixedDelta = GAME_CONFIG.CANVAS.FIXED_DELTA;
        this.maxAccumulatedTime = 0.25; // Prevents spiral of death on tab unfocus

        this.lastTime = 0;
        this.accumulator = 0;
        this.rafId = null;
        this.isRunning = false;

        // Performance telemetry
        this.fps = 60;
        this.framesThisSecond = 0;
        this.lastFpsUpdate = 0;
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.lastTime = performance.now();
        this.lastFpsUpdate = this.lastTime;
        this.framesThisSecond = 0;

        const loop = (currentTime) => {
            if (!this.isRunning) return;

            const frameTime = (currentTime - this.lastTime) / 1000;
            this.lastTime = currentTime;

            // Clamp maximum time step
            this.accumulator += Math.min(frameTime, this.maxAccumulatedTime);

            // Execute fixed updates
            while (this.accumulator >= this.fixedDelta) {
                this.updateFn(this.fixedDelta);
                this.accumulator -= this.fixedDelta;
            }

            // Render with fractional alpha for interpolation
            const alpha = this.accumulator / this.fixedDelta;
            this.renderFn(alpha);

            // FPS Calculation
            this.framesThisSecond++;
            if (currentTime - this.lastFpsUpdate >= 1000) {
                this.fps = this.framesThisSecond;
                this.framesThisSecond = 0;
                this.lastFpsUpdate = currentTime;
            }

            this.rafId = requestAnimationFrame(loop);
        };

        this.rafId = requestAnimationFrame(loop);
    }

    stop() {
        this.isRunning = false;
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
    }
}