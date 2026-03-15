export class Input {
    constructor() {
        this.keys = {};
        this.prevKeys = {};

        // Mouse/Touch states
        this.pointerDown = false;
        this.pointerPressed = false;
        this.pointerX = 0;
        this.pointerY = 0;
        this.blocked = false; // Input block flag

        // AbortControllerで一括リスナー解除を可能にする
        this._abortController = new AbortController();
        const signal = this._abortController.signal;

        window.addEventListener('keydown', (e) => {
            if (this.blocked) return;
            this.keys[e.code] = true;
        }, { signal });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        }, { signal });

        const updatePointerPos = (e) => {
            const canvas = document.getElementById('game-canvas');
            if (!canvas) return;

            const rect = canvas.getBoundingClientRect();
            // Get client coords
            const clientX = (e.touches && e.touches.length > 0) ? e.touches[0].clientX : e.clientX;
            const clientY = (e.touches && e.touches.length > 0) ? e.touches[0].clientY : e.clientY;

            // Map client coords to canvas internal (VIRTUAL) coords
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;

            this.pointerX = (clientX - rect.left) * scaleX;
            this.pointerY = (clientY - rect.top) * scaleY;
        };

        const onDown = (e) => {
            if (this.blocked) return;
            // Also ignore clicks on UI elements explicitly if needed, but blocked flag covers debug modes
            if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;

            updatePointerPos(e);
            this.pointerDown = true;
            this._pointerPressedCurrentFrame = true;
        };
        const onUp = (e) => {
            this.pointerDown = false;
        };

        window.addEventListener('mousedown', onDown, { signal });
        window.addEventListener('touchstart', onDown, { passive: false, signal });
        window.addEventListener('mousemove', updatePointerPos, { signal });
        window.addEventListener('touchmove', updatePointerPos, { passive: false, signal });
        window.addEventListener('mouseup', onUp, { signal });
        window.addEventListener('touchend', onUp, { signal });
    }

    destroy() {
        if (this._abortController) {
            this._abortController.abort();
            this._abortController = null;
        }
    }

    setBlocked(value) {
        this.blocked = value;
        if (value) {
            this.keys = {};
            this.pointerDown = false;
            this.pointerPressed = false;
            this._pointerPressedCurrentFrame = false;
        }
    }

    update() {
        if (this.blocked) {
            // Ensure states are clear
            return;
        }
        this.prevKeys = { ...this.keys };
        this.pointerPressed = this._pointerPressedCurrentFrame;
        this._pointerPressedCurrentFrame = false;
    }

    reset() {
        this.keys = {};
        this.prevKeys = {};
        this.pointerDown = false;
        this.pointerPressed = false;
        this._pointerPressedCurrentFrame = false;
    }

    isDown(code) {
        return !!this.keys[code];
    }

    isPressed(code) {
        return !!this.keys[code] && !this.prevKeys[code];
    }

    isAnyPressed() {
        return this.pointerPressed || Object.keys(this.keys).some(k => this.keys[k] && !this.prevKeys[k]);
    }

    // 特定のキーを除外してキー入力を判定
    isAnyPressedExcept(excludeKeys = []) {
        const keyPressed = Object.keys(this.keys).some(k => {
            if (excludeKeys.includes(k)) return false;
            return this.keys[k] && !this.prevKeys[k];
        });
        return this.pointerPressed || keyPressed;
    }
}
