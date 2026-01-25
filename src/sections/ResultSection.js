import { Assets } from '../Assets.js';

export class ResultSection {
    constructor(game) {
        this.game = game;
        this.reset();

        // --- Luxury Color Palette ---
        this.c_gold = '#FFD700';
        this.c_lightGold = '#FFF4CC';
        this.c_pink = '#FF69B4';
        this.c_lightPink = '#FFB6D9';
        this.c_purple = '#9B59B6';
        this.c_blue = '#6C91BF';

        // Sparkle particles for luxury effect
        this.sparkles = [];
        this.floatingStars = [];
    }

    reset() {
        this.phase = 'INIT'; // INIT, TITLE, SLIDE_IN, COUNTUP, RANK, WAIT
        this.timer = 0;

        // Animation Vars
        this.titleScale = 0;
        this.titleAlpha = 0;
        this.charOffset = -600;
        this.panelOffset = 1000;

        this.rankScale = 10.0;
        this.rankAlpha = 0;
        this.shook = false;

        this.displayTotal = 0;
        this.targetTotal = 0;

        this.data = null;

        // Card animations
        this.cardAlpha = [0, 0, 0];
        this.cardY = [0, 0, 0];
    }

    process() {
        if (this.game.results && this.phase !== 'INIT') return;

        const stageScore = this.game.stageScoreGained || 0;
        const damage = this.game.stageDamageCount || 0;
        const timeElapsed = (Date.now() - this.game.stageStartTime) / 1000;
        const lives = this.game.lives || 0;

        // --- Scoring Formulas ---
        const M_TIME = 20;
        const M_LIFE = 500;
        const B_NO_DMG = 2000;
        const B_QUICK = 1000;

        const timeBonus = Math.max(0, Math.floor((180 - timeElapsed) * M_TIME));
        const lifeBonus = lives * M_LIFE;
        const noDmgBonus = (damage === 0) ? B_NO_DMG : 0;
        const quickBonus = (timeElapsed < 60) ? B_QUICK : 0;

        const total = stageScore + timeBonus + lifeBonus + noDmgBonus + quickBonus;

        // Rank based on lives
        let rank = 'B';
        if (lives >= 10) rank = 'SS';
        else if (lives >= 1) rank = 'S';
        else if (lives >= -9) rank = 'A';

        // Comments
        const charId = this.game.characterManager.getCurrentCharacter().id;
        let comment = "Nice Try!";

        if (rank === 'SS') {
            comment = (charId === 'kanon') ? "完璧な計算通りね！" : "やったね！大成功！";
        } else if (rank === 'S') {
            comment = (charId === 'kanon') ? "ほぼ完璧ね。" : "すごいぴょん！";
        } else if (rank === 'A') {
            comment = (charId === 'kanon') ? "ギリギリだったわね..." : "あぶなかったぴょん...";
        } else {
            comment = (charId === 'kanon') ? "次はもっと慎重に..." : "もっと頑張るぴょん...";
        }

        // === Generate Performance Messages ===
        let healthMsg = "";
        let timeMsg = "";
        let performanceMsg = "";

        // Health/Lives Message
        if (lives >= 10) {
            healthMsg = "完璧な戦いでした！\nハートもたくさん集めました✨";
        } else if (lives >= 5) {
            healthMsg = "ノーダメージで完璧です！\n素晴らしい！";
        } else if (lives >= 3) {
            healthMsg = "少し傷つきましたが、\nまだ元気です！";
        } else if (lives >= 1) {
            healthMsg = "あぶなかったですね...\n気をつけて！";
        } else if (lives >= -5) {
            healthMsg = "治療費がかかっちゃいました...💉";
        } else {
            healthMsg = "かなりの治療費です...\nお大事に...💉💉";
        }

        // Carrot count (Direct tracking)
        const carrotCount = this.game.stageCarrots || 0;
        if (carrotCount >= 50) {
            timeMsg = `ニンジンを${carrotCount}個食べました！\nたくさん集めましたね✨`;
        } else if (carrotCount >= 30) {
            timeMsg = `ニンジンを${carrotCount}個食べました！\nいい感じです🥕`;
        } else if (carrotCount >= 10) {
            timeMsg = `ニンジンを${carrotCount}個食べました🥕`;
        } else if (carrotCount > 0) {
            timeMsg = `ニンジンを${carrotCount}個食べました`;
        } else {
            timeMsg = "ニンジンが食べられませんでした...";
        }

        // Damage-based Performance
        if (damage === 0) {
            performanceMsg = "一度も敵に触れませんでした！\n完璧！";
        } else if (damage <= 2) {
            performanceMsg = "ほとんど無傷で進みました！";
        } else if (damage <= 5) {
            performanceMsg = "何度か敵に接触しました";
        } else {
            performanceMsg = "激しい戦いでしたね...";
        }

        this.data = {
            timeStr: this.formatTime(timeElapsed),
            timeElapsed: timeElapsed,
            damage: damage,
            lives: lives,
            base: stageScore,
            bonuses: {
                time: timeBonus,
                life: lifeBonus,
                noDmg: noDmgBonus,
                quick: quickBonus
            },
            total: total,
            rank: rank,
            comment: comment,
            charId: charId,
            healthMsg: healthMsg,
            timeMsg: timeMsg,
            performanceMsg: performanceMsg
        };

        this.targetTotal = total;
        this.game.score += (timeBonus + lifeBonus + noDmgBonus + quickBonus);
        this.game.saveProgress();
        this.game.results = this.data;

        this.phase = 'TITLE';
        this.timer = 0;
    }

