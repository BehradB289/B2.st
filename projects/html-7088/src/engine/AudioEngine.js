/**
 * Procedural 8-bit NES Synthesizer Audio Engine
 * Studio: B2.st
 * Zero external audio files required! Synthesized in real-time via Web Audio API.
 * Rate-limited to prevent buffer clipping and audio distortion.
 */

import { globalActionLimiter } from '../core/performance_cache.js';
import { GameConfig } from '../../config/game.config.js';

export class AudioEngine {
    constructor() {
        this.ctx = null;
        this.masterVolume = null;
        this.enabled = true;
    }

    _initContext() {
        if (!this.ctx) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) {
                this.ctx = new AudioContextClass();
                this.masterVolume = this.ctx.createGain();
                this.masterVolume.gain.setValueAtTime(0.25, this.ctx.currentTime);
                this.masterVolume.connect(this.ctx.destination);
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    /**
     * Synthesize Classic NES Jump Sound (Frequency ramp square wave)
     */
    playJump() {
        if (!this.enabled) return;
        if (!globalActionLimiter.throttle('sfx_jump', GameConfig.rateLimits.soundTriggerInterval)) return;
        this._initContext();
        if (!this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';

        const t = this.ctx.currentTime;
        osc.frequency.setValueAtTime(150, t);
        osc.frequency.exponentialRampToValueAtTime(580, t + 0.14);

        gain.gain.setValueAtTime(0.3, t);
        gain.gain.linearRampToValueAtTime(0.01, t + 0.14);

        osc.connect(gain);
        gain.connect(this.masterVolume);

        osc.start(t);
        osc.stop(t + 0.15);
    }

    /**
     * Synthesize Stomp Sound
     */
    playStomp() {
        if (!this.enabled) return;
        if (!globalActionLimiter.throttle('sfx_stomp', GameConfig.rateLimits.soundTriggerInterval)) return;
        this._initContext();
        if (!this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';

        const t = this.ctx.currentTime;
        osc.frequency.setValueAtTime(160, t);
        osc.frequency.exponentialRampToValueAtTime(40, t + 0.12);

        gain.gain.setValueAtTime(0.4, t);
        gain.gain.linearRampToValueAtTime(0.01, t + 0.12);

        osc.connect(gain);
        gain.connect(this.masterVolume);

        osc.start(t);
        osc.stop(t + 0.13);
    }

    /**
     * Synthesize Coin Pickup Sound (Two-tone arpeggio)
     */
    playCoin() {
        if (!this.enabled) return;
        if (!globalActionLimiter.throttle('sfx_coin', 60)) return;
        this._initContext();
        if (!this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';

        const t = this.ctx.currentTime;
        osc.frequency.setValueAtTime(987.77, t); // B5
        osc.frequency.setValueAtTime(1318.51, t + 0.08); // E6

        gain.gain.setValueAtTime(0.25, t);
        gain.gain.linearRampToValueAtTime(0.25, t + 0.28);
        gain.gain.linearRampToValueAtTime(0.001, t + 0.35);

        osc.connect(gain);
        gain.connect(this.masterVolume);

        osc.start(t);
        osc.stop(t + 0.36);
    }

    /**
     * Synthesize Bump Sound (Ceiling/Block hit)
     */
    playBump() {
        if (!this.enabled) return;
        if (!globalActionLimiter.throttle('sfx_bump', 80)) return;
        this._initContext();
        if (!this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';

        const t = this.ctx.currentTime;
        osc.frequency.setValueAtTime(110, t);
        osc.frequency.linearRampToValueAtTime(55, t + 0.08);

        gain.gain.setValueAtTime(0.4, t);
        gain.gain.linearRampToValueAtTime(0.01, t + 0.08);

        osc.connect(gain);
        gain.connect(this.masterVolume);

        osc.start(t);
        osc.stop(t + 0.09);
    }

    /**
     * Synthesize Mario Die Sound (Descending chromatic scale)
     */
    playDie() {
        if (!this.enabled) return;
        this._initContext();
        if (!this.ctx) return;

        const t = this.ctx.currentTime;
        const freqs = [500, 470, 440, 415, 392, 370, 349, 300, 240, 180];
        freqs.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';

            const start = t + (idx * 0.05);
            osc.frequency.setValueAtTime(freq, start);
            gain.gain.setValueAtTime(0.3, start);
            gain.gain.linearRampToValueAtTime(0.001, start + 0.048);

            osc.connect(gain);
            gain.connect(this.masterVolume);

            osc.start(start);
            osc.stop(start + 0.05);
        });
    }
}

export const globalAudio = new AudioEngine();