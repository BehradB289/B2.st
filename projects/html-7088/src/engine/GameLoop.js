/**
 * Fixed Timestep Game Loop with Accumulator & Telemetry Hook
 * Studio: B2.st
 * Guarantees deterministic physics calculations independent of screen refresh rates.
 */

export class GameLoop {
    constructor(updateFn, renderFn, targetFps = 60) {
        this.updateFn = updateFn;
        this.renderFn = renderFn;
        this.fixedDelta = 1 / targetFps;
        this.maxAccumulator = 0.25; // Prevents spiral of death on lag spikes

        this.lastTime = 0;
        this.accumulator = 0;
        this.isRunning = false;
        this.animationFrameId = null;

        // FPS & Performance Profiling
        this.fps = 60;
        this.frameCount = 0;
        this.fpsTimer = 0;
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.lastTime = performance.now();
        this.accumulator = 0;
        this.animationFrameId = requestAnimationFrame(this._tick.bind(this));
    }

    stop() {
        this.isRunning = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
    }

    _tick(currentTime) {
        if (!this.isRunning) return;

        let frameDelta = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        // Cap excessive frame time (e.g. background tab)
        if (frameDelta > this.maxAccumulator) {
            frameDelta = this.maxAccumulator;
        }

        this.accumulator += frameDelta;

        // Run discrete fixed updates
        while (this.accumulator >= this.fixedDelta) {
            this.updateFn(this.fixedDelta);
            this.accumulator -= this.fixedDelta;
        }

        // Render current state with alpha interpolation factor
        const alpha = this.accumulator / this.fixedDelta;
        this.renderFn(alpha);

        // Calculate actual FPS
        this.frameCount++;
        this.fpsTimer += frameDelta;
        if (this.fpsTimer >= 1.0) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.fpsTimer = 0;
        }

        this.animationFrameId = requestAnimationFrame(this._tick.bind(this));
    }
}