    formatTime(sec) {
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    }

    update(dt) {
        if (!this.game.gameWon || this.game.state === 'ENDING') return;
        if (!this.data) this.process();

        this.timer += dt;

        switch (this.phase) {
            case 'TITLE':
                const t1 = Math.min(this.timer * 2, 1.0);
                this.titleScale = t1;
                this.titleAlpha = t1;

                if (this.timer > 1.0) {
                    this.phase = 'SLIDE_IN';
                    this.timer = 0;
                }
                break;

            case 'SLIDE_IN':
                const t2 = Math.min(this.timer * 1.5, 1.0);
                const easeOut = 1 - Math.pow(1 - t2, 3);

                this.charOffset = -600 + (600 * easeOut);
                this.panelOffset = 1000 - (1000 * easeOut);

                // Card animations
                for (let i = 0; i < 3; i++) {
                    const cardDelay = i * 0.2;
                    const cardProgress = Math.max(0, Math.min(1, (this.timer - cardDelay) / 0.5));
                    this.cardAlpha[i] = cardProgress;
                    this.cardY[i] = 30 * (1 - cardProgress);
                }

                if (t2 >= 1.0) {
                    this.phase = 'COUNTUP';
                    this.timer = 0;
                }
                break;

            case 'COUNTUP':
                const duration = 1.5;
                const t3 = Math.min(this.timer / duration, 1.0);
                this.displayTotal = Math.floor(this.targetTotal * t3);

                if (t3 >= 1.0) {
                    this.phase = 'RANK';
                    this.timer = 0;
                }
                break;

            case 'RANK':
                const t4 = Math.min(this.timer * 3, 1.0);
                this.rankScale = 10.0 - (9.0 * t4);
                if (this.rankScale < 1.0) this.rankScale = 1.0;
                this.rankAlpha = t4;

                if (t4 === 1.0 && !this.shook) {
                    this.game.vfx.shake(5, 0.2);
                    this.shook = true;
                }

                if (this.timer > 1.0) {
                    this.phase = 'WAIT';
                }
                break;

            case 'WAIT':
                this.rankScale = 1.0 + Math.sin(Date.now() / 200) * 0.05;

                if (this.game.input.isPressed('Space') || this.game.input.isPressed('Enter') || this.game.input.pointerPressed) {
                    this.reset();
                    this.game.nextStage();
                }
                break;
        }

        // Sparkle system (reduced for performance)
        if (Math.random() < 0.1) { // Reduced from 0.3
            this.sparkles.push({
                x: Math.random() * this.game.width,
                y: Math.random() * this.game.height,
                size: Math.random() * 3 + 2,
                life: 1.0,
                vx: (Math.random() - 0.5) * 20,
                vy: -Math.random() * 30 - 10,
                color: Math.random() > 0.5 ? this.c_gold : this.c_lightPink
            });
        }

        for (let i = this.sparkles.length - 1; i >= 0; i--) {
            const s = this.sparkles[i];
            s.life -= dt * 1.2;
            s.x += s.vx * dt;
            s.y += s.vy * dt;
            if (s.life <= 0) this.sparkles.splice(i, 1);
        }
    }

