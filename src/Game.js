import { Assets } from './Assets.js';
import { Input } from './Input.js';
import { Level } from './Level.js';
import { Player } from './entities/Player.js';
import { Boss } from './entities/Boss.js';
import { Camera } from './Camera.js';
import { ParallaxBackground } from './ParallaxBackground.js';

import { Environment } from './Environment.js';
import { AudioManager } from './AudioManager.js';
import { GachaSystem } from './GachaSystem.js';
import { DrillEnemy } from './entities/DrillEnemy.js';
import { CloudEnemy } from './entities/CloudEnemy.js';
import { Spring } from './entities/Spring.js';
import { SpeedRing } from './entities/SpeedRing.js';
import { CloudPlatform } from './entities/CloudPlatform.js';
import { MovingPlatform } from './entities/MovingPlatform.js';
import { FallingPlatform } from './entities/FallingPlatform.js';
import { CharacterManager } from './CharacterManager.js';
import { SectionManager } from './SectionManager.js';
import { HomeManager } from './HomeManager.js';
import { DebugManager } from './DebugManager.js';
import { BossSection } from './sections/BossSection.js';
import { ResultSection } from './sections/ResultSection.js';
import { StageUI } from './sections/StageUI.js';
import { VFXManager } from './sections/VFXManager.js';
import { DialogueSection } from './sections/DialogueSection.js';
import { EndingSection } from './sections/EndingSection.js';
import { StageConfig } from './data/StageConfig.js';
import { StagePlacements } from './data/StagePlacements.js';
import { StageValidator } from './utils/StageValidator.js';
import { applyPolyfills } from './utils/Polyfills.js';
import { DialogueManager } from './managers/DialogueManager.js';
import { BootManager } from './managers/BootManager.js';

// ... existing imports

const DAMAGE_TEXTS_ALICE = [
    'いたいぴょん(>_<)', 'きゃっ！(>_<)', 'お耳がぁ！(；ω；)', '痛いよぉ(TnT)', 'しくしく…(T_T)',
    'もう…やめてぇ(>_<)', 'うぅ…痛い(；ω；)', '転んじゃった(>_<*)', 'ひどいことするね(｀ε´)', 'めっ！だよ(｀・ω・´)',
    'ふえぇ…(ノД`)', '痛いの飛んでけー(>人<)', 'にんじんあげるから…(；ω；)', 'もふもふが…(ToT)', 'やんっ！(>_<)',
    'そんなぁ…(；ω；)', '痛いぴょん！(>_<)', 'うぅ…(>_<)', 'めまいが…(@_@)', 'お星さまが見える(☆_☆)',
    'もう怒ったよ！(｀^´)', 'ぷんぷん！(｀ε´)', 'しくしく(TnT)', '誰か助けてぇ(>_<)', 'あいたたた…(>_<)',
    'ひどいよぉ(；ω；)', 'うわーん！(ToT)', 'お耳ひっぱらないで(>_<)', 'しっぽが…(；ω；)', 'いたいっ！(>_<)'
];

