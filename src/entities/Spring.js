export class Spring {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 64;
        this.height = 32; // Half tile height
        this.y += 32; // Align to bottom of tile

        this.active = false;
        this.animationTimer = 0;
    }

    update(dt) {
        if (this.active) {
            this.animationTimer += dt * 60; // Convert sec to frames approx
            if (this.animationTimer > 20) {
                this.active = false;
                this.animationTimer = 0;
            }
        }
    }

    trigger(audio) {
        this.active = true;
        this.animationTimer = 0;
        // Play bounce sound (using jump sound with higher pitch logic if possible, otherwise just play)
        // Since we don't have pitch control easily exposed, just play jump
        audio.playJump();
    }

    draw(ctx, assets, camera) {
        const screenX = Math.floor(this.x - camera.x);
        const screenY = Math.floor(this.y - camera.y);

        if (screenX < -100 || screenX > camera.width + 100) return;

        // Spring Simulation Logic (Elasticity)
        let visualHeight = this.height;
        let offsetY = 0;

        if (this.active) {
            // Smooth elastic animation using sine wave damping
            const t = this.animationTimer;
            // 0 -> compressed, then expands, then wobbles back
            if (t < 5) {
                // Compression phase (Squash)
                visualHeight = this.height * 0.4;
            } else {
                // Extension phase (Stretch & Wobble)
                // Decay factor
                const decay = Math.max(0, 1 - (t - 5) / 20);
                const wave = Math.sin((t - 5) * 0.8) * decay;
                visualHeight = this.height + (this.height * 0.8 * wave);
            }
        }

        // Calculate top position based on bottom anchor
        const bottomY = screenY + this.height;
        const currentTopY = bottomY - visualHeight;

        // Dimensions - Visually wider!
        const visualWidth = 100; // Much wider than the 64px tile
        const centerX = screenX + this.width / 2;
        const leftX = centerX - visualWidth / 2;
        const width = visualWidth; // Use this for drawing

        // --- 1. Base (Pedestal) ---
        const baseX = leftX - 4;
        const baseW = width + 8;
        const baseY = bottomY - 6;
        const baseH = 6;

        const baseGrad = ctx.createLinearGradient(baseX, baseY, baseX, baseY + baseH);
        baseGrad.addColorStop(0, '#636e72');
        baseGrad.addColorStop(0.5, '#b2bec3');
        baseGrad.addColorStop(1, '#2d3436');

        ctx.fillStyle = baseGrad;
        ctx.beginPath();
        // Trapezoid shape for stability
        ctx.moveTo(baseX + 2, baseY);
        ctx.lineTo(baseX + baseW - 2, baseY);
        ctx.lineTo(baseX + baseW, baseY + baseH);
        ctx.lineTo(baseX, baseY + baseH);
        ctx.fill();

        // Base Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(baseX + 2, baseY + baseH, baseW - 4, 2);

        // --- 2. Coil (Spring Body) ---
        // Draw multiple rings or a helix
        const coils = 4;
        const coilWidth = width - 10;
        const coilX = centerX - coilWidth / 2;
        const coilStep = visualHeight / coils;

        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 6;

        // Shadow/Back of coil
        ctx.strokeStyle = '#2d3436';
        ctx.beginPath();
        for (let i = 0; i < coils; i++) {
            const y1 = bottomY - (i * coilStep); // Start low
            const y2 = bottomY - ((i + 0.5) * coilStep); // Mid-up
            const y3 = bottomY - ((i + 1) * coilStep); // Top of segment

            // Draw zigzag or curve? Let's do a stylish metallic sine-like curve
            // This is "Back" part (darker)
            // Actually, simple zigzag is clearest for game springs
            ctx.moveTo(coilX, y1);
            ctx.lineTo(coilX + coilWidth, y2);
        }
        ctx.stroke();

        // Front of coil (Shiny)
        const coilGrad = ctx.createLinearGradient(coilX, currentTopY, coilX + coilWidth, currentTopY);
        coilGrad.addColorStop(0, '#7f8c8d');
        coilGrad.addColorStop(0.4, '#ffffff'); // Shine
        coilGrad.addColorStop(0.6, '#bdc3c7');
        coilGrad.addColorStop(1, '#7f8c8d');

        ctx.strokeStyle = coilGrad;
        ctx.beginPath();
        for (let i = 0; i < coils; i++) {
            const y1 = bottomY - (i * coilStep);
            const y2 = bottomY - ((i + 0.5) * coilStep);
            const y3 = bottomY - ((i + 1) * coilStep);

            // Front crossing part
            ctx.moveTo(coilX + coilWidth, y2);
            ctx.lineTo(coilX, y3);
        }
        ctx.stroke();

        // --- 3. Top Plate (User stands here) ---
        const plateH = 8;
        const plateY = currentTopY;
        const plateW = width + 4;
        const plateX = centerX - plateW / 2;

        // Side/Thickness of plate
        ctx.fillStyle = '#c0392b';
        ctx.fillRect(plateX, plateY, plateW, plateH);

        // Top Surface
        const topGrad = ctx.createLinearGradient(plateX, plateY, plateX + plateW, plateY);
        topGrad.addColorStop(0, '#e74c3c');
        topGrad.addColorStop(0.5, '#ff7675'); // Highlight
        topGrad.addColorStop(1, '#c0392b');

        ctx.fillStyle = topGrad;
        ctx.beginPath();
        ctx.roundRect(plateX, plateY - 4, plateW, 6, 2);
        ctx.fill();

        // Target Mark on Top
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.beginPath();
        ctx.ellipse(centerX, plateY - 1, plateW * 0.3, 2, 0, 0, Math.PI * 2);
        ctx.fill();
    }
}
