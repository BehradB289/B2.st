# B2.st Mario Retro Game Engine - Database Architecture & Security Specification

## 1. Architectural Blueprint
The Mario Game Database Layer is structured according to the **Modular Repository & Adapter Pattern**, strictly decoupled from both the Canvas 2D Game Loop and the Entity-Component-System (ECS).

```
+--------------------------------------------------------------------------+
|                       HTML5 Canvas 2D Game Loop                          |
|   (src/engine/game_loop.js, physics_engine.js, camera_controller.js)     |
+--------------------------------------------------------------------------+
                                     |
                                     v
+--------------------------------------------------------------------------+
|                      ECS Systems & Level Managers                        |
|   (src/entities/mario.js, src/levels/world_manager.js)                  |
+--------------------------------------------------------------------------+
                                     |
                                     v
+--------------------------------------------------------------------------+
|                      Secure Database Layer (Facade)                      |
|                     (src/db/database_layer.js)                           |
+--------------------------------------------------------------------------+
      |                       |                       |             |
      v                       v                       v             v
+-------------+       +---------------+       +--------------+  +----------+
|  Profiles   |       |  SaveStates   |       |  HighScores  |  | Settings |
| Repository  |       |  Repository   |       |  Repository  |  |  Repo    |
+-------------+       +---------------+       +--------------+  +----------+
      |                       |                       |             |
      +-----------------------+-----------------------+-------------+
                                     |
                                     v
                 +---------------------------------------+
                 |       Schema & Sanitizer Engine       |
                 |          (src/db/schema.js)           |
                 +---------------------------------------+
                                     |
                                     v
                 +---------------------------------------+
                 |    Web Crypto SHA-256 Tamper Guard    |
                 +---------------------------------------+
                                     |
                                     v
                 +---------------------------------------+
                 |     Unified Storage Adapter Engine    |
                 |  (IndexedDB / Safe Memory Fallback)   |
                 +---------------------------------------+
```

---

## 2. Security Threat Model & Defense Strategy

### Threat 1: Save State Tampering (Cheat Engine / DevTools IndexedDB Manipulation)
* **Attack Vector**: Players open browser Developer Tools, inspect IndexedDB records, and manually elevate `score: 9999990`, `lives: 99`, or warp coordinates.
* **Mitigation**: Every save state and high score entry is cryptographically sealed with a deterministic SHA-256 HMAC-style signature incorporating the system security salt and canonical serialized properties. When `loadSlot()` is invoked, the database layer calculates the expected signature. Any discrepancy triggers a `SecurityTamperError`, records the event in `audit_log`, and isolates the payload.

### Threat 2: Prototype Pollution Vulnerabilities
* **Attack Vector**: Malicious JSON save imports or server sync payloads containing `__proto__`, `constructor`, or `prototype` keys designed to contaminate the JavaScript runtime object hierarchy.
* **Mitigation**: The `Sanitizer.sanitizeObject()` engine strips dangerous keys recursively, creates prototype-free maps via `Object.create(null)`, and freezes runtime copies before returning to caller logic.

### Threat 3: Cross-Site Scripting (XSS) via Player Names
* **Attack Vector**: Inputting `<script>fetch('/cookie')</script>` or SVG injection in the player profile username field.
* **Mitigation**: `Sanitizer.sanitizeString()` executes HTML entity stripping and ASCII control code purging before `FieldValidator` applies regex pattern verification `/^[a-zA-Z0-9_\s-]+$/`.

---

## 3. Data Dictionary & Schemas

### Object Store: `profiles`
* `id` (`string`, Primary Key): Unique profile identifier (`profile_UUID`).
* `username` (`string`, Unique Index): 2-20 characters alphanumeric player name.
* `avatar` (`string`): Enum (`mario`, `luigi`, `toad`, `peach`).
* `createdAt` (`number`): Epoch millisecond timestamp.
* `updatedAt` (`number`): Epoch millisecond timestamp.

