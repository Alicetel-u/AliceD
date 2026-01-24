import { Assets } from '../Assets.js';

export class ResultSection {
    constructor(game) {
        this.game = game;
        this.reset();

        // --- Colors ---
        this.c_primary = '#FFD700'; // Gold
        this.c_accent = '#f1c40f';
        this.c_bg_dark = 'rgba(20, 20, 30, 0.85)';
    }

    reset() {
        this.phase = 'INIT'; // INIT, TITLE, SLIDE_IN, COUNTUP, RANK, WAIT
        this.timer = 0;

        // Animation Vars
        this.titleScale = 0;
        this.titleAlpha = 0;
        this.charOffset = -600; // Slide from Left
        this.panelOffset = 1000; // Slide from Right

        this.rankScale = 10.0;
        this.rankAlpha = 0;
        this.shook = false;

        this.displayTotal = 0;
        this.targetTotal = 0;

        this.data = null;
    }

    process() {
        if (this.game.results && this.phase !== 'INIT') return;

        const stageScore = this.game.stageScoreGained || 0;
        const damage = this.game.stageDamageCount || 0;
        const timeElapsed = (Date.now() - this.game.stageStartTime) / 1000;
        const lives = this.game.lives || 0;

        // --- Scoring Formulas ---
        const M_TIME = 20; // Points per second saved (Base 180s)
        const M_LIFE = 500; // Points per life
        const B_NO_DMG = 2000;
        const B_QUICK = 1000; // Under 60s

        const timeBonus = Math.max(0, Math.floor((180 - timeElapsed) * M_TIME));
        const lifeBonus = lives * M_LIFE;
        const noDmgBonus = (damage === 0) ? B_NO_DMG : 0;
        const quickBonus = (timeElapsed < 60) ? B_QUICK : 0;

        const total = stageScore + timeBonus + lifeBonus + noDmgBonus + quickBonus;

        // Rank
        let rank = 'C';
        if (total >= 10000) rank = 'SS';
        else if (total >= 8000) rank = 'S';
        else if (total >= 6000) rank = 'A';
        else if (total >= 4000) rank = 'B';

        // Comments based on char
        const charId = this.game.characterManager.getCurrentCharacter().id;
        let comment = "Nice Try!";
        if (rank === 'SS' || rank === 'S') {
            comment = (charId === 'kanon') ? "完璧な計算通りね！" : "やったね！大成功！";
        } else if (rank === 'A' || rank === 'B') {
            comment = (charId === 'kanon') ? "悪くない結果だわ。" : "いい感じだぴょん！";
        } else {
            comment = (charId === 'kanon') ? "次はもっと効率的に..." : "もっと頑張るぴょん...";
        }

        // Store result data locally
        this.data = {
            timeStr: this.formatTime(timeElapsed),
            damage: damage,
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
            charId: charId
        };

        this.targetTotal = total;

        // Update Game Global Score
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

        // If data not processed yet
        if (!this.data) this.process();

        this.timer += dt;

        switch (this.phase) {
            case 'TITLE':
                // "STAGE CLEAR" Zoom In
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

                this.charOffset = -600 + (600 * easeOut); // To 0
                this.panelOffset = 1000 - (1000 * easeOut); // To 0

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
                this.rankScale = 10.0 - (9.0 * t4); // 10 -> 1
                if (this.rankScale < 1.0) this.rankScale = 1.0;
                this.rankAlpha = t4;

                // Shake screen on impact
                if (t4 === 1.0 && !this.shook) {
                    this.game.vfx.shake(5, 0.2); // Impact!
                    this.shook = true;
                }

                if (this.timer > 1.0) {
                    this.phase = 'WAIT';
                }
                break;

            case 'WAIT':
                this.rankScale = 1.0 + Math.sin(Date.now() / 200) * 0.05; // Pulse

                // Debug Log for Input
                if (Math.random() < 0.01) console.log("ResultSection: WAITING... Pressed:", this.game.input.pointerPressed);

                if (this.game.input.isPressed('Space') || this.game.input.isPressed('Enter') || this.game.input.pointerPressed) {
                    console.log("ResultSection: INPUT DETECTED! Calling nextStage()");
                    this.reset();
                    this.game.nextStage();
                }
                break;
        }
    }

