# 🕹️ B2.st Mario 2D Canvas Engine - Architecture & Caching Specification

## 1. Executive Summary
This document specifies the technical design for the high-performance Super Mario 2D Canvas engine built by studio B2.st. The system combines an Entity-Component-System (ECS-Lite) paradigm with an intelligent in-memory multi-tiered LRU/TTL caching accelerator and a Token Bucket Rate Limiter.

---

## 2. Layer Topology

```
┌────────────────────────────────────────────────────────┐
│                   Arcade Shell & HUD                   │
│              (public/index.html & CSS CRT)             │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│                  Master Game Controller                │
│                      (src/main.js)                     │
├───────────────────────────┬────────────────────────────┤
│   src/engine/GameLoop     │   src/core/performance_    │
│   src/engine/Physics      │   cache.js                 │
│   src/engine/Camera       │   - In-Memory LRU/TTL      │
│   src/engine/AudioEngine  │   - Token Bucket Limiter   │
└─────────────┬─────────────┴─────────────┬──────────────┘
              │                           │
┌─────────────▼─────────────┐ ┌───────────▼──────────────┐
│       src/entities/       │ │       src/levels/        │
│   - Mario (State Machine) │ │   - TileMap (Chunking)   │
│   - Goomba (Patrol/Squish)│ │   - Level1 (SMB 1-1)     │
│   - Koopa (Shell Physic)  │ │   - Offscreen Bitmaps    │
└───────────────────────────┘ └──────────────────────────┘
```

---

## 3. Intelligent In-Memory Cache (`src/core/performance_cache.js`)

### 3.1 LRU (Least Recently Used) Eviction
- Employs JavaScript `Map` insertion-order guarantees to achieve genuine **$O(1)$** eviction without overhead of doubly linked lists.
- Accessing an entry via `.get(key)` re-inserts the entry at the tail of the key list.
- When `size >= maxEntries`, `map.keys().next().value` yields the oldest entry in $O(1)$ time.

### 3.2 Time-To-Live (TTL) Pruning
- Supports dual eviction:
  1. **Lazy Eviction:** Checked during `.get(key)`. Expired entries are deleted immediately.
  2. **Active Batch Sweep:** Invoked via `.purgeExpired()` periodically by the main loop to clean orphaned spatial indices.

### 3.3 Offscreen Pre-rendering Accelerator
- Procedural pixel-art sprites (Mario frames, Goomba, Pipes, Bricks) are rendered once to detached HTML5 `OffscreenCanvas` surfaces and cached in `globalSpriteCache`.
- Replaces thousands of repetitive Canvas2D path drawing commands per second with single `ctx.drawImage` operations.

---

## 4. Rate Limiter Mechanics

### 4.1 Token Bucket Algorithm
- Controls high-frequency continuous actions:
  $$\text{tokens} = \min(\text{maxTokens}, \text{tokens} + \Delta t \times \text{refillRate})$$
- Applied to jump commands to eliminate ghost key toggling and physics glitch exploits.

### 4.2 Sliding Window Throttle
- Applied to synthesized Web Audio triggers (`playJump`, `playBump`, `playCoin`) to prevent audio buffer overruns and clipping.

---

## 5. Physics & AABB Solver
- Two-pass axis-independent resolution:
  1. **X-Axis:** Update position $\rightarrow$ Query nearby tiles in spatial index $\rightarrow$ Clamp position $\rightarrow$ Zero horizontal velocity.
  2. **Y-Axis:** Update position $\rightarrow$ Query nearby tiles $\rightarrow$ Detect ground or ceiling $\rightarrow$ Trigger event callbacks.
- Guarantees zero tunneling through blocks and zero corner snags.