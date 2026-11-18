# بازی ماریو در قالب فایل html

> 🚀 Autonomously Architected, Designed, Coded & Verified by **B2.st 6-Agent Studio v11.1**

## 📐 Architecture
معماری ماژولار مبتنی بر شی‌گرایی و Entity-Component-System سبک بر پایه HTML5 Canvas 2D و جاوااسکریپت ES6+. سیستم به چهار لایه مستقل تفکیک شده است: ۱) موتور مرکزی شامل چرخه بازی (Game Loop)، دوربین متحرک و موتور فیزیک AABB در دایرکتوری src/engine/، ۲) مدیریت هویت‌ها و انیمیشن کاراکترها و تایل‌مپ در src/entities/ و src/levels/، ۳) رابط کاربری رترو با استایل کلاسیک NES، HUD کامل و شل وب بهینه‌سازی‌شده برای رزولوشن پویا در public/index.html، و ۴) پایپ‌لاین تست‌های واحد برای فیزیک، گرانش و برخوردها در tests/.

## 🗂️ Folder Structure
```text
projects/html-7088/
├── docs/ARCHITECTURE.md
├── docs/TEST_SPEC.md
├── docs/architecture.md
├── package.json
├── public/index.html
├── public/style.css
├── src/engine/AABB.js
├── src/engine/Audio.js
├── src/engine/Camera.js
├── src/engine/EventEmitter.js
├── src/engine/GameLoop.js
├── src/engine/Input.js
├── src/engine/InputHandler.js
├── src/engine/Physics.js
├── src/engine/PhysicsEngine.js
├── src/engine/Vector2D.js
├── src/entities/Coin.js
├── src/entities/Entity.js
├── src/entities/Goomba.js
├── src/entities/Mario.js
├── src/entities/Particle.js
├── src/game.js
├── src/levels/Level1.js
├── src/levels/TileMap.js
├── src/levels/World1_1.js
├── src/main.js
├── src/vitest.config.js
├── tests/collision.test.js
├── tests/physics.test.js
```
