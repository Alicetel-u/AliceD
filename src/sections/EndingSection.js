/**
 * EndingSection.js
 * 
 * Re-implemented with a focus on cinematic quality and visual richness.
 * Features:
 * - Dynamic particle systems (background dust/lights)
 * - Parallax background with blurred visuals
 * - Ken Burns effect for main images (photo style)
 * - Elegant typography with fade transitions
 * - Cinematic letterboxing (optional)
 * - Smooth scene transitions
 */
import { EndingData } from '../data/EndingData.js';

export class EndingSection {
    constructor(game) {
        this.game = game;
        this.data = null;
        this.currentSceneIndex = 0;
        this.sceneTimer = 0; // ms
        this.state = 'IDLE'; // IDLE, PLAYING, FINISHED
        this.finTimer = 0;
        this.fadeAlpha = 0; // Global fade in/out transition
        this.pendingEndingId = null;
        this.startDelayTimer = 0;
        this.startDelayDuration = 0;

        this.particles = [];
        this.initParticles();
    }

    initParticles() {
        this.particles = [];
        const count = 50;
        for (let i = 0; i < count; i++) {
            this.spawnParticle(true); // Pre-warm
        }
    }

    spawnParticle(randomY = false) {
        const w = this.game.width;
        const h = this.game.height;
        this.particles.push({
            x: Math.random() * w,
            y: randomY ? Math.random() * h : h + 20,
            vx: (Math.random() - 0.5) * 15,
            vy: -10 - Math.random() * 30, // Upward floating
            size: 2 + Math.random() * 6,
            life: 2 + Math.random() * 4,
            maxLife: 4,
            alpha: 0,
            targetAlpha: 0.2 + Math.random() * 0.5,
            color: Math.random() > 0.8 ? '#FFD700' : '#FFFFFF' // Gold or White
        });
    }

    start(endingId, options = {}) {
        const delay = options.delay || 0;
        if (delay > 0) {
            this.pendingEndingId = endingId;
            this.startDelayTimer = 0;
            this.startDelayDuration = delay;
            this.state = 'PENDING';
            this.game.state = 'ENDING';
            return;
        }

        this.pendingEndingId = null;
        this.startDelayTimer = 0;
        this.startDelayDuration = 0;
        this.data = EndingData[endingId];
        if (!this.data) {
            this.game.state = 'HOME';
            return;
        }

        this.currentSceneIndex = 0;
        this.sceneTimer = 0;
        this.state = 'PLAYING';
        this.finTimer = 0;
        this.fadeAlpha = 1.0; // Start black, fade in

        this.game.audio.stopBGM();
        this.game.audio.playBGM('ENDING');

        // Hide HUD completely
        const uiLayer = document.getElementById('ui-layer');
        if (uiLayer) {
            uiLayer.style.display = 'none';
            uiLayer.classList.remove('flex'); // Ensure flex is removed if used
        }

        // Set game state to ENDING to stop StageUI rendering
        this.game.state = 'ENDING';

        this.initParticles();
    }

    update(dt) {
        if (this.state === 'PENDING') {
            this.startDelayTimer += dt;
            if (this.startDelayTimer >= this.startDelayDuration) {
                const nextEndingId = this.pendingEndingId;
                this.pendingEndingId = null;
                this.start(nextEndingId);
            }
            return;
        }

        if (this.state !== 'PLAYING') return;

        const scene = this.data[this.currentSceneIndex];
        if (!scene) return;

        // Timer
        this.sceneTimer += dt * 1000;

        // Transition Logic
        if (scene.type !== 'fin') {
            if (this.sceneTimer > scene.duration) {
                this.nextScene();
            }
        } else {
            // Fin logic
            this.finTimer += dt;
            if (this.game.input.isPressed('Space') || this.game.input.isPressed('Enter') || this.game.input.pointerPressed) {
                // Return to Title (HOME state)
                this.state = 'FINISHED';
                this.game.state = 'HOME';
                this.game.audio.playBGM('TITLE');

                // Reset game if needed for clean state
                // this.game.initLevel(1); // Optional, usually title handles reset
            }
        }

        // Particle System
        this.updateParticles(dt);
    }

