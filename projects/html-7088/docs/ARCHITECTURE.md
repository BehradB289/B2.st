# Super Mario NES Engine & In-Memory Performance Architecture
### Studio B2.st Full-Stack Technical Documentation

## 1. Architectural Layers

The architecture adheres to clean separation of concerns, divided into 4 decoupled subsystems:

```
[public/index.html] (NES Retro Shell & Dynamic Canvas)
          │
          ▼
[src/engine/game.js] (Coordinator & State Machine)
 ├── [src/engine/game_loop.js] (Fixed Timestep Physics + Raf Render)
 ├── [src/engine/physics.js] (AABB Collision & Map Boundary Resolution)
 ├── [src/engine/camera.js] (Deadzone & Smooth Progressive Scrolling)
 ├── [src/engine/input.js] (Multi-Input & Key Mapping)
 └── [src/engine/audio.js] (Zero-asset 8-Bit Web Audio Synthesizer)
          │
          ├───────────────────────────────────────────┐
          ▼                                           ▼
[src/entities/ & src/levels/]             [src/core/performance_cache.js]
 ├── Mario, Goomba, Mushroom, Particle     ├── PerformanceCache (TTL + LRU)
 ├── Procedural SpriteGenerator           └── RateLimiter (Token & Sliding Bucket)
 └── TileMap & Scenery Rendering
```

---

## 2. In-Memory Cache & Rate Limiting (`src/core/performance_cache.js`)

### PerformanceCache Features:
1. **LRU Eviction**: Maintains an internal hash map with constant amortized `O(1)` reads, updates and evictions. When capacity is exceeded, Least Recently Used keys are removed.
2. **TTL (Time-To-Live)**: Per-item or global expiry timestamps with auto-pruning.
3. **Telemetry Tracking**: Records live `hits`, `misses`, `evictions`, and calculates dynamic `hitRate%` for display on the HUD.
4. **Offscreen Canvas Texture Memoization**: Procedural NES pixel drawings are drawn once and cached, eliminating repetitive pixel drawing operations and sustaining 60 FPS on low-power devices.

### RateLimiter Implementation:
- **Token Bucket Algorithm**: Controls audio output frequency and prevent Web Audio distortion.
- **Sliding Window Key Tracker**: Restricts rapid spamming of keyboard jump and movement inputs.
- **Throttling Utility**: Smooths high-frequency window and resize recalculations.

---

## 3. Physics & Collision Handling

- **Fixed Timestep**: Delta time is clamped and processed with a fixed `1/60s` tick rate to prevent collision tunneling.
- **Separation of Axes**:
  - Horizontal movement is checked and resolved against tile solid boundaries.
  - Vertical movement integrates gravitational acceleration and detects ceiling hits (triggering question blocks) and floor landings.
- **Entity vs. Entity**: Bounding box overlap triggers state transitions (e.g., Mario landing on Goomba triggers squash rebound; lateral collision triggers shrink or death).

---

## 4. Execution & Testing

- Run the standalone unit tests:
  ```bash
  node tests/physics_test.js
  ```
- Launch the game:
  Open `public/index.html` in any modern web browser or serve via any static web server (e.g. `npx serve .`).