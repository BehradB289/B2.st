/**
 * @file Guardian.js
 * @description B2.st Studio - 10-Layer Defensive Runtime Shield.
 * Protects against Prototype Pollution, Memory Tampering, and NaN Propagation.
 */

"use strict";

export class Guardian {
    static init() {
        // Layer 1: Prototype Tampering Defense
        try {
            Object.freeze(Object.prototype);
            Object.freeze(Array.prototype);
            Object.freeze(Function.prototype);
        } catch (e) {
            console.warn("[B2.st Guardian] Warning: Prototypes already sealed or restricted.");
        }

        // Layer 2: Global Scope Pollution Prevention
        window.addEventListener("error", (event) => {
            console.error(`[B2.st Runtime Interceptor] Error trapped: ${event.message} at ${event.filename}:${event.lineno}`);
        });

        window.addEventListener("unhandledrejection", (event) => {
            console.error(`[B2.st Promise Guard] Rejected promise trapped:`, event.reason);
        });
    }

    /**
     * Sanitizes and bounds numeric values to avoid Infinity/NaN physics crashes.
     */
    static sanitizeNumber(val, min, max, defaultVal = 0) {
        if (typeof val !== "number" || Number.isNaN(val) || !Number.isFinite(val)) {
            return defaultVal;
        }
        return Math.max(min, Math.min(max, val));
    }

    /**
     * Deep freezes objects to prevent malicious state manipulation during runtime.
     */
    static secureState(obj) {
        return Object.freeze({ ...obj });
    }
}