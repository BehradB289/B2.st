# بازی ماریو در قالب فایل html

> 🚀 Autonomously Architected, Designed, Coded & Verified by **B2.st 6-Agent Studio v11.1**

## 📐 Architecture
معماری ماژولار مبتنی بر شی‌گرایی و Entity-Component-System سبک بر پایه HTML5 Canvas 2D و جاوااسکریپت ES6+. سیستم به چهار لایه مستقل تفکیک شده است: ۱) موتور مرکزی شامل چرخه بازی (Game Loop)، دوربین متحرک و موتور فیزیک AABB در دایرکتوری src/engine/، ۲) مدیریت هویت‌ها و انیمیشن کاراکترها و تایل‌مپ در src/entities/ و src/levels/، ۳) رابط کاربری رترو با استایل کلاسیک NES، HUD کامل و شل وب بهینه‌سازی‌شده برای رزولوشن پویا در public/index.html، و ۴) پایپ‌لاین تست‌های واحد برای فیزیک، گرانش و برخوردها در tests/.

## 🗂️ Folder Structure
```text
projects/html-7088/
├── .env.example
├── Dockerfile
├── config/constants.js
├── config/database.config.js
├── config/game.config.js
├── config/game_config.js
├── config/nginx.conf
├── docker-compose.yml
├── docs/ARCHITECTURE.md
├── docs/DATABASE_SCHEMA.md
├── docs/DEBUG_SYNTAX.md
├── docs/DEPLOYMENT.md
├── docs/TEST_SPEC.md
├── docs/architecture.md
├── docs/openapi.json
├── index.html
├── package.json
├── public/game.js
├── public/index.html
├── public/style.css
├── public/styles.css
├── public/swagger.html
├── scripts/deploy.sh
├── scripts/rollback.sh
├── src/.dockerignore
├── src/core/error_shield.js
├── src/core/memory_guard.js
├── src/core/performance_cache.js
├── src/db/database_layer.js
├── src/db/migrations/migration_runner.js
├── src/db/migrations/migrations.js
├── src/db/models/base_model.js
├── src/db/models/high_score_model.js
├── src/db/models/save_state_model.js
├── src/db/models/settings_model.js
├── src/db/security/crypto_vault.js
├── src/db/transaction_lock.js
├── src/docker-compose.dev.yml
├── src/engine/AABB.js
├── src/engine/Audio.js
├── src/engine/AudioEngine.js
├── src/engine/AudioSystem.js
├── src/engine/Camera.js
├── src/engine/EventEmitter.js
├── src/engine/Game.js
├── src/engine/GameEngine.js
├── src/engine/GameLoop.js
├── src/engine/Input.js
├── src/engine/InputHandler.js
├── src/engine/Physics.js
├── src/engine/PhysicsEngine.js
├── src/engine/Vector2D.js
├── src/engine/camera.js
├── src/engine/game_loop.js
├── src/engine/physics.js
├── src/entities/Coin.js
├── src/entities/Entity.js
├── src/entities/Goomba.js
├── src/entities/Mario.js
├── src/entities/Particle.js
├── src/entities/goomba.js
├── src/entities/mario.js
├── src/game.js
├── src/levels/Level1.js
├── src/levels/SpriteSheet.js
├── src/levels/TileMap.js
├── src/levels/World1_1.js
├── src/levels/level_1_1.js
├── src/main.js
├── src/module_83.js
├── src/security/owasp_guard.js
├── src/services/network_retry.js
├── src/utils/validator.js
├── src/vitest.config.js
├── src/world/Level.js
├── tests/collision.test.js
├── tests/database_layer.test.js
├── tests/integration.test.js
├── tests/physics.test.js
├── tests/physics_cache.test.js
├── tests/runAll.js
├── tests/testRunner.js
├── tests/unit.test.js
```