    draw() {
        if (!this.data) return;
        const ctx = this.game.ctx;
        const w = this.game.width;
        const h = this.game.height;

        ctx.save();

        // 1. Dark Overlay (Animated)
        ctx.fillStyle = `rgba(0,0,0, ${Math.min(0.8, this.timer * 0.5)})`;
        if (this.phase !== 'INIT') ctx.fillRect(0, 0, w, h);

        // 2. Character Portrait (Left Side)
        ctx.save();
        ctx.translate(this.charOffset, 0);
        const charImg = this.game.assets.getImage(`title_${this.data.charId}`);
        if (charImg) {
            const scale = h / charImg.height * 0.7; // Smaller 0.7
            const dw = charImg.width * scale;
            const dh = charImg.height * scale;

            // Glow behind char
            ctx.shadowColor = (this.data.charId === 'kanon') ? '#a29bfe' : '#ff7675';
            ctx.shadowBlur = 50;
            // Center vertically
            const dy = (h - dh) / 2;
            ctx.drawImage(charImg, 100, dy, dw, dh);
            ctx.shadowBlur = 0;
        }
        ctx.restore();

        // 3. Result Panel (Right Side)
        ctx.save();
        ctx.translate(this.panelOffset, 0); // Slide from right

        const pW = 600;
        const pH = h - 100;
        const pX = w - pW - 50;
        const pY = 50;

        // Panel BG
        ctx.fillStyle = this.c_bg_dark;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(pX, pY, pW, pH, 20);
        else ctx.rect(pX, pY, pW, pH);
        ctx.fill();

        ctx.strokeStyle = '#FFFFFF33';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw Stats
        this.drawStats(ctx, pX, pY, pW, pH);

        ctx.restore();

        // 4. TITLE "STAGE CLEAR"
        if (this.titleAlpha > 0) {
            ctx.save();
            ctx.translate(w / 2, 150);
            ctx.scale(this.titleScale, this.titleScale);

            ctx.shadowColor = '#f1c40f';
            ctx.shadowBlur = 20;
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '900 80px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText("STAGE CLEAR!", 0, 0);

            // Subtitle - Removed
            /*
            if (this.phase !== 'TITLE') {
                ctx.font = 'bold 30px sans-serif';
                ctx.fillStyle = '#f1c40f';
                ctx.fillText(this.data.comment, 0, 60);
            }
            */
            ctx.restore();
        }

        // 5. Rank Stamp
        if (this.phase === 'RANK' || this.phase === 'WAIT') {
            ctx.save();
            ctx.translate(w - 250, h - 250);
            ctx.rotate(-0.2); // Tilt
            ctx.scale(this.rankScale, this.rankScale);

            ctx.shadowColor = '#e74c3c';
            ctx.shadowBlur = 30;

            // Ring
            ctx.strokeStyle = (this.data.rank === 'SS' || this.data.rank === 'S') ? '#f1c40f' : '#e74c3c';
            ctx.lineWidth = 10;
            ctx.beginPath();
            ctx.arc(0, 0, 100, 0, Math.PI * 2);
            ctx.stroke();

            // Text
            ctx.fillStyle = (this.data.rank === 'SS' || this.data.rank === 'S') ? '#f1c40f' : '#e74c3c';
            ctx.font = '900 120px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.data.rank, 0, 5);

            // "RANK" label
            ctx.font = 'bold 30px sans-serif';
            ctx.fillStyle = '#FFF';
            ctx.fillText("RANK", 0, -80);

            ctx.restore();
        }

        // 6. Prompt
        if (this.phase === 'WAIT') {
            if (Math.floor(Date.now() / 500) % 2 === 0) {
                ctx.fillStyle = '#FFF';
                ctx.font = 'bold 24px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText("PRESS BUTTON TO CONTINUE >>", w - 300, h - 50);
            }
        }

        ctx.restore();
    }

    drawStats(ctx, x, y, w, h) {
        let cy = y + 120;
        const lineH = 50;
        const leftX = x + 40;
        const rightX = x + w - 40;

        ctx.font = 'bold 24px sans-serif';
        const drawLine = (label, val, color = '#FFF') => {
            ctx.fillStyle = '#bdc3c7'; // Label color
            ctx.textAlign = 'left';
            ctx.fillText(label, leftX, cy);

            ctx.fillStyle = color;
            ctx.textAlign = 'right';
            ctx.fillText(val, rightX, cy);

            cy += lineH;
        };

        drawLine("TIME", this.data.timeStr);
        drawLine("DAMAGE", `${this.data.damage} Hits`, this.data.damage === 0 ? '#2ecc71' : '#e74c3c');

        cy += 20;
        // Bonuses
        ctx.font = '20px sans-serif';
        if (this.data.bonuses.time > 0) drawLine("Time Bonus", `+${this.data.bonuses.time}`, '#f1c40f');
        if (this.data.bonuses.life > 0) drawLine("Life Bonus", `+${this.data.bonuses.life}`, '#f1c40f');
        if (this.data.bonuses.noDmg > 0) drawLine("No Damage Bonus", `+${this.data.bonuses.noDmg}`, '#e67e22');
        if (this.data.bonuses.quick > 0) drawLine("Speedster Bonus", `+${this.data.bonuses.quick}`, '#e67e22');

        // Line
        cy += 10;
        ctx.strokeStyle = '#FFFFFF55';
        ctx.beginPath();
        ctx.moveTo(leftX, cy);
        ctx.lineTo(rightX, cy);
        ctx.stroke();
        cy += 50;

        // Total
        ctx.font = 'bold 40px sans-serif';
        ctx.fillStyle = '#f1c40f';
        ctx.textAlign = 'left';
        ctx.fillText("TOTAL SCORE", leftX, cy);

        ctx.font = '900 60px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(this.displayTotal, rightX, cy);
    }
}
