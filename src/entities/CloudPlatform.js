export class CloudPlatform {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 96;
        this.height = 64;
        this.state = 'IDLE'; // IDLE, FADING, GONE
        this.timer = 0;
        this.opacity = 1.0;
    }

    update(dt) {
        if (this.state === 'FADING') {
            this.timer += dt;
            this.opacity = 1.0 - (this.timer / 1.0); // 1.0s fade out
            if (this.timer >= 1.0) {
                this.state = 'GONE';
                this.timer = 0;
                this.opacity = 0;
            }
        } else if (this.state === 'GONE') {
            this.timer += dt;
            if (this.timer >= 2.0) { // 2.0s respawn
                this.state = 'IDLE';
                this.timer = 0;
                this.opacity = 1.0;
            }
        }
    }

    touch() {
        if (this.state === 'IDLE') {
            this.state = 'FADING';
            this.timer = 0;
        }
    }

    draw(ctx, assets, camera) {
        if (this.state === 'GONE') return;

        const sx = this.x - camera.x;
        const sy = this.y - camera.y;

        if (sx < -100 || sx > camera.width + 100) return;

        ctx.save();

        let alpha = this.opacity;
        // Animation for Fading (Shake/Blink)
        let shakeX = 0;
        let shakeY = 0;
        if (this.state === 'FADING') {
            if (Math.floor(Date.now() / 50) % 2 === 0) alpha *= 0.8;
            shakeX = (Math.random() - 0.5) * 4;
            shakeY = (Math.random() - 0.5) * 4;
        } else {
            // Idle float
            shakeY = Math.sin(Date.now() / 500 + this.x) * 3;
        }

        ctx.globalAlpha = alpha;
        ctx.translate(sx + shakeX, sy + shakeY);

        // --- Cloud Rendering ---

        // Define puffs relative to 0,0 (top-left of bounding box)
        const puffs = [
            { x: 20, y: 35, r: 20 },
            { x: 40, y: 25, r: 25 }, // Main Top
            { x: 60, y: 30, r: 22 },
            { x: 78, y: 40, r: 18 }, // Right tail
            { x: 15, y: 45, r: 15 }, // Left tail
            { x: 50, y: 45, r: 22 }  // Bottom fill
        ];

        // 1. Build the Cloud Shape Path
        ctx.beginPath();
        puffs.forEach(p => {
            // moveTo avoids drawing lines connecting the circles
            ctx.moveTo(p.x + p.r, p.y);
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        });

        // 2. Drop Shadow (Drawn before clipping to extend outside)
        ctx.save();
        ctx.shadowColor = 'rgba(0, 168, 255, 0.4)';
        ctx.shadowBlur = 15;
        ctx.shadowOffsetY = 8;
        ctx.fillStyle = '#ecf0f1';
        ctx.fill();
        ctx.restore();

        // 3. Clip the context to the cloud shape
        // This ensures subsequent drawing operations (gradients) never leak outside the circles!
        ctx.save();
        ctx.clip();

        // 4. Fill Base Color
        ctx.fillStyle = '#ecf0f1';
        ctx.fill();

        // 5. Volume Gradients (Per Puff)
        // Drawn INSIDE the clip area
        puffs.forEach(p => {
            const grad = ctx.createRadialGradient(p.x - p.r * 0.3, p.y - p.r * 0.3, 0, p.x, p.y, p.r);
            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(0.7, 'rgba(247, 249, 250, 0.5)');
            grad.addColorStop(1, 'rgba(223, 230, 233, 0)');

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();
        });

        // 6. Overall Shading (Sky Reflection & Highlight)
        // Since we are clipped, filling a rectangle only colors the cloud shape.

        // Bottom shading (Blue-ish tint)
        const bottomGrad = ctx.createLinearGradient(0, 0, 0, 64);
        bottomGrad.addColorStop(0.5, 'rgba(255,255,255,0)');
        bottomGrad.addColorStop(1, 'rgba(116, 185, 255, 0.4)');
        ctx.fillStyle = bottomGrad;
        ctx.fillRect(0, 0, 96, 64);

        // Top Highlight
        const topGrad = ctx.createLinearGradient(0, 0, 0, 40);
        topGrad.addColorStop(0, 'rgba(255,255,255,0.9)');
        topGrad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = topGrad;
        ctx.fillRect(0, 0, 96, 40);

        ctx.restore(); // Remove clip

        // 7. Outline (Optional, soft touch)
        // Since clip is removed, we can stroke the path again if needed, 
        // but re-creating path is needed. Let's keep it lineless for "fluffy" look, 
        // or just very subtle if requested. The shadow defines the edge enough.

        ctx.restore();
    }
}
