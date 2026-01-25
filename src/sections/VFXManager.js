import * as PIXI from 'pixi.js';

export class VFXManager {
    constructor(game) {
        this.game = game;
        this.pixi = game.pixi;
        this.shakeTime = 0;
        this.shakeIntensity = 0;
        this.chromaticAberration = 0;
        this.speedLineIntensity = 0;

        // Visual Elements
        this.container = null;
        this.vignette = null;
        this.aberrationOverlay = null;
        this.speedLines = null;
        this.isReady = false;
    }

    init() {
        if (!this.pixi || !this.pixi.isReady) return;

        // Use 'foreground' layer for VFX (above entities, below UI)
        this.container = new PIXI.Container();
        this.pixi.layers.foreground.addChild(this.container);

        // 1. Vignette (Dynamic Graphics)
        this.vignette = new PIXI.Graphics();
        this.container.addChild(this.vignette);
        this.updateVignette();

        // 2. Chromatic Aberration / Flash Overlay
        this.aberrationOverlay = new PIXI.Graphics();
        this.aberrationOverlay.rect(0, 0, this.game.width, this.game.height).fill({ color: 0xffffff, alpha: 0 });
        this.aberrationOverlay.visible = false;
        this.container.addChild(this.aberrationOverlay);

        // 3. Speed Lines Container
        this.speedLines = new PIXI.Graphics();
        this.container.addChild(this.speedLines);

        this.isReady = true;
    }

    updateVignette() {
        if (!this.vignette) return;
        this.vignette.clear();

        // Pixi v8 gradient fill via texture or simple implementation
        // Creating a true radial gradient in Graphics is tricky in Pixi v8 without Texture.
        // We will approximate with a simple dark border overlay since Pixi Graphics Gradient is messy.
        // OR construct a canvas gradient texture once.
        const canvas = document.createElement('canvas');
        canvas.width = this.game.width;
        canvas.height = this.game.height;
        const ctx = canvas.getContext('2d');
        const grad = ctx.createRadialGradient(
            this.game.width / 2, this.game.height / 2, this.game.width * 0.4,
            this.game.width / 2, this.game.height / 2, this.game.width * 0.8
        );
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(1, 'rgba(0,0,0,0.4)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, this.game.width, this.game.height);

        const texture = PIXI.Texture.from(canvas);
        this.vignette.texture = texture; // Convert Graphics to Sprite? NO.
        // Let's swap Graphics for Sprite for vignette.
        if (this.vignetteData) {
            this.vignetteData.texture = texture;
        } else {
            // Replace graphics with sprite
            const idx = this.container.getChildIndex(this.vignette);
            this.container.removeChild(this.vignette);
            this.vignette = new PIXI.Sprite(texture);
            this.container.addChildAt(this.vignette, idx);
            this.vignetteData = this.vignette;
        }
    }

    /**
     * Update effects state and rendering
     * @param {number} dt Delta time in seconds
     */
    update(dt) {
        if (!this.isReady && this.pixi && this.pixi.isReady) {
            this.init();
        }

        // --- Logic Updates ---
        if (this.shakeTime > 0) {
            this.shakeTime -= dt;
            if (this.shakeTime <= 0) {
                this.shakeIntensity = 0;
            }
        }
        if (this.chromaticAberration > 0) {
            this.chromaticAberration = Math.max(0, this.chromaticAberration - dt * 2);
        }

        // Speed Lines intensity based on player speed
        if (this.game.player) {
            const speed = Math.abs(this.game.player.vx || 0);
            this.speedLineIntensity = Math.max(0, (speed - 800) / 1000);
        } else {
            this.speedLineIntensity = 0;
        }

        // --- Rendering Updates (Pixi) ---
        if (this.isReady) {
            this.applyShake();
            this.updateOverlays();
        }
    }

    applyShake() {
        // Shake the World layer
        // Assumes TileRenderer has already set the base position (-camera.x)
        const shakeTarget = this.pixi.layers.world;

        if (this.shakeTime > 0) {
            const dx = (Math.random() - 0.5) * this.shakeIntensity;
            const dy = (Math.random() - 0.5) * this.shakeIntensity;

            shakeTarget.x += dx;
            shakeTarget.y += dy;
        }
    }

    updateOverlays() {
        // 1. Aberration / Flash
        if (this.chromaticAberration > 0.05) {
            this.aberrationOverlay.visible = true;
            // Simple Red Flash
            const alpha = this.chromaticAberration * 0.3;
            // Re-drawing rect every frame is cheap in simple Graphics
            this.aberrationOverlay.clear();
            this.aberrationOverlay.rect(0, 0, this.game.width, this.game.height)
                .fill({ color: 0xff0000, alpha: alpha });
        } else {
            this.aberrationOverlay.visible = false;
        }

        // 2. Speed Lines
        this.speedLines.clear();
        if (this.speedLineIntensity > 0.1) {
            const count = 10;
            const alpha = Math.min(0.5, this.speedLineIntensity * 0.4);

            for (let i = 0; i < count; i++) {
                const y = Math.random() * this.game.height;
                const len = Math.random() * 200 + 100;
                const x = Math.random() * this.game.width;

                this.speedLines.moveTo(x, y);
                this.speedLines.lineTo(x + len, y);
                this.speedLines.stroke({ width: 2, color: 0xffffff, alpha: alpha });
            }
        }
    }

    // Keep legacy methods for compatibility
    triggerShake(intensity, duration) {
        this.shakeIntensity = intensity;
        this.shakeTime = duration;
    }

    shake(intensity, duration) {
        this.triggerShake(intensity, duration);
    }

    triggerChromaticAberration(intensity) {
        this.chromaticAberration = intensity;
    }

    // Legacy method called by Game.js - Now handled in update()
    applyShakeLegacy(ctx) { }
    drawPostProcess(ctx) { }
}
