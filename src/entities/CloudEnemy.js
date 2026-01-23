export class CloudEnemy {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.baseY = y; // Anchor Y position
        this.width = 160;
        this.height = 160;
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

    draw(ctx, assets, camera) {
        if (this.dead) return;

        const img = assets.getImage('enemy_cloud');

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
