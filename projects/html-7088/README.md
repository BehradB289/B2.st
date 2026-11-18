# بازی ماریو در قالب فایل html

> 🚀 Autonomously Architected, Designed, Coded & Verified by **B2.st 6-Agent Studio v11.1**

## 📐 Architecture
معماری ماژولار مبتنی بر شی‌گرایی و Entity-Component-System سبک بر پایه HTML5 Canvas 2D و جاوااسکریپت ES6+. سیستم به چهار لایه مستقل تفکیک شده است: ۱) موتور مرکزی شامل چرخه بازی (Game Loop)، دوربین متحرک و موتور فیزیک AABB در دایرکتوری src/engine/، ۲) مدیریت هویت‌ها و انیمیشن کاراکترها و تایل‌مپ در src/entities/ و src/levels/، ۳) رابط کاربری رترو با استایل کلاسیک NES، HUD کامل و شل وب بهینه‌سازی‌شده برای رزولوشن پویا در public/index.html، و ۴) پایپ‌لاین تست‌های واحد برای فیزیک، گرانش و برخوردها در tests/.

## 🗂️ Folder Structure
```text
projects/html-7088/
├── config/game.config.js
├── config/game_config.js
├── docs/ARCHITECTURE.md
├── docs/CHANGELOG.md
├── docs/DEBUG_SYNTAX.md
├── docs/TEST_SPEC.md
├── docs/architecture.md
├── index.html
├── package.json
├── public/index.html
├── public/style.css
├── public/styles.css
├── src/core/error_shield.js
├── src/core/memory_guard.js
├── src/core/performance_cache.js
├── src/engine/AABB.js
├── src/engine/Audio.js
├── src/engine/AudioEngine.js
├── src/engine/AudioSystem.js
├── src/engine/Camera.js
├── src/engine/EventEmitter.js
├── src/engine/Game.js
├── src/engine/GameLoop.js
├── src/engine/Input.js
├── src/engine/InputHandler.js
├── src/engine/Physics.js
├── src/engine/PhysicsEngine.js
├── src/engine/Renderer.js
├── src/engine/Vector2D.js
├── src/entities/Coin.js
├── src/entities/Enemies.js
├── src/entities/Entity.js
├── src/entities/Goomba.js
├── src/entities/Mario.js
├── src/entities/Particle.js
├── src/entities/Particles.js
├── src/entities/PowerUps.js
├── src/game.js
├── src/levels/Level.js
├── src/levels/Level1.js
├── src/levels/SpriteSheet.js
├── src/levels/TileMap.js
├── src/levels/World1_1.js
├── src/levels/world1_1.js
├── src/main.js
├── src/security/owasp_guard.js
├── src/vitest.config.js
├── src/world/Level.js
├── tests/collision.test.js
├── tests/physics.test.js
├── tests/physics_cache.test.js
```
