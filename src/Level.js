export class Level {
    constructor(tileSize) {
        this.tileSize = tileSize;
        this.width = 0;
        this.height = 0;
        this.tiles = [];
        this.entities = [];
        this.enemySpawns = [];
        this.springSpawns = [];
        this.ringSpawns = [];
        this.cloudSpawns = [];
        this.movingPlatformSpawns = [];
        this.fallingPlatformSpawns = [];
        this.config = null;
    }

    setConfig(config) {
        this.config = config;
    }

    load(levelMap) {
        this.height = levelMap.length * this.tileSize;
        this.width = levelMap[0].length * this.tileSize;
        this.rows = levelMap.length;
        this.cols = levelMap[0].length;

        // Reset all entity and spawn containers to prevent duplicates on reload
        this.entities = [];
        this.enemySpawns = [];
        this.springSpawns = [];
        this.ringSpawns = [];
        this.cloudSpawns = [];
        this.movingPlatformSpawns = [];
        this.fallingPlatformSpawns = [];

        // Parse map
        this.matrix = [];
        for (let y = 0; y < levelMap.length; y++) {
            const row = [];
            for (let x = 0; x < levelMap[y].length; x++) {
                const char = levelMap[y][x];
                let tileType = null;
                if (['#', 'D', 'B'].includes(char)) {
                    tileType = char;
                } else if (['c', 'G', 'S', 'R'].includes(char)) {
                    // Collectibles are stored as entities, tile is null (air)
                    const entityType = (char === 'c') ? 'C' : char;
                    this.entities.push({ type: entityType, x: x * this.tileSize, y: y * this.tileSize, collected: false });
                } else if (char === 'E' || char === 'F') {
                    // Enemy spawn point
                    this.enemySpawns.push({
                        x: x * this.tileSize,
                        y: y * this.tileSize,
                        type: char === 'F' ? 'flyer' : 'walker'
                    });
                } else if (char === 'J') {
                    this.springSpawns.push({ x: x * this.tileSize, y: y * this.tileSize });
                } else if (char === 'O') {
                    this.ringSpawns.push({ x: x * this.tileSize, y: y * this.tileSize, type: 'right' });
                } else if (char === 'X') { // Super Ring
                    this.ringSpawns.push({ x: x * this.tileSize, y: y * this.tileSize, type: 'super' });
                } else if (char === 'U') {
                    this.ringSpawns.push({ x: x * this.tileSize, y: y * this.tileSize, type: 'up' });
                } else if (char === 'V') { // Changed 'D' to 'V' to avoid conflict with Dirt 'D'
                    this.ringSpawns.push({ x: x * this.tileSize, y: y * this.tileSize, type: 'down' });
                } else if (char === 'C') {
                    this.cloudSpawns.push({ x: x * this.tileSize, y: y * this.tileSize });
                } else if (char === 'M') {
                    this.movingPlatformSpawns.push({ x: x * this.tileSize, y: y * this.tileSize });
                } else if (char === 'T') {
                    this.fallingPlatformSpawns.push({ x: x * this.tileSize, y: y * this.tileSize });
                }
                row.push(tileType);
            }
            this.matrix.push(row);
        }

        // Sort entities by X for rendering optimization
        this.entities.sort((a, b) => a.x - b.x);
    }

    getTile(col, row) {
        if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return null;
        return this.matrix[row][col];
    }

    isSolid(col, row) {
        const tile = this.getTile(col, row);
        return tile === '#' || tile === 'D' || tile === 'B';
    }

    draw(ctx, assets, camera) {
        const tileset = assets.getImage('tiles');

        // Resolve assets based on theme
        const theme = (this.config && this.config.theme) ? this.config.theme : {};
        const groundKey = theme.groundTile || 'grass_block';
        const dirtKey = theme.dirtTile || 'dirt_block';
        const platformKey = theme.platformTile || 'crate';

        const grass = assets.getImage(groundKey) || assets.getImage('grass_block');
        const dirt = assets.getImage(dirtKey) || assets.getImage('dirt_block');
        const crate = assets.getImage(platformKey) || assets.getImage('crate');

        // Calculate visible range
        const startCol = Math.floor(camera.x / this.tileSize);
        const endCol = startCol + (camera.width / this.tileSize) + 1;
        const startRow = Math.floor(camera.y / this.tileSize);
        const endRow = startRow + (camera.height / this.tileSize) + 1;

        // Round camera once for all tiles to prevent seams
        const camX = Math.floor(camera.x);
        const camY = Math.floor(camera.y);

        // Legacy tileset size for spikes/items
        const ts = tileset ? tileset.width / 3 : 32;

        for (let r = startRow; r <= endRow; r++) {
            if (r < 0 || r >= this.rows) continue;
            if (!this.matrix[r]) continue; // Guard clause
            for (let c = startCol; c <= endCol; c++) {
                if (c < 0 || c >= this.cols) continue;
                const tile = this.matrix[r][c];
                if (tile) {
                    const tx = (c * this.tileSize - camX) | 0;
                    const ty = (r * this.tileSize - camY) | 0;

                    const drawSize = (this.tileSize + 2) | 0;

                    if (this.config && this.config.id === 3) {
                        this.drawToyBlock(ctx, tile, tx, ty, drawSize, c, r);
                    } else if (this.config && this.config.id === 4) {
                        this.drawHospitalBlock(ctx, assets, tile, tx, ty, drawSize, c, r);
                    } else if (this.config && this.config.id === 5) {
                        this.drawHeavenBlock(ctx, assets, tile, tx, ty, drawSize, c, r);
                    } else {
                        // Standard Image Drawing
                        if (tile === '#' && grass) {
                            ctx.drawImage(grass, 0, 0, grass.width, grass.height, tx, ty, drawSize, drawSize);
                        } else if (tile === 'D' && dirt) {
                            ctx.drawImage(dirt, 0, 0, dirt.width, dirt.height, tx, ty, drawSize, drawSize);
                        } else if (tile === 'B' && crate) {
                            ctx.drawImage(crate, 0, 0, crate.width, crate.height, tx, ty, drawSize, drawSize);
                        }
                    }
                }
            }
        }

        // Draw Entities (Carrots, Clovers) - Optimized Loop
        if (tileset) {
            const viewLeft = camera.x - 100;
            const viewRight = camera.x + camera.width + 100;

            // Simple binary search or just iterate until strict limits since it's sorted
            for (let i = 0; i < this.entities.length; i++) {
                const ent = this.entities[i];
                if (ent.collected) continue;

                // Optimization: Sorted by X.
                // If ent.x is far to the right of view, break loop.
                if (ent.x > viewRight) break;

                // If too far left, skip
                if (ent.x < viewLeft) continue;

                if (ent.type === 'G') {
                    const img = assets.getImage('golden_carrot');
                    const ts = this.tileSize;
                    const hts = ts / 2;
                    const gx = (ent.x - camera.x) | 0;
                    const gy = (ent.y - camera.y) | 0;

                    ctx.save();
                    const drawSize = ts * 3.0; // 3 blocks tall/wide
                    const offset = (drawSize - ts) / 2;

                    // Draw anchored to bottom: (gy + ts) is bottom of cell
                    const drawX = gx - offset;
                    const drawY = (gy + ts) - drawSize;

                    // FEVER Text - Anchored above the golden carrot
                    ctx.font = `bold ${Math.floor(ts * 0.45 * 1.5)}px monospace`;
                    ctx.textAlign = 'center';
                    ctx.fillStyle = '#FFD700';
                    ctx.strokeStyle = '#000';
                    ctx.lineWidth = 4;
                    const floatY = Math.sin(Date.now() / 200) * (ts * 0.15) - (drawSize * 0.1);
                    ctx.strokeText("FEVER", gx + hts, drawY + floatY);
                    ctx.fillText("FEVER", gx + hts, drawY + floatY);

                    if (img) {
                        ctx.drawImage(img, 0, 0, img.width, img.height, drawX, drawY, drawSize, drawSize);
                    } else {
                        ctx.font = `${ts}px serif`;
                        ctx.fillText("🏆", gx + hts, gy + ts);
                    }

                    // Goal Pedestal
                    if (ent.hasPedestal) {
                        ctx.fillStyle = '#7f8c8d';
                        ctx.beginPath();
                        ctx.moveTo(gx - ts * 0.15, gy + ts);
                        ctx.lineTo(gx + ts * 1.15, gy + ts);
                        ctx.lineTo(gx + ts, gy + ts * 0.7);
                        ctx.lineTo(gx, gy + ts * 0.7);
                        ctx.closePath();
                        ctx.fill();
                        ctx.strokeStyle = '#333';
                        ctx.lineWidth = 2;
                        ctx.stroke();
                    }
                    ctx.restore();

                    // Ambient sparkles
                    ctx.save();
                    for (let i = 0; i < 5; i++) {
                        const sx = Math.floor(gx + Math.random() * ts);
                        const sy = Math.floor(gy + Math.random() * ts);
                        ctx.fillStyle = '#FFD700';
                        ctx.globalAlpha = Math.random();
                        ctx.fillRect(sx, sy, ts * 0.06, ts * 0.06);
                    }
                    ctx.restore();
                    continue; // Skip rest for this entity
                }

                if (ent.type === 'C') {
                    // Normal Carrot - Bottom Anchored
                    const img = assets.getImage('carrot');
                    if (img) {
                        ctx.save();
                        ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
                        ctx.shadowBlur = 8;
                        const drawSize = this.tileSize * 1.5;
                        const offset = (drawSize - this.tileSize) / 2;
                        ctx.drawImage(img, 0, 0, img.width, img.height,
                            Math.floor(ent.x - camera.x - offset),
                            Math.floor(ent.y - camera.y + this.tileSize - drawSize),
                            drawSize, drawSize);
                        ctx.restore();
                        continue;
                    }
                }

                if (ent.type === 'S') {
                    // Speed clover - Bottom Anchored
                    const ts = this.tileSize;
                    ctx.save();
                    const drawSize = ts * 1.5;
                    const ex = Math.floor(ent.x - camera.x + ts / 2);
                    // Critical Fix: Offset Y slightly upwards (+5) to ensure it's not clipped by overlapping tiles
                    const ey = Math.floor(ent.y - camera.y + ts - 5);

                    ctx.font = `${Math.floor(drawSize)}px serif`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'bottom';
                    ctx.shadowColor = 'rgba(0,0,0,0.5)';
                    ctx.shadowBlur = 4;
                    ctx.fillText("🍀", ex, ey);

                    ctx.fillStyle = '#f1c40f';
                    ctx.font = `bold ${Math.floor(ts * 0.35)}px monospace`;
                    ctx.fillText("SPEED!", ex, ey - drawSize * 0.85);
                    ctx.restore();
                    continue;
                }

                if (ent.type === 'R') {
                    // Reward Box -> Changed to Golden Carrot Style
                    const img = assets.getImage('golden_carrot');
                    const ts = this.tileSize;
                    const hts = ts / 2;
                    const gx = (ent.x - camera.x) | 0;
                    const gy = (ent.y - camera.y) | 0;

                    ctx.save();
                    const drawSize = ts * 3.0; // 3 blocks tall/wide
                    const offset = (drawSize - ts) / 2;

                    // Draw anchored to bottom: (gy + ts) is bottom of cell
                    const drawX = gx - offset;
                    const drawY = (gy + ts) - drawSize;

                    if (img) {
                        ctx.drawImage(img, 0, 0, img.width, img.height, drawX, drawY, drawSize, drawSize);
                    } else {
                        ctx.font = `${ts}px serif`;
                        ctx.fillText("🏆", gx + hts, gy + ts);
                    }

                    // Add sparkle effect
                    ctx.fillStyle = '#FFD700';
                    ctx.globalAlpha = Math.random();
                    ctx.beginPath();
                    ctx.arc(gx + hts, gy + hts, ts * 0.2, 0, Math.PI * 2);
                    ctx.fill();

                    ctx.restore();
                    continue;
                }

                if (tileset) {
                    let sx = 0;
                    let sy = ts;
                    // Fallback using tileset if individual image not found
                    if (ent.type === 'G') sx = ts;
                    if (ent.type === 'C') sx = ts * 2;

                    if (ent.type !== 'S') { // S handled above
                        ctx.drawImage(
                            tileset,
                            sx, sy, ts, ts,
                            Math.floor(ent.x - camera.x),
                            Math.floor(ent.y - camera.y),
                            this.tileSize, this.tileSize
                        );
                    }
                }
            }
        }
    }

    drawToyBlock(ctx, type, x, y, size, c, r) {
        ctx.save();

        let baseColor, litColor, darkColor, shadowColor;

        if (type === '#') { // Ground - Vibrant Plastic Red
            baseColor = '#e74c3c'; litColor = '#ff7675'; darkColor = '#c0392b'; shadowColor = '#922b21';
        } else if (type === 'D') { // Dirt/Wall - Vibrant Plastic Blue
            baseColor = '#3498db'; litColor = '#74b9ff'; darkColor = '#2980b9'; shadowColor = '#1f618d';
        } else if (type === 'B') { // Platform - Vibrant Plastic Yellow
            baseColor = '#f1c40f'; litColor = '#fcd670'; darkColor = '#f39c12'; shadowColor = '#d35400';
        }

        // 1. Block Body with Rounded Bevel Logic
        // Calculate gradient for main body
        const bodyGrad = ctx.createLinearGradient(x, y, x, y + size);
        bodyGrad.addColorStop(0, litColor);
        bodyGrad.addColorStop(0.5, baseColor);
        bodyGrad.addColorStop(1, darkColor);
        ctx.fillStyle = bodyGrad;

        // Draw main block
        ctx.fillRect(x, y, size, size);

        // 2. Inner Bevel Highlight (Top/Left) and Shadow (Bottom/Right)
        const bevelSize = 3;

        // Top Highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + size, y);
        ctx.lineTo(x + size - bevelSize, y + bevelSize);
        ctx.lineTo(x + bevelSize, y + bevelSize);
        ctx.lineTo(x + bevelSize, y + size - bevelSize);
        ctx.lineTo(x, y + size);
        ctx.closePath();
        ctx.fill();

        // Bottom Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.moveTo(x + size, y + size);
        ctx.lineTo(x, y + size);
        ctx.lineTo(x + bevelSize, y + size - bevelSize);
        ctx.lineTo(x + size - bevelSize, y + size - bevelSize);
        ctx.lineTo(x + size - bevelSize, y + bevelSize);
        ctx.lineTo(x + size, y);
        ctx.closePath();
        ctx.fill();

        // 3. Studs (Simulated 3D cylinders on top)
        // Only draw studs if there is no block above, or for decoration
        // For ground/dirt, standard LEGO studs on top
        if (type === '#' || type === 'D') {
            const hasTop = (r > 0 && this.matrix[r - 1] && this.matrix[r - 1][c] === type);
            // Even if there is a block on top, we might want to draw partial texture, but usually studs are hidden.
            // Let's draw studs only if open air above to emphasize the "Lego" look of the surface.
            if (!hasTop) {
                const studRadius = size * 0.18;
                const studHeight = size * 0.08;
                const studOffset = size * 0.25; // Quarter positions

                this.drawStud(ctx, x + studOffset, y, studRadius, studHeight, baseColor, litColor, darkColor);
                this.drawStud(ctx, x + size - studOffset, y, studRadius, studHeight, baseColor, litColor, darkColor);
            } else {
                // Inner join line to show stacked blocks
                ctx.fillStyle = 'rgba(0,0,0,0.1)';
                ctx.fillRect(x, y, size, 2);
            }
        }

        // 4. Platform Decoration (Premium Gift Box)
        if (type === 'B') {
            // Side indentation to make it look like a crate/box
            ctx.fillStyle = 'rgba(0,0,0,0.1)';
            ctx.fillRect(x + 4, y + 4, size - 8, size - 8);

            // Re-fill brighter center
            ctx.fillStyle = bodyGrad;
            ctx.fillRect(x + 6, y + 6, size - 12, size - 12);

            // Ribbon - Vibrant Pink
            const ribbonColor = '#e056fd';
            const ribbonLight = '#f3a6ff';
            const ribbonShadow = '#be2edd';

            const rw = size * 0.2; // Ribbon Width
            const cx = x + size / 2;
            const cy = y + size / 2;

            // Vertical Ribbon
            const vGrad = ctx.createLinearGradient(cx - rw / 2, y, cx + rw / 2, y);
            vGrad.addColorStop(0, ribbonShadow);
            vGrad.addColorStop(0.5, ribbonColor);
            vGrad.addColorStop(1, ribbonShadow);
            ctx.fillStyle = vGrad;
            ctx.fillRect(cx - rw / 2, y + 2, rw, size - 4);

            // Horizontal Ribbon
            const hGrad = ctx.createLinearGradient(x, cy - rw / 2, x, cy + rw / 2);
            hGrad.addColorStop(0, ribbonShadow);
            hGrad.addColorStop(0.5, ribbonColor);
            hGrad.addColorStop(1, ribbonShadow);
            ctx.fillStyle = hGrad;
            ctx.fillRect(x + 2, cy - rw / 2, size - 4, rw);

            // Bow Tie Center
            ctx.fillStyle = ribbonLight;
            ctx.beginPath();
            ctx.arc(cx, cy, rw * 0.8, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = ribbonShadow;
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // 5. Glossy Sheen (Arc reflection)
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(x + size * 0.2, y + size * 0.2, size * 0.3, size * 0.15, -Math.PI / 4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fill();
        ctx.restore();

        ctx.restore();
    }

    drawStud(ctx, cx, cy, radius, height, base, lit, dark) {
        // Stud is drawn *above* the y line, so simple geometry shift
        // But since we are rendering tiles top-down, drawing "above" y might overlap previous row?
        // Actually, we render row by row. If we draw outside (y < current_y), it might get overwritten by the previous row if the previous row was drawn *after*? 
        // No, loop is startRow to endRow. Previous row (y-1) is drawn BEFORE current row (y).
        // So drawing ABOVE y (into y-1 space) will OVERWRITE the previous row's bottom pixels.
        // This is perfect for 3D effect overlapping.

        const topY = cy - height;

        // Shadow (cylinder side)
        ctx.fillStyle = dark;
        ctx.beginPath();
        ctx.moveTo(cx - radius, cy); // Base left
        ctx.lineTo(cx + radius, cy); // Base right
        ctx.lineTo(cx + radius, topY); // Top right
        ctx.lineTo(cx - radius, topY); // Top left
        ctx.closePath();
        ctx.fill();

        // Base connector shading (where stud meets block)
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.beginPath();
        ctx.ellipse(cx, cy, radius, radius * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Stud Top Surface
        const grad = ctx.createRadialGradient(cx - radius * 0.3, topY - radius * 0.3, 0, cx, topY, radius);
        grad.addColorStop(0, lit);
        grad.addColorStop(1, base);

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(cx, topY, radius, radius * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Top Rim Highlight
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(cx, topY, radius * 0.9, radius * 0.35, 0, 0, Math.PI * 2);
        ctx.stroke();

        // "R" logo on stud
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.font = `bold ${Math.floor(radius)}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('R', cx, topY);
    }

    drawHospitalBlock(ctx, assets, type, x, y, size, c, r) {
        // Direct rendering mode - bypassing image check to ensure rich procedural look
        // (User requested rich blocks, so we force procedural here unless we had high-res assets)

        ctx.save();

        if (type === '#') { // Floor: Sterile White Tiles
            // Base: Very light blue-grey
            const grad = ctx.createLinearGradient(x, y, x, y + size);
            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(1, '#dfe6e9');
            ctx.fillStyle = grad;
            ctx.fillRect(x, y, size, size);

            // Tile Grid Pattern (2x2 sub-tiles)
            ctx.strokeStyle = '#b2bec3';
            ctx.lineWidth = 1;
            ctx.beginPath();
            // Vertical middle
            ctx.moveTo(x + size * 0.5, y);
            ctx.lineTo(x + size * 0.5, y + size);
            // Horizontal middle
            ctx.moveTo(x, y + size * 0.5);
            ctx.lineTo(x + size, y + size * 0.5);
            ctx.stroke();

            // Reflection / Gloss (Diagonal sheen)
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.beginPath();
            ctx.moveTo(x, y + size);
            ctx.lineTo(x + size, y);
            ctx.lineTo(x + size, y + size * 0.3);
            ctx.lineTo(x + size * 0.3, y + size);
            ctx.closePath();
            ctx.fill();

            // Top Edge Highlight
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(x, y, size, 2);

        } else if (type === 'D') { // Wall: Medical Panel (Teal & Metal)
            const baseColor = '#20bf6b'; // Medical Green/Teal
            const darkColor = '#0fb9b1';

            // Panel Body
            ctx.fillStyle = baseColor;
            ctx.fillRect(x, y, size, size);

            // Inset Panel Look
            ctx.fillStyle = 'rgba(0,0,0,0.1)';
            ctx.fillRect(x + 4, y + 4, size - 8, size - 8);
            ctx.fillStyle = darkColor;
            ctx.fillRect(x + 6, y + 6, size - 12, size - 12);

            // Medical Cross Symbol (+)
            ctx.fillStyle = '#f5f6fa'; // White
            ctx.shadowColor = 'rgba(0,0,0,0.2)';
            ctx.shadowBlur = 4;
            const th = size * 0.15; // thickness
            const len = size * 0.5; // length
            const cx = x + size / 2;
            const cy = y + size / 2;

            ctx.fillRect(cx - th / 2, cy - len / 2, th, len); // Vertical
            ctx.fillRect(cx - len / 2, cy - th / 2, len, th); // Horizontal
            ctx.shadowBlur = 0;

            // Metallic Border (Bolt details)
            ctx.strokeStyle = '#a5b1c2';
            ctx.lineWidth = 4;
            ctx.strokeRect(x + 2, y + 2, size - 4, size - 4);

            // Bolts at corners
            ctx.fillStyle = '#d1d8e0';
            const boltOff = 6;
            const boltR = 2;
            [[boltOff, boltOff], [size - boltOff, boltOff], [boltOff, size - boltOff], [size - boltOff, size - boltOff]].forEach(pos => {
                ctx.beginPath();
                ctx.arc(x + pos[0], y + pos[1], boltR, 0, Math.PI * 2);
                ctx.fill();
            });

        } else if (type === 'B') { // Platform: High-Tech Stretcher / Bed
            // 1. Frame (Silver/Steel)
            const frameH = size * 0.3;
            const frameY = y + size - frameH;

            const frameGrad = ctx.createLinearGradient(x, frameY, x, y + size);
            frameGrad.addColorStop(0, '#7f8c8d');
            frameGrad.addColorStop(0.2, '#bdc3c7'); // Highlight
            frameGrad.addColorStop(0.5, '#7f8c8d');
            frameGrad.addColorStop(1, '#2c3e50');
            ctx.fillStyle = frameGrad;
            ctx.fillRect(x, frameY, size, frameH);

            // 2. Mattress (Blue/White Medical Fabric)
            const matH = size * 0.5;
            const matY = y + size * 0.2; // Floating slightly or connected

            // Soft rounded look
            ctx.fillStyle = '#2bcbba'; // Cyan-ish
            ctx.beginPath();
            ctx.moveTo(x, matY);
            ctx.lineTo(x + size, matY);
            ctx.lineTo(x + size, frameY);
            ctx.lineTo(x, frameY);
            ctx.fill();

            // Mattress Highlight (Top surface)
            ctx.fillStyle = '#81ecec';
            ctx.fillRect(x, matY, size, matH * 0.3);

            // 3. Side Rail / Detail
            ctx.fillStyle = '#ecf0f1';
            ctx.fillRect(x + 2, frameY + 5, size - 4, frameH - 10);

            // Little LED indicators
            ctx.fillStyle = '#eb4d4b'; // Red LED
            ctx.beginPath(); ctx.arc(x + size * 0.15, frameY + frameH / 2, 3, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#6ab04c'; // Green LED
            ctx.beginPath(); ctx.arc(x + size * 0.30, frameY + frameH / 2, 3, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#f9ca24'; // Yellow LED
            ctx.beginPath(); ctx.arc(x + size * 0.45, frameY + frameH / 2, 3, 0, Math.PI * 2); ctx.fill();
        }

        // Common Outline for cleanliness
        // ctx.strokeStyle = 'rgba(0,0,0,0.1)';
        // ctx.lineWidth = 1;
        // ctx.strokeRect(x, y, size, size);

        ctx.restore();
    }

    drawHeavenBlock(ctx, assets, type, x, y, size, c, r) {
        // Prepare assets
        const floorImg = assets.getImage('temple_tile_floor');
        const wallImg = assets.getImage('temple_tile_wall');
        const pillarImg = assets.getImage('golden_pillar');

        ctx.save();

        // 1. Draw Base (Opaque) - Essential for non-transparency
        let baseColor = '#ffffff';
        let detailColor = '#f1f2f6';
        if (type === 'D') { baseColor = '#dfe4ea'; detailColor = '#f5f6fa'; }
        if (type === 'B') { baseColor = '#f1c40f'; detailColor = '#feca57'; }

        ctx.fillStyle = baseColor;
        ctx.fillRect(x, y, size, size);

        // 2. Resolve image and draw on top
        let img = null;
        if (type === '#' && floorImg) img = floorImg;
        else if (type === 'D' && wallImg) img = wallImg;
        else if (type === 'B' && pillarImg) img = pillarImg;

        // Draw image asset if valid (removed data:image restriction)
        if (img && img.width > 0) {
            ctx.drawImage(img, x, y, size, size);
        }

        // 3. Procedural "Heavenly" Details (Gloss, Marble, Borders)
        if (type === '#' || type === 'D') {
            // Soft bevel/inner glow
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.lineWidth = 2;
            ctx.strokeRect(x + 1, y + 1, size - 2, size - 2);

            // Subtle marble-like reflection
            const grad = ctx.createLinearGradient(x, y, x + size, y + size);
            grad.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
            grad.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
            grad.addColorStop(1, 'rgba(200, 214, 229, 0.1)');
            ctx.fillStyle = grad;
            ctx.fillRect(x, y, size, size);

            // Clean bottom shadow for depth
            ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            ctx.fillRect(x, y + size - 2, size, 2);

        } else if (type === 'B') {
            // Golden Pillar Shading
            const pGrad = ctx.createLinearGradient(x, y, x + size, y);
            pGrad.addColorStop(0, 'rgba(0, 0, 0, 0.2)');
            pGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.4)');
            pGrad.addColorStop(1, 'rgba(0, 0, 0, 0.2)');
            ctx.fillStyle = pGrad;
            ctx.fillRect(x + size * 0.15, y, size * 0.7, size);

            // Top/Bottom banding
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.fillRect(x, y, size, 4);
            ctx.fillRect(x, y + size - 4, size, 4);
        }

        // Subtle dark outline for definition
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, size, size);

        ctx.restore();
    }
}
