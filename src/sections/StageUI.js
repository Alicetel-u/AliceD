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
    }

    /**
     * メインの描画メソッド
     */
    draw() {
        if (!this.game.player) return; // Guard clause

        this.time += 0.05; // Animation timer

        if (this.game.state === 'PLAYING' || this.game.state === 'BOSS_BATTLE') {
            this.drawAuroraMeter();
        }
    }

    getBarrierGoal() {
        return 200;
    }

    /**
     * "Test Tube" Neon Meter
     * 試験管のようなガラスのメーター、発光する液体、目立つアイコン
     */
    drawAuroraMeter() {
        const { width, height, state, boss, player, stageScoreGained } = this.game;
        const isBossBattle = state === 'BOSS_BATTLE';
        const t = this.time;

        // Layout Config
        const meterW = width * 0.8;
        const meterH = 40; // 少し太くして試験管感を出す
        const meterX = (width - meterW) / 2;
        const meterY = height - 60;
        const radius = meterH / 2; // 完全な丸み（カプセル型）

        this.ctx.save();

        // Oscillation for "living" feel
        const pulse = Math.sin(t * 2) * 0.1 + 1.0;
        const glowIntensity = 20 + Math.sin(t * 5) * 10;

        // --- 1. Glass Container (Test Tube) ---
        // Back Glass (Dark)
        // Back Glass (Dark)
        this.ctx.beginPath();
        this.ctx.rect(meterX, meterY, meterW, meterH);
        this.ctx.fillStyle = 'rgba(10, 20, 30, 0.6)'; // 半透明の暗いガラス
        this.ctx.fill();

        // Neon Glow (Backlight)
        this.ctx.shadowBlur = glowIntensity;
        this.ctx.shadowColor = isBossBattle ? '#ff0055' : '#00ffff';
        this.ctx.strokeStyle = isBossBattle ? 'rgba(255, 0, 85, 0.5)' : 'rgba(0, 255, 255, 0.5)';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        this.ctx.shadowBlur = 0; // Reset

        // --- 2. Liquid Content (The Fluid) ---
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.rect(meterX + 2, meterY + 2, meterW - 4, meterH - 4);
        this.ctx.clip(); // 内部にクリッピング

        // Fluid Content Logic
        if (isBossBattle && boss) {
            this.drawBossFluid(meterX, meterY, meterW, meterH, boss, stageScoreGained);
        } else {
            this.drawProgressFluid(meterX, meterY, meterW, meterH);
        }

        // Glass Highlights (Tubular reflection)
        // Upper Highlight
        this.ctx.globalCompositeOperation = 'screen';
        const highGrad = this.ctx.createLinearGradient(meterX, meterY, meterX, meterY + meterH);
        highGrad.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
        highGrad.addColorStop(0.3, 'rgba(255, 255, 255, 0.1)');
        highGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
        highGrad.addColorStop(1, 'rgba(255, 255, 255, 0.2)');

        this.ctx.fillStyle = highGrad;
        this.ctx.beginPath();
        this.ctx.rect(meterX, meterY, meterW, meterH);
        this.ctx.fill();

        this.ctx.restore(); // End Clip/Composite

        // --- 3. Prominent Avatar (The Rabbit) ---
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

        // Icon Position
        let iconX = meterX + (meterW * progress);

        // Rabbit Icon Drawing
        this.ctx.save();
        this.ctx.translate(iconX, meterY + meterH / 2);

        // Icon Glow Layer (Lighter)
        this.ctx.globalCompositeOperation = 'lighter';
        const auraColor = isBossBattle ? '#ffaa00' : '#00ffaa';

        // Pulsing Aura (Background only)
        const iconPulse = 1.0 + Math.sin(t * 10) * 0.1;
        this.ctx.scale(iconPulse, iconPulse);

        const radGrad = this.ctx.createRadialGradient(0, 0, 10, 0, 0, 35);
        radGrad.addColorStop(0, auraColor);
        radGrad.addColorStop(1, 'rgba(0,0,0,0)');
        this.ctx.fillStyle = radGrad;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 35, 0, Math.PI * 2);
        this.ctx.fill();

        // Reset scale for text
        this.ctx.scale(1 / iconPulse, 1 / iconPulse);

        // The Rabbit (Normal Source Over, No Blur)
        this.ctx.globalCompositeOperation = 'source-over';
        this.ctx.shadowBlur = 0; // Remove text glow for clarity
        this.ctx.shadowColor = 'transparent';
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '36px serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        // Y揺れ
        const bobble = Math.sin(t * 8) * 3;
        this.ctx.fillText("🐰", 0, bobble);

        this.ctx.restore();

        this.ctx.restore(); // Final restore

        // --- 4. Boss Indicator (Off-screen) ---
        if (isBossBattle && boss) {
            const distToPlayer = boss.x - player.x;
            if (Math.abs(distToPlayer) > width * 0.85) {
                this.drawBossIndicator(distToPlayer, width, height);
            }
        }
    }

    drawProgressFluid(x, y, w, h) {
        const { player, preBossLength, tileSize } = this.game;
        const currentBlockX = Math.floor(player.x / tileSize);
        const progress = Math.min(1.0, Math.max(0, currentBlockX / preBossLength));
        const t = this.time;

        // Fluid Gradient using 'lighter' for glowing effect
        this.ctx.globalCompositeOperation = 'lighter';
        const fluidGrad = this.ctx.createLinearGradient(x, y, x + w, y);
        fluidGrad.addColorStop(0, '#0055ff');
        fluidGrad.addColorStop(1, '#00ffff');

        this.ctx.fillStyle = fluidGrad;

        // Waving fluid end
        const fillW = w * progress;
        this.ctx.fillRect(x, y, fillW, h);

        // Bubbles inside
        for (let i = 0; i < 10; i++) {
            const bx = (x + (t * 50 + i * 100)) % fillW;
            const by = y + h / 2 + Math.sin(t + i) * 10;
            const bSize = 2 + Math.sin(t * 3 + i) * 1;
            this.ctx.fillStyle = 'rgba(255,255,255,0.4)';
            this.ctx.beginPath();
            this.ctx.arc(x + bx, by, Math.abs(bSize), 0, Math.PI * 2);
            this.ctx.fill();
        }

        // Goal Icon
        this.ctx.globalCompositeOperation = 'source-over';
        this.ctx.font = '28px serif';
        this.ctx.fillStyle = '#fff';
        this.ctx.fillText("🏁", x + w - 20, y + h / 2 + 8);
    }

    drawBossFluid(x, y, w, h, boss, stageScore) {
        const t = this.time;

        // 1. HP Fluid (Red/Purple)
        const hpRatio = Math.max(0, boss.hp / boss.maxHp);

        // Shake
        if (boss.hp < this.prevBossHp) this.hpShake = 15;
        this.prevBossHp = boss.hp;
        const shakeX = (this.hpShake > 0) ? (Math.random() - 0.5) * 15 : 0;
        if (this.hpShake > 0) this.hpShake--;

        this.ctx.globalCompositeOperation = 'lighter';
        const hpGrad = this.ctx.createLinearGradient(x, y, x + w, y);
        hpGrad.addColorStop(0, '#880000');
        hpGrad.addColorStop(0.5, '#ff0033');
        hpGrad.addColorStop(1, '#ff5500');

        this.ctx.fillStyle = hpGrad;
        this.ctx.fillRect(x + shakeX, y, w * hpRatio, h);

        // 2. Barrier Fluid (Blue - Overlay)
        const barrierGoal = this.getBarrierGoal();
        const barrierRatio = Math.min(1.0, stageScore / barrierGoal);

        if (boss.isInvulnerable) {
            // Barrier is active: Full face (Full Height)
            const barH = h;
            const barY = y;

            // Orange Gradient for Barrier Charge
            const barrierGrad = this.ctx.createLinearGradient(x, barY, x + w, barY);
            barrierGrad.addColorStop(0, '#ffaa00');
            barrierGrad.addColorStop(1, '#ffff00');

            this.ctx.fillStyle = barrierGrad;

            // Full width, but ratio controls opacity or fill? 
            // Let's fill width based on ratio
            const barrierW = w * barrierRatio;
            this.ctx.fillRect(x, barY, barrierW, barH);

            // Shininess
            if (barrierRatio >= 1.0) {
                this.ctx.fillStyle = `rgba(255, 255, 255, ${0.5 + Math.sin(t * 15) * 0.5})`; // Blinking
                this.ctx.fillRect(x, barY, w, barH);
            }

            // Text
            this.ctx.globalCompositeOperation = 'source-over';
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 12px monospace';
            this.ctx.fillText(`🛡️ BARRIER: ${Math.floor(stageScore)}/${barrierGoal}`, x + 10, y + h - 5);
        } else {
            // Broken
            this.ctx.globalCompositeOperation = 'lighter';
            this.ctx.fillStyle = `rgba(255, 200, 0, ${0.5 + Math.sin(t * 20) * 0.3})`;
            this.ctx.font = 'bold 14px monospace';
            this.ctx.fillText("⚡ BROKEN ⚡", x + 10, y + h - 5);
        }

        // Boss Icon (Skull)
        this.ctx.globalCompositeOperation = 'source-over';
        this.ctx.font = '30px serif';
        this.ctx.shadowColor = '#ff0000';
        this.ctx.shadowBlur = 15;
        this.ctx.fillText("👿", x + w - 25, y + h / 2 + 10);
        this.ctx.shadowBlur = 0;
    }

    drawBossIndicator(dist, w, h) {
        const arrowX = dist > 0 ? w - 70 : 70;
        this.ctx.save();
        this.ctx.translate(arrowX, h / 2);

        const bounce = Math.sin(this.time * 5) * 10;
        this.ctx.fillStyle = '#ff4757';
        this.ctx.shadowBlur = 20;
        this.ctx.shadowColor = '#ff4757';
        this.ctx.font = 'bold 48px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(dist > 0 ? "➔" : "←", bounce, 0);

        this.ctx.font = '900 16px sans-serif';
        this.ctx.fillStyle = '#fff';
        this.ctx.fillText("BOSS", bounce, 35);
        this.ctx.restore();
    }
}
