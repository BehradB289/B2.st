/**
 * Keyboard and Virtual Gamepad Input Processor
 * Studio: B2.st
 */
export class InputHandler {
    constructor(rateLimiter = null) {
        this.rateLimiter = rateLimiter;
        this.keys = {
            left: false,
            right: false,
            jump: false,
            sprint: false,
            down: false
        };

        this.justPressed = {
            jump: false
        };

        this._setupListeners();
    }

    _setupListeners() {
        window.addEventListener('keydown', (e) => {
            this._handleKey(e.code, true);
        });

        window.addEventListener('keyup', (e) => {
            this._handleKey(e.code, false);
        });
    }

    _handleKey(code, isDown) {
        switch (code) {
            case 'ArrowLeft':
            case 'KeyA':
                this.keys.left = isDown;
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.keys.right = isDown;
                break;
            case 'ArrowUp':
            case 'KeyW':
            case 'Space':
                if (isDown && !this.keys.jump) {
                    if (!this.rateLimiter || this.rateLimiter.allow('input_jump')) {
                        this.justPressed.jump = true;
                    }
                }
                this.keys.jump = isDown;
                break;
            case 'ArrowDown':
            case 'KeyS':
                this.keys.down = isDown;
                break;
            case 'ShiftLeft':
            case 'KeyX':
                this.keys.sprint = isDown;
                break;
        }
    }

    /**
     * Programmatic trigger for touch/mobile gamepad
     */
    setVirtualButton(buttonName, state) {
        if (buttonName === 'jump') {
            if (state && !this.keys.jump) {
                if (!this.rateLimiter || this.rateLimiter.allow('input_jump')) {
                    this.justPressed.jump = true;
                }
            }
            this.keys.jump = state;
            return;
        }
        if (this.keys.hasOwnProperty(buttonName)) {
            this.keys[buttonName] = state;
        }
    }

    /**
     * Clears one-shot triggers at end of tick
     */
    postUpdate() {
        this.justPressed.jump = false;
    }
}