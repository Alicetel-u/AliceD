/**
 * StageUI.js
 * ステージプレイ中のUI (Deep Smoked Glass Theme)
 */
export class StageUI {
    constructor(game) {
        this.game = game;
        this.ctx = game.ctx;
        this.time = 0;
        this.prevBossHp = 0;
        this.hpShake = 0;
        this.cache = {};
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
        const cacheKey = `${meterW}_${meterH}_${isBossBattle}_glass_v4`;
        if (this.cache.key === cacheKey) return;

        this.cache.key = cacheKey;

        // 1. Surface Specular Highlights
        const highGrad = this.ctx.createLinearGradient(meterX, meterY, meterX, meterY + meterH);
        highGrad.addColorStop(0, 'rgba(255, 255, 255, 0.5)');
        highGrad.addColorStop(0.05, 'rgba(255, 255, 255, 0.2)');
        highGrad.addColorStop(0.4, 'rgba(255, 255, 255, 0)');
        highGrad.addColorStop(0.6, 'rgba(255, 255, 255, 0)');
        highGrad.addColorStop(0.95, 'rgba(255, 255, 255, 0.1)');
        highGrad.addColorStop(1, 'rgba(255, 255, 255, 0.3)');
        this.cache.highGrad = highGrad;

        // 2. Liquid Glass Gradients
        // Normal: VIBRANT BOLD Orange
        const fluidGrad = this.ctx.createLinearGradient(meterX, meterY, meterX + meterW, meterY);
        fluidGrad.addColorStop(0, '#ff4400'); // Deep Reddish Orange
        fluidGrad.addColorStop(0.4, '#ff8800'); // Bold Orange
        fluidGrad.addColorStop(0.8, '#ffaa00'); // Bright Golden Orange
        fluidGrad.addColorStop(1, '#ffcc00'); // Yellowish end
        this.cache.fluidGrad = fluidGrad;

        // Boss HP: Deep Garnet (Consistent)
        const hpGrad = this.ctx.createLinearGradient(meterX, meterY, meterX + meterW, meterY);
        hpGrad.addColorStop(0, '#220000');
        hpGrad.addColorStop(0.3, '#770000');
        hpGrad.addColorStop(0.7, '#cc0000');
        hpGrad.addColorStop(1, '#ff3333');
        this.cache.hpGrad = hpGrad;

        // Barrier: PURPLE LASER Core
        const barrierGrad = this.ctx.createLinearGradient(meterX, meterY, meterX + meterW, meterY);
        barrierGrad.addColorStop(0, '#330066'); // Dark Purple
        barrierGrad.addColorStop(0.5, '#aa00ff'); // Vivid Purple
        barrierGrad.addColorStop(1, '#ff00ff'); // Magenta Laser
        this.cache.barrierGrad = barrierGrad;

        const auraColor = isBossBattle ? '#ff3333' : '#ffaa00';
        const radGrad = this.ctx.createRadialGradient(0, 0, 10, 0, 0, 80);
        radGrad.addColorStop(0, auraColor);
        radGrad.addColorStop(0.3, auraColor + '44');
        radGrad.addColorStop(1, 'rgba(0,0,0,0)');
        this.cache.auraGrad = radGrad;
    }

    drawAuroraMeter() {
        const { width, height, state, boss, player, stageScoreGained } = this.game;
        const isBossBattle = state === 'BOSS_BATTLE';
        const t = this.time;

        const meterW = width * 0.85;
        const meterH = 68;
        const meterX = (width - meterW) / 2;
        const meterY = height - 95;

        this.refreshCaches(meterX, meterY, meterW, meterH, isBossBattle);

        this.ctx.save();

        // 1. Smoked Glass Casing
        this.ctx.fillStyle = 'rgba(5, 5, 8, 0.9)';
        this.ctx.beginPath();
        this.ctx.roundRect(meterX, meterY, meterW, meterH, 14);
        this.ctx.fill();

        // 2. Heavy Glass Border
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();

        this.ctx.strokeStyle = isBossBattle ? 'rgba(255, 0, 0, 0.6)' : 'rgba(255, 136, 0, 0.5)';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();

        // 3. Inner Clipping
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.roundRect(meterX + 4, meterY + 4, meterW - 8, meterH - 8, 10);
        this.ctx.clip();

        if (isBossBattle && boss) {
            this.drawBossFluid(meterX, meterY, meterW, meterH, boss, stageScoreGained);
        } else {
            this.drawProgressFluid(meterX, meterY, meterW, meterH);
        }

        // 4. Center Etched Divider (REMOVED splitY logic for full height)
        // No divider for unified bar

        // 5. Polished Glass Highlights
        this.ctx.globalCompositeOperation = 'screen';
        this.ctx.fillStyle = this.cache.highGrad;
        this.ctx.fillRect(meterX, meterY, meterW, meterH);

        // Dynamic Reflection Sweep
        const sweepX = ((t * 150) % (meterW * 3)) - meterW;
        const sweepGrad = this.ctx.createLinearGradient(meterX + sweepX, meterY, meterX + sweepX + 120, meterY);
        sweepGrad.addColorStop(0, 'rgba(255,255,255,0)');
        sweepGrad.addColorStop(0.5, 'rgba(255,255,255,0.2)');
        sweepGrad.addColorStop(1, 'rgba(255,255,255,0)');
        this.ctx.fillStyle = sweepGrad;
        this.ctx.fillRect(meterX, meterY, meterW, meterH);

        this.ctx.restore();

        // 6. Avatar Icon (Unified 60px)
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

        const pulse = 1.0 + Math.sin(t * 8) * 0.12;
        this.ctx.scale(pulse, pulse);
        this.ctx.globalCompositeOperation = 'screen';
        this.ctx.fillStyle = this.cache.auraGrad;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 80, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.globalCompositeOperation = 'source-over';
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = 'rgba(0,0,0,0.5)';
        this.ctx.font = 'bold 60px serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        // BOSS時：盾アイコン / 通常時：ウサギアイコン
        const avatarIcon = isBossBattle ? "🛡️" : "🐰";
        this.ctx.fillText(avatarIcon, 0, Math.sin(t * 8) * 4);
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

        this.ctx.save();

        // Vibrant Orange Body
        this.ctx.fillStyle = this.cache.fluidGrad;
        this.ctx.fillRect(x, y, fillW, h);

        // Core Intensity Line
        this.ctx.globalCompositeOperation = 'lighter';
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        this.ctx.fillRect(x, y + h * 0.45, fillW, 2);

        this.ctx.restore();

        this.ctx.fillStyle = '#fff';
        this.ctx.shadowBlur = 12;
        this.ctx.shadowColor = 'rgba(0,0,0,0.6)';
        this.ctx.font = 'bold 60px serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText("🏁", x + w - 50, y + h / 2);
    }