    updateParticles(dt) {
        // Spawn new
        if (this.particles.length < 60 && Math.random() < 0.1) {
            this.spawnParticle();
        }

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt;

            // Fade in/out logic
            const lifeRatio = p.life / p.maxLife;
            if (lifeRatio > 0.8) {
                p.alpha += dt; // Fade in
                if (p.alpha > p.targetAlpha) p.alpha = p.targetAlpha;
            } else if (lifeRatio < 0.2) {
                p.alpha -= dt; // Fade out
            }

            if (p.life <= 0 || p.alpha < 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    nextScene() {
        this.currentSceneIndex++;
        this.sceneTimer = 0;
        if (this.currentSceneIndex >= this.data.length - 1) {
            // Ensure we stop at the last scene (Fin)
            this.currentSceneIndex = this.data.length - 1;
        }
    }

    draw() {
        if (this.state === 'PENDING') {
            const ctx = this.game.ctx;
            const w = this.game.width;
            const h = this.game.height;
            const progress = this.startDelayDuration > 0 ? Math.min(1, this.startDelayTimer / this.startDelayDuration) : 1;
            ctx.save();
            ctx.fillStyle = '#000';
            ctx.globalAlpha = 0.35 + progress * 0.65;
            ctx.fillRect(0, 0, w, h);
            ctx.restore();
            return;
        }

        if (this.state !== 'PLAYING') return;
        const scene = this.data[this.currentSceneIndex];
        if (!scene) return;

        const ctx = this.game.ctx;
        const w = this.game.width;
        const h = this.game.height;

        ctx.save();

        // 0. Base Background (Elegant Dark)
        if (scene.bgColor) {
            ctx.fillStyle = scene.bgColor;
        } else {
            const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
            bgGrad.addColorStop(0, '#0f0c29');
            bgGrad.addColorStop(0.5, '#302b63');
            bgGrad.addColorStop(1, '#24243e');
            ctx.fillStyle = bgGrad;
        }
        ctx.fillRect(0, 0, w, h);

        // 1. Ambient Background Image (Blurred & Zoomed)
        if (scene.image || scene.bgImage) {
            const imgKey = scene.image || scene.bgImage;
            const img = this.game.assets.getImage(imgKey);
            if (img) {
                ctx.save();
                ctx.globalAlpha = 0.3; // Low opacity for background
                const scale = Math.max(w / img.width, h / img.height) * 1.2;
                const dx = (w - img.width * scale) / 2;
                const dy = (h - img.height * scale) / 2;
                ctx.drawImage(img, dx, dy, img.width * scale, img.height * scale);
                ctx.restore();
            }
        }

        // 2. Background Particles
        this.drawParticles(ctx, 0); // Layer 0: small, far particles

        // 3. Main Visual (Photo Style)
        if (scene.image || scene.bgImage) {
            const imgKey = scene.image || scene.bgImage;
            const img = this.game.assets.getImage(imgKey);

            if (img && scene.type !== 'fin' && scene.type !== 'blackout') {
                this.drawPhoto(ctx, img, w, h, scene);
            }
        }

        // 4. Foreground Particles
        this.drawParticles(ctx, 1); // Layer 1: brighter, near particles

        // 5. Cinematic Letterbox (Optional, adds pro feel)
        const boxSize = 60;
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, w, boxSize);
        ctx.fillRect(0, h - boxSize, w, boxSize);

        // 6. Text (Centered, Elegant)
        this.drawText(ctx, w, h, scene);

        // 7. Global Fade In/Out (Scene Transition simulation)
        let fade = 0;
        const fadeTime = 800; // ms
        if (this.sceneTimer < fadeTime) {
            if (!scene.noFadeIn) {
                fade = 1.0 - (this.sceneTimer / fadeTime);
            }
        } else if (this.sceneTimer > scene.duration - fadeTime) {
            if (scene.type !== 'fin' && !scene.noFadeOut) { // Don't fade out Fin or flagged scenes
                fade = (this.sceneTimer - (scene.duration - fadeTime)) / fadeTime;
            }
        }
        if (fade > 0) {
            ctx.fillStyle = `rgba(0, 0, 0, ${fade})`;
            ctx.fillRect(0, 0, w, h);
        }

        ctx.restore();
    }

    drawPhoto(ctx, img, w, h, scene) {
        // Ken Burns Params
        let zoom = 1.0;
        let angle = 0;

        if (!scene.noAnim) {
            const progress = this.sceneTimer / scene.duration;
            zoom = 1.0 + Math.sin(progress * 0.8) * 0.08; // Gentle zoom
            angle = Math.sin(progress * 1.0) * 0.03; // Gentle rock
        }

        const photoW = w * 0.65; // 65% width
        const photoH = photoW * (img.height / img.width);

        // Constrain height
        let finalW = photoW;
        let finalH = photoH;
        if (finalH > h * 0.55) {
            finalH = h * 0.55;
            finalW = finalH * (img.width / img.height);
        }

        const cx = w / 2;
        const cy = h / 2 - 30; // Slightly above center

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle);
        ctx.scale(zoom, zoom);

        // White Border & Shadow (Polaroid)
        const border = 15;
        const bottomBorder = 40;

        ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
        ctx.shadowBlur = 30;
        ctx.shadowOffsetY = 15;

        ctx.fillStyle = '#fff';
        // Draw frame centered at 0,0
        ctx.fillRect(-finalW / 2 - border, -finalH / 2 - border, finalW + border * 2, finalH + border + bottomBorder);

        ctx.shadowColor = 'transparent'; // No shadow for image itself

        // Draw Image
        ctx.drawImage(img, -finalW / 2, -finalH / 2, finalW, finalH);

        ctx.restore();
    }

