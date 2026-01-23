
export class MovingPlatform {
    constructor(x, y, tileSize, range = 3, speed = 2) {
        this.startX = x;
        this.startY = y;
        this.x = x;
        this.y = y;
        this.width = tileSize * 3; // 3 blocks wide
        this.height = tileSize / 2; // Thin platform
        this.tileSize = tileSize;

        this.range = range * tileSize;
        this.speed = speed;
        this.time = Math.random() * Math.PI * 2; // Random start phase

        this.vx = 0;
        this.vy = 0;
    }

    update(dt) {
        this.time += dt * this.speed;

        // Horizontal movement based on Sine wave
        const offsetX = Math.sin(this.time) * this.range;
        const nextX = this.startX + offsetX;

        this.vx = (nextX - this.x) / dt; // Calculate velocity for carrying player
        this.x = nextX;

        // Visual bobbing
        this.y = this.startY + Math.sin(this.time * 2) * 5;
    }

    draw(ctx, camera) {
        const drawX = this.x - camera.x;
        const drawY = this.y - camera.y;

        if (drawX + this.width < 0 || drawX > ctx.canvas.width) return;

        // Draw Platform Mechanic Style
        ctx.save();

        // Piston/Rail effect (imaginary line)
        /*
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(this.startX - this.range - camera.x + this.width/2, this.startY - camera.y + this.height/2);
        ctx.lineTo(this.startX + this.range - camera.x + this.width/2, this.startY - camera.y + this.height/2);
        ctx.stroke();
        ctx.setLineDash([]);
        */

        // Main Body
        const grad = ctx.createLinearGradient(drawX, drawY, drawX, drawY + this.height);
        grad.addColorStop(0, '#bdc3c7');
        grad.addColorStop(0.5, '#ecf0f1');
        grad.addColorStop(1, '#95a5a6');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.rect(drawX, drawY, this.width, this.height);
        ctx.fill();

        // Border
        ctx.strokeStyle = '#7f8c8d';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Details (Bolts)
        ctx.fillStyle = '#34495e';
        const boltSize = 4;
        ctx.beginPath();
        ctx.arc(drawX + 10, drawY + this.height / 2, boltSize, 0, Math.PI * 2);
        ctx.arc(drawX + this.width - 10, drawY + this.height / 2, boltSize, 0, Math.PI * 2);
        ctx.fill();

        // Center Glow (Energy source)
        ctx.fillStyle = '#3498db';
        ctx.shadowColor = '#2ecc71';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.rect(drawX + this.width / 2 - 15, drawY + 5, 30, this.height - 10);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Propellers or Hover effects (Particles) can be added in Game.js

        ctx.restore();
    }
}
