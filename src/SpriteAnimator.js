export class SpriteAnimator {
    constructor(defaultConfig) {
        this.config = defaultConfig || {
            type: 'SHEET',
            cols: 1,
            rows: 1,
            maxFrames: 1,
            frameInterval: 10,
            states: { idle: { row: 0, frames: 1 } }
        };

        this.state = 'idle';
        this.frame = 0;
        this.frameTimer = 0;
        this.validatedImages = new Set();
    }

    setConfig(config) {
        this.config = config;
        this.validatedImages.clear(); // 設定が変わったら再検証
    }

    setState(state) {
        if (this.state !== state) {
            this.state = state;
            this.frame = 0;
            this.frameTimer = 0;
        }
    }

    update(dt) {
        // 現在の状態の設定を取得
        const stateConfig = this.config.states[this.state] || this.config.states.idle || {};
        const frameInterval = stateConfig.frameInterval || this.config.frameInterval || 10;
        const maxFrames = stateConfig.frames || this.config.maxFrames || 1;

        this.frameTimer += dt * 60; // 60fps base
        if (this.frameTimer >= frameInterval) {
            this.frame = (this.frame + 1) % maxFrames;
            this.frameTimer -= frameInterval;
        }
    }

    draw(ctx, image, x, y, width, height, facingRight = true, scaleX = 1, scaleY = 1, rotation = 0) {
        if (!image) return;

        // Auto Verification
        this.validateImage(image);

        const stateConfig = this.config.states[this.state] || this.config.states.idle || {};

        // Determine layout for current state
        const sheetCols = stateConfig.sheetCols || this.config.cols || 1;
        const animCols = stateConfig.cols || sheetCols;
        const maxFrames = stateConfig.frames || this.config.maxFrames || 1;

        let sheetRows = this.config.rows || 1;
        if (this.config.type !== 'SHEET' && stateConfig.rows) {
            sheetRows = stateConfig.rows;
        }

        // Frame calculation
        const currentFrame = this.frame % maxFrames;

        // Sprite sheet calculation: precise floats
        const sw = image.width / sheetCols;
        const sh = image.height / sheetRows;

        // Sub-region wrapping logic
        const relCol = currentFrame % animCols;
        const relRow = Math.floor(currentFrame / animCols);

        const col = (stateConfig.colOffset || 0) + relCol;
        const row = (stateConfig.row || 0) + relRow;

        const sx = col * sw;
        const sy = row * sh;

        ctx.save();
        // Professional positioning: use integer translation for the base but allow float scales/rotations
        ctx.translate(Math.floor(x), Math.floor(y));

        // Apply Render Effects (Shadow/Glow) for blending
        const effect = stateConfig.renderEffect || this.config.renderEffect;
        if (effect) {
            if (effect.shadowBlur) ctx.shadowBlur = effect.shadowBlur;
            if (effect.shadowColor) ctx.shadowColor = effect.shadowColor;
        }

        if (rotation !== 0) {
            ctx.rotate(rotation);
        }

        // Apply facing and scale
        ctx.scale(facingRight ? scaleX : -scaleX, scaleY);

        // Aspect ratio handling
        const spriteAspect = sw / sh;
        const renderHeight = width / spriteAspect;

        // Professional Anti-Artifact Hack (v2):
        // Deepen the left-cut to eliminate persistent neighbor noise on the left edge.
        const bleed = this.config.bleed !== undefined ? this.config.bleed : 1.0;
        const leftGuard = 2.0; // Extra guard pixels specifically for the left edge artifact

        // 1. Calculate base integer positions
        const baseSX = Math.round(col * sw);
        const baseSY = Math.round(row * sh);
        const baseSW = Math.round(sw);
        const baseSH = Math.round(sh);

        // Apply bleed + extra leftGuard + custom trims for srcX/Y
        const trimLeft = (stateConfig.trimLeft || 0);
        const trimRight = (stateConfig.trimRight || 0);
        const trimTop = (stateConfig.trimTop || 0);
        const trimBottom = (stateConfig.trimBottom || 0);

        const srcX = baseSX + bleed + leftGuard + trimLeft;
        const srcY = baseSY + bleed + trimTop;
        const srcW = Math.max(1, baseSW - (bleed * 2) - leftGuard - trimLeft - trimRight);
        const srcH = Math.max(1, baseSH - (bleed * 2) - trimTop - trimBottom);

        // Optional State Offsets (pixel based, scaled)
        let offX = (stateConfig.offsetX || 0) * scaleX;
        let offY = (stateConfig.offsetY || 0) * scaleY;

        // Per-Frame Offsets (for fixing jittery sprite sheets)
        // Per-Frame Offsets (for fixing jittery sprite sheets)
        if (stateConfig.frameOffsets && stateConfig.frameOffsets[currentFrame]) {
            const fOff = stateConfig.frameOffsets[currentFrame];
            if (fOff.x !== undefined) offX += fOff.x * scaleX;
            if (fOff.y !== undefined) offY += fOff.y * scaleY;
        }

        // Draw centered at the bottom pivot
        ctx.drawImage(
            image,
            srcX, srcY, srcW, srcH,
            -width / 2 + offX, -height + offY,
            width, height
        );

        ctx.restore();

        return height;
    }

    validateImage(image) {
        if (this.validatedImages.has(image)) return;
        if (!image.complete || image.naturalWidth === 0) return; // Not loaded yet

        const stateConfig = this.config.states[this.state] || {};
        const cols = stateConfig.cols || this.config.cols || 1;
        const rows = stateConfig.rows || this.config.rows || 1;

        const frameW = image.naturalWidth / cols;
        const frameH = image.naturalHeight / rows;

        let warning = [];

        // 1. Integer check
        if (!Number.isInteger(frameW) || !Number.isInteger(frameH)) {
            warning.push(`> Frame dimensions are non-integers (${frameW.toFixed(2)}x${frameH.toFixed(2)}). Image size (${image.naturalWidth}x${image.naturalHeight}) might not match Cols:${cols}/Rows:${rows}.`);
        }

        // 2. Aspect Ration Warning
        if (frameW < 16 || frameH < 16) {
            warning.push(`> Frames are suspiciously small (${frameW}x${frameH}). Check grid settings.`);
        }

        if (warning.length > 0) {
            console.warn(`[SpriteAnimator] Potential config mismatch for image "${image.src}":\n` + warning.join('\n'));

            // Auto-correction hint (optional, just log for AI/Dev)
            // if (image.naturalWidth % 4 === 0 && image.naturalWidth % cols !== 0) {
            //    console.info(`[Tip] Image width is divisible by 4. Maybe cols=4?`);
            // }
        }

        this.validatedImages.add(image);
    }
}