    drawText(ctx, w, h, scene) {
        const lines = scene.text || [];
        if (lines.length === 0) return;

        // Fin Screen Special Case
        if (scene.type === 'fin') {
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'center';
            ctx.font = '700 italic 80px serif';
            ctx.shadowColor = '#fff';
            ctx.shadowBlur = 20;
            ctx.fillText("Fin", w / 2, h / 2);

            ctx.shadowBlur = 0;
            ctx.font = '22px "Yu Gothic", sans-serif';
            ctx.fillStyle = '#fff';
            if (this.finTimer > 1.5 && Math.floor(Date.now() / 600) % 2 === 0) {
                ctx.fillText("- CLICK OR TAP TO RETURN TO TITLE -", w / 2, h / 2 + 100);
            }
            ctx.fillStyle = '#aaa';
            ctx.font = '18px sans-serif';
            ctx.fillText("THANK YOU FOR PLAYING", w / 2, h / 2 + 140);
            return;
        }

        // Standard Text (One line forced as requested)
        const text = lines.join(' ');

        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Font Settings
        ctx.font = '500 38px "Yu Mincho", "Hiragino Mincho ProN", serif'; // Specific serif fonts for JP

        // Text Position: Center of Screen (Overlaying photo)
        const x = w / 2;
        let y = h / 2;
        if (scene.textOffsetY) {
            y += scene.textOffsetY;
        }

        // --- Readability Enhancement: Background Plate ---
        const metrics = ctx.measureText(text);
        const textW = metrics.width;

        let plateH = 80;
        let plateY = y - plateH / 2;
        if (scene.subText) {
            plateH = 150; // Expand for subtext
            plateY = y - 40; // Shift slightly down to cover both lines
        }

        const bgGrad = ctx.createLinearGradient(x - textW / 2 - 100, 0, x + textW / 2 + 100, 0);
        bgGrad.addColorStop(0, 'rgba(0,0,0,0)');
        bgGrad.addColorStop(0.2, 'rgba(0,0,0,0.7)');
        bgGrad.addColorStop(0.8, 'rgba(0,0,0,0.7)');
        bgGrad.addColorStop(1, 'rgba(0,0,0,0)');

        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, plateY, w, plateH);

        // Text Animation: Slight Fade/Blur In
        let alpha = 1.0;
        const progress = this.sceneTimer;
        if (progress < 1000) alpha = progress / 1000;

        ctx.globalAlpha = alpha;

        // 1. Strong Outer Outline (Stroke) for readability over photo
        ctx.lineWidth = 4;
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.strokeText(text, x, y);

        // 2. Subtle Glow
        ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
        ctx.shadowBlur = 10;

        // 3. Main Text Color
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(text, x, y);

        // Subtext (if any)
        if (scene.subText) {
            // Larger Font & Better Visibility
            ctx.font = '500 28px sans-serif';

            const subY = y + 55;

            ctx.strokeStyle = 'rgba(0,0,0,0.8)';
            ctx.lineWidth = 4;
            ctx.shadowBlur = 5;
            ctx.strokeText(scene.subText, x, subY);

            ctx.fillStyle = '#EEE';
            ctx.fillText(scene.subText, x, subY);
        }

        ctx.restore();
    }

    drawParticles(ctx, layer) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';

        this.particles.forEach(p => {
            if (layer === 0 && p.size > 4) return;
            if (layer === 1 && p.size <= 4) return;

            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.restore();
    }
}