const DAMAGE_TEXTS_KANON = [
    'きゃっ！(>_<)', 'くっ…(>_<)', '痛いじゃない！(｀^´)', 'なんですって！？(ﾟДﾟ)', 'ひどい…(；ω；)',
    '信じられない！(ﾟДﾟ)', 'もうっ！(｀ε´)', '気安く触らないで(>_<)', '覚悟なさい！(｀・ω・´)', '許さないんだから(｀^´)',
    'うぅ…痛いわ(；ω；)', '油断したわ…(>_<)', '計算外ね(ﾟДﾟ)', 'ちょっと！(｀ε´)', 'やめてよ！(>_<)',
    'スカートが…(；ω；)', '痛いってば！(｀^´)', '何するのよ！(｀・ω・´)', '無礼ね！(｀^´)', '反省しなさい！(｀・ω・´)',
    'もう、知らない！(｀ε´)', '私の計算が…(>_<)', 'くじけないわ(｀・ω・´)', 'まだ終わらないわ(｀^´)', '痛い…(；ω；)',
    'なんてこと…(ﾟДﾟ)', '屈辱ね…(>_<)', '弁償してよね(｀ε´)', '次は負けない！(｀・ω・´)', 'きゃあ！(>_<)'
];

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d', { alpha: false });
        applyPolyfills(this.ctx);

        // Disable antialiasing for pixel art look
        this.ctx.imageSmoothingEnabled = false;

        this.width = canvas.width;
        this.height = canvas.height;

        this.assets = new Assets();
        this.input = new Input();
        this.tileSize = 64;
        this.camera = new Camera(this.width, this.height);
        this.level = new Level(this.tileSize); // 64px tiles base
        this.parallax = new ParallaxBackground(this.width, this.height);
        this.env = new Environment(this.width, this.height);
        this.audio = new AudioManager();
        this.characterManager = new CharacterManager();
        this.dialogueManager = new DialogueManager(this);

        this.player = null;
        this.boss = null;
        this.enemies = [];
        this.score = 0;
        this.stageScoreGained = 0; // そのステージで純粋に得た分
        this.lives = 5; // Starting with 5 hearts
        this.isDebtState = false; // Flag to track if we switched to syringe mode
        this.running = false;
        this.isPaused = false;
        this.gameWon = false;
        this.lastTime = 0;
        this.state = 'WAIT_FOR_INPUT'; // HOME, PLAYING, BOSS_BATTLE, RESPAWN_WAIT
        this.winCooldown = 0;
        this.damageCooldown = 0; // Invulnerability frames
        this.knockbackTimer = 0; // Control loss frames
        this.recoveryCooldown = 0; // Cooldown for knockback recovery
        this.hitStopTimer = 0; // Brief freeze on impact
        this.timeScale = 1.0; // For slow motion effects
        this.stage = 1;
        this.introTimer = 0;
        this.bossIntroTimer = 0;
        this.bossDefeatTimer = 0;
        this.cameraOffsetX = this.width / 2;

        // Stage Stats & Results
        this.stageStartTime = Date.now();
        this.stageDamageCount = 0;
        this.results = null;

        // タイトル画面のフェード効果
        this.titleFadeAlpha = 1.0; // 0.0 ~ 1.0
        this.titleFadeState = 'IDLE'; // IDLE, FADE_OUT, FADE_IN
        this.titleFadeSpeed = 0.05; // フェード速度
        this.pendingCharacterChange = null; // 切り替え待ちのキャラクター

        // Load Progress
        this.loadProgress();

        // Initialize Gacha (AFTER loading score)
        this.gacha = new GachaSystem(this);

        // Home Management
        this.homeManager = new HomeManager(this);

        // Debug Management (Independent section)
        this.debugManager = new DebugManager(this);

        // Section Management
        this.sections = new SectionManager(this);
        this.stageUI = new StageUI(this);
        this.resultSection = new ResultSection(this);
        this.vfx = new VFXManager(this);
        this.dialogueSection = new DialogueSection(this);
        this.endingSection = new EndingSection(this);
        this.bootManager = new BootManager(this); // Logic-only Boot Manager

        this.setupSections();
        this.homeManager.setupSections();
        this.setupDebugSections();
    }

    setupDebugSections() {
        this.sections.register('DebugSystem', {
            update: (dt) => this.debugManager.update(dt),
            draw: () => this.debugManager.draw()
        });
    }

    setupSections() {
        // Dialogue Logic
        this.sections.register('DialogueSystem', {
            update: (dt) => this.dialogueSection.update(dt)
        });

        // Ending Logic
        this.sections.register('EndingSystem', {
            update: (dt) => this.endingSection.update(dt),
            draw: () => this.endingSection.draw()
        });

        // 各機能をセクションとして登録
        this.sections.register('System', {
            update: (dt) => {
                this.input.update();

                if (!this.player) return;

                this.dialogueManager.update(dt);
                if (this.damageCooldown > 0) this.damageCooldown -= dt;
                if (this.knockbackTimer > 0) {
                    this.knockbackTimer -= dt;
                    // 着地するまでノックバック状態を継続（地面に着くまでは操作不能）
                    if (this.knockbackTimer <= 0 && !this.player.grounded) {
                        this.knockbackTimer = 0.01; // 微小な時間を保持
                    }
                }
                if (this.recoveryCooldown > 0) this.recoveryCooldown -= dt;

                // Knockback Recovery (Aerial Tech) - Moved to System to work in Boss Battles
                const isRecoveryInput =
                    this.input.isPressed('Space') ||
                    this.input.pointerPressed;

                if (this.knockbackTimer > 0 && this.knockbackTimer < 0.85 && isRecoveryInput && this.recoveryCooldown <= 0) {
                    this.knockbackTimer = 0;
                    this.recoveryCooldown = 2.0; // 2 seconds cooldown
                    // Removed hitStopTimer here as requested

                    // Momentum Reset (Stop flying away)
                    if (this.player) {
                        this.player.vy = -600; // Hop up
                        this.player.vx = 0;    // Stop horizontal movement
                        this.player.jumpCount = 1;
                    }

                    // SE: Highlight
                    this.audio.playRecovery();

                    // Visual Feedback: Text
                    if (this.player) {
                        this.env.particles.push({
                            type: 'text',
                            x: this.player.x + this.player.width / 2,
                            y: this.player.y - 60,
                            vx: 0, vy: -1, life: 60,
                            text: "RECOVERY!",
                            color: '#ffff00', size: 28, bold: true, pulse: true,
                            stroke: '#000000'
                        });

                        // Visual Feedback: Yellow Barrier (Visible & Sustained)
                        this.env.particles.push({
                            x: this.player.x + this.player.width / 2,
                            y: this.player.y + this.player.height / 2 - 150,
                            vx: 0, vy: 0,
                            life: 30, // 0.5 sec
                            size: 60,
                            grow: 20, // Moderate growth
                            color: 'rgba(255, 235, 59, 0.7)',
                            fade: true,
                            glow: true
                        });

                        // Extra Sparkles
                        for (let i = 0; i < 16; i++) {
                            const angle = (i / 16) * Math.PI * 2;
                            this.env.particles.push({
                                x: this.player.x + this.player.width / 2,
                                y: this.player.y + this.player.height / 2 - 150,
                                vx: Math.cos(angle) * 10,
                                vy: Math.sin(angle) * 10,
                                life: 40, size: 5, color: '#fff',
                                friction: 0.95
                            });
                        }
                    }
                }
            }
        });

        // World Renderer: 中央集権的な描画システム (背景 -> マップ -> キャラ -> エフェクト)
        this.sections.register('WorldRenderer', {
            update: (dt) => {
                this.vfx.update(dt);
            },
            draw: () => this.drawWorld()
        });

        this.sections.register('Environment', {
            update: (dt) => this.env.update(dt)
            // Draw moved to WorldRenderer
        });

        // ※CharacterSelectionはHomeManager側で管理されるようになりました

        this.sections.register('Gameplay', {
            update: (dt) => {
                if (this.isPaused || !this.player) return;
                if (this.state === 'HOME' || this.state === 'WAIT_FOR_INPUT' || this.gameWon || this.state === 'BOSS_BATTLE' || this.state === 'BOOT') return;

                // --- NEW: Block gameplay (movement) if dialogue is active ---
                if (this.dialogueManager && this.dialogueManager.active) return;

                // --- DIALOGUE TRIGGERS ---
                if (this.dialogueFlags && this.state === 'PLAYING') {
                    const stageKey = `STAGE${this.stage}`;
                    // Opening
                    if (!this.dialogueFlags.opening) {
                        const key = `${stageKey}_OPENING`;
                        if (this.dialogueManager.hasDialogue(key)) {
                            this.dialogueFlags.opening = true;
                            this.startDialogue(key, () => {
                                this.showReadyGo();
                            });
                        } else {
                            this.dialogueFlags.opening = true;
                            this.showReadyGo();
                        }
                        return;
                    }
                    // Midpoint (Approx 200 tiles)
                    if (!this.dialogueFlags.mid && this.player.x > this.tileSize * 200) {
                        const key = `${stageKey}_MID`;
                        if (this.dialogueManager.hasDialogue(key)) {
                            this.dialogueFlags.mid = true;
                            this.startDialogue(key);
                        } else {
                            this.dialogueFlags.mid = true; // Skip if non-existent
                        }
                    }
                }
                // -------------------------

                // Count down timers based on dt
                if (this.damageCooldown > 0) this.damageCooldown -= dt;
                if (this.knockbackTimer > 0) this.knockbackTimer -= dt;
                if (this.bossDefeatTimer > 0) {
                    this.bossDefeatTimer -= dt;
                    if (this.bossDefeatTimer <= 0) {
                        this.timeScale = 1.0; // Reset slow-mo
                    }
                }

                // Respawn Animation Handling
                if (this.state === 'RESPAWNING') {
                    this.updateRespawnAnimation(dt);
                    return;
                }

                // Knockback Recovery logic moved to System section

                // Gameplay section remaining timers
                if (this.bossDefeatTimer > 0) {
                    this.bossDefeatTimer -= dt;
                    if (this.bossDefeatTimer <= 0) {
                        this.timeScale = 1.0; // Reset slow-mo
                    }
                }

                // Check Boss Transition
                const bossTriggerX = (this.preBossLength || 400) * this.tileSize;
                if (this.player.x >= bossTriggerX && this.state === 'PLAYING') {
                    this.state = 'BOSS_BATTLE';
                    this.camera.minX = this.camera.x; // Transparent Wall: Prevents returning to normal stage
                    // Boss BGM will be played after the cut-in in BossSection.js
                    // Ensure boss is woken up or reset if needed
                    if (this.boss) {
                        this.boss.state = 'IDLE'; // Will be switched to BATTLE by BossSection
                    }
                    return;
                }

                // 落下検知
                let activeInput = this.input;
                if (this.player.y > this.level.height) {
                    activeInput = {
                        isPressed: () => false,
                        isDown: () => false,
                        pointerPressed: false,
                        pointerDown: false
                    };
                }

                const stageBonus = (this.stage >= 2) ? 1 : 0;
                this.player.update(activeInput, this.level, this.camera, this.audio, dt, false, stageBonus, this.knockbackTimer > 0);
                this.enemies.forEach(enemy => enemy.update(dt, this.level, this.camera));

                this.checkCollectibles();
                this.checkGizmos();
                if (this.springs) this.springs.forEach(s => s.update(dt));
                if (this.rings) this.rings.forEach(r => r.update(dt));
                if (this.clouds) this.clouds.forEach(c => c.update(dt));
                this.checkEnemyCollisions();

                // 落下リスポーン
                if (this.player.y > this.level.height + 150) {
                    this.handlePlayerFall();
                }
            }
            // Draw moved to WorldRenderer
        });

        this.sections.register('BossEncounter', new BossSection(this));

        this.sections.register('Camera', {
            update: (dt) => {
                if (this.state === 'HOME' || this.state === 'WAIT_FOR_INPUT' || this.state === 'BOOT' || !this.player) return;

                const targetOffset = (this.state === 'BOSS_BATTLE') ? this.width * 0.2 : this.width / 2;
                // Fix: dt * 120 is > 1.0, causing explosion.            // Camera follow Logic
                // We want to offset camera so player is more on the left for running
                // Camera follow Logic
                if (this.stopScroll) {
                    // 横スクロールは止めるが、上下（地面の視認）は追撃するためにYのみ追従させる
                    const prevX = this.camera.x;
                    this.camera.follow(this.player, this.level.width, this.level.height, dt, 400);
                    this.camera.x = prevX;
                } else {
                    this.camera.follow(this.player, this.level.width, this.level.height, dt, 400);
                }
            }
        });

        this.sections.register('UI', {
            update: (dt) => {
                if (this.gameWon && this.state !== 'ENDING') {
                    // input.update() is handled in 'System' section. Do not call it here.
                    this.resultSection.update(dt);
                    return;
                }
                if (this.state === 'PLAYING' || this.state === 'BOSS_BATTLE') {
                    this.updateSpeedUI();
                }
            },
            draw: () => {
                this.drawGameUI();
            }
        });
    }

    // --- Centralized World Renderer ---
    drawWorld() {
        if (this.gameWon) return; // Dedicated win screen handles this
        if (this.state === 'HOME' || this.state === 'WAIT_FOR_INPUT' || this.state === 'BOOT') return; // Home/Intro handles itself

        // 1. Clear Screen & Background (Dynamic based on Stage Theme)
        const bgColor = (this.currentStageConfig && this.currentStageConfig.theme)
            ? this.currentStageConfig.theme.backgroundColor
            : '#54a0ff';

        // Create a subtle vertical gradient for "premium" feel
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, bgColor);
        gradient.addColorStop(1, this.adjustColor(bgColor, -20)); // Slightly darker at bottom

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Apply Screen Shake
        this.ctx.save(); // Save for shake
        this.vfx.applyShake(this.ctx);

        this.parallax.draw(this.ctx, this.camera);

        // 2. Level (Tiles)
        this.level.draw(this.ctx, this.assets, this.camera);

        // 3. Enemies
        this.enemies.forEach(enemy => enemy.draw(this.ctx, this.assets, this.camera));

        if (this.springs) this.springs.forEach(s => s.draw(this.ctx, this.assets, this.camera));
        if (this.rings) this.rings.forEach(r => r.draw(this.ctx, this.assets, this.camera));
        if (this.clouds) this.clouds.forEach(c => c.draw(this.ctx, this.assets, this.camera));
        if (this.movingPlatforms) this.movingPlatforms.forEach(mp => mp.draw(this.ctx, this.camera));
        if (this.fallingPlatforms) this.fallingPlatforms.forEach(fp => fp.draw(this.ctx, this.camera));

        // 4. Player
        if (this.player) {
            this.player.draw(this.ctx, this.assets, this.camera);
        }

        // 5. Boss
        if (this.boss && (this.state === 'BOSS_BATTLE')) {
            // Only draw boss if we are in boss battle (or maybe transitioning)
            // BossSection will handle Overlay/Cut-in
            this.boss.draw(this.ctx, this.assets, this.camera);
        }

        // 6. Particles (Environment)
        this.env.draw(this.ctx, this.camera);

        this.ctx.restore(); // Restore shake

        // 7. Post-Process FX
        this.vfx.drawPostProcess(this.ctx);
    }

    // --- Respawn Animation Logic ---
    updateRespawnAnimation(dt) {
        this.respawnTimer += dt;
        const duration = 1.0; // 1秒かけて戻る
        const t = Math.min(this.respawnTimer / duration, 1.0);

        // EaseOutCubic: Smoothly return
        const ease = 1 - Math.pow(1 - t, 3);

        this.player.x = this.respawnStart.x + (this.respawnTarget.x - this.respawnStart.x) * ease;
        this.player.y = this.respawnStart.y + (this.respawnTarget.y - this.respawnStart.y) * ease;

        // アニメーション終了
        if (t >= 1.0) {
            if (this.wasBossBattle) {
                this.state = 'BOSS_BATTLE';
            } else {
                this.state = 'PLAYING';
            }

            this.damageCooldown = 1.0; // 復帰後無敵 (1s)
            this.knockbackTimer = 0; // すぐに動けるようにする
            this.player.grounded = false;
            this.player.vx = 0;
            this.player.vy = 0;
            this.player.isGliding = false;
        }
    }

    async startGame() {
        if (!this.audio.initialized) {
            await this.audio.init();
        }
        this.audio.playBGM('GAME');

        // Context resume ensure
        if (this.audio.ctx && this.audio.ctx.state === 'suspended') {
            this.audio.ctx.resume();
        }

        this.stage = 1;
        this.score = 0;
        this.stageScoreGained = 0;
        this.lives = 5;
        this.isDebtState = false;
        this.stageDamageCount = 0;
        this.stageStartTime = Date.now();
        this.gacha.resetCollection();
        this.saveProgress();
        this.updateScoreUI();

        // 読み込み画面を表示
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.classList.remove('hidden');
            const info = document.getElementById('loading-status');
            if (info) info.textContent = `PREPARING STAGE ${this.stage}...`;
        }

        // ホーム画面UIを強制的に隠す
        const homeUI = ['home-gacha-panel', 'home-collection-panel'];
        homeUI.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.add('hidden');
        });

        // 動的ロードの実行
        await this.loadStageAssets(this.stage);

        // ロード完了後に開始
        this.initLevel();
        this.updateStageUI(); // タイトル表示を確実に実行

        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
        }

        this.state = 'STAGE_INTRO';
        this.introTimer = 0;
    }

    handlePlayerFall() {
        if (this.state === 'RESPAWNING' || this.state === 'GAME_OVER') return;

        // 情けない音を再生
        this.audio.playFall();

        // ボス戦かどうかの状態を保存
        this.wasBossBattle = (this.state === 'BOSS_BATTLE');

        // ボス戦の場合は落下ダメージなしで復帰（即死級だが救済）
        // デバッグモード（無敵）ならライフを減らさない
        const isGodMode = this.debugManager && this.debugManager.isGodMode;

        // 落下ダメージの処理 (takeDamageと同じロジックを適用)
        this.stageDamageCount++;

        if (!isGodMode) {
            if (!this.isDebtState) {
                if (this.lives > 0) {
                    this.lives--;
                } else {
                    this.isDebtState = true;
                }
            }
        }

        this.updateHealthUI();

        // Respawn Sequence開始 (GAME_OVERを廃止し、常にリスポーンさせる)
        this.state = 'RESPAWNING';
        this.respawnTimer = 0;

        this.respawnStart = { x: this.player.x, y: this.player.y };

        // 目標地点：最後の安全位置
        // 勝手にオフセットすると壁の中や穴の上に移動してしまう可能性があるため、lastSafeXをそのまま使う
        // もっと後ろに戻す (15 tiles back)
        let targetX = (this.player.lastSafeX || 100) - this.tileSize * 15;
        // スタート地点より前には行かない
        if (targetX < this.spawnX) targetX = this.spawnX;

        // Y座標はそこから少し上空から落とす（高く戻すことで着地までの猶予を持たせる）
        let targetY = (this.player.lastSafeY || this.level.height - 200) - this.tileSize * 8;
        if (targetY < 0) targetY = 0;

        this.respawnTarget = { x: targetX, y: targetY };

        // 物理挙動リセット
        this.player.vx = 0;
        this.player.vy = 0;
        this.damageCooldown = 60;
    }

    drawCharacterSelectionUI() {
        // (以前のdraw内のタイトルUI描画ロジックをここに移植...)
        const currentChar = this.characterManager.getCurrentCharacter();
        const theme = currentChar.theme || { primaryColor: '#FFD700', secondaryColor: '#FFA500' };

        const boxWidth = 320;
        const boxHeight = 140;
        const boxX = this.width - boxWidth - 20;
        const boxY = this.height - boxHeight - 20;

        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
        this.ctx.strokeStyle = theme.primaryColor;
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

        this.ctx.fillStyle = theme.primaryColor;
        this.ctx.font = 'bold 18px monospace';
        this.ctx.textAlign = 'left';
        this.ctx.fillText("CHARACTER SELECT", boxX + 15, boxY + 30);

        this.ctx.fillStyle = '#FFF';
        this.ctx.font = 'bold 24px monospace';
        this.ctx.fillText(currentChar.name, boxX + 15, boxY + 65);

        this.ctx.font = '14px monospace';
        this.ctx.fillStyle = '#AAA';
        this.ctx.fillText(currentChar.description || '', boxX + 15, boxY + 90);

        this.ctx.fillStyle = theme.secondaryColor;
        this.ctx.font = '12px monospace';
        this.ctx.fillText("Press Left/Right Arror to Change", boxX + 15, boxY + 120);
    }

    drawGameUI() {
        // Toggle HTML UI Visiblity based on state
        // Only show HUD and Debug tools when actually playing a stage
        const isIngame = (this.state === 'PLAYING' || this.state === 'BOSS_BATTLE' || this.state === 'RESPAWNING' || this.state === 'GAME_OVER' || this.gameWon);

        const uiLayer = document.getElementById('ui-layer');
        const debugContainer = document.getElementById('debug-container');

        if (uiLayer) {
            uiLayer.style.display = isIngame ? 'flex' : 'none';
        }
        if (debugContainer) {
            const isVisible = this.debugManager ? this.debugManager.isVisible : false;
            // SHOW if (ingame OR explicitly visible via secret trigger)
            debugContainer.style.display = (isIngame || isVisible) ? 'block' : 'none';
        }

        // 1. Click to Start Screen
        if (this.state === 'WAIT_FOR_INPUT') {
            this.ctx.save();

            // Draw Title Background
            const titleBg = this.assets.getImage('bg_title');
            if (titleBg) {
                // "Cover" fit logic
                const imgAspect = titleBg.width / titleBg.height;
                const screenAspect = this.width / this.height;

                let drawW, drawH, offsetX, offsetY;

                if (screenAspect > imgAspect) {
                    drawW = this.width;
                    drawH = drawW / imgAspect;
                    offsetX = 0;
                    offsetY = (this.height - drawH) / 2;
                } else {
                    drawH = this.height;
                    drawW = drawH * imgAspect;
                    offsetX = (this.width - drawW) / 2;
                    offsetY = 0;
                }
                this.ctx.drawImage(titleBg, offsetX, offsetY, drawW, drawH);
            } else {
                // Fallback
                this.ctx.fillStyle = '#54a0ff';
                this.ctx.fillRect(0, 0, this.width, this.height);
            }

            // Text: CLICK TO START
            this.introBlinkTimer = (this.introBlinkTimer || 0) + 0.05;
            const alpha = 0.6 + 0.4 * Math.sin(this.introBlinkTimer * 3);

            this.ctx.save();
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';

            // Glow Effect
            this.ctx.shadowBlur = 20;
            this.ctx.shadowColor = '#FFFFFF';

            // Main Text
            this.ctx.font = '900 48px "Verdana", sans-serif';
            this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            this.ctx.fillText("CLICK TO START", this.width / 2, this.height * 0.85);

            // Cancel Shadow for clean outline
            this.ctx.shadowBlur = 0;
            this.ctx.strokeStyle = `rgba(0, 0, 0, ${alpha * 0.5})`;
            this.ctx.lineWidth = 3;
            this.ctx.strokeText("CLICK TO START", this.width / 2, this.height * 0.85);

            this.ctx.restore();

            this.ctx.restore();
            return;
        }

        // ステージUI（ナビゲーション、警告など）の描画
        this.stageUI.draw();




        // 必要に応じてオーバレイなどの描画
        if (this.gameWon) {
            this.resultSection.draw();
        }
    }



    async nextStage() {
        console.log("MOVING TO NEXT STAGE!");
        this.stage++;
        this.gameWon = false;
        this.winCooldown = 0;
        this.state = 'LOADING_STAGE'; // 一時的な状態
        this.bossVictoryProcessed = false;
        this.knockbackTimer = 0;
        this.timeScale = 1.0;

        this.results = null;
        this.stageScoreGained = 0;
        this.stageDamageCount = 0;
        this.stageStartTime = Date.now();

        // 読み込み画面を表示
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.classList.remove('hidden');
            const info = document.getElementById('loading-status');
            if (info) info.textContent = `PREPARING STAGE ${this.stage}...`;
        }

        // 次のステージの素材を動的にロード
        await this.loadStageAssets(this.stage);

        this.initLevel();
        this.updateStageUI();
        this.updateScoreUI();
        this.saveProgress();

        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
        }

        if (this.currentStageConfig && this.currentStageConfig.bgm) {
            this.audio.playBGM(this.currentStageConfig.bgm);
        } else {
            this.audio.playGameBGM();
        }

        this.state = 'STAGE_INTRO';
        this.introTimer = 0;
    }

    playDialogue(id) {
        if (this.dialogueSection) {
            this.dialogueSection.play(id);
        }
    }

    loadProgress() {
        const savedScore = localStorage.getItem('rabbit_dash_score');
        if (savedScore) {
            this.score = parseInt(savedScore, 10);
            this.updateScoreUI();
        }
        const savedStage = localStorage.getItem('rabbit_dash_stage');
        if (savedStage) {
            this.stage = parseInt(savedStage, 10);
        }
    }

    saveProgress() {
        localStorage.setItem('rabbit_dash_score', this.score);
        localStorage.setItem('rabbit_dash_stage', this.stage);
    }

    updateHealthUI() {
        const container = document.getElementById('health-bar');
        if (!container) return;

        // コンテナのスタイル
        container.style.display = 'flex';
        container.style.flexWrap = 'wrap';
        container.style.maxWidth = '250px'; // 少し広げる

        // 既存をクリア
        container.innerHTML = '';

        if (!this.isDebtState) {
            // --- ハートモード ---
            let remain = this.lives;

            const megaHearts = Math.floor(remain / 100);
            remain %= 100;

            const bigHearts = Math.floor(remain / 10);
            const smallHearts = remain % 10;

            // Mega Hearts (x100)
            for (let i = 0; i < megaHearts; i++) {
                this.createIcon(container, '💖', '42px', '+100', '#eb4d4b');
            }

            // Big Hearts (x10)
            for (let i = 0; i < bigHearts; i++) {
                this.createIcon(container, '💗', '36px', '+10', '#ff4757');
            }

            // Normal Hearts (x1)
            for (let i = 0; i < smallHearts; i++) {
                const heart = document.createElement('div');
                heart.className = 'heart';
                heart.textContent = '❤️';
                heart.style.fontSize = '28px';
                heart.style.margin = '2px';
                container.appendChild(heart);
            }
        } else {
            // --- 注射器モード (借金) ---
            let syringeCount = this.stageDamageCount - 5;

            const megaSyringes = Math.floor(syringeCount / 100);
            syringeCount %= 100;

            const bigSyringes = Math.floor(syringeCount / 10);
            const smallSyringes = syringeCount % 10;

            // Mega Syringes (x100)
            for (let i = 0; i < megaSyringes; i++) {
                this.createIcon(container, '💉', '48px', 'x100', '#4834d4');
            }

            // Big Syringes (x10)
            for (let i = 0; i < bigSyringes; i++) {
                this.createIcon(container, '💉', '40px', 'x10', '#ff4757');
            }

            // Normal Syringes (x1)
            for (let i = 0; i < smallSyringes; i++) {
                const syringe = document.createElement('div');
                syringe.className = 'syringe';
                syringe.textContent = '💉';
                syringe.style.fontSize = '28px';
                syringe.style.margin = '2px';
                container.appendChild(syringe);
            }
        }
    }

    createIcon(container, iconChar, size, labelText, labelBg) {
        const wrapper = document.createElement('div');
        wrapper.style.position = 'relative';
        wrapper.style.display = 'inline-block';
        wrapper.style.margin = '4px';

        const icon = document.createElement('div');
        icon.textContent = iconChar;
        icon.style.fontSize = size;
        wrapper.appendChild(icon);

        const label = document.createElement('div');
        label.textContent = labelText;
        label.style.position = 'absolute';
        label.style.bottom = '-4px';
        label.style.right = '-4px';
        label.style.fontSize = '11px';
        label.style.backgroundColor = labelBg;
        label.style.color = 'white';
        label.style.padding = '1px 3px';
        label.style.borderRadius = '6px';
        label.style.fontWeight = 'bold';
        label.style.border = '1px solid white';
        label.style.boxShadow = '0 1px 2px rgba(0,0,0,0.3)';
        wrapper.appendChild(label);

        container.appendChild(wrapper);
    }

    updateScoreUI() {
        const el = document.getElementById('grass-count');
        const gachaEl = document.getElementById('gacha-currency');

        const isDebt = this.score < 0;
        const displayScore = isDebt ? `借金-${Math.abs(this.score)}` : this.score;

        if (el) {
            el.innerText = displayScore;
            el.style.color = isDebt ? '#ff4757' : '#fff';
        }
        if (gachaEl) {
            gachaEl.innerText = displayScore;
            gachaEl.style.color = isDebt ? '#ff4757' : '#fff';
        }
    }

    updateSpeedUI() {
        const lvEl = document.getElementById('speed-level');
        const bonusEl = document.getElementById('speed-bonus');
        if (lvEl && this.player) {
            lvEl.innerText = this.player.speedLevel;

            if (bonusEl) {
                if (this.state === 'BOSS_BATTLE') {
                    bonusEl.innerText = " ボスステージ+3";
                } else if (this.stage >= 2) {
                    bonusEl.innerText = " ステージボーナス+1";
                } else {
                    bonusEl.innerText = "";
                }
            }
        }
    }

    updateStageUI() {
        const stageNameEl = document.getElementById('stage-name');
        if (stageNameEl && this.currentStageConfig) {
            stageNameEl.innerText = this.currentStageConfig.name || `STAGE ${this.stage}`;
        } else if (stageNameEl) {
            stageNameEl.innerText = `STAGE ${this.stage}`;
        }

        // --- New Rich Stage Overlay ---
        const overlay = document.getElementById('stage-title-overlay');
        const overlayNum = document.getElementById('overlay-stage-num');
        const overlayName = document.getElementById('overlay-stage-name');

        if (overlay && overlayNum && overlayName) {
            // Update Content
            overlayNum.innerText = this.stage;
            overlayName.innerText = (this.currentStageConfig && this.currentStageConfig.name)
                ? this.currentStageConfig.name
                : "Adventure Start";

            // Reset & Trigger Animation
            overlay.classList.remove('hidden');

            // Force Animation Reset on Children
            const container = overlay.querySelector('.stage-title-container');
            const label = overlay.querySelector('.stage-label');
            const mainName = overlay.querySelector('.stage-name-main');
            const line = overlay.querySelector('.stage-decoration-line');

            [container, label, mainName, line].forEach(el => {
                if (el) {
                    el.style.animation = 'none';
                    void el.offsetWidth; // Trigger Reflow
                    el.style.animation = ''; // Revert to CSS defined animation
                }
            });

            // Cleanup Timer
            if (this.stageOverlayTimer) clearTimeout(this.stageOverlayTimer);
            this.stageOverlayTimer = setTimeout(() => {
                overlay.classList.add('hidden');
            }, 6000); // Match CSS animation duration (5s + buffer)
        }
    }



    adjustColor(hex, amt) {
        let usePound = false;
        if (hex[0] === "#") {
            hex = hex.slice(1);
            usePound = true;
        }
        let num = parseInt(hex, 16);
        let r = (num >> 16) + amt;
        if (r > 255) r = 255; else if (r < 0) r = 0;
        let g = ((num >> 8) & 0x00FF) + amt;
        if (g > 255) g = 255; else if (g < 0) g = 0;
        let b = (num & 0x0000FF) + amt;
        if (b > 255) b = 255; else if (b < 0) b = 0;
        return (usePound ? "#" : "") + (b | (g << 8) | (r << 16)).toString(16).padStart(6, '0');
    }

    resolveAssetPath(name) {
        // 1. Specific overrides (Prioritize over direct filename to allow folder mapping)
        const overrides = {
            'boss_toy_king': 'stage3boss2.png',
            'boss_toy_king_weak': 'stage3boss2.png',
            'boss_toy_king_cutin': 'boss_toy_king_cutin.png',
            'boss_nurse': 'boss_nurse.png',
            'boss_nurse_weak': 'boss_nurse_weak.png',
            'boss_nurse_cutin': 'boss_nurse_cutin.png',
            'boss_sister_s': 'boss_sister_s.png',
            'boss_sister_k': 'boss_sister_k.png',
            'boss_sister_cutin': 'sisterScut.png',
            'boss_god_cutin': 'stage5bosscut.png',
            'boss_mochitsuki': 'boss_mochitsuki.png',
            'boss_weak': 'boss_mochitsuki_weak.png',
            'golden_carrot': 'gold_carrot.webp',
            'boss_cutin': 'boss_cutin.png',
            'game_logo': 'game_logo.png',
            'boss_reaper': 'boss_reaper.png',
            'boss_god': 'boss_god.png',
            'stage3_custom_bg': 'stage3backgroundp.JPG',
            // Ending Assets (Managed in assets/img/ending/)
            // (Use direct filename support for aliceendX.webp mappings below)
            // Editor Direct Filename Support (Map to ending folder)
            'kanonend1.webp': 'ending/kanonend1.webp',
            'kanonend2.webp': 'ending/kanonend2.webp',
            'kanonend3.webp': 'ending/kanonend3.webp',
            'aliceend1.webp': 'ending/aliceend1.webp',
            'aliceend2.webp': 'ending/aliceend2.webp',
            'aliceend3.webp': 'ending/aliceend3.webp',
            'aliceend4.webp': 'ending/aliceend4.webp',
            'aliceend5.webp': 'ending/aliceend5.webp'
        };

        if (overrides[name]) return `./assets/img/${overrides[name]}`;

        // 2. Direct filename support (e.g. "my_bg.jpg")
        if (name.indexOf('.') !== -1) {
            return `./assets/img/${name}`;
        }

        // 3. Default PNG fallback
        return `./assets/img/${name}.webp`;
    }

    getTransparencyKey(name) {
        // Specific transparency overrides
        const keys = {
            // Stage 5 blocks are white, AUTO transparency will key out the floor.
            'temple_tile_floor': null,
            'temple_tile_wall': null,
            'golden_pillar': null
        };
        return keys[name] || null;
    }

    /**
     * 特定のステージに必要なアセットを動的にロードする
     */
    async loadStageAssets(stageId) {
        const stage = StageConfig[stageId] || StageConfig[1];
        const assetSet = new Set();

        if (stage.theme) {
            if (stage.theme.backgroundImage) assetSet.add(stage.theme.backgroundImage);
            if (stage.theme.groundTile) assetSet.add(stage.theme.groundTile);
            if (stage.theme.dirtTile) assetSet.add(stage.theme.dirtTile);
            if (stage.theme.platformTile) assetSet.add(stage.theme.platformTile);
            if (stage.theme.backgroundLayers) {
                stage.theme.backgroundLayers.forEach(layer => {
                    if (layer.image) assetSet.add(layer.image);
                });
            }
        }
        if (stage.boss) {
            if (stage.boss.image) assetSet.add(stage.boss.image);
            if (stage.boss.imageWeak) assetSet.add(stage.boss.imageWeak);
            if (stage.boss.cutin) assetSet.add(stage.boss.cutin);
        }

        const imagesToLoad = [];
        assetSet.forEach(name => {
            if (!this.assets.images[name]) {
                imagesToLoad.push({
                    name: name,
                    src: this.resolveAssetPath(name),
                    transparencyKey: this.getTransparencyKey(name)
                });
            }
        });

        if (imagesToLoad.length > 0) {
            console.log(`Loading stage ${stageId} assets:`, imagesToLoad.map(i => i.name));
            await this.assets.loadImages(imagesToLoad);
        }
    }

    async start() {
        // Initialize Boot Manager
        this.bootManager.init();

        const selectedCharacter = this.characterManager.getCurrentCharacter();

        // --- CORE ASSETS (Always loaded at start) ---
        const coreAssets = [
            'enemy_cloud', 'tiles', 'enemies', 'carrot', 'bg_sky', 'bg_mountains', 'bg_hills',
            'golden_carrot', 'fuwamoko', 'boss_shadow',
            'aliceend1.webp', 'aliceend2.webp', 'aliceend3.webp', 'aliceend4.webp', 'aliceend5.webp',
            'kanonend1.webp', 'kanonend2.webp', 'kanonend3.webp'
        ];

        const imagesToLoad = [];
        const charTransparency = selectedCharacter.transparencyKey !== undefined ? selectedCharacter.transparencyKey : 'AUTO';

        // Player Basic
        imagesToLoad.push({ name: 'player', src: `./assets/img/${selectedCharacter.spriteFile}`, transparencyKey: charTransparency });

        // Core Common
        coreAssets.forEach(name => {
            imagesToLoad.push({
                name: name,
                src: this.resolveAssetPath(name),
                transparencyKey: this.getTransparencyKey(name)
            });
        });

        // All Character Selector Images
        const allChars = this.characterManager.getAllCharacters();
        allChars.forEach(char => {
            if (char.titleImage) {
                imagesToLoad.push({
                    name: `title_${char.id}`,
                    src: `./assets/img/${char.titleImage}`
                });
            }
        });

        // Current Selected Character Title & Motions
        imagesToLoad.push({
            name: 'title',
            src: `./assets/img/${selectedCharacter.titleImage || 'title_alice.png'}`
        });

        if (selectedCharacter.spriteFiles) {
            ['idle', 'run', 'jump', 'glide'].forEach(motion => {
                if (selectedCharacter.spriteFiles[motion]) {
                    imagesToLoad.push({
                        name: `player_${motion}`,
                        src: `./assets/img/${selectedCharacter.spriteFiles[motion]}`,
                        transparencyKey: charTransparency
                    });
                }
            });
        }

        // Add Main Title Background
        imagesToLoad.push({ name: 'bg_title', src: './assets/img/title.png' });

        // Logic handled by BootManager
        const loadingPromise = this.assets.loadImages(imagesToLoad);
        this.bootManager.setLoadingPromise(loadingPromise);

        console.log("Core Loading Started.");

        loadingPromise.then(() => {
            this.parallax.addLayer(this.assets.getImage('bg_sky'), 0);
            this.parallax.addLayer(this.assets.getImage('bg_mountains'), 0.2, true);
            this.parallax.addLayer(this.assets.getImage('bg_hills'), 0.5, true);
            console.log("Core Assets Loaded.");
        });

        // Audio Activation Listener
        const activateAudio = () => {
            if (!this.audio.initialized) {
                this.audio.init();
            }
            if (this.audio.ctx && this.audio.ctx.state === 'suspended') {
                this.audio.ctx.resume();
            }

            // WAIT_FOR_INPUT: Original transition to HOME
            if (this.state === 'WAIT_FOR_INPUT') {
                this.state = 'HOME';
                this.introBlinkTimer = 0; // reset
                this.audio.playTitleBGM();
                // Click to Startの入力がそのままHome画面のタップ判定にならないようにリセット
                this.input.reset();
                return;
            }
        };
        window.addEventListener('keydown', activateAudio);
        window.addEventListener('click', activateAudio);
        window.addEventListener('touchstart', activateAudio);

        // Mute Button Listener
        const muteBtn = document.getElementById('mute-btn');
        if (muteBtn) {
            muteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const isMuted = this.audio.toggleMute();
                muteBtn.innerText = isMuted ? '🔇' : '🔊';
            });
        }

        // Start Loop
        this.running = true;
        requestAnimationFrame((t) => this.loop(t));
    }

    resize(width, height) {
        this.width = width;
        this.height = height;
        this.camera.width = width;
        this.camera.height = height;
        this.ctx.imageSmoothingEnabled = false; // Reset just in case
        if (this.parallax) this.parallax.resize(width, height);
        if (this.env) this.env.resize(width, height);
    }

    async reloadCharacterSprite() {
        const selectedCharacter = this.characterManager.getCurrentCharacter();
        const imagesToLoad = [
            { name: 'player', src: `./assets/img/${selectedCharacter.spriteFile}`, transparencyKey: 'AUTO' }
        ];

        // タイトル画像も再読み込み
        if (selectedCharacter.titleImage) {
            imagesToLoad.push({ name: 'title', src: `./assets/img/${selectedCharacter.titleImage}` });
        } else {
            imagesToLoad.push({ name: 'title', src: './assets/img/title.webp' });
        }

        // モーション別のスプライトアセットを一旦クリア（他キャラの残骸を防ぐ）
        const motionSpriteNames = ['player_idle', 'player_run', 'player_jump', 'player_glide'];
        motionSpriteNames.forEach(name => this.assets.deleteImage(name));

        // モーション別のスプライトファイルがある場合は追加で読み込む
        if (selectedCharacter.spriteFiles) {
            if (selectedCharacter.spriteFiles.idle) {
                imagesToLoad.push({ name: 'player_idle', src: `./assets/img/${selectedCharacter.spriteFiles.idle}`, transparencyKey: 'AUTO' });
            }
            if (selectedCharacter.spriteFiles.run) {
                imagesToLoad.push({ name: 'player_run', src: `./assets/img/${selectedCharacter.spriteFiles.run}`, transparencyKey: 'AUTO' });
            }
            if (selectedCharacter.spriteFiles.jump) {
                imagesToLoad.push({ name: 'player_jump', src: `./assets/img/${selectedCharacter.spriteFiles.jump}`, transparencyKey: 'AUTO' });
            }
            if (selectedCharacter.spriteFiles.glide) {
                imagesToLoad.push({ name: 'player_glide', src: `./assets/img/${selectedCharacter.spriteFiles.glide}`, transparencyKey: 'AUTO' });
            }
        }

        await this.assets.loadImages(imagesToLoad);
    }

    initLevel() {
        // --- Stage Configuration ---
        const config = StageConfig[this.stage || 1] || StageConfig[1];
        // const rawConfig = StageConfig[this.stage || 1];
        // const config = StageValidator.validate(rawConfig);
        this.currentStageConfig = config;

        // Theme & Physics
        this.gravity = config.physics.gravity;

        // Pass theme config to level
        this.level.setConfig(config);

        // Reset Dialogue Flags for the new stage
        this.dialogueFlags = {
            opening: false,
            mid: false
        };

        // Update Parallax Background
        this.updateParallax();

        // Generation Params
        const gen = config.generation;

        // ステージの仕様を共通化（基本は64pxタイル）
        this.tileSize = 64;
        this.level.tileSize = this.tileSize;

        // Restore original scale feel: 'length' in config is distance TO boss.
        this.preBossLength = gen.length || 400;
        const arenaLength = 1000; // Restore large arena buffer

        const cols = this.preBossLength + arenaLength;
        const rows = 30;

        const grid = Array(rows).fill(null).map(() => Array(cols).fill('.'));

        // Generator Config
        let currentY = rows - 6;
        let x = 0;

        // Player Spawn
        let spawnX = 100;
        let spawnY = 100;

        // Pass 1: Generate Ground Heights
        const heights = new Array(cols);
        while (x < cols) {
            // Spawn / Protection zone (First 40 tiles)
            if (x <= 40 || x > cols - 5) {
                if (x === 15) {
                    this.spawnX = x * this.tileSize;
                    this.spawnY = (currentY - 1) * this.tileSize;
                }
                // Determine ground height for flat start
                heights[x] = currentY;

                // Speed Item will be placed at x=40 in Pass 2

                x++;
                continue;
            }

            // Boss Pre-Buffer Zone (20 blocks of flat land before boss)
            if (x >= this.preBossLength - 20 && x < this.preBossLength) {
                heights[x] = currentY;
                x++;
                continue;
            }

            const isArena = x >= this.preBossLength;
            const rand = Math.random();

            // Dynamic Hole Generation based on Config
            if (!isArena && rand < gen.holes) {
                const gapSize = Math.floor(Math.random() * 2) + 2;
                for (let i = 0; i < gapSize && x + i < cols; i++) {
                    heights[x + i] = null;
                }
                x += gapSize;

                // Rule: Prohibit unreachable opposite bank (Found in Stage 3)
                // If gap is wide (3+), enforce landing to be same level or lower.
                // Y increases downwards (0 is top), so ground raising means Y decreasing.
                // deltaY = -1 (Up), 0 (Flat), 1 (Down)
                let deltaY = Math.floor(Math.random() * 3) - 1;

                // If gap is 3 blocks, jumping UP is very risky/impossible depending on gravity.
                // Force flat or downward slope for safe landing.
                if (gapSize >= 3 && deltaY < 0) {
                    deltaY = 0;
                }
                currentY += deltaY;
            } else if (rand < 0.2) { // Height change
                currentY += Math.floor(Math.random() * 3) - 1;
                // Make at least 2 blocks of same height to avoid jagged look
                const stepWidth = 2; // Fixed 2 blocks width for steps
                for (let k = 0; k < stepWidth && x < cols; k++) {
                    heights[x] = currentY;
                    x++;
                }
            } else {
                heights[x] = currentY;
                x++; // Increment x for the else case
            }

            if (currentY < 10) currentY = 10;
            if (currentY > rows - 4) currentY = rows - 4;
        }

        // Fill ground based on heights
        for (let gx = 0; gx < cols; gx++) {
            if (heights[gx] !== null) {
                this.fillGround(grid, gx, heights[gx], rows);
            }
        }

        // Pass 2: Place Features
        let skipFeatureUntil = 0;
        let nextPlatformX = 0;

        // Feature Probabilities from Config
        const prob = gen.features;

        // Helper to check if a rect in the grid is strictly air ('.')
        const isSpaceEmpty = (grid, x, y, w, h) => {
            for (let dy = 0; dy < h; dy++) {
                for (let dx = 0; dx < w; dx++) {
                    const ty = y + dy;
                    const tx = x + dx;
                    if (ty < 0 || ty >= rows || tx < 0 || tx >= cols) return false;
                    if (grid[ty][tx] !== '.') return false;
                }
            }
            return true;
        };

        for (let fx = 5; fx < cols - 20; fx++) {
            const h = heights[fx];
            if (h === null) continue;

            const isArenaPos = fx >= this.preBossLength;
            const isPreBossBuffer = fx >= this.preBossLength - 20 && fx < this.preBossLength;
            const distInArena = isArenaPos ? fx - this.preBossLength : -1;

            // --- MANDATORY OVERRIDES (Items that MUST spawn at specific blocks) ---
            let spawnedMandatory = false;

            // 1. (Removed) Speed Boost control is now fully handled by StagePlacements.js & Rules

            // 2. Periodic Golden Carrot (Arena Fever Item) - Every 200 blocks
            if (isArenaPos && (distInArena > 0 && distInArena % 200 === 0)) {
                // Stage 2: Ensure it's not buried. Slightly higher (h-2).
                const pedY = (this.stage === 2) ? h - 2 : h - 4;
                if (pedY > 2 && isSpaceEmpty(grid, fx - 1, pedY - 1, 3, 2)) {
                    for (let px = -1; px <= 1; px++) grid[pedY][fx + px] = 'B';
                    grid[pedY - 1][fx] = 'G';
                    skipFeatureUntil = fx + 12;
                    spawnedMandatory = true;
                }
            }
            // 3. (Removed) Periodic Speed Items

            if (spawnedMandatory) continue;

            // --- NORMAL RANDOM FEATURES ---
            if (fx > skipFeatureUntil) {
                const roll = Math.random();
                let pAcc = 0;

                // Boss Arena OR Pre-Boss Buffer: Normal Carrots spawning (NO platforms or enemies here)
                if (isArenaPos || isPreBossBuffer) {
                    if (roll < 0.45) { // 45% chance for carrot in arena
                        if (isSpaceEmpty(grid, fx, h - 1, 1, 1)) {
                            grid[h - 1][fx] = 'c';
                            skipFeatureUntil = fx + 3;
                        }
                    }
                    continue;
                }

                // Pre-Arena: Safe Zone (fx < 40) - Strictly limited to Carrots
                if (fx < 40) {
                    if (fx > 20 && fx % 8 === 0) {
                        if (isSpaceEmpty(grid, fx, h - 1, 1, 1)) {
                            grid[h - 1][fx] = 'c';
                            skipFeatureUntil = fx + 3;
                        }
                    }
                } else {
                    // Regular Stage Features
                    // A. Floating Platforms 
                    pAcc += (gen.platforms || 0.1);
                    if (roll < pAcc) {
                        const platWidth = Math.floor(Math.random() * 3) + 3;

                        // Find highest ground in the platform span to prevent blockage
                        let minGroundY = rows;
                        for (let k = 0; k < platWidth; k++) {
                            if (fx + k < cols && heights[fx + k] !== null) {
                                if (heights[fx + k] < minGroundY) minGroundY = heights[fx + k];
                            }
                        }

                        // Default h if all holes
                        if (minGroundY === rows) minGroundY = h;

                        // Ensure at least 4 blocks clearance from the highest ground point
                        // Place 4-6 blocks above that highest ground
                        const platY = minGroundY - (Math.floor(Math.random() * 2) + 4);

                        if (platY > 2 && isSpaceEmpty(grid, fx, platY - 1, platWidth, 2)) {
                            for (let px = 0; px < platWidth; px++) {
                                if (fx + px < cols - 20) {
                                    grid[platY][fx + px] = 'B';
                                    if (px === Math.floor(platWidth / 2)) grid[platY - 1][fx + px] = 'c';
                                }
                            }
                            skipFeatureUntil = fx + platWidth + 8;
                            continue;
                        }
                    }

                    // B. Enemies (Ground & Air)
                    const pEnemies = (prob.enemies || 0.12);
                    const pFlyers = (prob.flyers || 0.08);
                    pAcc += (pEnemies + pFlyers);
                    if (roll < pAcc) {
                        const flyerRatio = pFlyers / (pEnemies + pFlyers);
                        if (Math.random() < flyerRatio) {
                            const flyerY = h - (Math.floor(Math.random() * 5) + 5);
                            if (isSpaceEmpty(grid, fx, flyerY, 1, 1)) {
                                grid[flyerY][fx] = 'F';
                                skipFeatureUntil = fx + 10;
                                continue;
                            }
                        } else {
                            if (heights[fx] !== null && heights[fx + 1] !== null) {
                                if (isSpaceEmpty(grid, fx, h - 2, 2, 2)) {
                                    grid[h - 1][fx] = 'E';
                                    skipFeatureUntil = fx + 12;
                                    continue;
                                }
                            }
                        }
                    }

                    // C. Carrots
                    pAcc += (prob.carrots || 0.15);
                    if (roll < pAcc) {
                        const distRand = Math.random();
                        if (distRand < 0.45) { // Ground
                            if (isSpaceEmpty(grid, fx, h - 1, 1, 1)) grid[h - 1][fx] = 'c';
                        } else if (distRand < 0.7) { // Crate
                            if (isSpaceEmpty(grid, fx, h - 2, 1, 2)) {
                                grid[h - 1][fx] = 'B';
                                grid[h - 2][fx] = 'c';
                            }
                        } else { // Air
                            const airY = h - (Math.floor(Math.random() * 4) + 4);
                            if (isSpaceEmpty(grid, fx, airY, 1, 1)) grid[airY][fx] = 'c';
                        }
                        skipFeatureUntil = fx + 4;
                        continue;
                    }

                    // D. Special Gizmos
                    const pSprings = prob.springs || 0.0;
                    const pRings = prob.rings || 0.0;
                    const pClouds = prob.clouds || 0.05;
                    const pMoving = prob.moving || 0.0;
                    const pFalling = prob.falling || 0.0; // Falling Platform
                    const totalGizmo = pSprings + pRings + pClouds + pMoving + pFalling;

                    pAcc += totalGizmo;

                    if (roll < pAcc) {
                        const gizmoRoll = Math.random() * totalGizmo;

                        if (gizmoRoll < pSprings) {
                            // Spring ('J')
                            // Ensure ground exists +-1 block to avoid floating look near holes
                            if (isSpaceEmpty(grid, fx, h - 5, 1, 5) &&
                                heights[fx - 1] !== null &&
                                heights[fx + 1] !== null) {
                                grid[h - 1][fx] = 'J';

                                // --- New Stage Rule: Enemy guarding the spring ---
                                // 30% chance to put a Cloud Enemy right above the spring
                                if (Math.random() < 0.3) {
                                    // Place enemy 1 block above spring to block it
                                    // Spring is at h-1. Enemy should be at h-2.
                                    if (h - 2 > 0) {
                                        grid[h - 2][fx] = 'F'; // 'F' is Flyer/Cloud Enemy
                                    }
                                }

                                // Automatic Carrot Trail (Upwards) (Reduced to avoid overlap with enemy)
                                for (let k = 3; k <= 6; k++) {
                                    const ty = h - k;
                                    if (ty >= 0 && grid[ty][fx] === '.') { // Only if empty (not overwriting potential enemy)
                                        grid[ty][fx] = 'c';
                                    }
                                }

                                skipFeatureUntil = fx + 10;
                            }
                        } else if (gizmoRoll < pSprings + pRings) {
                            // Speed Ring ('O')
                            const ringY = h - (Math.floor(Math.random() * 4) + 7);
                            if (ringY > 6 && isSpaceEmpty(grid, fx, ringY, 1, 1) && fx + 13 < cols - 20) {
                                grid[ringY][fx] = 'O';

                                // Automatic Carrot Trail (Forward)
                                for (let k = 1; k <= 5; k++) {
                                    if (fx + k < cols && grid[ringY][fx + k] === '.') {
                                        grid[ringY][fx + k] = 'c';
                                    }
                                }

                                grid[ringY][fx + 6] = 'U';
                                grid[ringY - 4][fx + 12] = 'V';
                                skipFeatureUntil = fx + 35;
                            }
                        } else if (gizmoRoll < pSprings + pRings + pClouds) {
                            // Cloud Platform ('C')
                            const cloudY = h - (Math.floor(Math.random() * 5) + 8);
                            if (cloudY > 2 && isSpaceEmpty(grid, fx, cloudY, 2, 1)) {
                                grid[cloudY][fx] = 'C'; grid[cloudY][fx + 1] = 'C';
                                skipFeatureUntil = fx + 10;
                            }
                        } else if (gizmoRoll < pSprings + pRings + pClouds + pMoving) {
                            // Moving Platform ('M')
                            const movY = h - (Math.floor(Math.random() * 6) + 6);
                            if (movY > 2 && isSpaceEmpty(grid, fx, movY, 3, 2) && fx + 10 < cols - 20) {
                                grid[movY][fx] = 'M';

                                // Incentive: Carrots above platform
                                for (let cx = 0; cx < 3; cx++) {
                                    const cy = movY - 3; // 3 blocks above
                                    if (cy > 0 && grid[cy][fx + cx] === '.') {
                                        grid[cy][fx + cx] = 'c';
                                    }
                                }

                                skipFeatureUntil = fx + 20;
                            }
                        } else {
                            // Falling Platform ('T')
                            const fallY = h - (Math.floor(Math.random() * 5) + 5);
                            if (fallY > 2 && isSpaceEmpty(grid, fx, fallY, 2, 2)) {
                                grid[fallY][fx] = 'T';
                                skipFeatureUntil = fx + 10;
                            }
                        }
                        continue;
                    }

                    // E. Filler Carrots
                    if (Math.random() < 0.45) {
                        if (isSpaceEmpty(grid, fx, h - 1, 1, 1)) {
                            grid[h - 1][fx] = 'c';
                            skipFeatureUntil = fx + 3;
                        }
                    }
                }
            }
        }

        // --- FIXED PLACEMENTS OVERRIDE ---
        // StagePlacements.js に定義された固定配置を適用
        const placements = StagePlacements[this.stage];
        if (placements && Array.isArray(placements)) {
            console.log(`Applying ${placements.length} fixed placements for Stage ${this.stage}`);
            placements.forEach(p => {
                const px = p.x;
                // pxが範囲外、またはボスエリア内なら無視（ボスステージ保護）
                if (px < 0 || px >= cols || px >= this.preBossLength) return;

                let py;
                if (p.y !== undefined && p.y > 0) {
                    // 地面からの高さ指定 (1=地面直上)
                    // その地点の地面高さを取得
                    const groundY = heights[px] !== null ? heights[px] : rows - 1;
                    py = groundY - p.y;
                } else {
                    // 高さ指定なし(0/undefined)なら地面探索して配置
                    const groundY = heights[px];
                    if (groundY !== null) {
                        py = groundY - 1; // デフォルトで地面の上
                    } else {
                        // 穴の上なら適当な高さ（画面中央あたり）
                        py = rows - 8;
                    }
                }

                // グリッド範囲チェック
                if (py < 0) py = 0;
                if (py >= rows) py = rows - 1;

                // 配置適用
                // 特別なタイプ: H=穴, W=壁
                if (p.type === 'H') {
                    // 地面を消して穴にする
                    let digY = heights[px];
                    if (digY !== null) {
                        // 地面から下をすべて空にする
                        for (let d = digY; d < rows; d++) grid[d][px] = '.';
                        heights[px] = null; // height更新
                    }
                } else if (p.type === 'W') {
                    // 壁を作る (高さ3)
                    const base = heights[px] || (rows - 1);
                    for (let i = 0; i < 3; i++) {
                        if (base - 1 - i >= 0) grid[base - 1 - i][px] = 'D'; // Dirt wall
                    }
                    // height更新
                    heights[px] = base - 3;
                } else {
                    // 通常アイテム/敵

                    // Rules Check: No Grounded Enemy over Pit
                    if (p.type === 'E') {
                        // Check if below is air/hole
                        if (py + 1 >= rows || (!grid[py + 1][px] || grid[py + 1][px] === '.')) {
                            // Skip placement to prevent floating walking enemies
                            return;
                        }
                    }

                    // Rules Check: No Objects Deep in Pits
                    if (heights[px] === null && py >= rows - 3) {
                        // Deep pit zone -> Do not place anything
                        return;
                    }

                    // Rule 17: No Static Blocks over Pits
                    if (p.type === 'B' && heights[px] === null) {
                        return;
                    }

                    // 既存のものを上書き
                    grid[py][px] = p.type;

                    // Auto-Foundation for Jump Pads
                    if (p.type === 'J') {
                        if (py + 1 < rows && (!grid[py + 1][px] || grid[py + 1][px] === '.')) {
                            grid[py + 1][px] = 'B';
                            // Update height logic if needed, but B acts as solid
                        }
                    }

                    // Fixed Placement Cleanup:
                    // Clear nearby random items and blocks to prevent overlapping
                    if (['J', 'E', 'F', 'O', 'U', 'C', 'M', 'T', 'W'].includes(p.type)) {
                        const isGrounded = ['J', 'E', 'W'].includes(p.type);

                        for (let dy = -1; dy <= 1; dy++) {
                            for (let dx = -1; dx <= 1; dx++) {
                                if (dx === 0 && dy === 0) continue; // Skip self

                                // Grounded objects need floor at dy=1, so don't clear below
                                if (isGrounded && dy === 1 && dx === 0) continue;

                                const ny = py + dy;
                                const nx = px + dx;
                                if (ny >= 0 && ny < rows && nx >= 0 && nx < cols) {
                                    const existing = grid[ny][nx];
                                    // Remove random items AND BLOCKS if they are too close
                                    // But don't remove terrain (#, D) as that might be main ground
                                    if (['c', 'S', 'B'].includes(existing)) {
                                        grid[ny][nx] = '.';
                                    }
                                }
                            }
                        }
                    }
                }
            });
        }

        // Arena Start Calculations
        const arenaStartX = this.preBossLength;
        const startH = heights[arenaStartX] || 15;
        const bossX = arenaStartX * this.tileSize;
        const bossY = (startH - 4) * this.tileSize;

        const map = grid.map(row => row.join(''));
        this.level.load(map);

        // ... Object Instantiation (Enemies, Springs, etc.) ...
        this.enemies = this.level.enemySpawns.map(spawn => {
            if (spawn.type === 'flyer') return new CloudEnemy(spawn.x, spawn.y);
            else return new DrillEnemy(spawn.x, spawn.y, this.tileSize);
        });
        this.springs = this.level.springSpawns.map(spawn => new Spring(spawn.x, spawn.y));
        this.rings = this.level.ringSpawns.map(spawn => new SpeedRing(spawn.x, spawn.y, spawn.type));
        this.clouds = this.level.cloudSpawns.map(spawn => new CloudPlatform(spawn.x, spawn.y));

        try {
            this.movingPlatforms = this.level.movingPlatformSpawns.map(spawn => new MovingPlatform(spawn.x, spawn.y, this.tileSize));
        } catch (e) {
            console.error("MovingPlatform Init Error:", e);
            this.movingPlatforms = [];
        }

        try {
            this.fallingPlatforms = this.level.fallingPlatformSpawns.map(spawn => new FallingPlatform(spawn.x, spawn.y, this.tileSize));
        } catch (e) {
            console.error("FallingPlatform Init Error:", e);
            this.fallingPlatforms = [];
        }

        const bonusStats = this.gacha.getStats();
        const selectedCharacter_obj = this.characterManager.getCurrentCharacter();
        const speechLines = selectedCharacter_obj.speechLines || [];
        const charStats = selectedCharacter_obj.stats || { speed: 1.0, jump: 1.0 };

        this.player = new Player(this.spawnX, this.spawnY, this.tileSize, bonusStats, speechLines, charStats);
        this.player.game = this;
        if (selectedCharacter_obj.animation) {
            // Inject ID for specific resizing logic (e.g. Kanon run)
            selectedCharacter_obj.animation.id = selectedCharacter_obj.id;
            this.player.setCharacterConfig(selectedCharacter_obj.animation);
        }

        // Force Camera Reset to Spawn Point immediately
        // This prevents the "only background visible" glitch on stage transition
        this.camera.minX = 0;
        this.camera.x = Math.max(0, this.spawnX - this.width * 0.3);
        this.camera.y = 0; // Or track player Y if needed, but usually 0 is fine for side scroller

        const bossSpawnX = (this.preBossLength + 20) * this.tileSize;
        const bossSpawnY = (rows - 10) * this.tileSize;
        this.boss = new Boss(bossSpawnX, bossSpawnY, this.tileSize, this.currentStageConfig.boss);

        this.gameWon = false;
        this.stageStartTime = Date.now();
        this.stageDamageCount = 0;
        this.results = null;

        // this.score = 0; // Don't reset score on level load, it persists
        this.updateScoreUI();
        this.updateHealthUI();
        this.updateSpeedUI();
        this.updateStageUI();

        if (this.currentStageConfig && this.currentStageConfig.bgm) {
            this.audio.playBGM(this.currentStageConfig.bgm);
        } else {
            this.audio.playGameBGM();
        }

        // Initialize Intro State (Pause game update for 2 seconds)
        this.state = 'STAGE_INTRO';
        this.introTimer = 0;
    }

    fillGround(grid, x, y, rows) {
        if (x >= grid[0].length) return;
        for (let r = y; r < rows; r++) {
            if (r === y) grid[r][x] = '#'; // Grass top
            else grid[r][x] = 'D'; // Dirt below
        }
    }

    startDialogue(id, onComplete) {
        this.dialogueManager.startDialogue(id, onComplete);
    }

    showReadyGo() {
        // Add a "Ready Go" particle
        this.env.particles.push({
            type: 'text',
            x: this.width / 2, y: this.height / 2,
            text: `STAGE ${this.stage} - START!`, color: '#fff', size: 50,
            life: 120, screenSpace: true, bold: true
        });
    }

    loop(timestamp) {
        if (!this.running) return;

        const dt = ((timestamp - this.lastTime) / 1000) * this.timeScale;
        this.lastTime = timestamp;
        const cappedDt = Math.min(dt, 0.1);

        if (this.state === 'ENDING') {
            // Need System (Input) to update so we can detect click/tap
            this.sections.run('System', 'update', cappedDt);
            this.endingSection.update(cappedDt);
            this.endingSection.draw();
        } else if (this.state === 'STAGE_INTRO') {
            // STAGE INTRO: Pause World, run System/Draw
            this.sections.run('System', 'update', cappedDt);
            this.sections.run('Camera', 'update', cappedDt); // Allow camera to settle if needed

            this.introTimer += cappedDt;
            // Wait for stage title animation (approx 3.0s - match CSS introContainer duration)
            if (this.introTimer >= 3.0) {
                this.state = 'PLAYING';
                this.introTimer = 0;
            }

            // Draw everything (static world)
            this.ctx.fillStyle = '#000';
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.sections.runAll('draw');

        } else if (this.state === 'BOOT') {
            // Update Boot Manager (handles intro phases)
            this.bootManager.update(cappedDt);
            // Do not run game sections or draw game world during boot
        } else {
            // 各セクションの更新処理を安全に実行
            this.sections.runAll('update', cappedDt);

            // 背景クリアは共通
            this.ctx.fillStyle = '#000';
            this.ctx.fillRect(0, 0, this.width, this.height);

            // 各セクションの描画処理を安全に実行
            this.sections.runAll('draw');
        }

        requestAnimationFrame((t) => this.loop(t));
    }

    updateParallax() {
        // Clear existing layers
        this.parallax.layers = [];

        const theme = this.currentStageConfig.theme;

        // New System: Custom Multiple Layers
        if (theme.backgroundLayers && Array.isArray(theme.backgroundLayers)) {
            theme.backgroundLayers.forEach(layerDef => {
                const img = this.assets.getImage(layerDef.image);
                if (img) {
                    // speed: 0 = static, 1 = follows camera perfectly (never seen moving?), 0.5 = half speed
                    // alignBottom: true if it should sit at the bottom (ground), false for sky/fill
                    // filter: (optional) CSS filter string like "blur(4px)" or "brightness(0.5)"
                    this.parallax.addLayer(img, layerDef.speed, layerDef.alignBottom, layerDef.filter);
                }
            });
            return;
        }

        // Legacy / Fallback System
        const bgName = theme.backgroundImage || 'bg_hills'; // Default to hills

        if (bgName === 'bg_monastery') {
            // Monastery Setup
            const bg = this.assets.getImage('bg_monastery');
            if (bg) {
                this.parallax.addLayer(bg, 0.1, true); // Slow moving distant background
            }
        } else {
            // Generic / Forest Setup
            const sky = this.assets.getImage('bg_sky');
            const bg = this.assets.getImage(bgName) || this.assets.getImage('bg_mountains');

            if (sky) this.parallax.addLayer(sky, 0); // Static Sky
            if (bg) this.parallax.addLayer(bg, 0.2, true); // Mountains or Hills
        }
    }

    checkCollectibles() {
        // Simple AABB vs Point/Small Box
        const pRect = { x: this.player.x, y: this.player.y, w: this.player.width, h: this.player.height };
        const ts = this.level.tileSize;

        this.level.entities.forEach(ent => {
            if (ent.collected) return;
            if (
                pRect.x < ent.x + ts + 32 &&
                pRect.x + pRect.w > ent.x - 32 &&
                pRect.y < ent.y + ts + 32 &&
                pRect.y + pRect.h > ent.y - 32
            ) {
                ent.collected = true;
                if (ent.type === 'C') {
                    // Hack & Slash: Critical Carrot Gain
                    const stats = this.gacha.getStats();
                    let amount = 1;
                    let isCrit = false;
                    if (Math.random() * 100 < stats.CRIT) {
                        amount = 2; // Double carrots
                        isCrit = true;
                    }

                    // Boss Progress: Each carrot gives 1 point (or 2 on crit)
                    this.score += amount * 1;
                    this.stageScoreGained += amount * 1; // Track stage gain
                    this.updateScoreUI();
                    this.saveProgress();
                    this.audio.playCollect();

                    // UI Feedback for Crit
                    if (isCrit) {
                        this.env.particles.push({
                            type: 'text',
                            x: ent.x, y: ent.y - 60, vy: -2.5, vx: 0, life: 75,
                            text: "💥 CARROT POWER +2 💥", color: '#ff9f43', size: 50, bold: true, pulse: true
                        });
                    } else {
                        this.env.particles.push({
                            type: 'text',
                            x: ent.x, y: ent.y - 40, vy: -2, vx: 0, life: 60,
                            text: "CARROT POWER +1", color: '#e67e22', size: 36, bold: true, pulse: true
                        });
                    }

                    // Gacha is no longer triggered here
                    // this.gacha.triggerEventGacha();
                } else if (ent.type === 'S') {
                    // Speed Up Item (Previously Slow)
                    this.player.applySpeedBoost();
                    this.updateSpeedUI();
                    this.audio.playCollect();
                    // Enhanced Floating Text (Rainbow & Pulse)
                    this.env.particles.push({
                        type: 'text',
                        x: ent.x,
                        y: ent.y - 40,
                        vy: -1.5,
                        vx: 0,
                        life: 90,
                        text: `⚡ SPEED UP! Lv${this.player.speedLevel} ⚡`,
                        color: '#f1c40f',
                        size: 40,
                        bold: true,
                        rainbow: true, // Glows with rainbow colors
                        pulse: true    // Vibrates in size
                    });

                    // Add some sparkles around
                    for (let i = 0; i < 12; i++) {
                        const angle = Math.random() * Math.PI * 2;
                        const dist = Math.random() * 30;
                        this.env.particles.push({
                            x: ent.x + Math.cos(angle) * dist,
                            y: ent.y + Math.sin(angle) * dist,
                            vx: Math.cos(angle) * 4,
                            vy: Math.sin(angle) * 4,
                            life: 25 + Math.random() * 20,
                            size: 3 + Math.random() * 5,
                            color: '#f1c40f',
                            glow: true,
                            fade: true
                        });
                    }
                } else if (ent.type === 'G') {
                    // Special Golden Block -> Carrot Fever
                    this.activateCarrotFever();
                    this.audio.playCollect();

                    // 画面中央に虹色で点滅する大きなテキストを表示
                    this.env.particles.push({
                        type: 'text',
                        x: this.width / 2,
                        y: this.height * 0.3,
                        vx: 0,
                        vy: 0,
                        life: 300, // 5秒間表示
                        text: "✨ ニンジンフィーバー ✨",
                        size: 70,
                        rainbow: true,
                        blink: true,
                        screenSpace: true
                    });
                } else if (ent.type === 'R') {
                    // Bonus Gift Box Discovery
                    this.audio.playCollect();
                    this.env.particles.push({
                        type: 'text',
                        x: ent.x, y: ent.y - 40, vy: -1.5, vx: 0, life: 60,
                        text: "GET!", color: '#ff9f43', size: 30, bold: true
                    });
                } // 重複していた 'G' の判定（Global Win Logic）は削除または統合が必要だが、
                // 現在はゴール地点に別の文字を割り当てるか、条件（stage終了判定）で分岐させるべき
                // ここでは一旦そのままにし、'G' をすべてフィーバーに統一する（ゴールは別で処理されているはず）
                /*
                else if (ent.type === 'G') {
                    this.gameWon = true;
                    // ... (削除)
                }
                */
            }
        });
    }



    checkGizmos() {
        if (!this.player || !this.springs) return;
        const p = this.player;

        this.springs.forEach(spring => {
            if (
                p.x < spring.x + spring.width + 5 &&
                p.x + p.width > spring.x - 5 &&
                p.y < spring.y + spring.height &&
                p.y + p.height > spring.y + 10
            ) {
                // Trigger on ANY contact (no need to be falling)
                spring.trigger(this.audio);
                p.vy = -2200; // Restored to standard power
                p.jumpCount = 0;
                p.startSpringJump(); // Enable wall-through jump

                for (let i = 0; i < 8; i++) {
                    this.env.particles.push({
                        x: spring.x + spring.width / 2,
                        y: spring.y,
                        vx: (Math.random() - 0.5) * 12,
                        vy: -Math.random() * 5 - 5,
                        life: 40, size: 6, color: '#FFD700'
                    });
                }
            }
        });

        // Speed Rings
        if (this.rings) {
            this.rings.forEach(ring => {
                const centerX = ring.x + 64;
                const centerY = ring.y + 64;
                const dist = Math.sqrt(Math.pow((p.x + p.width / 2) - centerX, 2) + Math.pow((p.y + p.height / 2) - centerY, 2));

                if (dist < 100) {
                    if (ring.trigger(this.audio)) {
                        // Apply velocity based on ring type
                        if (ring.type === 'up') {
                            p.vx = 375;  // Halved from 750 (Original 1500)
                            p.vy = -400; // Halved from -800 (Original -1600)
                        } else if (ring.type === 'super') {
                            // SUPER SPEED & INVINCIBILITY
                            p.vx = 1800;
                            p.vy = 0;
                            p.superDashTimer = 0.7; // ~1260 distance (2x normal ring)
                            p.boostTimer = 0;
                        } else if (ring.type === 'down') {
                            p.vx = 375;  // Halved from 750 (Original 1500)
                            p.vy = 400;  // Halved from 800 (Original 1600)
                        } else {
                            p.vx = 625;  // Halved from 1250 (Original 2500)
                            p.vy = 0;
                        }

                        if (ring.type !== 'super') {
                            p.boostTimer = 1.0; // 1s gravity ignore
                        }
                        p.jumpCount = 0;

                        // NEW: Ring gives a carrot! (Except for Super Ring)
                        if (ring.type !== 'super') {
                            this.carrots++;

                            // Carrot +1 particle (Same style as Enemy life reward)
                            this.env.particles.push({
                                type: 'text',
                                x: centerX,
                                y: centerY - 20,
                                vx: (Math.random() - 0.5) * 8,
                                vy: -15 - Math.random() * 10,
                                gravity: 0.7,
                                friction: 0.98,
                                life: 90,
                                text: "🥕+1",
                                size: 45,
                                bold: true,
                                pulse: true
                            });
                        }

                        this.camera.shake(0.2, 10); // 0.2s shake
                        for (let k = 0; k < 10; k++) {
                            this.env.particles.push({
                                x: centerX, y: centerY,
                                vx: (Math.random() - 0.5) * 20, vy: (Math.random() - 0.5) * 20,
                                life: 30, size: 4, color: '#00d2d3', glow: true
                            });
                        }
                    }
                }
            });
        }

        // Disappearing Clouds
        if (this.clouds) {
            this.clouds.forEach(cloud => {
                if (cloud.state !== 'GONE') {
                    const pBottom = p.y + p.height;
                    const prevBottom = p.prevY + p.height;
                    if (
                        p.x < cloud.x + cloud.width - 5 &&
                        p.x + p.width > cloud.x + 5 &&
                        p.vy >= 0 &&
                        prevBottom <= cloud.y + 5 && // Was above (or just started touching)
                        pBottom >= cloud.y // Is now at or below
                    ) {
                        p.y = cloud.y - p.height;
                        p.vy = 0;
                        p.grounded = true;
                        p.jumpCount = 0;
                        cloud.touch();
                    }
                }
            });
        }

        // Moving Platforms Collision
        if (this.movingPlatforms) {
            this.movingPlatforms.forEach(mp => {
                mp.update(0.016); // Approx dt

                // Check collision if player is falling/landing
                const p = this.player;
                if (p.vy >= 0) { // Only checking downward motion
                    const pBottom = p.y + p.height;
                    const landTolerance = 15; // pixels

                    // Horizontal Overlap
                    if (p.x + p.width > mp.x && p.x < mp.x + mp.width) {
                        // Vertical Overlap with Top surface
                        if (pBottom >= mp.y && pBottom <= mp.y + mp.height + landTolerance) {
                            // Snap to top
                            p.y = mp.y - p.height;
                            p.vy = 0;
                            p.grounded = true;
                            p.jumpCount = 0;

                            // Carry player
                            // p.vx is player's own velocity. We adjust position directly.
                            p.x += mp.vx * 0.016;
                        }
                    }
                }
            });
        }

        // Falling Platforms Collision
        if (this.fallingPlatforms) {
            this.fallingPlatforms.forEach(fp => {
                fp.update(0.016);

                // Only interact if not falling yet
                if (fp.state !== 'FALLING') {
                    const p = this.player;
                    if (p.vy >= 0) {
                        const pBottom = p.y + p.height;
                        const landTolerance = 15;

                        if (p.x + p.width > fp.x && p.x < fp.x + fp.width) {
                            if (pBottom >= fp.y && pBottom <= fp.y + fp.height + landTolerance) {
                                p.y = fp.y - p.height;
                                p.vy = 0;
                                p.grounded = true;
                                p.jumpCount = 0;

                                fp.trigger(); // Start shaking
                            }
                        }
                    }
                }
            });
        }

        // Reset Aerial Kill Combo if grounded
        if (this.player.grounded) {
            this.aerialKillCombo = 0;
        }
    }

    takeDamage(source = null, cooldownOverride = null, noKnockback = false, damageAmount = 1) {
        // Invulnerability frame check
        if (this.damageCooldown > 0) return;

        // Hack & Slash: DEF Bonus (Evasion/Guard)
        const stats = this.gacha.getStats();
        if (Math.random() * 100 < stats.DEF) {
            // Guarded!
            this.damageCooldown = 1.0;
            this.env.particles.push({
                type: 'text',
                x: this.player.x, y: this.player.y - 40, vy: -1.5, vx: 0, life: 60,
                text: "GUARD!", color: '#ffff00', size: 20
            });
            this.audio.playLand();
            return;
        }

        const isGodMode = this.debugManager && this.debugManager.isGodMode;

        // Count the hit for the results screen
        this.stageDamageCount += damageAmount;

        if (!isGodMode) {
            if (!this.isDebtState) {
                if (this.lives > 0) {
                    this.lives -= damageAmount;
                } else {
                    this.isDebtState = true;
                }
            }
            this.updateHealthUI();

            // Set cooldown: use override if provided, else default to 1.0s
            // If cooldownOverride is 0, it means continuous damage (no mercy!)
            this.damageCooldown = (cooldownOverride !== null) ? cooldownOverride : 1.0;
        } else {
            this.damageCooldown = (cooldownOverride !== null) ? cooldownOverride : 1.0;
        }

        if (!noKnockback) {
            this.knockbackTimer = 1.0;
        }

        // 情けないダメージ音
        this.audio.playDamage();

        // 衝突判定と方向の算出：敵がいる方向とは逆（背後）へ
        let knockbackDir;
        if (!noKnockback) {
            if (source) {
                const sourceCenterX = source.x + source.width / 2;
                const playerCenterX = this.player.x + this.player.width / 2;
                // 敵より左なら左(-1)へ、右なら右(1)へ
                knockbackDir = (playerCenterX < sourceCenterX) ? -1 : 1;
            } else {
                // ソースがない場合は向いている方向の逆へ
                knockbackDir = this.player.facingRight ? -1 : 1;
            }
        }

        if (!noKnockback) {
            // ノックバックの実行：斜め後ろ上方向へ弾き飛ばす
            // さらに勢いを強くする（めちゃくちゃ吹っ飛ぶように変更）
            this.player.vx = knockbackDir * 3000;
            this.player.vy = -2000;
            this.player.grounded = false; // 空中扱いにする
        }

        // 痛そうなエフェクト（ヒットストップ感はないが視覚的に強調）
        for (let i = 0; i < 8; i++) {
            this.env.particles.push({
                x: this.player.x + 32,
                y: this.player.y + 32,
                vx: (Math.random() - 0.5) * 15,
                vy: (Math.random() - 0.5) * 15,
                life: 30,
                size: Math.random() * 5 + 3,
                color: '#e74c3c' // Blood/Impact red
            });
        }
        // キャラクターごとのダメージテキストを取得
        let damageText = "OUCH!";
        const currentId = this.characterManager.getCurrentCharacter().id;

        if (currentId === 'alice') {
            damageText = DAMAGE_TEXTS_ALICE[Math.floor(Math.random() * DAMAGE_TEXTS_ALICE.length)];
        } else if (currentId === 'kanon') {
            damageText = DAMAGE_TEXTS_KANON[Math.floor(Math.random() * DAMAGE_TEXTS_KANON.length)];
        }

        this.env.particles.push({
            type: 'text',
            x: this.player.x, y: this.player.y - 40, vy: -0.5, vx: 0, life: 60,
            text: damageText, color: '#ff3333', size: 50, gravity: 0,
            bold: true, blink: false,
            attachTo: this.player
        });

        // GAME_OVER condition removed per user request
        /*
        if (this.lives <= 0) {
            this.state = 'GAME_OVER';
        }
        */
        /* 
         ノックバックを見せるため、即時リスポーンは廃止。
         プレイヤーは吹き飛ばされた後、重力で落下して復帰or穴に落ちる。
         もし穴に落ちた場合は handlePlayerFall() が呼ばれるので問題ない。
         else {
            this.respawnPlayer();
         }
        */
    }

    respawnPlayer() {
        // Respawn at last safe ground
        this.player.x = this.player.lastSafeX || this.spawnX;
        this.player.y = (this.player.lastSafeY || this.spawnY) - 64;
        this.player.vx = 0;
        this.player.vy = 0;
        this.player.speedLevel = 0;

        // Remember the state before waiting
        this.preWaitState = this.state;
        this.state = 'RESPAWN_WAIT';
    }

    checkBossCollision() {
        if (!this.boss || this.boss.defeated) return;

        const p = this.player;
        const b = this.boss;

        // 1. Check Projectile vs Player
        b.projectiles.forEach((proj, index) => {
            const dx = proj.x - (p.x + p.width / 2);
            const dy = proj.y - (p.y + p.height / 2);
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < proj.size + 20) {
                this.takeDamage();
                b.projectiles.splice(index, 1);
            }
        });

        // 2. Check Player vs Boss Body
        if (
            p.x < b.x + b.width &&
            p.x + p.width > b.x &&
            p.y < b.y + b.height &&
            p.y + p.height > b.y
        ) {
            // --- New Damage Logic ---
            const isBossAttacking = (b.state === 'SPIN_DASH');

            // 突進中かつ帰還中でない場合のみダメージ
            if (isBossAttacking && !b.isReturning) {
                // ダッシュ中は判定を少しシビアにする（避けやすくするため）
                const shrinkX = b.width * 0.15; // 縮小率を少し緩めて当たりやすく調整
                const shrinkY = b.height * 0.15;
                const dashHitbox = {
                    x: b.x + shrinkX,
                    y: b.y + shrinkY,
                    w: b.width - (shrinkX * 2),
                    h: b.height - (shrinkY * 2)
                };

                const isHittingDash = (
                    p.x < dashHitbox.x + dashHitbox.w &&
                    p.x + p.width > dashHitbox.x &&
                    p.y < dashHitbox.y + dashHitbox.h &&
                    p.y + p.height > dashHitbox.y
                );

                if (isHittingDash) {
                    this.takeDamage(b);
                    return;
                }
            }

            // 非攻撃状態、または当たり判定の外側：踏みつけ判定
            // (帰還中であっても踏めるように修正)
            if (!p.grounded) {
                const damageDealt = b.takeDamage();
                if (damageDealt) {
                    p.vy = -1000;
                    const dir = (p.x + p.width / 2 < b.x + b.width / 2) ? -1 : 1;
                    p.vx = dir * 1500;
                    this.audio.playBossDamage();

                    // エフェクト生成
                    for (let i = 0; i < 20; i++) {
                        const speed = 5 + Math.random() * 15;
                        const angle = Math.random() * Math.PI * 2;
                        this.env.particles.push({
                            x: p.x + p.width / 2, y: p.y + p.height / 2,
                            vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
                            life: 30 + Math.random() * 20, size: 5 + Math.random() * 8,
                            color: i % 2 === 0 ? '#ff4757' : '#f1c40f', fade: true
                        });
                    }

                    this.camera.shake(0.2, 10);
                    const comicTexts = ["SMASH!", "POW!!!", "WHAM!", "BOOM!", "CRASH!"];
                    this.env.particles.push({
                        type: 'text', x: b.x + b.width / 2, y: b.y - 20,
                        vy: -8, life: 60, text: comicTexts[Math.floor(Math.random() * comicTexts.length)],
                        color: '#ff4757', size: 70, bold: true, stroke: '#ffffff'
                    });

                    if (b.defeated) {
                        this.score += 50;
                        this.stageScoreGained += 50;
                        this.updateScoreUI();
                        this.timeScale = 0.2;
                        this.camera.shake(50, 20);
                        this.audio.playWin ? this.audio.playWin() : this.audio.playCollect();
                        this.bossDefeatTimer = 180;
                        this.spawnBossExplosion(b.x, b.y);
                    }
                    return;
                }
            }

            // デフォルト：大きく弾き飛ばす（ダメージなし）
            this.knockbackTimer = 0.7;
            p.vy = -1100;
            const dir = (p.x + p.width / 2 < b.x + b.width / 2) ? -1 : 1;
            p.vx = dir * 1800;
            if (this.audio.playBump) this.audio.playBump();
        }
    }

    checkEnemyCollisions() {
        const p = this.player;
        this.enemies.forEach(en => {
            if (en.dead) return;

            // Expand hitbox for Super Dash
            const expansion = p.isSuperDashing ? 200 : 0;

            if (
                p.x - expansion < en.x + en.width &&
                p.x + p.width + expansion > en.x &&
                p.y - expansion < en.y + en.height &&
                p.y + p.height + expansion > en.y
            ) {
                // Boost Invincibility (Speed Ring)
                if (this.player.boostTimer > 0 || p.isSuperDashing || p.superDashTimer > 0) {
                    this.onEnemyDefeated(en);
                    this.camera.shake(0.15, 5);
                    for (let k = 0; k < 20; k++) {
                        this.env.particles.push({
                            x: en.x + en.width / 2,
                            y: en.y + en.height / 2,
                            vx: (Math.random() - 0.5) * 25,
                            vy: (Math.random() - 0.5) * 25,
                            life: 50, size: 8, color: '#ff7675', gravity: 0.5
                        });
                    }
                    return;
                }
                // Check for stomp (or Glide Attack)
                // Relaxed stomp hitbox: 80% coverage instead of 50%
                // Glide Attack: Gliding counts as an attack!
                if ((p.vy > 0 && p.y + p.height < en.y + en.height * 0.8) || p.isGliding) {
                    this.onEnemyDefeated(en);
                    p.vy = -400; // Small bounce
                    // Explosion effect (Colorful Burst)
                    for (let i = 0; i < 25; i++) {
                        const angle = Math.random() * Math.PI * 2;
                        const spd = Math.random() * 10 + 5;
                        // Fire colors: Red, Orange, Yellow, White
                        const colors = ['#e74c3c', '#e67e22', '#f1c40f', '#ecf0f1'];
                        const color = colors[Math.floor(Math.random() * colors.length)];

                        this.env.particles.push({
                            x: en.x + 32, y: en.y + 32,
                            vx: Math.cos(angle) * spd,
                            vy: Math.sin(angle) * spd,
                            life: 40 + Math.random() * 20,
                            size: Math.random() * 8 + 4,
                            color: color,
                            fade: true,
                            gravity: 0.2
                        });
                    }
                } else if (en.type === 'flyer' && p.vy < 0 && p.y > en.y + en.height * 0.4) {
                    this.onEnemyDefeated(en);
                    p.vy = 200; // Bounce down

                    // Explosion effect
                    for (let i = 0; i < 25; i++) {
                        const angle = Math.random() * Math.PI * 2;
                        const spd = Math.random() * 10 + 5;
                        const colors = ['#e74c3c', '#e67e22', '#f1c40f', '#ecf0f1', '#a29bfe'];
                        const color = colors[Math.floor(Math.random() * colors.length)];

                        this.env.particles.push({
                            x: en.x + 32, y: en.y + 32,
                            vx: Math.cos(angle) * spd,
                            vy: Math.sin(angle) * spd,
                            life: 40 + Math.random() * 20,
                            size: Math.random() * 8 + 4,
                            color: color,
                            fade: true,
                            gravity: 0.2
                        });
                    }
                } else {
                    // Hurt player
                    this.takeDamage(en);
                }
            }
        });
    }

    onEnemyDefeated(en) {
        en.dead = true;

        // Update Combo
        this.aerialKillCombo = (this.aerialKillCombo || 0) + 1;

        const pts = 2; // Fixed score gain across all stages to maintain balance
        this.score += pts;
        this.stageScoreGained += pts; // Track stage gain
        this.updateScoreUI();
        this.saveProgress();
        this.audio.playBarrierBreak();

        // Combo Effect
        if (this.aerialKillCombo >= 2) {
            // Long shake for combos
            this.camera.shake(0.25, 8); // 0.25s duration (was 0.5s)
            this.env.particles.push({
                type: 'text', x: en.x, y: en.y - 40, vy: -3, life: 60,
                text: `${this.aerialKillCombo} COMBO!`, color: '#e056fd', size: 40, bold: true
            });
        } else {
            // Normal short shake
            this.camera.shake(0.1, 5);
        }

        // ライフを1回復する仕様に変更
        this.lives += 1;

        // もし借金状態(ライフ0以下)から回復した場合は借金状態を解除
        if (this.lives > 0 && this.isDebtState) {
            this.isDebtState = false;
        }

        this.updateHealthUI();

        // ニンジンではなくライフ(ハート)がポーンと出てくるエフェクトに変更
        this.env.particles.push({
            type: 'text',
            x: en.x + (en.width || 64) / 2,
            y: en.y + (en.height || 64) / 2,
            vx: (Math.random() - 0.5) * 8,
            vy: -15 - Math.random() * 10,
            gravity: 0.7,
            friction: 0.98,
            life: 90,
            text: "❤️+1",
            size: 45,
            bold: true,
            pulse: true
        });
    }

    spawnBossExplosion(x, y) {
        // High-End Cinematic Explosion Direction
        this.audio.playBossExplosion();

        // 1. Blinding Flash & Slow Motion (Hitstop/Cinematic look)
        this.timeScale = 0.1;
        setTimeout(() => { this.timeScale = 1.0; }, 2000); // 2 seconds of slow-mo (real time)

        this.camera.shake(60, 1.0); // Strong 1-sec shake

        // 2. Initial Shockwave
        this.env.particles.push({
            x: x, y: y, life: 40, size: 50, grow: 40,
            color: 'rgba(255, 255, 255, 0.9)', fade: true, screenSpace: false
        });

        // 3. Primary Fireballs (Orange/Red/Yellow)
        for (let i = 0; i < 80; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 10 + Math.random() * 30;
            this.env.particles.push({
                x: x, y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 60 + Math.random() * 60,
                size: 8 + Math.random() * 15,
                color: `hsl(${10 + Math.random() * 50}, 100%, 50%)`,
                gravity: 0.1, friction: 0.98, fade: true, glow: true
            });
        }

        // 4. Kinetic Sparks (Fast, white/yellow needles)
        for (let i = 0; i < 40; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 40 + Math.random() * 40;
            this.env.particles.push({
                x: x, y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 20 + Math.random() * 20,
                size: 3, color: '#fff', fade: true
            });
        }

        // 5. Rising Smoke
        for (let i = 0; i < 30; i++) {
            this.env.particles.push({
                x: x + (Math.random() - 0.5) * 100,
                y: y + (Math.random() - 0.5) * 100,
                vx: (Math.random() - 0.5) * 2,
                vy: -Math.random() * 4 - 2,
                life: 120 + Math.random() * 60,
                size: 20 + Math.random() * 40,
                color: 'rgba(44, 62, 80, 0.6)', fade: true
            });
        }

        // 6. Finishing Text Overlay (Pulsing)
        this.env.particles.push({
            type: 'text',
            x: this.width / 2, y: this.height / 2,
            vx: 0, vy: -0.5, life: 180,
            text: "🌟 BOSS DEFEATED! 🌟", color: '#f1c40f', size: 60,
            screenSpace: true, bold: true, pulse: true
        });

        // 7. Calculate Stage Results
        const elapsedSec = Math.floor((Date.now() - this.stageStartTime) / 1000);
        const mins = Math.floor(elapsedSec / 60);
        const secs = elapsedSec % 60;
        const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;

        const medicalCost = this.stageDamageCount * 10;
        const scoreBefore = this.score;

        // Update score - Allowing negative (debt)
        this.score -= medicalCost;



        this.results = {
            time: timeStr,
            damage: this.stageDamageCount,
            cost: medicalCost,
            scoreBefore: scoreBefore
        };

        this.updateScoreUI();
        this.saveProgress();
    }

    // 旧Monolithic drawメソッドは各セクションに分散・再定義されたため削除しました。
    // 代わりに SectionManager.runAll('draw') でセクション単位の描画が管理されます。

    activateCarrotFever() {
        const startCol = Math.floor(this.player.x / this.level.tileSize) + 5; // Start a bit ahead
        const range = 60; // 60 blocks range
        const endCol = Math.min(startCol + range, this.level.cols);
        const rows = this.level.rows;

        for (let c = startCol; c < endCol; c++) {
            // Find ground
            let groundY = -1;
            for (let r = 0; r < rows; r++) {
                if (this.level.isSolid(c, r)) {
                    groundY = r;
                    break;
                }
            }

            if (groundY !== -1) {
                // Fill up to 12 blocks high (Ground & Air)
                for (let h = 1; h <= 12; h++) {
                    const targetY = groundY - h;
                    if (targetY >= 0) {
                        // Check if it's empty in the current running level logic (check entities)
                        // But since we are modifying the base grid effectively or entities list:
                        // Level entities are loaded from the map string in Level.load().
                        // Level.matrix is what isSolid checks, but entities are separate objects in this.level.entities.
                        // We need to inject new entities.

                        // Check if space is occupied by existing entity
                        const occupied = this.level.entities.some(e =>
                            !e.collected &&
                            Math.floor(e.x / this.level.tileSize) === c &&
                            Math.floor(e.y / this.level.tileSize) === targetY
                        );

                        if (!occupied && Math.random() < 0.2) { // 20% chance (Doubled from 10%)
                            // Add new carrot entity
                            this.level.entities.push({
                                type: 'C',
                                x: c * this.level.tileSize,
                                y: targetY * this.level.tileSize,
                                collected: false
                            });
                        }
                    }
                }
            }
        }
        // Ensure entities are sorted by X for the rendering optimization loop in Level.js
        this.level.entities.sort((a, b) => a.x - b.x);
    }
    startDialogue(key, onComplete) {
        // Character specific dialogue check
        const currentChar = this.characterManager.getCurrentCharacter();
        if (currentChar && (currentChar.id === 'kanon' || currentChar.name === 'カノン')) {
            const kanonKey = key + '_KANON';
            if (this.dialogueManager.hasDialogue(kanonKey)) {
                key = kanonKey;
            }
        }

        this.dialogueManager.startDialogue(key, onComplete);
    }

    showReadyGo() {
        this.env.particles.push({
            type: 'text',
            x: this.width / 2,
            y: this.height / 2,
            text: 'READY GO!',
            color: '#f1c40f',
            size: 60,
            life: 120,
            screenSpace: true,
            bold: true
        });

        // Sound effect (Optional if we have one, otherwise just visuals)
        if (this.audio) {
            // Assuming there's a start sound or something
        }
    }
}
