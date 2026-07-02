export class TipsManager {
    constructor(game) {
        this.game = game;
        this.activeTip = null;
        this.closeDelay = 0;
        this.wasPaused = false;
        this.backdropAlpha = 0;
        this.seenThisRun = {
            jump: false,
            glide: false
        };
    }

    resetRuntime() {
        this.activeTip = null;
        this.closeDelay = 0;
        this.backdropAlpha = 0;
        this.wasPaused = false;
        this.seenThisRun.jump = false;
        this.seenThisRun.glide = false;
    }

    update(dt) {
        if (this.activeTip) {
            this.game.isPaused = true;
            this.backdropAlpha = Math.min(1, this.backdropAlpha + dt * 5);
            this.closeDelay = Math.max(0, this.closeDelay - dt);

            if (this.closeDelay <= 0 && this.game.input.isAnyPressed()) {
                this.dismiss();
            }
            return;
        }

        if (!this.shouldWatchGameplay()) return;

        if (!this.hasSeen('jump') && this.isJumpPressed()) {
            this.show('jump');
            return;
        }

        if (this.hasSeen('jump') && !this.hasSeen('glide') && this.shouldShowGlideTip()) {
            this.show('glide');
        }
    }

    shouldWatchGameplay() {
        return this.game.stage === 1 &&
            this.game.state === 'PLAYING' &&
            !this.game.gameWon &&
            !this.game.dialogueManager?.active &&
            this.game.player;
    }

    isJumpPressed() {
        return this.game.input.isPressed('Space') || this.game.input.pointerPressed;
    }

    shouldShowGlideTip() {
        const player = this.game.player;
        if (!player || player.grounded || player.jumpCount < 1) return false;
        return this.game.input.isDown('Space') || this.game.input.pointerDown;
    }

    show(id) {
        this.activeTip = id;
        this.closeDelay = 0.45;
        this.backdropAlpha = 0;
        this.wasPaused = this.game.isPaused;
        this.game.isPaused = true;
        this.game.input.reset();
    }

    dismiss() {
        if (!this.activeTip) return;

        const dismissedTip = this.activeTip;
        this.markSeen(dismissedTip);
        this.activeTip = null;
        this.closeDelay = 0;
        this.backdropAlpha = 0;
        this.game.input.reset();

        if (dismissedTip === 'jump' && !this.hasSeen('glide')) {
            const originalPaused = this.wasPaused;
            this.show('glide');
            this.wasPaused = originalPaused;
            return;
        }

        this.game.isPaused = this.wasPaused;
    }

    hasSeen(id) {
        return !!this.seenThisRun[id];
    }

    markSeen(id) {
        this.seenThisRun[id] = true;
    }

    draw() {
        if (!this.activeTip) return;

        const ctx = this.game.ctx;
        const w = this.game.width;
        const h = this.game.height;
        const imageKey = this.activeTip === 'jump' ? 'tips_jump' : 'tips_glide';
        const img = this.game.assets.getImage(imageKey);
        if (!img) return;

        ctx.save();
        ctx.globalAlpha = 0.72 * this.backdropAlpha;
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, w, h);
        ctx.restore();

        const maxW = w * 0.78;
        const maxH = h * 0.78;
        const scale = Math.min(maxW / img.width, maxH / img.height, 1.0);
        const drawW = img.width * scale;
        const drawH = img.height * scale;
        const x = (w - drawW) / 2;
        const y = (h - drawH) / 2;

        const ease = 1 - Math.pow(1 - this.backdropAlpha, 3);
        ctx.save();
        ctx.globalAlpha = ease;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
        ctx.shadowBlur = 28;
        ctx.shadowOffsetY = 10;
        ctx.drawImage(img, x, y, drawW, drawH);
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;

        if (this.closeDelay <= 0) {
            const pulse = 0.65 + Math.sin(Date.now() / 220) * 0.25;
            ctx.globalAlpha = pulse;
            ctx.font = 'bold 24px "Zen Maru Gothic", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#fff';
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.lineWidth = 5;
            const text = this.activeTip === 'jump' ? 'CLICK / SPACE: NEXT TIP' : 'CLICK / SPACE: CLOSE';
            ctx.strokeText(text, w / 2, Math.min(h - 30, y + drawH + 34));
            ctx.fillText(text, w / 2, Math.min(h - 30, y + drawH + 34));
        }
        ctx.restore();
    }
}

