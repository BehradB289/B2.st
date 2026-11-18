# B2.st NES Mario Engine — Architecture & Caching Specification

## 1. High-Level Modular Layers
1. **Core Utilities & Cache (`src/core/`)**:
   - `PerformanceCache`: Fast In-Memory LRU Cache with sub-millisecond lookups, configurable TTL, eviction policies, and memoization helpers.
   - `RateLimiter`: Dual Token-Bucket and Keyed-Window throttling system protecting the physics loop and input handlers against spam and event starvation.
2. **Central Engine (`src/engine/`)**:
   - `GameLoop`: Fixed-timestep physics update (60 Hz) coupled with variable delta interpolation rendering.
   - `Physics`: Discrete AABB collision engine with axis-separation resolution.
   - `Camera`: Smooth horizontal and vertical viewport tracker with boundary clamps.
   - `InputHandler`: Unified keyboard abstraction integrated with rate limiters.
3. **Entities & Levels (`src/entities/`, `src/levels/`)**:
   - Lightweight hybrid ECS/OOP structure.
   - `Mario`, `Goomba`, `TileMap`: Procedural rasterization leveraging `PerformanceCache` to cache offscreen bitmaps and eliminate redundant vector draw calls.
4. **Retro Presentation (`public/`)**:
   - Authentic 8-bit NES CRT scanline simulation, dynamic viewport scaler, and live HUD metrics (FPS, Cache Hit Ratio, Limiter status).
5. **Quality Assurance (`tests/`)**:
   - Automated unit tests covering AABB math, LRU eviction, TTL expiration, and rate-limiting integrity.