### Object Store: `save_states`
* `id` (`string`, Primary Key): Composite key `save_{profileId}_{slot}`.
* `profileId` (`string`, Index): Foreign reference to `profiles.id`.
* `slot` (`number`): Integer save slot (1 to 5).
* `world` (`number`): World number (1 through 8).
* `level` (`number`): Level number (1 through 4).
* `score` (`number`): Current player score (0 to 9,999,990).
* `coins` (`number`): Coin count (0 to 99).
* `lives` (`number`): Current lives remaining (1 to 99).
* `powerState` (`string`): Mario state enum (`small`, `super`, `fire`, `star`).
* `checkpointX` (`number`): AABB horizontal sub-pixel coordinate.
* `checkpointY` (`number`): AABB vertical sub-pixel coordinate.
* `timeRemaining` (`number`): Game timer count (0 to 999).
* `checksum` (`string`): SHA-256 cryptographic proof signature.

### Object Store: `high_scores`
* `id` (`string`, Primary Key): Score identifier.
* `profileId` (`string`, Index): Player profile ID.
* `playerName` (`string`): Display name at time of score attainment.
* `score` (`number`, Index): Verified game score.
* `world` (`number`): Final world attained.
* `level` (`number`): Final level attained.
* `timeRemaining` (`number`): Remaining level time.
* `achievedAt` (`number`): Epoch timestamp.
* `signature` (`string`): SHA-256 cryptographic score verification signature.

### Object Store: `settings`
* `id` (`string`, Primary Key): Constant `'system_settings'`.
* `masterVolume`, `bgmVolume`, `sfxVolume` (`number`): 0 to 100 percentage range.
* `crtFilter`, `scanlines`, `curvature` (`boolean`): Retro NES visual shaders.
* `fpsLimit` (`number`): 30 or 60 Hz display refresh cap.
* `keybindings` (`object`): Action-to-KeyCode mapping table.

---

## 4. Automatic Migration Lifecycle

The migration system executes automatically upon `SecureDatabase.initialize()`:
1. `getAppliedVersions()` queries `migrations_history`.
2. Compares against the registered list of migration classes.
3. Automatically applies pending versions sequentially (`up()`).
4. Logs execution performance duration and status (`SUCCESS`).
5. In the event of a migration step failure, executes `down()` rollback logic and logs error diagnostics.

* **Version 1 (`InitialSchema_V1`)**: Provisions base stores, default settings, and guest Mario profile.
* **Version 2 (`SaveStatesAndCheckpoints_V2`)**: Configures slot allocation, checkpoint coordinates, and power state tracking.
* **Version 3 (`SecurityAndAudit_V3`)**: Enforces cryptographic signatures across all legacy saves, introduces security audit logging, and retro CRT configurations.

---

## 5. Game Loop Integration Example

```javascript
import { SecureDatabase } from './src/db/database_layer.js';

// Initialization in Game Startup
const db = new SecureDatabase();
await db.initialize();

// Checkpoint Save Trigger (e.g., reaching mid-level flagpole or pipe)
async function onCheckpointReached(marioEntity, worldState) {
  try {
    await db.saves.saveSlot(activeProfile.id, 1, {
      world: worldState.world,
      level: worldState.level,
      score: marioEntity.score,
      coins: marioEntity.coins,
      lives: marioEntity.lives,
      powerState: marioEntity.powerState,
      checkpointX: marioEntity.transform.x,
      checkpointY: marioEntity.transform.y,
      timeRemaining: worldState.timer
    });
    console.log('Checkpoint secured with SHA-256 integrity signature.');
  } catch (err) {
    console.error('Failed to save checkpoint:', err.message);
  }
}

// Checkpoint Load Trigger
async function onContinueGame(profileId, slot) {
  try {
    const save = await db.saves.loadSlot(profileId, slot);
    marioEntity.spawnAt(save.checkpointX, save.checkpointY, save.powerState);
    gameState.restore(save.world, save.level, save.score, save.coins, save.lives);
  } catch (err) {
    if (err.name === 'SecurityTamperError') {
      alert('Save data rejected: File was altered outside the game engine!');
    }
  }
}
```