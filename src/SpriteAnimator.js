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
        // Per-image frame alignment data. WeakMap keeps memory bounded when
        // character assets are swapped at runtime.
        this.alignmentCache = new WeakMap();
    }

    setConfig(config) {
        this.config = config;
        this.validatedImages.clear(); // 設定が変わったら再検証
        this.alignmentCache = new WeakMap();
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

        // Catch up safely after a long frame. Non-looping states (e.g. jump)
        // play once and hold their final pose instead of restarting mid-air.
        while (this.frameTimer >= frameInterval) {
            if (stateConfig.loop === false) {
                if (this.frame < maxFrames - 1) {
                    this.frame += 1;
                } else {
                    this.frameTimer = 0;
                    break;
                }
            } else {
                this.frame = (this.frame + 1) % maxFrames;
            }
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

        let sheetRows = stateConfig.sheetRows || this.config.rows || 1;
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
        const leftGuard = this.config.leftGuard !== undefined ? this.config.leftGuard : 2.0; // V2 sheets can disable the legacy left-edge guard

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

        // Optional source-window offsets. Useful when an otherwise regular sheet
        // has artwork sitting a few pixels across a nominal cell boundary.
        let sourceOffsetX = stateConfig.sourceOffsetX || 0;
        let sourceOffsetY = stateConfig.sourceOffsetY || 0;
        if (stateConfig.sourceFrameOffsets && stateConfig.sourceFrameOffsets[currentFrame]) {
            const sourceFrameOffset = stateConfig.sourceFrameOffsets[currentFrame];
            if (sourceFrameOffset.x !== undefined) sourceOffsetX += sourceFrameOffset.x;
            if (sourceFrameOffset.y !== undefined) sourceOffsetY += sourceFrameOffset.y;
        }

        const srcX = baseSX + sourceOffsetX + bleed + leftGuard + trimLeft;
        const srcY = baseSY + sourceOffsetY + bleed + trimTop;
        const srcW = Math.max(1, baseSW - (bleed * 2) - leftGuard - trimLeft - trimRight);
        const srcH = Math.max(1, baseSH - (bleed * 2) - trimTop - trimBottom);

        // Optional State Offsets (pixel based, scaled)
        let offX = (stateConfig.offsetX || 0) * scaleX;
        let offY = (stateConfig.offsetY || 0) * scaleY;

        // Auto-align generated sprite frames by their visible silhouette.
        // This removes the common AI-sprite "head wobble / floating feet"
        // without requiring hand-authored offsets for all 16 frames.
        if (stateConfig.autoAlign || this.config.autoAlign) {
            const autoOffset = this.getAutoAlignment(
                image,
                stateConfig,
                sheetCols,
                sheetRows,
                animCols,
                maxFrames,
                currentFrame
            );
            if (autoOffset) {
                offX += autoOffset.x * (width / Math.max(1, baseSW)) * scaleX;
                offY += autoOffset.y * (height / Math.max(1, baseSH)) * scaleY;
            }
        }

        // Manual per-frame offsets remain available for art-directed tweaks.
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

    getAutoAlignment(image, stateConfig, sheetCols, sheetRows, animCols, maxFrames, currentFrame) {
        if (!image || !image.width || !image.height) return null;

        const alignConfig = typeof stateConfig.autoAlign === 'object'
            ? stateConfig.autoAlign
            : (typeof this.config.autoAlign === 'object' ? this.config.autoAlign : {});

        const threshold = alignConfig.alphaThreshold ?? 24;
        const maxOffset = alignConfig.maxOffset ?? 14;
        const alignX = alignConfig.x !== false;
        const alignY = alignConfig.y !== false;
        const key = [
            sheetCols, sheetRows, animCols, maxFrames,
            stateConfig.row || 0, stateConfig.colOffset || 0,
            threshold, maxOffset, alignX ? 1 : 0, alignY ? 1 : 0
        ].join(':');

        let imageCache = this.alignmentCache.get(image);
        if (!imageCache) {
            imageCache = new Map();
            this.alignmentCache.set(image, imageCache);
        }

        if (!imageCache.has(key)) {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = image.width;
                canvas.height = image.height;
                const scanCtx = canvas.getContext('2d', { willReadFrequently: true });
                scanCtx.drawImage(image, 0, 0);

                const pixels = scanCtx.getImageData(0, 0, canvas.width, canvas.height).data;
                const frameW = image.width / sheetCols;
                const frameH = image.height / sheetRows;
                const frames = [];

                for (let frame = 0; frame < maxFrames; frame++) {
                    const relCol = frame % animCols;
                    const relRow = Math.floor(frame / animCols);
                    const col = (stateConfig.colOffset || 0) + relCol;
                    const row = (stateConfig.row || 0) + relRow;

                    const x0 = Math.max(0, Math.round(col * frameW));
                    const y0 = Math.max(0, Math.round(row * frameH));
                    const x1 = Math.min(canvas.width, Math.round((col + 1) * frameW));
                    const y1 = Math.min(canvas.height, Math.round((row + 1) * frameH));

                    const colCounts = new Uint16Array(Math.max(1, x1 - x0));
                    const rowCounts = new Uint16Array(Math.max(1, y1 - y0));

                    for (let py = y0; py < y1; py++) {
                        const rowBase = py * canvas.width * 4;
                        for (let px = x0; px < x1; px++) {
                            if (pixels[rowBase + px * 4 + 3] > threshold) {
                                colCounts[px - x0]++;
                                rowCounts[py - y0]++;
                            }
                        }
                    }

                    // Ignore isolated sparkles/noise and use the main silhouette.
                    const minColPixels = Math.max(2, Math.floor((y1 - y0) * 0.01));
                    const minRowPixels = Math.max(2, Math.floor((x1 - x0) * 0.01));

                    let left = -1;
                    let right = -1;
                    let top = -1;
                    let bottom = -1;

                    for (let i = 0; i < colCounts.length; i++) {
                        if (colCounts[i] >= minColPixels) {
                            if (left === -1) left = i;
                            right = i;
                        }
                    }
                    for (let i = 0; i < rowCounts.length; i++) {
                        if (rowCounts[i] >= minRowPixels) {
                            if (top === -1) top = i;
                            bottom = i;
                        }
                    }

                    if (left === -1 || top === -1) {
                        frames.push(null);
                    } else {
                        frames.push({
                            centerX: (left + right) / 2,
                            bottom
                        });
                    }
                }

                const median = values => {
                    const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
                    if (!sorted.length) return 0;
                    const mid = Math.floor(sorted.length / 2);
                    return sorted.length % 2
                        ? sorted[mid]
                        : (sorted[mid - 1] + sorted[mid]) / 2;
                };

                const targetCenter = median(frames.filter(Boolean).map(f => f.centerX));
                const targetBottom = median(frames.filter(Boolean).map(f => f.bottom));

                const offsets = frames.map(frame => {
                    if (!frame) return { x: 0, y: 0 };
                    const x = alignX
                        ? Math.max(-maxOffset, Math.min(maxOffset, targetCenter - frame.centerX))
                        : 0;
                    const y = alignY
                        ? Math.max(-maxOffset, Math.min(maxOffset, targetBottom - frame.bottom))
                        : 0;
                    return { x, y };
                });

                imageCache.set(key, offsets);
            } catch (error) {
                console.warn('[SpriteAnimator] Auto alignment unavailable; using original frame positions.', error);
                imageCache.set(key, []);
            }
        }

        return imageCache.get(key)[currentFrame] || { x: 0, y: 0 };
    }

    validateImage(image) {
        if (this.validatedImages.has(image)) return;
        if (!image.complete || image.naturalWidth === 0) return; // Not loaded yet

        const stateConfig = this.config.states[this.state] || {};
        const cols = stateConfig.cols || this.config.cols || 1;
        const rows = stateConfig.sheetRows || stateConfig.rows || this.config.rows || 1;

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
