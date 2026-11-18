```javascript
/**
 * B2.st Studio - Config Test Runner
 * تست‌های واحد برای env_config.js
 */

const { EnvConfig, ConfigBuilder, RawParser, TypeConverter, SecuritySanitizer } = require('./env_config');

let passed = 0;
let failed = 0;

function assert(condition, testName) {
    if (condition) {
        console.log(`  ✅ ${testName}`);
        passed++;
    } else {
        console.error(`  ❌ ${testName}`);
        failed++;
    }
}

console.log('╔══════════════════════════════════════════╗');
console.log('║  B2.st Studio - Config Tests             ║');
console.log('╚══════════════════════════════════════════╝');
console.log('');

// ── Test Group 1: TypeConverter ──
console.log('📦 TypeConverter:');
assert(TypeConverter.toNumber('42', 0) === 42, 'toNumber: string to number');
assert(TypeConverter.toNumber('abc', 10) === 10, 'toNumber: invalid fallback');
assert(TypeConverter.toNumber('', 5) === 5, 'toNumber: empty fallback');
assert(TypeConverter.toBoolean('true', false) === true, 'toBoolean: "true"');
assert(TypeConverter.toBoolean('false', true) === false, 'toBoolean: "false"');
assert(TypeConverter.toBoolean('1', false) === true, 'toBoolean: "1"');
assert(TypeConverter.toBoolean('', false) === false, 'toBoolean: empty fallback');
assert(TypeConverter.clamp(5, 0, 10) === 5, 'clamp: in range');
assert(TypeConverter.clamp(-5, 0, 10) === 0, 'clamp: below min');
assert(TypeConverter.clamp(15, 0, 10) === 10, 'clamp: above max');
console.log('');

// ── Test Group 2: SecuritySanitizer ──
console.log('🔒 SecuritySanitizer:');
assert(SecuritySanitizer.sanitizeString('<script>alert(1)</script>') === 'scriptalert(1)/script', 'sanitize: XSS tags');
assert(SecuritySanitizer.sanitizePath('../../../etc/passwd') === 'etc/passwd', 'sanitize: path traversal');
assert(SecuritySanitizer.sanitizePath('./assets/sprites') === './assets/sprites', 'sanitize: valid path');
assert(SecuritySanitizer.isValidOrigin('*') === true, 'origin: wildcard');
assert(SecuritySanitizer.isValidOrigin('http://localhost:3000') === true, 'origin: localhost');
console.log('');

// ── Test Group 3: RawParser ──
console.log('📄 RawParser:');
const testEnv = `
# Comment line
NODE_ENV=production
GAME_FPS=30
GAME_DEBUG_MODE=true
ASSETS_BASE_PATH="./assets"
INVALID LINE
`;
const parsed = RawParser.parseEnvString(testEnv);
assert(parsed.NODE_ENV === 'production', 'parse: NODE_ENV');
assert(parsed.GAME_FPS === '30', 'parse: GAME_FPS');
assert(parsed.GAME_DEBUG_MODE === 'true', 'parse: GAME_DEBUG_MODE');
assert(parsed.ASSETS_BASE_PATH === './assets', 'parse: quoted value');
assert(Object.keys(parsed).length === 4, 'parse: correct count');
console.log('');

// ── Test Group 4: ConfigBuilder ──
console.log('🏗️  ConfigBuilder:');
const builder = new ConfigBuilder();
const result = builder.build({
    NODE_ENV: 'development',
    GAME_FPS: '60',
    GAME_GRAVITY: '0.7',
    GAME_DEBUG_MODE: 'true',
    PLAYER_SPEED: '3.5'
});
assert(result.isValid === true, 'build: valid config');
assert(result.config.node.env === 'development', 'build: node.env');
assert(result.config.game.fps === 60, 'build: game.fps number');
assert(result.config.game.gravity === 0.7, 'build: game.gravity float');
assert(result.config.game.debugMode === true, 'build: game.debugMode boolean');
assert(result.config.player.speed === 3.5, 'build: player.speed');
console.log('');

// ── Test Group 5: Clamping ──
console.log('📏 Value Clamping:');
const clampResult = builder.build({
    GAME_FPS: '999',
    APP_PORT: '80',
    GAME_GRAVITY: '-5'
});
assert(clampResult.config.game.fps === 144, 'clamp: FPS max 144');
assert(clampResult.config.app.port === 1024, 'clamp: port min 1024');
assert(clampResult.config.game.gravity === 0.1, 'clamp: gravity min 0.1');
assert(clampResult.warnings.length > 0, 'clamp: warnings generated');
console.log('');

// ── Test Group 6: EnvConfig Singleton ──
console.log('🔧 EnvConfig Singleton:');
EnvConfig._reset();
const config1 = new EnvConfig();
config1.initSync({ GAME_DEBUG_MODE: 'true' });
const config2 = new EnvConfig();
assert(config1 === config2, 'singleton: same instance');
assert(config1.get('game.debugMode') === true, 'singleton: get value');
assert(config1.isDev() === true, 'singleton: isDev default');
assert(config1.isDebug() === true, 'singleton: isDebug');
console.log('');

// ── Test Group 7: toGameConfig ──
console.log('🎮 toGameConfig:');
const gameConfig = config1.toGameConfig();
assert(gameConfig.canvas.width === 768, 'gameConfig: canvas width');
assert(gameConfig.physics.gravity === 0.7, 'gameConfig: gravity');
assert(gameConfig.player.jumpForce === -12, 'gameConfig: jump force');
assert(gameConfig.debug === true, 'gameConfig: debug flag');
assert(typeof gameConfig.assets.base === 'string', 'gameConfig: assets path');
console.log('');

// ── Test Group 8: Invalid Values ──
console.log('🚫 Invalid Values:');
EnvConfig._reset();
const invalidBuilder = new ConfigBuilder();
const invalidResult = invalidBuilder.build({
    NODE_ENV: 'invalid_env',
    APP_VERSION: 'not-semver'
});
assert(invalidResult.errors.length > 0, 'invalid: errors detected');
assert(invalidResult.config.node.env === 'development', 'invalid: fallback to default');
console.log('');

// ── Summary ──
console.log('═══════════════════════════════════════════');
console.log(`  نتیجه: ${passed} موفق | ${failed} ناموفق`);
console.log('═══════════════════════════════════════════');

process.exit(failed > 0 ? 1 : 0);
```