    draw() {
        if (!this.data) return;
        const ctx = this.game.ctx;
        const w = this.game.width;
        const h = this.game.height;

        ctx.save();

        // Background (simplified)
        ctx.fillStyle = 'rgba(15, 10, 30, 0.92)';
        ctx.fillRect(0, 0, w, h);

        // === 2. Decorative Corner Ornaments ===
        this.drawOrnament(ctx, 50, 50, this.c_gold);
        this.drawOrnament(ctx, w - 50, 50, this.c_gold);
        this.drawOrnament(ctx, 50, h - 50, this.c_gold);
        this.drawOrnament(ctx, w - 50, h - 50, this.c_gold);

        // === 3. Title with Ribbon ===
        if (this.titleAlpha > 0) {
            ctx.save();
            ctx.globalAlpha = this.titleAlpha;

            // Ribbon background
            const ribbonY = 120;
            const ribbonHeight = 100;
            ctx.fillStyle = 'rgba(255, 215, 0, 0.2)';
            ctx.fillRect(0, ribbonY - ribbonHeight / 2, w, ribbonHeight);

            // Gold borders
            ctx.strokeStyle = this.c_gold;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(0, ribbonY - ribbonHeight / 2);
            ctx.lineTo(w, ribbonY - ribbonHeight / 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, ribbonY + ribbonHeight / 2);
            ctx.lineTo(w, ribbonY + ribbonHeight / 2);
            ctx.stroke();

            // Title text
            ctx.translate(w / 2, ribbonY);
            ctx.scale(this.titleScale, this.titleScale);

            ctx.strokeStyle = '#000';
            ctx.lineWidth = 10;
            ctx.font = 'bold 90px "Zen Maru Gothic", serif';
            ctx.textAlign = 'center';
            ctx.strokeText("ステージクリア！", 0, 0);

            const titleGrad = ctx.createLinearGradient(0, -50, 0, 50);
            titleGrad.addColorStop(0, this.c_gold);
            titleGrad.addColorStop(0.5, this.c_lightGold);
            titleGrad.addColorStop(1, this.c_gold);
            ctx.fillStyle = titleGrad;
            ctx.fillText("ステージクリア！", 0, 0);

            ctx.restore();
        }

        // === 4. Character Portrait (Slide in from Left) ===
        ctx.save();
        ctx.translate(this.charOffset, 0);

        const charImg = this.game.assets.getImage(`title_${this.data.charId}`);
        if (charImg) {
            // Large character display in center
            const maxCharWidth = Math.min(w * 0.70, 900);
            const maxCharHeight = h * 0.95;
            const scaleW = maxCharWidth / charImg.width;
            const scaleH = maxCharHeight / charImg.height;
            const scale = Math.min(scaleW, scaleH);

            const dw = charImg.width * scale;
            const dh = charImg.height * scale;

            // Simplified glow
            ctx.shadowColor = (this.data.charId === 'kanon') ? this.c_purple : this.c_pink;
            ctx.shadowBlur = 30; // Reduced from 50

            // Position character left-of-center
            const dx = (w - dw) / 2 - w * 0.15;
            const dy = (h - dh) / 2;
            ctx.drawImage(charImg, dx, dy, dw, dh);
            ctx.shadowBlur = 0;

            // Decorative frame around character
            ctx.strokeStyle = this.c_gold;
            ctx.lineWidth = 4;
            ctx.setLineDash([12, 6]);
            ctx.strokeRect(dx - 10, dy - 10, dw + 20, dh + 20);
            ctx.setLineDash([]);
        }

        ctx.restore();

        // === 5. Message Cards ===
        ctx.save();
        ctx.translate(this.panelOffset, 0);

        const messages = [
            { icon: "💖", text: this.data.healthMsg, color: this.c_pink },
            { icon: "🥕", text: this.data.timeMsg, color: "#FFA500" }, // Orange for carrots
            { icon: "⚔️", text: this.data.performanceMsg, color: this.c_purple }
        ];

        // Adjust card size to fit screen
        const cardW = Math.min(480, w * 0.45);
        const cardH = 130;
        const startX = Math.max(w - cardW - 40, w * 0.5);
        let cardY = 220;

        messages.forEach((msg, idx) => {
            if (this.cardAlpha[idx] > 0) {
                ctx.save();
                ctx.globalAlpha = this.cardAlpha[idx];
                ctx.translate(0, -this.cardY[idx]);

                this.drawMessageCard(ctx, startX, cardY, cardW, cardH, msg.icon, msg.text, msg.color);
                cardY += cardH + 20;

                ctx.restore();
            }
        });

        ctx.restore();

        // === 5. Score Display ===
        ctx.save();
        ctx.translate(this.panelOffset, 0);

        const scoreY = Math.min(cardY + 30, h - 220);
        const scoreBoxW = Math.min(480, w * 0.45);
        const scoreBoxH = 170;
        const scoreBoxX = Math.max(w - scoreBoxW - 40, w * 0.5);

        // Score box with luxury frame
        ctx.fillStyle = 'rgba(20, 15, 40, 0.9)';
        ctx.strokeStyle = this.c_gold;
        ctx.lineWidth = 4;
        this.roundRect(ctx, scoreBoxX, scoreY, scoreBoxW, scoreBoxH, 15);
        ctx.fill();
        ctx.stroke();

        // Inner decorative frame
        ctx.strokeStyle = this.c_lightGold;
        ctx.lineWidth = 2;
        this.roundRect(ctx, scoreBoxX + 10, scoreY + 10, scoreBoxW - 20, scoreBoxH - 20, 10);
        ctx.stroke();

        // "Total Score" label
        ctx.font = 'bold 32px "Zen Maru Gothic", serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = this.c_lightGold;
        ctx.fillText("合計スコア", scoreBoxX + scoreBoxW / 2, scoreY + 50);

        // Score number (simplified)
        ctx.font = 'bold 64px "Zen Maru Gothic", monospace';
        ctx.fillStyle = this.c_gold;
        ctx.textAlign = 'center';
        ctx.shadowColor = this.c_gold;
        ctx.shadowBlur = 10; // Reduced shadow
        ctx.fillText(this.displayTotal, scoreBoxX + scoreBoxW / 2, scoreY + 125);
        ctx.shadowBlur = 0;

        ctx.restore();

        // === 6. Rank Stamp ===
        if (this.phase === 'RANK' || this.phase === 'WAIT') {
            ctx.save();
            // Position rank stamp in bottom left, with safe margins
            const rankX = Math.min(250, w * 0.2);
            const rankY = Math.max(h - 230, h * 0.75);
            ctx.translate(rankX, rankY);
            ctx.rotate(-0.15);
            ctx.scale(this.rankScale, this.rankScale);

            const rankColor = (this.data.rank === 'SS' || this.data.rank === 'S') ? this.c_gold : this.c_lightPink;

            // Glow effect (reduced)
            ctx.shadowColor = rankColor;
            ctx.shadowBlur = 30;

            // Outer ring
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 8;
            ctx.beginPath();
            ctx.arc(0, 0, 140, 0, Math.PI * 2);
            ctx.stroke();

            // Main ring
            ctx.strokeStyle = rankColor;
            ctx.lineWidth = 16;
            ctx.beginPath();
            ctx.arc(0, 0, 120, 0, Math.PI * 2);
            ctx.stroke();

            // Inner decorative ring
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.arc(0, 0, 100, 0, Math.PI * 2);
            ctx.stroke();

            // Rank text
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 8;
            ctx.font = 'bold 150px "Zen Maru Gothic", serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.strokeText(this.data.rank, 0, 10);

            const rankGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 120);
            rankGrad.addColorStop(0, '#FFF');
            rankGrad.addColorStop(0.6, rankColor);
            rankGrad.addColorStop(1, '#FFD700');
            ctx.fillStyle = rankGrad;
            ctx.fillText(this.data.rank, 0, 10);

            // "RANK" label
            ctx.font = 'bold 38px "Zen Maru Gothic", serif';
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 5;
            ctx.strokeText("ランク", 0, -95);
            ctx.fillStyle = rankColor;
            ctx.fillText("ランク", 0, -95);

            // Decorative stars
            ctx.font = '50px sans-serif';
            ctx.fillStyle = this.c_gold;
            ctx.shadowBlur = 25;
            [[-90, -90], [90, -90], [-90, 90], [90, 90]].forEach(([x, y]) => {
                ctx.fillText("★", x, y);
            });

            ctx.restore();
        }