    drawBossFluid(x, y, w, h, boss, stageScore) {
        const hpRatio = Math.max(0, boss.hp / boss.maxHp);
        if (boss.hp < this.prevBossHp) this.hpShake = 15;
        this.prevBossHp = boss.hp;
        const shakeX = (this.hpShake > 0) ? (Math.random() - 0.5) * 12 : 0;
        if (this.hpShake > 0) this.hpShake--;

        const t = this.time;
        const hpW = w * hpRatio;

        this.ctx.save();
        this.ctx.translate(shakeX, 0);

        // 1. HP Gauge (Deep Red)
        this.ctx.fillStyle = this.cache.hpGrad;
        this.ctx.fillRect(x, y, hpW, h);

        // Glass Shadow Interior
        const hpShadow = this.ctx.createLinearGradient(x, y, x, y + h);
        hpShadow.addColorStop(0, 'rgba(0,0,0,0.35)');
        hpShadow.addColorStop(1, 'rgba(0,0,0,0.2)');
        this.ctx.fillStyle = hpShadow;
        this.ctx.fillRect(x, y, hpW, h);

        // 2. Barrier Layer (PURPLE LASER)
        const barrierGoal = this.getBarrierGoal();
        const barrierRatio = Math.min(1.0, stageScore / barrierGoal);

        if (boss.isInvulnerable) {
            const barW = w * barrierRatio;

            // A. Dense Purple Base
            this.ctx.fillStyle = this.cache.barrierGrad;
            this.ctx.globalAlpha = 0.7;
            this.ctx.fillRect(x, y, barW, h);

            // B. Laser Pulse Core
            this.ctx.globalCompositeOperation = 'lighter';
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            this.ctx.fillRect(x, y + h * 0.4, barW, 4); // Bright laser line

            // C. Crackling Sparks (稲妻エフェクト)
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 1.5;
            for (let i = 0; i < 3; i++) {
                if (Math.random() > 0.4) {
                    let sx = x + Math.random() * barW;
                    let sy = y + Math.random() * h;
                    this.ctx.beginPath();
                    this.ctx.moveTo(sx, sy);
                    for (let j = 0; j < 3; j++) {
                        sx += (Math.random() - 0.5) * 30;
                        sy += (Math.random() - 0.5) * 30;
                        this.ctx.lineTo(sx, sy);
                    }
                    this.ctx.stroke();
                }
            }

            // D. Barrier Text (Removed icon)
            this.ctx.globalAlpha = 1.0;
            this.ctx.globalCompositeOperation = 'source-over';
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 26px monospace';
            this.ctx.textAlign = 'left';
            this.ctx.textBaseline = 'middle';
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = '#cc00ff';
            this.ctx.fillText(`PURPLE BARRIER: ${Math.floor(stageScore)}/${barrierGoal}`, x + 40, y + h / 2);
            this.ctx.shadowBlur = 0;
        } else {
            // Critical Alert Pulse (When barrier is broken)
            if (hpRatio < 0.3) {
                this.ctx.globalAlpha = 0.3 + Math.sin(t * 20) * 0.3;
                this.ctx.fillStyle = '#ff3333';
                this.ctx.fillRect(x, y, hpW, h);
                this.ctx.globalAlpha = 1.0;
            }

            // Broken state
            this.ctx.fillStyle = `rgba(255, 255, 255, ${0.8 + Math.sin(t * 40) * 0.2})`;
            this.ctx.font = 'bold 28px monospace';
            this.ctx.textAlign = 'left';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText("⚡ BARRIER SHATTERED ⚡", x + 40, y + h / 2);
        }

        this.ctx.restore();

        // Boss Icon inside the bar
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = 'rgba(0,0,0,0.5)';
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 60px serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText("👿", x + w - 50, y + h / 2);
    }

    drawBossIndicator(dist, w, h) {
        const arrowX = dist > 0 ? w - 70 : 70;
        this.ctx.save();
        this.ctx.translate(arrowX, h / 2);
        const bounce = Math.sin(this.time * 8) * 12;
        this.ctx.fillStyle = '#ff3333';
        this.ctx.font = 'bold 60px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.shadowBlur = 20;
        this.ctx.shadowColor = '#ff0000';

        // 矢印表示に戻す
        this.ctx.fillText(dist > 0 ? "➔" : "←", bounce, 0);
        this.ctx.restore();
    }
}
