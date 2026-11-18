# Super Mario NES Engine & Automated Test Suite
**Studio:** B2.st  
**Architecture:** 4-Tier Modular Entity-Component-System (Canvas 2D)

---

## 1. Directory Structure

```text
├── config/
│   └── constants.js             # Physics rates, tile definitions, player speeds
├── src/
│   ├── engine/
│   │   ├── Vector2D.js          # 2D Linear Algebra primitive
│   │   ├── AABB.js              # Axis-Aligned Bounding Box collision geometry
│   │   ├── Camera.js            # Forward-locked scrolling camera (NES Mario style)
│   │   ├── InputHandler.js      # Decoupled keyboard state and mock controller
│   │   ├── PhysicsEngine.js     # Swept collision detection & tile resolution
│   │   ├── GameLoop.js          # Fixed-timestep physics update loop
│   │   └── GameEngine.js        # Central game orchestrator
│   ├── entities/
│   │   ├── Entity.js            # Base ECS entity abstraction
│   │   ├── Mario.js             # Player controller, states, animations
│   │   └── Goomba.js            # Patrol AI, stomp vulnerability, squashing
│   └── levels/
│       ├── TileMap.js           # 2D Grid block indexing & tile interaction
│       └── Level1.js            # World 1-1 layout generation
├── tests/
│   ├── testRunner.js            # Zero-dependency async test harness
│   ├── unit.test.js             # Vector, AABB, and TileMap unit tests
│   ├── integration.test.js      # Complete physics, jump, collision & stomp tests
│   └── runAll.js                # Combined test runner script
├── public/
│   ├── index.html               # CRT NES cabinet shell and HUD integration
│   └── styles.css               # Scanline filter and responsive layout
└── docs/
    └── ARCHITECTURE.md          # Architecture and technical documentation
```

---

## 2. Physics & Collision Pipeline

Collision handling is executed using decoupled horizontal and vertical Swept AABB checks:
1. **Horizontal Move (`vx * dt`):** Test left and right bounding edges against `TileMap.isSolid()`. If a solid tile (Pipe, Brick) is intercepted, the entity's position is clamped to the block edge and velocity is zeroed.
2. **Vertical Move (`vy * dt`):** Apply gravity (`+980 px/s²`). If moving downwards and intersecting solid ground, `y` is clamped to the top surface, `vy = 0`, and `isGrounded = true`.
3. **Ceiling Interaction:** If moving upwards and striking question/brick tiles, `vy = 0` and `TileMap.interactTile()` spawns coins and updates block states.
4. **Entity-to-Entity:**
   - **Stomp Detection:** If Mario's bounding box intersects Goomba and Mario's velocity is downward (`vy > 0`), the Goomba squashes, Mario rebounds upward (`MARIO_CONFIG.BOUNCE_FORCE`), and scores are awarded.
   - **Damage:** If Mario collides horizontally or vertically while grounded, damage is sustained and invulnerability frames are activated.

---

## 3. Running Automated Tests

To execute the entire test suite via Node.js without any third-party dependencies:

```bash
# Run all tests (Unit & Integration)
npm test

# Run integration tests specifically
npm run test:integration

# Run unit tests specifically
npm run test:unit
```