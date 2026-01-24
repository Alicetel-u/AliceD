export class SpeedRing {
    constructor(x, y, type = 'right') {
        this.x = x;
        this.y = y;
        this.radius = 64; // 2x Size
        this.width = 128; // 2x Size
        this.height = 128; // 2x Size
        this.active = true;
        this.cooldown = 0;
        this.timer = 0;
        this.type = type; // 'right', 'up', 'down'
    }

    update(dt) {
        this.timer += dt;
        if (!this.active) {
            this.cooldown -= dt;
            if (this.cooldown <= 0) {
                this.active = true;
            }
        }
    }

    trigger(audio) {
        if (!this.active) return false;
        this.active = false;
        this.cooldown = 3.0;
        if (audio && audio.playPowerUp) audio.playPowerUp();
        else if (audio) audio.playCollect();
        return true;
    }

    draw(ctx, assets, camera) {
        const sx = this.x - camera.x;
        const sy = this.y - camera.y;

        if (sx < -200 || sx > camera.width + 200) return;

        ctx.save();
        ctx.translate(sx + 64, sy + 64); // Center update

        // Direction Angle
        let angle = 0;
        if (this.type === 'up') angle = -Math.PI / 4;
        if (this.type === 'down') angle = Math.PI / 4;

        ctx.rotate(angle);

        // Pulsing
        const scale = 1.0 + Math.sin(this.timer * 8) * 0.1;
        ctx.scale(scale, scale);

        // Outer Ring
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);

        let color = '#0abde3';
        let glow = '#48dbfb';

        if (this.type === 'super') {
            // Rainbow Effect: Cycle hue based on time
            const hue = (this.timer * 200) % 360;
            color = `hsl(${hue}, 100%, 65%)`;
            glow = `hsl(${hue}, 100%, 80%)`;
        }

        ctx.strokeStyle = this.active ? color : '#636e72';
        ctx.lineWidth = (this.type === 'super') ? 15 : 10;
        ctx.stroke();

        // Extra ring for Super type to make it look special
        if (this.type === 'super' && this.active) {
            ctx.beginPath();
            ctx.arc(0, 0, this.radius - 15, 0, Math.PI * 2);
            ctx.lineWidth = 5;
            ctx.stroke();
        }

        // Inner detail (Triangle) - Scaled up
        if (this.active) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.beginPath();
            ctx.moveTo(-20, -30);
            ctx.lineTo(40, 0);
            ctx.lineTo(-20, 30);
            ctx.fill();

            // Glow
            ctx.shadowBlur = 30;
            ctx.shadowColor = glow;
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 5;
            ctx.stroke();
        }

        ctx.restore();
    }
}
