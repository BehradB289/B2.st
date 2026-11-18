import { describe, it, expect, beforeEach } from 'vitest';
import { PhysicsEngine, PHYSICS_CONSTANTS } from '../src/engine/PhysicsEngine.js';
import { Mario, MARIO_CONSTANTS } from '../src/entities/Mario.js';

describe('PhysicsEngine & Mario Kinematics', () => {
  let physics;
  let mario;

  beforeEach(() => {
    physics = new PhysicsEngine({
      gravity: 980,
      terminalVelocity: 600,
      friction: 0.88
    });
    mario = new Mario(100, 100);
  });

  describe('Gravity and Free Fall', () => {
    it('accelerates a falling entity downward by g * dt', () => {
      const dt = 1 / 60;
      mario.isGrounded = false;
      mario.vel.set(0, 0);

      physics.integrate(mario, dt);

      const expectedVy = 980 * dt;
      expect(mario.vel.y).toBeCloseTo(expectedVy, 4);
      expect(mario.pos.y).toBeGreaterThan(100);
    });

    it('clamps downward velocity to terminal velocity', () => {
      mario.isGrounded = false;
      mario.vel.set(0, 590);

      // Multiple integration steps
      for (let i = 0; i < 20; i++) {
        physics.integrate(mario, 1 / 60);
      }

      expect(mario.vel.y).toBe(600);
    });
  });

  describe('Jump Ascent, Apex, and Descent Dynamics', () => {
    it('sets upward impulse on jump execution when grounded', () => {
      mario.isGrounded = true;
      const jumped = mario.jump();

      expect(jumped).toBe(true);
      expect(mario.isGrounded).toBe(false);
      expect(mario.vel.y).toBe(MARIO_CONSTANTS.JUMP_IMPULSE);
      expect(mario.state).toBe('jumping');
    });

    it('rejects jump request when airborne', () => {
      mario.isGrounded = false;
      mario.vel.y = -200;

      const jumped = mario.jump();

      expect(jumped).toBe(false);
      expect(mario.vel.y).toBe(-200);
    });

    it('verifies ascent, apex inflection point, and descent phase accurately', () => {
      mario.isGrounded = true;
      mario.jump();

      const initialY = mario.pos.y;
      const dt = 1 / 60;
      let reachedApex = false;
      let apexTime = 0;
      let apexY = initialY;

      // Track simulation over 1 full second
      for (let step = 0; step < 60; step++) {
        const currentTime = step * dt;
        physics.integrate(mario, dt);
        mario.updateState();

        if (!reachedApex && mario.vel.y >= 0) {
          reachedApex = true;
          apexTime = currentTime;
          apexY = mario.pos.y;

          // At apex, vertical velocity has crossed zero
          expect(mario.vel.y).toBeGreaterThanOrEqual(0);
          expect(mario.vel.y).toBeLessThan(980 * dt);
          // Mario has risen substantially above starting point (screen y decreases going up)
          expect(apexY).toBeLessThan(initialY);
        }

        if (reachedApex && currentTime > apexTime + 0.1) {
          // In descent phase, velocity must be positive and state falling
          expect(mario.vel.y).toBeGreaterThan(0);
          expect(mario.pos.y).toBeGreaterThan(apexY);
          expect(mario.state).toBe('falling');
        }
      }

      expect(reachedApex).toBe(true);
      // Apex theoretical time: t = |v0| / g = 420 / 980 ≈ 0.428s
      expect(apexTime).toBeCloseTo(0.428, 1);
    });
  });

  describe('Friction and Horizontal Damping', () => {
    it('decelerates horizontal velocity on ground', () => {
      mario.isGrounded = true;
      mario.vel.set(100, 0);

      physics.integrate(mario, 1 / 60);

      expect(mario.vel.x).toBeLessThan(100);
      expect(mario.vel.x).toBeGreaterThan(0);
    });
  });
});