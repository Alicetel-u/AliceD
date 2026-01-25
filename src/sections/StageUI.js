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

        // 1. Crystal Glass Overlay (Specular highlights)
        const highGrad = this.ctx.createLinearGradient(meterX, meterY, meterX, meterY + meterH);
        highGrad.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
        highGrad.addColorStop(0.1, 'rgba(255, 255, 255, 0.6)'); // Sharp top highlight
        highGrad.addColorStop(0.2, 'rgba(255, 255, 255, 0.2)');
        highGrad.addColorStop(0.4, 'rgba(255, 255, 255, 0.05)');
        highGrad.addColorStop(0.6, 'rgba(255, 255, 255, 0)');
        highGrad.addColorStop(0.9, 'rgba(255, 255, 255, 0.15)'); // Bottom reflection
        highGrad.addColorStop(1, 'rgba(255, 255, 255, 0.3)');
        this.cache.highGrad = highGrad;

        // 2. Rich Liquid Gradients
        const fluidGrad = this.ctx.createLinearGradient(meterX, meterY, meterX + meterW, meterY);
        fluidGrad.addColorStop(0, '#0022aa');
        fluidGrad.addColorStop(0.5, '#0099ff');
        fluidGrad.addColorStop(1, '#00ffff');
        this.cache.fluidGrad = fluidGrad;

        const hpGrad = this.ctx.createLinearGradient(meterX, meterY, meterX + meterW, meterY);
        hpGrad.addColorStop(0, '#660000');
        hpGrad.addColorStop(0.5, '#ff0033');
        hpGrad.addColorStop(1, '#ff8800');
        this.cache.hpGrad = hpGrad;

        const barrierGrad = this.ctx.createLinearGradient(meterX, meterY, meterX + meterW, meterY);
        barrierGrad.addColorStop(0, '#cc8800');
        barrierGrad.addColorStop(1, '#ffff00');
        this.cache.barrierGrad = barrierGrad;

        const auraColor = isBossBattle ? '#ffaa00' : '#00ffaa';
        const radGrad = this.ctx.createRadialGradient(0, 0, 5, 0, 0, 45);
        radGrad.addColorStop(0, auraColor);
        radGrad.addColorStop(0.4, auraColor + '66');
        radGrad.addColorStop(1, 'rgba(0,0,0,0)');
        this.cache.auraGrad = radGrad;
    }

    drawAuroraMeter() {
        const { width, height, state, boss, player, stageScoreGained } = this.game;
        const isBossBattle = state === 'BOSS_BATTLE';
        const t = this.time;

        const meterW = width * 0.8;
        const meterH = 40;
        const meterX = (width - meterW) / 2;
        const meterY = height - 60;

        this.refreshCaches(meterX, meterY, meterW, meterH, isBossBattle);

        this.ctx.save();

        // 1. Frosted Crystal Container
        this.ctx.fillStyle = 'rgba(5, 10, 20, 0.75)';
        this.ctx.beginPath();
        this.ctx.roundRect(meterX, meterY, meterW, meterH, 12);
        this.ctx.fill();

        // Neon Edge (Thin but sharp)
        this.ctx.shadowBlur = 12;
        this.ctx.shadowColor = isBossBattle ? '#ff0055' : '#00ffff';
        this.ctx.strokeStyle = isBossBattle ? 'rgba(255, 0, 85, 0.7)' : 'rgba(0, 255, 255, 0.7)';
        this.ctx.lineWidth = 2.5;
        this.ctx.stroke();
        this.ctx.shadowBlur = 0;

        // 2. Liquid Content (Clipped)
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.roundRect(meterX + 2, meterY + 2, meterW - 4, meterH - 4, 10);
        this.ctx.clip();

        if (isBossBattle && boss) {
            this.drawBossFluid(meterX, meterY, meterW, meterH, boss, stageScoreGained);
        } else {
            this.drawProgressFluid(meterX, meterY, meterW, meterH);
        }

        // Periodic Sweep Shine 에フェクト (diagonal gleam)
        const sweepT = (this.time * 0.4) % 3.0;
        if (sweepT < 1.0) {
            const sweepX = meterX + (meterW + 200) * sweepT - 100;
            const grad = this.ctx.createLinearGradient(sweepX, meterY, sweepX + 100, meterY);
            grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
            grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
            grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
            this.ctx.globalCompositeOperation = 'screen';
            this.ctx.fillStyle = grad;
            this.ctx.fillRect(meterX, meterY, meterW, meterH);
        }

        // Top Gloss Overlay (The most important part for glass feel)
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

        // Rich Aura Glow (using lighter and cached radial gradient)
        this.ctx.globalCompositeOperation = 'lighter';
        const pulse = 1.0 + Math.sin(t * 8) * 0.1;
        this.ctx.scale(pulse, pulse);
        this.ctx.fillStyle = this.cache.auraGrad;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 40, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.globalCompositeOperation = 'source-over';
        this.ctx.font = 'bold 36px serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText("🐰", 0, Math.sin(t * 8) * 3);
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

        this.ctx.globalCompositeOperation = 'lighter';
        this.ctx.fillStyle = this.cache.fluidGrad;
        const fillW = w * progress;
        this.ctx.fillRect(x, y, fillW, h);

        // Soft Glowing Crystal Particles
        const t = this.time;
        for (let i = 0; i < 6; i++) {
            const phase = i * 1.5;
            const px = (t * 30 + i * 100) % fillW;
            const py = y + h * 0.5 + Math.sin(t + phase) * (h * 0.25);
            const alpha = 0.2 + Math.abs(Math.sin(t * 1.5 + phase)) * 0.4;
            const size = 1.5 + Math.abs(Math.cos(t * 0.8 + phase)) * 3;

            this.ctx.fillStyle = `rgba(180, 240, 255, ${alpha})`;
            this.ctx.beginPath();
            this.ctx.arc(x + px, py, size, 0, Math.PI * 2);
            this.ctx.fill();
        }

        this.ctx.globalCompositeOperation = 'source-over';
        this.ctx.font = '24px serif';
        this.ctx.fillText("🏁", x + w - 25, y + h / 2 + 8);
    }

    drawBossFluid(x, y, w, h, boss, stageScore) {
        const hpRatio = Math.max(0, boss.hp / boss.maxHp);
        if (boss.hp < this.prevBossHp) this.hpShake = 10;
        this.prevBossHp = boss.hp;
        const shakeX = (this.hpShake > 0) ? (Math.random() - 0.5) * 10 : 0;
        if (this.hpShake > 0) this.hpShake--;

        this.ctx.globalCompositeOperation = 'lighter';
        this.ctx.fillStyle = this.cache.hpGrad;
        this.ctx.fillRect(x + shakeX, y, w * hpRatio, h);

        const barrierGoal = this.getBarrierGoal();
        const barrierRatio = Math.min(1.0, stageScore / barrierGoal);

        if (boss.isInvulnerable) {
            this.ctx.fillStyle = this.cache.barrierGrad;
            this.ctx.fillRect(x, y, w * barrierRatio, h);

            this.ctx.globalCompositeOperation = 'source-over';
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 11px monospace';
            this.ctx.fillText(`🛡️ BARRIER: ${Math.floor(stageScore)}/${barrierGoal}`, x + 10, y + h - 5);
        } else {
            this.ctx.globalCompositeOperation = 'lighter';
            this.ctx.fillStyle = `rgba(255, 200, 0, ${0.5 + Math.sin(this.time * 20) * 0.3})`;
            this.ctx.font = 'bold 13px monospace';
            this.ctx.fillText("⚡ BROKEN ⚡", x + 10, y + h - 5);
        }

        this.ctx.globalCompositeOperation = 'source-over';
        this.ctx.font = '28px serif';
        this.ctx.fillText("👿", x + w - 30, y + h / 2 + 10);
    }

    drawBossIndicator(dist, w, h) {
        const arrowX = dist > 0 ? w - 60 : 60;
        this.ctx.save();
        this.ctx.translate(arrowX, h / 2);
        const bounce = Math.sin(this.time * 5) * 8;
        this.ctx.fillStyle = '#ff4757';
        this.ctx.font = 'bold 40px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(dist > 0 ? "➔" : "←", bounce, 0);
        this.ctx.restore();
    }
}