        // === 7. Sparkles ===
        this.sparkles.forEach(s => {
            ctx.save();
            ctx.globalAlpha = s.life * 0.8;
            ctx.fillStyle = s.color;
            ctx.shadowColor = s.color;
            ctx.shadowBlur = 15;

            ctx.beginPath();
            for (let i = 0; i < 5; i++) {
                const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
                const x = s.x + Math.cos(angle) * s.size;
                const y = s.y + Math.sin(angle) * s.size;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        });

        // === 8. Prompt ===
        if (this.phase === 'WAIT') {
            if (Math.floor(Date.now() / 500) % 2 === 0) {
                ctx.font = 'bold 28px "Zen Maru Gothic", serif';
                ctx.textAlign = 'center';
                ctx.fillStyle = this.c_gold;
                ctx.shadowColor = this.c_gold;
                ctx.shadowBlur = 15;
                ctx.fillText("ボタンを押して続ける ▶", w / 2, h - 50);
                ctx.shadowBlur = 0;
            }
        }

        ctx.restore();
    }

    drawOrnament(ctx, x, y, color) {
        ctx.save();
        ctx.translate(x, y);
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;

        // Corner decorative lines
        ctx.beginPath();
        ctx.moveTo(-30, 0);
        ctx.lineTo(-10, 0);
        ctx.moveTo(0, -30);
        ctx.lineTo(0, -10);
        ctx.stroke();

        // Small ornamental circle
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    drawMessageCard(ctx, x, y, w, h, icon, text, color) {
        // Card background with gradient
        const cardGrad = ctx.createLinearGradient(x, y, x, y + h);
        cardGrad.addColorStop(0, 'rgba(40, 30, 60, 0.95)');
        cardGrad.addColorStop(1, 'rgba(25, 20, 45, 0.95)');
        ctx.fillStyle = cardGrad;

        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 20;
        this.roundRect(ctx, x, y, w, h, 12);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Border with color accent
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        this.roundRect(ctx, x, y, w, h, 12);
        ctx.stroke();

        // Icon
        ctx.font = '50px sans-serif';
        ctx.fillStyle = color;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(icon, x + 25, y + h / 2);

        // Text with word wrap
        ctx.font = 'bold 24px "Zen Maru Gothic", sans-serif';
        ctx.fillStyle = '#FFF';
        const lines = text.split('\n');
        const lineHeight = 32;
        const textX = x + 95;
        const startY = y + (h - (lines.length - 1) * lineHeight) / 2;

        lines.forEach((line, idx) => {
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.lineWidth = 4;
            ctx.strokeText(line, textX, startY + idx * lineHeight);
            ctx.fillText(line, textX, startY + idx * lineHeight);
        });
    }

    roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }
}
