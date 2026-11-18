/**
 * @file main.js
 * @description Secure Modular Entrypoint. Initializes B2.st Defense and Engine.
 */

"use strict";

import { Guardian } from "./security/Guardian.js";
import { Engine } from "./core/Engine.js";

document.addEventListener("DOMContentLoaded", () => {
    // Initialize Layer 1-10 Security Guardian
    Guardian.init();

    const canvas = document.getElementById("gameCanvas");
    if (!canvas) {
        console.error("[B2.st Bootloader] Target canvas '#gameCanvas' not found in DOM.");
        return;
    }

    try {
        const gameEngine = new Engine(canvas);
        gameEngine.start();
        console.log("[B2.st Bootloader] Mario Engine initialized under strict security baseline.");
    } catch (err) {
        console.error("[B2.st Bootloader] Fatal startup failure:", err);
    }
});