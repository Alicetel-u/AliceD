/**
 * StageUI.js
 * ステージプレイ中のUI（ナビゲーション、HUD、警告表示など）を専門に扱うクラス
 * "Aurora Cyber-Glass Meter" Design Implementation
 */
export class StageUI {
    constructor(game) {
        this.game = game;
        this.ctx = game.ctx;
        this.time = 0;
        this.prevBossHp = 0;
        this.hpShake = 0;
        this.cache = {}; // Cache for gradients and static visuals
    }

    draw() {
        if (!this.game.player) return;
        this.time += 0.05;
        if (this.game.state === 'PLAYING' || this.game.state === 'BOSS_BATTLE') {
            this.drawAuroraMeter();
        }
    }

    getBarrierGoal() { return 200; }

    refreshCaches(meterX, meterY, meterW, meterH, isBossBattle) {
        const cacheKey = `${meterW}_${meterH}_${isBossBattle}`;
        if (this.cache.key === cacheKey) return;

        this.cache.key = cacheKey;

        // 1. Premium Glass Tube Gradient (Cylindrical look)
        const highGrad = this.ctx.createLinearGradient(meterX, meterY, meterX, meterY + meterH);
        highGrad.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
        highGrad.addColorStop(0.1, 'rgba(255, 255, 255, 0.4)'); // Top highlight
        highGrad.addColorStop(0.2, 'rgba(255, 255, 255, 0.1)');
        highGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
        highGrad.addColorStop(0.8, 'rgba(255, 255, 255, 0.05)');
        highGrad.addColorStop(1, 'rgba(255, 255, 255, 0.2)'); // Bottom reflection
        this.cache.highGrad = highGrad;

        // 2. Multi-layered Fluid Gradients
        const fluidGrad = this.ctx.createLinearGradient(meterX, meterY, meterX + meterW, meterY);
        fluidGrad.addColorStop(0, '#0044cc');
        fluidGrad.addColorStop(0.5, '#00aaff');
        fluidGrad.addColorStop(1, '#00ffff');
        this.cache.fluidGrad = fluidGrad;

        const hpGrad = this.ctx.createLinearGradient(meterX, meterY, meterX + meterW, meterY);
        hpGrad.addColorStop(0, '#660000');
        hpGrad.addColorStop(0.4, '#ff0033');
        hpGrad.addColorStop(1, '#ff8800');
        this.cache.hpGrad = hpGrad;

        const barrierGrad = this.ctx.createLinearGradient(meterX, meterY, meterX + meterW, meterY);
        barrierGrad.addColorStop(0, '#cc8800');
        barrierGrad.addColorStop(1, '#ffff00');
        this.cache.barrierGrad = barrierGrad;

        const auraColor = isBossBattle ? '#ffaa00' : '#00ffaa';
        const radGrad = this.ctx.createRadialGradient(0, 0, 10, 0, 0, 60);
        radGrad.addColorStop(0, auraColor);
        radGrad.addColorStop(0.4, auraColor + '66');
        radGrad.addColorStop(1, 'rgba(0,0,0,0)');
        this.cache.auraGrad = radGrad;
    }

    drawAuroraMeter() {
        const { width, height, state, boss, player, stageScoreGained } = this.game;
        const isBossBattle = state === 'BOSS_BATTLE';
        const t = this.time;

        const meterW = width * 0.85;
        const meterH = 65;
        const meterX = (width - meterW) / 2;
        const meterY = height - 90;

        this.refreshCaches(meterX, meterY, meterW, meterH, isBossBattle);

        this.ctx.save();

        // 1. Dark Glass Background
        this.ctx.fillStyle = 'rgba(5, 10, 20, 0.8)';
        this.ctx.beginPath();
        this.ctx.roundRect(meterX, meterY, meterW, meterH, 10);
        this.ctx.fill();

        // Border Glow
        this.ctx.shadowBlur = 20;
        this.ctx.shadowColor = isBossBattle ? '#ff0055' : '#00ffff';
        this.ctx.strokeStyle = isBossBattle ? 'rgba(255, 0, 85, 0.6)' : 'rgba(0, 255, 255, 0.6)';
        this.ctx.lineWidth = 4;
        this.ctx.stroke();
        this.ctx.shadowBlur = 0;

        // 2. Liquid Content with Mask
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.roundRect(meterX + 2, meterY + 2, meterW - 4, meterH - 4, 8);
        this.ctx.clip();

        if (isBossBattle && boss) {
            this.drawBossFluid(meterX, meterY, meterW, meterH, boss, stageScoreGained);
        } else {
            this.drawProgressFluid(meterX, meterY, meterW, meterH);
        }

        // Top Gloss Overlay
        this.ctx.globalCompositeOperation = 'screen';
        this.ctx.fillStyle = this.cache.highGrad;
        this.ctx.fillRect(meterX, meterY, meterW, meterH);
        this.ctx.restore();

        // 3. Avatar Icon
        const { preBossLength, tileSize } = this.game;
        let progress = 0;
        if (isBossBattle && boss) {
            const barrierGoal = this.getBarrierGoal();
            progress = Math.min(1.0, stageScoreGained / barrierGoal);
            if (!boss.isInvulnerable) progress = 1.0;
        } else {
            const currentBlockX = Math.floor(player.x / tileSize);
            progress = Math.min(1.0, Math.max(0, currentBlockX / preBossLength));
        }

        const iconX = meterX + (meterW * progress);
        this.ctx.save();
        this.ctx.translate(iconX, meterY + meterH / 2);

        const pulse = 1.0 + Math.sin(t * 8) * 0.15;
        this.ctx.scale(pulse, pulse);
        this.ctx.globalCompositeOperation = 'lighter';
        this.ctx.fillStyle = this.cache.auraGrad;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 70, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.globalCompositeOperation = 'source-over';
        this.ctx.font = 'bold 64px serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText("🐰", 0, Math.sin(t * 8) * 5);
        this.ctx.restore();

        this.ctx.restore();

        if (isBossBattle && boss) {
            const distToPlayer = boss.x - player.x;
            if (Math.abs(distToPlayer) > width * 0.85) {
                this.drawBossIndicator(distToPlayer, width, height);
            }
        }
    }

