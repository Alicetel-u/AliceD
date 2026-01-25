export class CloudEnemy {
    constructor(x, y, stage = 1) {
        this.x = x;
        this.y = y;
        this.baseY = y; // Anchor Y position

        let size = 160;
        if (stage === 2) size = 192;
        else if (stage === 3) size = 224;
        else if (stage === 5) size = 288; // Even bigger for St5
        // Stage 4 stays 160, Stage 1 stays 160

        this.width = size;
        this.height = size;

        this.dead = false;
        this.timer = Math.random() * 100; // Random initial phase
        this.type = 'flyer';
    }

    update(dt) {
        if (this.dead) return;

        this.timer += dt * 3.0; // Floating speed (Increased from 2.0)
        // Floating motion (Sine wave)
        const offset = Math.sin(this.timer) * 100; // Amplitude 100px (Increased from 40px)
        this.y = this.baseY + offset;
    }

    draw(ctx, assets, camera, config) {
        if (this.dead) return;

        const imgKey = (config && config.enemies && config.enemies.air) ? config.enemies.air : 'enemy_cloud';
        const img = assets.getImage(imgKey);

        // Simple culling
        if (this.x < camera.x - 200 || this.x > camera.x + camera.width + 200) return;

        const screenX = Math.floor(this.x - camera.x);
        const screenY = Math.floor(this.y - camera.y);

        if (img) {
            ctx.drawImage(img, screenX, screenY, this.width, this.height);
        } else {
            // Fallback visualization
            const cx = screenX + this.width / 2;
            const cy = screenY + this.height / 2;
            const r = this.width / 2 - 4;

            ctx.fillStyle = '#a29bfe';
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'white';
            ctx.font = '80px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText("☁️", cx, cy);
        }
    }
}
