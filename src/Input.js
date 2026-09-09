export class Input {
    constructor() {
        this.keys = {};
        this.prevKeys = {};
        // Edge-triggered key presses captured by DOM events and consumed once
        // per game frame. The previous implementation copied keys -> prevKeys
        // at frame start, making isPressed() false before gameplay could read it.
        this._pressedKeysPending = new Set();
        this._pressedKeysFrame = new Set();

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
            if (!this.keys[e.code]) {
                this._pressedKeysPending.add(e.code);
            }
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
            this.prevKeys = {};
            this.pointerDown = false;
            this.pointerPressed = false;
            this._pointerPressedCurrentFrame = false;
            this._pressedKeysPending.clear();
            this._pressedKeysFrame.clear();
        }
    }

    update() {
        if (this.blocked) {
            this._pressedKeysFrame.clear();
            return;
        }

        // Publish DOM edge events for this frame, then clear the pending set.
        this._pressedKeysFrame = new Set(this._pressedKeysPending);
        this._pressedKeysPending.clear();

        this.pointerPressed = !!this._pointerPressedCurrentFrame;
        this._pointerPressedCurrentFrame = false;
        this.prevKeys = { ...this.keys };
    }

    reset() {
        this.keys = {};
        this.prevKeys = {};
        this.pointerDown = false;
        this.pointerPressed = false;
        this._pointerPressedCurrentFrame = false;
        this._pressedKeysPending.clear();
        this._pressedKeysFrame.clear();
    }

    isDown(code) {
        return !!this.keys[code];
    }

    isPressed(code) {
        return this._pressedKeysFrame.has(code);
    }

    isAnyPressed() {
        return this.pointerPressed || this._pressedKeysFrame.size > 0;
    }

    // 特定のキーを除外してキー入力を判定
    isAnyPressedExcept(excludeKeys = []) {
        const keyPressed = [...this._pressedKeysFrame].some(k => !excludeKeys.includes(k));
        return this.pointerPressed || keyPressed;
    }
}