    drawProgressFluid(x, y, w, h) {
        const { player, preBossLength, tileSize } = this.game;
        const progress = Math.min(1.0, Math.max(0, Math.floor(player.x / tileSize) / preBossLength));
        const fillW = w * progress;
        const t = this.time;

        if (fillW <= 0) return;

        // Wave Logic
        this.ctx.save();
        this.ctx.fillStyle = this.cache.fluidGrad;

        // Layer 1: Back Wave
        this.ctx.globalAlpha = 0.5;
        this.drawWave(x, y, fillW, h, t * 2, 8, 100);

        // Layer 2: Front Wave
        this.ctx.globalAlpha = 1.0;
        this.ctx.globalCompositeOperation = 'lighter';
        this.drawWave(x, y, fillW, h, -t * 3, 5, 80);

        // Rich Glowing Bubbles
        this.ctx.fillStyle = 'rgba(200, 240, 255, 0.6)';
        for (let i = 0; i < 8; i++) {
            const bx = (t * 50 + i * 150) % fillW;
            const seed = i * 1.5;
            const by = y + h * 0.7 + Math.sin(t * 2 + seed) * (h * 0.2);
            const size = 2 + Math.abs(Math.sin(t + seed)) * 4;
            this.ctx.beginPath();
            this.ctx.arc(x + bx, by, size, 0, Math.PI * 2);
            this.ctx.fill();
        }
        this.ctx.restore();

        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 50px serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText("🏁", x + w - 40, y + h / 2);
    }

    drawWave(x, y, w, h, offset, amp, freq) {
        this.ctx.beginPath();
        this.ctx.moveTo(x, y + h);
        for (let ix = 0; ix <= w; ix += 5) {
            const iy = y + h * 0.3 + Math.sin(ix / freq + offset) * amp;
            this.ctx.lineTo(x + ix, iy);
        }
        this.ctx.lineTo(x + w, y + h);
        this.ctx.closePath();
        this.ctx.fill();
    }

    drawBossFluid(x, y, w, h, boss, stageScore) {
        const hpRatio = Math.max(0, boss.hp / boss.maxHp);
        if (boss.hp < this.prevBossHp) this.hpShake = 10;
        this.prevBossHp = boss.hp;
        const shakeX = (this.hpShake > 0) ? (Math.random() - 0.5) * 10 : 0;
        if (this.hpShake > 0) this.hpShake--;

        const fillW = w * hpRatio;
        const t = this.time;

        this.ctx.save();
        this.ctx.translate(shakeX, 0);
        this.ctx.fillStyle = this.cache.hpGrad;

        // HP Waves (Red/Energy)
        this.ctx.globalAlpha = 0.4;
        this.drawWave(x, y, fillW, h, t * 4, 10, 60);
        this.ctx.globalAlpha = 1.0;
        this.ctx.globalCompositeOperation = 'lighter';
        this.drawWave(x, y, fillW, h, -t * 5, 6, 40);
        this.ctx.restore();

        const barrierGoal = this.getBarrierGoal();
        const barrierRatio = Math.min(1.0, stageScore / barrierGoal);

        if (boss.isInvulnerable) {
            this.ctx.fillStyle = this.cache.barrierGrad;
            this.ctx.globalAlpha = 0.6;
            this.ctx.fillRect(x, y, w * barrierRatio, h);
            this.ctx.globalAlpha = 1.0;

            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 22px monospace';
            this.ctx.textAlign = 'left';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(`🛡️ BARRIER: ${Math.floor(stageScore)}/${barrierGoal}`, x + 25, y + h / 2);
        } else {
            this.ctx.fillStyle = `rgba(255, 200, 0, ${0.5 + Math.sin(this.time * 20) * 0.3})`;
            this.ctx.font = 'bold 28px monospace';
            this.ctx.textAlign = 'left';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText("⚡ BROKEN ⚡", x + 25, y + h / 2);
        }

        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 54px serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText("👿", x + w - 50, y + h / 2);
    }

    drawBossIndicator(dist, w, h) {
        const arrowX = dist > 0 ? w - 60 : 60;
        this.ctx.save();
        this.ctx.translate(arrowX, h / 2);
        const bounce = Math.sin(this.time * 5) * 8;
        this.ctx.fillStyle = '#ff4757';
        this.ctx.font = 'bold 72px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(dist > 0 ? "➔" : "←", bounce, 0);
        this.ctx.restore();
    }
}
