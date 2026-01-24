export class DrillEnemy {
    constructor(x, y, tileSize) {
        this.width = tileSize * 2.25;
        this.height = tileSize * 2.25;

        // Adjust position to align bottom with tile and center horizontally
        this.x = x + (tileSize - this.width) / 2;
        this.y = y + tileSize - this.height;

        const scale = tileSize / 64;
        this.speed = 5 * scale * 60; // 5px/frame equivalent -> pixels/sec (increased from 2)
        this.vx = -this.speed; // Start moving left
        this.vy = 0;
        this.gravity = 30 * scale * 60; // Standardize gravity to pixels/sec^2
        this.type = 'enemy';
        this.dead = false;

        // Wandering logic
        this.wanderRange = 192 * scale; // Increased from 128 to 192 (1.5x larger motion)
        this.spawnX = this.x;
    }

    update(dt, level, camera) {
        if (this.dead) return;

        // Apply gravity
        this.vy += this.gravity * dt;
        this.y += this.vy * dt;

        // Ground collision
        this.handleCollision(level, 'y');

        // Horizontal movement (Wandering)
        this.x += this.vx * dt;

        // Check for walls or edge of wander range
        const col = Math.floor((this.vx > 0 ? this.x + this.width : this.x) / level.tileSize);
        const row = Math.floor((this.y + this.height - 5) / level.tileSize);

        // Calculate tile ahead to check for ledge (cliff)
        // If moving right, check bottom-right tile. If moving left, check bottom-left tile.
        const lookAheadX = this.vx > 0 ? this.x + this.width + 5 : this.x - 5;
        const lookAheadCol = Math.floor(lookAheadX / level.tileSize);
        const lookAheadRow = Math.floor((this.y + this.height + 5) / level.tileSize); // Check below feet

        let shouldTurn = false;

        // Wall check
        if (level.isSolid(col, row)) {
            shouldTurn = true;
        }
        // Ledge check: If the tile below the projected path is NOT solid, it's a cliff.
        // Also ensure we are actually on the ground before checking cliffs (don't turn in mid-air fall)
        else if (this.vy === 0 && !level.isSolid(lookAheadCol, lookAheadRow)) {
            shouldTurn = true;
        }
        // Wander range check
        else if (Math.abs(this.x - this.spawnX) > this.wanderRange) {
            shouldTurn = true;
        }

        if (shouldTurn) {
            this.vx *= -1; // Reverse direction
        }

        // Keep within world bounds
        if (this.x < 0) this.vx = this.speed;
        if (this.x > level.width - this.width) this.vx = -this.speed;
    }

    handleCollision(level, axis) {
        const ts = level.tileSize;
        const left = Math.floor(this.x / ts);
        const right = Math.floor((this.x + this.width - 1) / ts);
        const top = Math.floor(this.y / ts);
        const bottom = Math.floor((this.y + this.height - 1) / ts);

        if (axis === 'y') {
            for (let c = left; c <= right; c++) {
                if (level.isSolid(c, bottom)) {
                    this.y = bottom * ts - this.height;
                    this.vy = 0;
                    break;
                }
            }
        }
    }

    draw(ctx, assets, camera) {
        if (this.dead) return;

        const img = assets.getImage('fuwamoko');
        const dx = Math.floor(this.x - camera.x);
        const dy = Math.floor(this.y - camera.y);

        if (dx + this.width < 0 || dx > ctx.canvas.width) return;

        ctx.save();
        if (this.vx > 0) {
            // Flip image when moving right
            ctx.scale(-1, 1);
            ctx.drawImage(img, -dx - this.width, dy, this.width, this.height);
        } else {
            ctx.drawImage(img, dx, dy, this.width, this.height);
        }
        ctx.restore();
    }
}
