
export class FallingPlatform {
    constructor(x, y, tileSize) {
        this.startX = x;
        this.startY = y;
        this.x = x;
        this.y = y;
        this.width = tileSize * 2; // 2 blocks wide
        this.height = tileSize / 2;
        this.tileSize = tileSize;

        this.state = 'IDLE'; // IDLE, SHAKING, FALLING
        this.timer = 0;
        this.shakeOffset = { x: 0, y: 0 };
        this.vy = 0;
    }

    trigger() {
        if (this.state === 'IDLE') {
            this.state = 'SHAKING';
            this.timer = 0.5; // Shake for 0.5 seconds
        }
    }

    update(dt) {
        if (this.state === 'SHAKING') {
            this.timer -= dt;
            // Random shake effect
            this.shakeOffset.x = (Math.random() - 0.5) * 5;
            this.shakeOffset.y = (Math.random() - 0.5) * 5;

            if (this.timer <= 0) {
                this.state = 'FALLING';
                this.vy = 200; // Initial fall speed
            }
        } else if (this.state === 'FALLING') {
            this.shakeOffset.x = 0;
            this.shakeOffset.y = 0;
            this.vy += 1000 * dt; // Gravity
            this.y += this.vy * dt;
        }
    }

    draw(ctx, camera) {
        const drawX = this.x + this.shakeOffset.x - camera.x;
        const drawY = this.y + this.shakeOffset.y - camera.y;

        if (drawX + this.width < 0 || drawX > ctx.canvas.width) return;

        ctx.save();

        // Color based on state
        // IDLE: Normal
        // SHAKING: Reddish tint
        // FALLING: Dark

        let baseColor = '#95a5a6'; // Concrete/Grey
        let detailColor = '#7f8c8d';

        if (this.state === 'SHAKING') {
            baseColor = '#e74c3c'; // Warning Red
            detailColor = '#c0392b';
        }

        // Draw Block
        ctx.fillStyle = baseColor;
        ctx.beginPath();
        ctx.rect(drawX, drawY, this.width, this.height);
        ctx.fill();

        // Cracks visualization
        ctx.strokeStyle = detailColor;
        ctx.lineWidth = 2;

        if (this.state !== 'IDLE') {
            ctx.beginPath();
            ctx.moveTo(drawX + 10, drawY + 5);
            ctx.lineTo(drawX + 20, drawY + 15);
            ctx.lineTo(drawX + 15, drawY + 25);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(drawX + this.width - 10, drawY + 5);
            ctx.lineTo(drawX + this.width - 20, drawY + 15);
            ctx.lineTo(drawX + this.width - 15, drawY + 25);
            ctx.stroke();
        }

        // Border
        ctx.strokeStyle = '#2c3e50';
        ctx.strokeRect(drawX, drawY, this.width, this.height);

        ctx.restore();
    }
}
