
export class VFXManager {
    constructor(game) {
        this.game = game;
        this.shakeTime = 0;
        this.shakeIntensity = 0;
        this.chromaticAberration = 0;
    }

    /**
     * Update effects state
     * @param {number} dt Delta time in seconds
     */
    update(dt) {
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
            const speed = Math.abs(this.game.player.vx);
            this.speedLineIntensity = Math.max(0, (speed - 800) / 1000);
        } else {
            this.speedLineIntensity = 0;
        }
    }

    /**
     * Apply camera shake transformation
     * Should be called before drawing the world
     * @param {CanvasRenderingContext2D} ctx 
     */
    applyShake(ctx) {
        if (this.shakeTime > 0) {
            const dx = (Math.random() - 0.5) * this.shakeIntensity;
            const dy = (Math.random() - 0.5) * this.shakeIntensity;
            ctx.translate(dx, dy);
        }
    }

    /**
     * Trigger a screen shake
     * @param {number} intensity Amount of pixels to shake
     * @param {number} duration Duration in seconds
     */
    triggerShake(intensity, duration) {
        this.shakeIntensity = intensity;
        this.shakeTime = duration;
    }

    // Alias for compatibility
    shake(intensity, duration) {
        this.triggerShake(intensity, duration);
    }

    /**
     * Trigger a chromatic aberration effect (RGB shift)
     * @param {number} intensity 
     */
    triggerChromaticAberration(intensity) {
        this.chromaticAberration = intensity;
    }

    /**
     * Draw post-processing effects
     * Should be called after drawing everything else
     * @param {CanvasRenderingContext2D} ctx 
     */
    drawPostProcess(ctx) {
        // 1. Chromatic Aberration
        if (this.chromaticAberration > 0.1) {
            ctx.save();
            ctx.globalCompositeOperation = 'overlay';
            ctx.fillStyle = `rgba(255, 0, 0, ${this.chromaticAberration * 0.3})`;
            ctx.fillRect(0, 0, this.game.width, this.game.height);
            ctx.globalCompositeOperation = 'color-dodge';
            ctx.fillStyle = `rgba(0, 255, 255, ${this.chromaticAberration * 0.3})`;
            ctx.fillRect(2, 2, this.game.width, this.game.height);
            ctx.restore();
        }

        // 2. Speed Lines
        if (this.speedLineIntensity > 0.1) {
            this.drawSpeedLines(ctx);
        }

        // 3. Vignette (Always present for premium look)
        this.drawVignette(ctx);
    }

    drawSpeedLines(ctx) {
        const count = 20;
        ctx.save();
        ctx.strokeStyle = `rgba(255, 255, 255, ${this.speedLineIntensity * 0.4})`;
        ctx.lineWidth = 2;
        for (let i = 0; i < count; i++) {
            const y = Math.random() * this.game.height;
            const length = Math.random() * 200 + 100;
            const x = Math.random() * this.game.width;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + length, y);
            ctx.stroke();
        }
        ctx.restore();
    }

    drawVignette(ctx) {
        if (!this.vignetteGradient || this.lastWidth !== this.game.width || this.lastHeight !== this.game.height) {
            this.lastWidth = this.game.width;
            this.lastHeight = this.game.height;
            this.vignetteGradient = ctx.createRadialGradient(
                this.game.width / 2, this.game.height / 2, this.game.width * 0.2,
                this.game.width / 2, this.game.height / 2, this.game.width * 0.8
            );
            this.vignetteGradient.addColorStop(0, 'rgba(0,0,0,0)');
            this.vignetteGradient.addColorStop(1, 'rgba(0,0,0,0.3)');
        }

        ctx.fillStyle = this.vignetteGradient;
        ctx.fillRect(0, 0, this.game.width, this.game.height);
    }
}
