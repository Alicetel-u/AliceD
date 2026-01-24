export class Particle {
    constructor(x, y, vx, vy, life, color, size) {
        // Handle object config or param list
        if (typeof x === 'object') {
            const c = x;
            this.x = c.x; this.y = c.y; this.vx = c.vx; this.vy = c.vy;
            this.life = c.life; this.maxLife = c.life;
            this.color = c.color; this.size = c.size;
            this.type = c.type || 'rect';
            this.text = c.text || '';
            this.rainbow = c.rainbow || false;
            this.screenSpace = c.screenSpace || false;
        } else {
            this.x = x; this.y = y; this.vx = vx; this.vy = vy;
            this.life = life; this.maxLife = life;
            this.color = color;
            this.size = size;
            this.type = 'rect';
        }
    }

    update(dt) {
        const dtFrames = dt * 60;
        this.x += this.vx * dtFrames;
        this.y += this.vy * dtFrames;
        this.life -= dtFrames;
    }

    draw(ctx, camera) {
        if (this.life <= 0) return;

        ctx.save();
        ctx.globalAlpha = Math.max(0, this.life / this.maxLife);

        const drawX = this.screenSpace ? this.x : this.x - camera.x;
        const drawY = this.screenSpace ? this.y : this.y - camera.y;

        if (this.type === 'text') {
            if (this.rainbow) {
                const hue = (Date.now() / 2) % 360; // Fast cycle
                ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
                ctx.shadowColor = `hsl(${hue}, 100%, 80%)`;
                ctx.shadowBlur = 10;
            } else {
                ctx.fillStyle = this.color;
                ctx.shadowColor = 'black';
                ctx.shadowBlur = 4;
            }
            ctx.font = `bold ${this.size}px monospace`;
            ctx.textAlign = 'center';
            ctx.fillText(this.text, Math.floor(drawX), Math.floor(drawY));
        } else {
            ctx.fillStyle = this.color;
            ctx.fillRect(Math.floor(drawX), Math.floor(drawY), this.size, this.size);
        }

        ctx.restore();
    }
}
