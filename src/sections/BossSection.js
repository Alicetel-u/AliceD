export class BossSection {
    constructor(game) {
        this.game = game;
    }

    update(dt) {
        if (this.game.state !== 'BOSS_BATTLE') {
            this.phase = 'WARNING'; // Reset phase when not in boss battle
            this.timer = 0;
            this.isVulnPhase = false; // Reset vuln phase
            this.impactTriggered = false; // Reset impact flag
            this.game.stopScroll = false; // Reset scroll stop
            this.dialoguePlayed = false; // Reset dialogue flag
            this.whiteOutAlpha = 0;
            this.isWhiteOut = false; // Reset transition flag

            // Cleanup BGM Overlay if active
            const overlay = document.getElementById('bgm-overlay');
            if (overlay) overlay.classList.add('hidden');

            return;
        }

        if (this.game.isPaused) return;

        this.timer += dt;

        // --- PHASE MANAGEMENT ---
        if (this.phase === 'WARNING') {
            // Cut-in / Warning Phase (Optimized to 2.5 seconds for better flow)
            if (this.timer >= 2.5) {
                // Warning Finished -> Go to APPEAR (Boss Entrance Animation)
                this.phase = 'APPEAR';
                this.timer = 0;

                const bossBgm = (this.game.currentStageConfig && this.game.currentStageConfig.boss && this.game.currentStageConfig.boss.bgm) ? this.game.currentStageConfig.boss.bgm : 'BOSS';
                this.game.audio.playBGM(bossBgm);
                if (this.game.currentStageConfig && this.game.currentStageConfig.boss && this.game.currentStageConfig.boss.bgmName) {
                    this.showBgmDisplay(this.game.currentStageConfig.boss.bgmName);
                }
            } else {
                if (this.timer < dt * 2) { // First frame (approx)
                    this.game.audio.playBossAlarm();
                }
            }
        } else if (this.phase === 'APPEAR') {
            // Boss Enter Animation (1.5 seconds for dramatic feel)
            // Slide in from right (+300) to final position
            this.game.boss.isInvulnerable = true;
            const progress = Math.min(1, this.timer / 1.5);
            const ease = 1 - Math.pow(1 - progress, 4); // Smoother ease out
            const startX = this.game.camera.x + this.game.width + 300;
            const endX = this.game.camera.x + this.game.width - 450;

            if (this.game.boss) {
                this.game.boss.x = startX + (endX - startX) * ease;
                // Center boss vertically on screen with a slight vertical slide in too
                const targetY = (this.game.camera.y + this.game.height / 2) - (this.game.boss.height / 2);
                this.game.boss.y = targetY;
                this.game.boss.baseY = targetY;

                // Keep the boss in IDLE state so it animates during appearance
                this.game.boss.state = 'IDLE';
                this.game.boss.update(dt, this.game.player, this.game.camera, this.game.width, this.game.env);
            }

            if (this.timer >= 1.5) {
                // Animation Done -> Check Dialogue
                const stageKey = `STAGE${this.game.stage}`;
                const dialogueKey = `${stageKey}_BOSS_START`;
                let dialogueToPlay = null;

                if (this.game.dialogueManager.hasDialogue(dialogueKey)) {
                    dialogueToPlay = dialogueKey;
                } else if (this.game.stage === 5 && this.game.dialogueManager.hasDialogue('DEMO_FULL')) {
                    dialogueToPlay = 'DEMO_FULL';
                }

                if (dialogueToPlay) {
                    this.phase = 'DIALOGUE';
                    this.game.isPaused = true;
                    this.game.startDialogue(dialogueToPlay, () => {
                        this.game.isPaused = false;
                        this.phase = 'FIGHT';
                        this.timer = 0;
                        this._initFightState();
                    });
                } else {
                    this.phase = 'FIGHT';
                    this.timer = 0;
                    this._initFightState();
                }
            }
        }

        // --- COMMON UPDATES ---
        let activeInput = this.game.input;
        let forceStop = false;

        // If cut-in is active OR APPEARING OR WhiteOut, restrict input and freeze horizontal movement
        if (this.phase === 'WARNING' || this.phase === 'APPEAR' || this.isWhiteOut) {
            activeInput = {
                isPressed: () => false,
                isDown: () => false,
                pointerPressed: false,
                pointerDown: false
            };
            forceStop = true; // Stop horizontal auto-run
        }

        // --- BOSS POSITIONING DURING TRANSITION ---
        if (this.phase === 'WARNING' && this.game.boss) {
            // Keep boss ahead of camera during cut-in
            this.game.boss.x = this.game.camera.x + this.game.width + 300;
            this.game.boss.y = this.game.player.y - 100;
        }

        // Boss Logic (Active in FIGHT and also DIALOGUE so it doesn't look dead while talking)
        if ((this.phase === 'FIGHT' || this.phase === 'DIALOGUE') && this.game.boss) {
            // Check for Point-based Vulnerability Phase
            // Check for Point-based Vulnerability Phase
            // Target Score Configuration
            // Target Score Configuration
            const targetScore = 200;
            /*
            let targetScore;
            switch (this.game.stage) {
                case 1: targetScore = 100; break;
                case 2: targetScore = 200; break; // Default formula match
                case 3: targetScore = 200; break; // Modified
                case 4: targetScore = 200; break; // Modified
                case 5: targetScore = 300; break; // Modified
                default: targetScore = this.game.stage * 100; break;
            }
            */
            if (this.game.stageScoreGained >= targetScore && !this.isVulnPhase) {
                this.isVulnPhase = true;
                this.game.stopScroll = true; // Stop Camera Scroll
                this.game.boss.isInvulnerable = false; // Now you can hit it!
                // this.game.boss.hp = 5; // REMOVED: Respect StageConfig HP
                // this.game.boss.maxHp = 5; // REMOVED: Respect StageConfig HP

                // Boss Logic: Continue BATTLE state but with barrier broken
                this.game.boss.state = 'BATTLE';

                // Boss will automatically retreat to right edge due to Boss.js update logic when !isInvulnerable.

                // Barrier Break Effects
                this.game.audio.playBarrierBreak();
                this.game.camera.shake(0.5, 20); // 0.5s shake, 20 intensity

                // Flashy Particles
                for (let i = 0; i < 60; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const speed = 5 + Math.random() * 20;
                    this.game.env.particles.push({
                        x: this.game.boss.x + this.game.boss.width / 2,
                        y: this.game.boss.y + this.game.boss.height / 2,
                        vx: Math.cos(angle) * speed,
                        vy: Math.sin(angle) * speed,
                        life: 40 + Math.random() * 40,
                        size: 4 + Math.random() * 10,
                        color: `hsl(${180 + Math.random() * 60}, 100%, 70%)`, // Cyber Blue/Cyan
                        fade: true,
                        glow: true
                    });
                }

                // Shockwave
                this.game.env.particles.push({
                    x: this.game.boss.x + this.game.boss.width / 2,
                    y: this.game.boss.y + this.game.boss.height / 2,
                    vx: 0, vy: 0, life: 30, size: 50, grow: 15, // Rapidly expanding
                    color: 'rgba(255, 255, 255, 0.8)',
                    fade: true
                });

                // Text Popup
                this.game.env.particles.push({
                    type: 'text',
                    x: this.game.width / 2, y: this.game.height / 2,
                    vx: 0, vy: -2, life: 100,
                    text: "✨ BARRIER BREAK! ✨", color: '#00d2ff', size: 50,
                    screenSpace: true, bold: true
                });

                const barrierKey = `STAGE${this.game.stage}_BARRIER_BREAK`;
                if (this.game.dialogueManager.hasDialogue(barrierKey)) {
                    this.game.startDialogue(barrierKey);
                }

                console.log("BOSS STOPPED ON GROUND! CONTINUE AUTO-RUN.");
            }

            if (!this.game.bossVictoryProcessed) {
                this.game.boss.update(dt, this.game.player, this.game.camera, this.game.width, this.game.env);
                if (!this.game.boss.defeated) this.game.checkBossCollision();
            }
            if (this.game.boss.defeated && !this.game.bossVictoryProcessed) {
                this.game.bossVictoryProcessed = true;

                // Cinematic Explosion
                this.game.spawnBossExplosion(
                    this.game.boss.x + this.game.boss.width / 2,
                    this.game.boss.y + this.game.boss.height / 2
                );

                const finishLevel = () => {
                    if (this.game.stage === 5) {
                        // Stage 5: Skip whiteout, go directly to ending to avoid visual clash
                        this.game.state = 'ENDING';
                        const char = this.game.characterManager.getCurrentCharacter();
                        const endingId = (char && char.id === 'kanon') ? 'KANON_TRUE' : 'ALICE_TRUE';
                        this.game.endingSection.start(endingId);
                    } else {
                        this.isWhiteOut = true;
                        this.whiteOutAlpha = 0;
                    }
                };

                const defeatKey = `STAGE${this.game.stage}_BOSS_DEFEAT`;

                // Check if dialogue exists (Inclusive of Stage 5)
                // Note: Game.js startDialogue handles the _KANON suffix logic automatically.
                if (this.game.dialogueManager.hasDialogue(defeatKey) ||
                    (this.game.stage === 5 && (this.game.dialogueManager.hasDialogue(defeatKey + '_KANON') || this.game.dialogueManager.hasDialogue(defeatKey)))) {

                    // Wait for slow-mo explosion (1.5s) THEN start dialogue
                    setTimeout(() => {
                        this.game.isPaused = true;
                        this.game.startDialogue(defeatKey, () => {
                            this.game.isPaused = false;
                            finishLevel(); // Whiteout -> Ending triggered here
                        });
                    }, 1500);
                } else {
                    // Fallback if no dialogue found
                    setTimeout(finishLevel, 1500);
                }
            }
        }

        // Player Update (Forced Scroll continues - isManual is false)
        this.game.player.update(
            activeInput,
            this.game.level,
            this.game.camera,
            this.game.audio,
            dt,
            true, // isBossMode = true during battle
            this.game.stage >= 2 ? 1 : 0, // stageBonus
            this.game.knockbackTimer > 0,
            false // Continue auto-run even if boss defeated (Victory Exit)
        );

        // Freeze player horizontally during WARNING
        if (forceStop) {
            this.game.player.vx = 0;
            // Also reset x based on last frame if needed, but vx=0 usually enough for auto-run player
        }

        // Enable item, enemy, and gizmo (springs) collection during boss battle
        this.game.checkCollectibles();
        this.game.checkEnemyCollisions();
        this.game.checkGizmos();

        // 物理的なすり抜け・画面外押し出し防止
        const p = this.game.player;
        const cam = this.game.camera;

        // 1. 画面左端の壁 (通常ステージに戻れないようにする / ノックバックで置いていかれないようにする)
        if (p.x < cam.x) {
            p.x = cam.x;
            if (p.vx < 0) p.vx = 0;
        }

        // 2. ボス突き抜け・押し出し防止 (バリア破壊後の体当たりフェーズ)
        if (this.isVulnPhase && this.game.boss) {
            const b = this.game.boss;

            if (!b.defeated) {
                const wallX = b.x + 40;
                if (p.x + p.width > wallX) {
                    p.x = wallX - p.width;
                    if (p.vx > 0) p.vx = 0; // 前進を止める
                }
            }
        }

        // 落下リスポーン
        if (this.game.player.y > this.game.level.height + 150) {
            this.game.handlePlayerFall();
        }

        // White Out Transition Logic
        if (this.isWhiteOut) {
            this.whiteOutAlpha += dt * 0.5; // 2 seconds to full white
            if (this.whiteOutAlpha >= 1.0) {
                this.whiteOutAlpha = 1.0;

                // Prevent multiple executions and ensure boss is actually defeated
                if (this.game.gameWon || this.game.state === 'ENDING' || !this.game.bossVictoryProcessed) return;

                if (this.game.stage === 5) {
                    console.log("Transiting to ENDING state");
                    this.game.state = 'ENDING';

                    // キャラクターによる分岐
                    const char = this.game.characterManager.getCurrentCharacter();
                    if (char && char.id === 'kanon') {
                        this.game.endingSection.start('KANON_TRUE');
                    } else {
                        // アリスの場合、またはデフォルト
                        this.game.endingSection.start('ALICE_TRUE');
                    }
                } else {
                    this.game.gameWon = true;
                    this.game.audio.playWin();
                }
            }
        }
    }

    draw() {
        if (this.game.state !== 'BOSS_BATTLE') return;

        const ctx = this.game.ctx;
        const w = this.game.width;
        const h = this.game.height;
        const t = this.timer;

        // --- WARNING CUT-IN OVERLAY ---
        if (this.phase === 'WARNING') {
            ctx.save();

            // Stage 1: Glitch Hazard Background (0.0s - 1.0s)
            const glitch = Math.floor(t * 15) % 2 === 0;
            if (t < 1.0) {
                ctx.fillStyle = glitch ? 'rgba(255, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.4)';
                ctx.fillRect(0, 0, w, h);

                // Drawing Hazard Stripes
                ctx.fillStyle = '#f1c40f';
                const stripeW = 100;
                for (let i = -1; i < w / stripeW + 1; i++) {
                    ctx.beginPath();
                    ctx.moveTo(i * stripeW + (t * 200) % stripeW, 0);
                    ctx.lineTo(i * stripeW + 50 + (t * 200) % stripeW, 0);
                    ctx.lineTo(i * stripeW + 20 + (t * 200) % stripeW, h);
                    ctx.lineTo(i * stripeW - 30 + (t * 200) % stripeW, h);
                    ctx.fill();
                }
            } else {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
                ctx.fillRect(0, 0, w, h);
            }

            // Stage 2: Cinematic Slit (Horizontal Bars)
            const slitProgress = Math.min(1.0, Math.max(0, (t - 0.5) * 2)); // Starts at 0.5s
            const barH = h * 0.25;
            const slitY = (h - barH) / 2;

            ctx.fillStyle = '#000';
            // Top bar
            ctx.fillRect(0, 0, w, slitY * (1 - slitProgress / 4)); // Closes slightly or stays
            // Bottom bar
            ctx.fillRect(0, h - slitY * (1 - slitProgress / 4), w, slitY);

            // Stage 3: Boss Entry & Speedlines (1.0s - 3.0s)
            if (t > 1.0) {
                const bossConfig = this.game.currentStageConfig ? this.game.currentStageConfig.boss : {};
                const cutinKey = bossConfig.cutin || 'boss_cutin';
                const cutinImg = this.game.assets.getImage(cutinKey);

                // Speedlines
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
                ctx.lineWidth = 2;
                for (let i = 0; i < 20; i++) {
                    const lineY = slitY + Math.random() * barH;
                    ctx.beginPath();
                    ctx.moveTo(0, lineY);
                    ctx.lineTo(w, lineY);
                    ctx.stroke();
                }

                if (cutinImg) {
                    const entryT = Math.min(1.0, (t - 1.0) * 1.5);
                    const offX = (1 - entryT) * w;
                    const imgRatio = cutinImg.height / cutinImg.width;
                    const drawW = w * 0.8;
                    const drawH = drawW * imgRatio;
                    const drawY = (h - drawH) / 2;

                    ctx.save();
                    ctx.globalAlpha = Math.min(1.0, entryT * 2);
                    ctx.shadowColor = '#ff4757';
                    ctx.shadowBlur = 20;
                    ctx.drawImage(cutinImg, offX + w * 0.1, drawY, drawW, drawH);
                    ctx.restore();
                }
            }

            // Stage 4: Impact Title (2.5s - 4.0s)
            if (t > 2.5) {
                if (!this.impactTriggered) {
                    this.game.audio.playBossImpact();
                    this.game.camera.shake(0.5, 30);
                    this.impactTriggered = true;
                }

                const titleT = Math.min(1.0, (t - 2.5) * 4);
                ctx.save();
                ctx.translate(w / 2, h / 2 + 100);
                ctx.scale(2.0 - titleT, 2.0 - titleT); // Slamming from large to normal
                ctx.globalAlpha = titleT;

                ctx.font = '900 italic 70px sans-serif';
                ctx.textAlign = 'center';

                // Shadow
                ctx.fillStyle = '#000';
                ctx.strokeText("強敵出現", 6, 6);

                // Main Text
                const grad = ctx.createLinearGradient(0, -30, 0, 30);
                grad.addColorStop(0, '#f1c40f');
                grad.addColorStop(1, '#e67e22');
                ctx.fillStyle = grad;
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 4;
                ctx.strokeText("強敵出現", 0, 0);
                ctx.fillText("強敵出現", 0, 0);

                ctx.restore();
            }

            // Central Warning Text (Stage 1 only)
            if (t < 1.2) {
                ctx.save();
                ctx.translate(w / 2, h / 2);
                const s = 1.0 + 0.2 * Math.sin(t * 30);
                ctx.scale(s, s);
                ctx.font = '900 italic 80px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillStyle = glitch ? '#fff' : '#ff3838';
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 8;
                ctx.strokeText("WARNING", 0, 0);
                ctx.fillText("WARNING", 0, 0);
                ctx.restore();
            }

            ctx.restore();
        }

        // White Out Overlay
        if (this.whiteOutAlpha > 0) {
            ctx.fillStyle = `rgba(255, 255, 255, ${this.whiteOutAlpha})`;
            ctx.fillRect(0, 0, w, h);
        }
    }
    showBgmDisplay(name) {
        const overlay = document.getElementById('bgm-overlay');
        const title = document.getElementById('bgm-title-text');
        if (overlay && title) {
            title.innerText = name;
            overlay.classList.remove('hidden');

            // Reset animation (optional, implies forcing reflow if we want re-trigger)

            // Hide after 6 seconds
            if (this.bgmTimer) clearTimeout(this.bgmTimer);
            this.bgmTimer = setTimeout(() => {
                overlay.classList.add('hidden');
            }, 6000);
        }
    }
    _initFightState() {
        console.log("Boss Battle Triggered!");
        // Placeholder for any specific battle start initialization
    }
}
