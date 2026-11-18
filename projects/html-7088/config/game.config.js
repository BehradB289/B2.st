/**
 * پیکربندی مرکزی متغیرهای کیفیتی، صوتی و گرافیکی موتور بازی
 */
export const GAME_CONFIG = {
  version: '2.4.0-pro',
  title: 'Super Mario B2 Studio Edition',
  canvas: {
    baseWidth: 768,
    baseHeight: 480,
    pixelRatio: 1,
    crispRendering: true
  },
  physics: {
    fixedFps: 60,
    gravity: 0.48,
    maxFallVelocity: 11.5,
    tileSize: 32
  },
  graphics: {
    crtFilterDefault: true,
    scanlineIntensity: 0.25,
    particlesLimit: 120
  },
  audio: {
    synthSampleRate: 44100,
    defaultBgmVolume: 0.3,
    defaultSfxVolume: 0.45
  }
};