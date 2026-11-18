/**
 * Web Audio API - 8-Bit Chiptune Synthesizer
 * No external sound assets required; zero latency, retro NES waveforms.
 */

export class AudioManager {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.bgmPlaying = false;
    this.bgmInterval = null;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      this.ctx = new AudioContextClass();
      this.initialized = true;
    }
  }

  ensureContext() {
    if (!this.initialized) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted && this.bgmPlaying) {
      this.stopBGM();
    } else if (!this.muted && !this.bgmPlaying) {
      this.startBGM();
    }
    return this.muted;
  }

  playTone(freq, type, duration, startVol = 0.2, endVol = 0.001) {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(startVol, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(Math.max(endVol, 0.0001), this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      // Audio context safeguard
    }
  }

  playJump(isSuper = false) {
    if (this.muted || !this.ctx) return;
    this.ensureContext();
    const startTime = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    const startFreq = isSuper ? 180 : 150;
    const endFreq = isSuper ? 560 : 420;

    osc.frequency.setValueAtTime(startFreq, startTime);
    osc.frequency.exponentialRampToValueAtTime(endFreq, startTime + 0.18);

    gain.gain.setValueAtTime(0.18, startTime);
    gain.gain.linearRampToValueAtTime(0.01, startTime + 0.18);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + 0.18);
  }

  playCoin() {
    if (this.muted || !this.ctx) return;
    this.ensureContext();
    const t = this.ctx.currentTime;
    this.playTone(987.77, 'sine', 0.08, 0.22, 0.1); // B5
    setTimeout(() => {
      this.playTone(1318.51, 'sine', 0.25, 0.22, 0.001); // E6
    }, 70);
  }

  playStomp() {
    if (this.muted || !this.ctx) return;
    this.ensureContext();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.12);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.linearRampToValueAtTime(0.01, t + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.12);
  }

  playKick() {
    this.playTone(80, 'square', 0.1, 0.35, 0.01);
  }

  playPowerUpAppears() {
    if (this.muted || !this.ctx) return;
    const notes = [330, 392, 659, 523, 587, 784];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 'triangle', 0.08, 0.15), i * 50);
    });
  }

  playPowerUp() {
    if (this.muted || !this.ctx) return;
    const notes = [330, 392, 659, 523, 587, 784, 880, 1046];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 'square', 0.08, 0.18), i * 40);
    });
  }

  playPowerDown() {
    if (this.muted || !this.ctx) return;
    const notes = [784, 659, 523, 392, 330, 220];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 'sawtooth', 0.08, 0.15), i * 50);
    });
  }

  playFireball() {
    this.playTone(800, 'triangle', 0.06, 0.15);
    setTimeout(() => this.playTone(300, 'sawtooth', 0.06, 0.1), 30);
  }

  playBrickBump() {
    this.playTone(110, 'square', 0.07, 0.25);
  }

  playBrickBreak() {
    if (this.muted || !this.ctx) return;
    this.playTone(90, 'sawtooth', 0.12, 0.3);
    this.playTone(180, 'square', 0.08, 0.2);
  }

  playFlagpole() {
    if (this.muted || !this.ctx) return;
    const fanfare = [
      { f: 523, d: 0.1 }, { f: 659, d: 0.1 }, { f: 784, d: 0.1 },
      { f: 1046, d: 0.2 }, { f: 784, d: 0.1 }, { f: 1046, d: 0.4 }
    ];
    let delay = 0;
    fanfare.forEach((n) => {
      setTimeout(() => this.playTone(n.f, 'triangle', n.d, 0.25), delay);
      delay += n.d * 1000 + 40;
    });
  }

  playDie() {
    if (this.muted || !this.ctx) return;
    this.stopBGM();
    const deathNotes = [500, 400, 300, 200, 150];
    deathNotes.forEach((f, i) => {
      setTimeout(() => this.playTone(f, 'square', 0.15, 0.3), i * 120);
    });
  }

  startBGM() {
    if (this.muted || this.bgmPlaying || !this.ctx) return;
    this.bgmPlaying = true;

    // Classic NES Overworld Motifs (simplified chiptune sequencer)
    const melody = [
      { f: 659.25, d: 0.12 }, { f: 659.25, d: 0.12 }, { f: 0, d: 0.12 }, { f: 659.25, d: 0.12 },
      { f: 0, d: 0.12 }, { f: 523.25, d: 0.12 }, { f: 659.25, d: 0.12 }, { f: 0, d: 0.12 },
      { f: 783.99, d: 0.24 }, { f: 0, d: 0.24 }, { f: 392.00, d: 0.24 }, { f: 0, d: 0.24 },

      { f: 523.25, d: 0.18 }, { f: 0, d: 0.12 }, { f: 392.00, d: 0.18 }, { f: 0, d: 0.12 },
      { f: 329.63, d: 0.18 }, { f: 0, d: 0.12 }, { f: 440.00, d: 0.14 }, { f: 493.88, d: 0.14 },
      { f: 466.16, d: 0.12 }, { f: 440.00, d: 0.18 }, { f: 392.00, d: 0.16 }
    ];

    let step = 0;
    const playStep = () => {
      if (!this.bgmPlaying || this.muted) return;
      const note = melody[step];
      if (note.f > 0) {
        this.playTone(note.f * 0.75, 'square', note.d, 0.08, 0.001);
      }
      step = (step + 1) % melody.length;
      this.bgmInterval = setTimeout(playStep, (note.d + 0.03) * 1000);
    };

    playStep();
  }

  stopBGM() {
    this.bgmPlaying = false;
    if (this.bgmInterval) {
      clearTimeout(this.bgmInterval);
      this.bgmInterval = null;
    }
  }
}

export const sound = new AudioManager();