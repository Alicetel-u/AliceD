import { Particle } from './Particle.js';
import { SpriteAnimator } from '../SpriteAnimator.js';

// デフォルトのセリフ（後方互換性のため、キャラクター未指定時に使用）
const DEFAULT_SPEECH_LINES = [
    "ぴょんぴょん！今日も絶好調だよ！",
    "お耳ピーン！準備はいつでもOK！",
    "世界一高く跳んじゃうもんね、見てて！",
    "ねえねえ、いっしょにかけっこしよう？",
    "お散歩？お散歩いくの！？わーい！",
    "あのね……なでなで、してほしいな",
    "ずっと隣にいていい……？ 寂しくなっちゃうから",
    "ぎゅーってして？ ふわふわだよ？",
    "えへへ、あなたのこと、だーい好き！",
    "ひとりでお留守番は、いやだぴょん……",
    "くんくん……どこかに人参、隠してない？",
    "もぐもぐ……これ、世界で一番おいしい！",
    "おやつ、まだかなぁ。お耳が動いちゃうよ",
    "お腹ぺこぺこぴょん。何かちょうだい？",
    "いい匂いがする！もしかしてクッキー焼いた？",
    "うさぎをただの可愛い動物だと思ったら大間違いだよ？",
    "わたしの耳は地獄耳なんだから。内緒話は禁止！",
    "足が速すぎて、ついてこれないんじゃない？",
    "なーに？ わたしの可愛さに惚れちゃった？",
    "捕まえてごらーん！……なーんてねっ。",
    "ふわふわ……おやすみなさいのじかん……",
    "日向ぼっこ、最高だねぇ。一緒に寝ちゃおう？",
    "あと5分だけ……むにゃむにゃ……",
    "ここ、すごく落ち着く場所だね",
    "夢の中でも、あなたに会えるといいな",
    "冒険の始まりだぴょん！出発進行ー！",
    "わたしの耳を信じて。こっちからいい音がするよ！",
    "次はどっちの道に行こうか？ ワクワクするね",
    "あなたが一緒なら、暗い森も怖くないよ",
    "幸運のウサギが、あなたに幸せを運んできてあげる！"
];

class SpeechSystem {
    constructor(player, speechLines = DEFAULT_SPEECH_LINES) {
        this.player = player;
        this.speechLines = speechLines;
        this.active = false;
        this.text = "";
        this.timer = 0;
        this.nextSpeechTime = Math.random() * 5 + 5; // 5-10 sec
        this.displayDuration = 4; // 4 seconds
        this.fadeTime = 0.5; // 0.5 sec fade
        this.opacity = 0;
        this.state = 'WAITING'; // WAITING, FADE_IN, VISIBLE, FADE_OUT
    }

    update(dt) {
        switch (this.state) {
            case 'WAITING':
                this.timer += dt;
                if (this.timer >= this.nextSpeechTime) {
                    this.state = 'FADE_IN';
                    this.timer = 0;
                    this.text = this.speechLines[Math.floor(Math.random() * this.speechLines.length)];
                    this.nextSpeechTime = Math.random() * 5 + 5; // Reset next interval
                }
                break;
            case 'FADE_IN':
                this.timer += dt;
                this.opacity = this.timer / this.fadeTime;
                if (this.timer >= this.fadeTime) {
                    this.opacity = 1;
                    this.state = 'VISIBLE';
                    this.timer = 0;
                }
                break;
            case 'VISIBLE':
                this.timer += dt;
                if (this.timer >= this.displayDuration) {
                    this.state = 'FADE_OUT';
                    this.timer = 0;
                }
                break;
            case 'FADE_OUT':
                this.timer += dt;
                this.opacity = 1 - (this.timer / this.fadeTime);
                if (this.timer >= this.fadeTime) {
                    this.opacity = 0;
                    this.state = 'WAITING';
                    this.timer = 0;
                }
                break;
        }
    }

    draw(ctx, camera) {
        if (this.state === 'WAITING') return;

        // キャラクターの実際の描画高さに基づいて、頭の上の正確な位置を計算
        const x = this.player.x - camera.x + this.player.width / 2;

        // 描画の下端(pivotY)から実際の高さ分だけ上にオフセット
        const renderHeight = this.player.lastRenderHeight || this.player.height;
        const pivotY = this.player.y - camera.y + this.player.height;
        const y = pivotY - renderHeight - 15; // 頭のてっぺんから15px上

        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, this.opacity));

        // Setup font first to measure text
        ctx.font = 'bold 16px monospace';
        const metrics = ctx.measureText(this.text);
        const padding = 10;
        const boxWidth = metrics.width + padding * 2;
        const boxHeight = 30;

        // Draw Bubble Background (Pixel Art Style: White box with thick border)
        // Main Box
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;

        // Draw centered box
        const boxX = x - boxWidth / 2;
        const boxY = y - boxHeight / 2;

        ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
        ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

        // Little triangle/tail pointing down
        ctx.beginPath();
        ctx.moveTo(x - 5, boxY + boxHeight);
        ctx.lineTo(x, boxY + boxHeight + 8);
        ctx.lineTo(x + 5, boxY + boxHeight);
        ctx.stroke();
        ctx.fill();

        // Re-stroke bottom line to cover triangle overlap look if needed, 
        // but verify generic stroke looks okay. 
        // Actually, to look "connected", we would need to draw the path carefully. 
        // Let's just draw the triangle on top of the border for now, or just fill it.
        ctx.beginPath();
        ctx.moveTo(x - 4, boxY + boxHeight - 1); // overlap slightly
        ctx.lineTo(x, boxY + boxHeight + 8);
        ctx.lineTo(x + 4, boxY + boxHeight - 1);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();

        // Draw text
        ctx.fillStyle = '#000000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.text, x, y);

        ctx.restore();
    }
}

export class Player {
    constructor(x, y, tileSize, bonusStats = { SPD: 0, JUMP: 0, CRIT: 0, DEF: 0 }, speechLines = DEFAULT_SPEECH_LINES, characterStats = { speed: 1.0, jump: 1.0 }) {
        this.x = x;
        this.y = y;
        this.tileSize = tileSize;
        this.bonusStats = bonusStats;
        this.characterStats = characterStats;

        // Sprite Animator
        this.animator = new SpriteAnimator();

        const scale = tileSize / 32;
        const sizeMultiplier = 1.5;

        // Scale hitbox by 1.25x
        const originalWidth = tileSize - (10 * scale);
        const originalHeight = tileSize - (4 * scale);

        this.width = originalWidth * sizeMultiplier;
        this.height = originalHeight * sizeMultiplier;

        // Adjust position to center relative to original size and align bottom
        // This ensures the player grows "up and out" from their original center-bottom point
        this.x = x + (originalWidth - this.width) / 2;
        this.y = y + (originalHeight - this.height);

        this.vx = 0;
        this.vy = 0;
        this.prevX = x;
        this.prevY = y;

        this.speed = 0.5 * scale * 60; // 0.5px per frame @ 60fps -> pixels/sec
        // Apply Speed Bonus (Gacha + Character Base)
        const speedMult = (1 + (this.bonusStats.SPD / 100)) * this.characterStats.speed;
        this.maxSpeed = 6 * scale * 60 * speedMult;

        // Apply Jump Bonus (Gacha + Character Base)
        const jumpMult = (1 + (this.bonusStats.JUMP / 100)) * this.characterStats.jump;
        this.jumpForce = -12 * scale * 60 * jumpMult;

        this.gravity = 0.6 * scale * 3600; // Gravity is usually applied per frame per frame, so 60*60 for sec^2
        this.glideGravity = 0.1 * scale * 3600;
        this.friction = 0.8; // Friction is a coefficient, careful here

        // 描画用の高さ保持（セリフ位置用）
        this.lastRenderHeight = this.height;

        this.grounded = false;
        this.facingRight = true;
        this.isGliding = false;

        // Animation attributes
        this.state = 'idle';
        this.frame = 0;
        this.frameTimer = 0;
        this.frameInterval = 10;

        // キャラクター別のアニメーション設定
        this.usesSeparateSprites = false;
        this.maxFrames = 4;

        // Juice: Squash & Stretch
        this.scaleX = 1;
        this.scaleY = 1;
        this.rotation = 0; // Dynamic tilting
        this.tiltTarget = 0;
        this.juiciness = 1.0;

        // Juice: Particles
        this.particles = [];

        // Triple Jump (Changed from 2)
        this.jumpCount = 0;
        this.maxJumps = 3;

        // Status Effects
        this.boostTimer = 0;
        this.speedLevel = 0; // 0 to 5

        // Speech System（キャラクターごとのセリフを使用）
        this.speech = new SpeechSystem(this, speechLines);

        // Checkpoint System
        this.lastSafeX = x;
        this.lastSafeY = y;

        // Visual Effects
        this.hasGoldenAura = false;
        this.auraTimer = 0;

        // キャラクター固有のアニメーション設定を保持
        this.characterConfig = null;

        // Stage 2 Swamp State
        this.inSwamp = false;

        // Spring Jump Flag (Wall-through)
        this.isSpringJumping = false;

        // Super Dash Flag
        this.superDashTimer = 0;
        this.isSuperDashing = false;
    }

    // キャラクター設定を適用（ゲーム開始時に呼ばれる）
    setCharacterConfig(config) {
        this.characterConfig = config;
        this.animator.setConfig(config);

        // 以前の古い変数は互換性のために残すが、基本はconfigを参照する
        if (config) {
            this.usesSeparateSprites = config.type === 'SEPARATE';
            this.maxFrames = config.maxFrames;
            this.frameInterval = config.frameInterval;
        }
    }

    applySpeedBoost() {
        this.speedLevel = Math.min(this.speedLevel + 1, 5);
        // Removed boostTimer - effectiveness is now permanent until death
    }

    startSpringJump() {
        this.isSpringJumping = true;
    }

    update(input, level, camera, audio, dt, isBossMode = false, stageBonus = 0, isHurt = false, isManual = false) {
        // Super Dash Logic (Gold Ring / Ultra Burst)
        if (this.superDashTimer > 0) {
            this.superDashTimer -= dt;
            this.isSuperDashing = true;

            // Allow Vertical Steering with high responsiveness
            let vInput = 0;
            if (input.isDown('ArrowUp') || input.isDown('KeyW')) vInput = -1;
            if (input.isDown('ArrowDown') || input.isDown('KeyS')) vInput = 1;

            this.x += this.vx * dt;
            this.y += (vInput * 1200) * dt; // Direct override of vy feeling

            // Massive Visuals: Gold/Rainbow Trail
            for (let i = 0; i < 3; i++) {
                this.particles.push(new Particle(
                    this.x + Math.random() * this.width,
                    this.y + Math.random() * this.height,
                    -this.vx * 0.1, (Math.random() - 0.5) * 50,
                    45, `hsl(${Math.random() * 60 + 40}, 100%, 60%)`, // Gold/Yellow spectrum
                    15
                ));
            }

            this.state = 'jump';
            this.handleParticles(dt);
            return; // Skip normal physics
        } else {
            this.isSuperDashing = false;
        }

        // Boost Logic (Speed Ring)
        if (this.boostTimer > 0) {
            this.boostTimer -= dt;
            // Velocity is kept from trigger (vx=2500, vy=0)
            // Allow vertical steering
            let vInput = 0;
            if (input.isDown('ArrowUp') || input.isDown('KeyW')) vInput = -1;
            if (input.isDown('ArrowDown') || input.isDown('KeyS')) vInput = 1;

            this.x += this.vx * dt;
            this.y += (this.vy + vInput * 1000) * dt;

            // Trail
            if (Math.random() < 0.8) {
                this.particles.push(new Particle(
                    this.x, this.y + this.height / 2,
                    -this.vx * 0.05, (Math.random() - 0.5) * 10,
                    30, '#00d2d3', 8
                ));
            }

            this.state = 'jump';
            this.handleParticles(dt);
            return; // Skip normal physics
        }
        // Horizontal Movement
        let baseMultiplier = 0.45;

        // ダメージを受けてノックバック中の場合は入力を無視し、慣性のみで動く
        if (isHurt) {
            // 操作無効（ノックバックの速度 vx は外部で設定され、ここでは減衰させるか等速にする）
            this.vx *= Math.pow(0.95, dt * 60); // 減速をフレームレートに依存しないように修正
        } else if (isManual) {
            // Manual Movement Phase (Boss Vulnerable Phase)
            const moveSpeed = (this.maxSpeed / 60) * 0.8 * 60; // 80% of max speed for manual control
            let moveDir = 0;
            if (input.isDown('KeyA') || input.isDown('ArrowLeft')) moveDir -= 1;
            if (input.isDown('KeyD') || input.isDown('ArrowRight') || input.isDown('KeyF') || input.isDown('Space')) moveDir += 1; // Allow space/F/D for right

            this.vx = moveDir * moveSpeed;
            if (moveDir !== 0) {
                this.facingRight = moveDir > 0;
            } else {
                // Apply friction if no input
                this.vx *= Math.pow(0.8, dt * 60);
            }

            if (this.grounded && Math.abs(this.vx) > 100 && Math.random() < 0.2) {
                this.spawnDust(this.x, this.y + this.height);
            }
        } else {
            // 通常の移動計算（Auto Run）
            // ... (rest of existing logic)
            // Effective speed level (base + boost items + active bonus)
            let effectiveSpeedLevel = this.speedLevel;

            // Handle Speed Boost
            if (effectiveSpeedLevel > 0) {
                baseMultiplier += (effectiveSpeedLevel * 0.1);

                // Visual feedback for speedup
                if (Math.random() < 0.3) {
                    this.particles.push(new Particle(
                        this.x + Math.random() * this.width,
                        this.y + Math.random() * this.height,
                        -this.vx * 0.1,
                        (Math.random() - 0.5) * 1,
                        20,
                        'rgba(241, 196, 15, 0.5)',
                        10
                    ));
                }
            }

            let finalSpeed = (this.maxSpeed / 60) * baseMultiplier * 60;
            this.vx = finalSpeed;
            this.facingRight = true;

            if (this.grounded && Math.random() < 0.2) {
                this.spawnDust(this.x, this.y + this.height);
            }
        }

        // Swamp Effects on Physics
        if (this.inSwamp) {
            // Slow down horizontal movement
            this.vx *= 0.5;

            // Visuals (Bubbles)
            if (Math.random() < 0.2) {
                this.particles.push(new Particle(
                    this.x + Math.random() * this.width,
                    this.y + this.height,
                    0, -30, 40, 'rgba(142, 68, 173, 0.6)', 6
                ));
            }
        }

        // Vertical Movement (Jump & Glide)
        const isJumpPressed = !isHurt && (input.isPressed('Space') || input.pointerPressed);
        const isGlideHeld = !isHurt && (input.isDown('Space') || input.pointerDown);

        if (isJumpPressed && (this.grounded || this.jumpCount < this.maxJumps)) {
            // Swamp reduces jump height
            this.vy = this.inSwamp ? this.jumpForce * 0.7 : this.jumpForce; // pixels/sec

            this.grounded = false;
            this.jumpCount++;

            // Stretch on jump
            this.scaleX = 0.7;
            this.scaleY = 1.3;

            if (this.jumpCount > 1) {
                // Double Jump Effect
                this.spawnDoubleJumpDust(this.x + this.width / 2, this.y + this.height);
            } else {
                // Normal Jump particles
                for (let i = 0; i < 5; i++) {
                    this.spawnDust(this.x + this.width / 2, this.y + this.height);
                }
            }

            if (audio) audio.playJump();
        }

        // Ear Glide
        if (!this.grounded && isGlideHeld && this.vy > 0) {
            this.isGliding = true;
            this.vy += this.glideGravity * dt;
            // Scale terminal velocity for glide
            const scale = this.tileSize / 32;
            if (this.vy > 2 * scale * 60) this.vy = 2 * scale * 60;
        } else {
            this.isGliding = false;
            // Swamp gravity (thicker medium, fall slower? or same?)
            // Let's make it slightly floaty/heavy drag
            const g = this.inSwamp ? this.gravity * 0.5 : this.gravity;
            this.vy += g * dt;
        }

        // Apply Velocity with Sub-stepping to prevent tunneling
        // Divide full movement into segments smaller than half-tile size
        const subSteps = Math.ceil(Math.max(Math.abs(this.vx * dt), Math.abs(this.vy * dt)) / (this.tileSize * 0.5)) || 1;
        const stepDt = dt / subSteps;

        const wasGrounded = this.grounded;
        this.grounded = false;

        for (let s = 0; s < subSteps; s++) {
            this.prevX = this.x;
            this.prevY = this.y;

            this.x += this.vx * stepDt;
            this.handleCollision(level, 'x');
            this.y += this.vy * stepDt;
            this.handleCollision(level, 'y');
        }

        // Terminal Velocity Cap (Safety)
        const maxFallSpeed = 1800;
        if (this.vy > maxFallSpeed) this.vy = maxFallSpeed;

        // Landed detection for squash
        if (!wasGrounded && this.grounded) {
            this.jumpCount = 0; // Reset jumps

            // Pro Impact Logic: Squash based on fall speed
            const impactForce = Math.min(1.8, Math.max(1.2, 1 + (Math.abs(this.vy) / 1000)));
            this.scaleX = impactForce;
            this.scaleY = 2 - impactForce;
            this.rotation = (Math.random() - 0.5) * 0.1; // Slight jolt

            // Land particles - proportional to impact
            const particleCount = Math.floor(impactForce * 5);
            for (let i = 0; i < particleCount; i++) {
                this.spawnDust(this.x + this.width / 2, this.y + this.height);
            }
            if (audio) audio.playLand();

            this.lastSafeX = this.x;
            this.lastSafeY = this.y;
        }

        // Reset Swamp State for next frame re-application
        this.inSwamp = false;

        // Update Animation State
        this.updateAnimation(dt);

        // Juice: Update Scales (Lerp back to 1)
        const lerpSpeed = 1 - Math.pow(0.85, dt * 60);
        this.scaleX += (1 - this.scaleX) * lerpSpeed;
        this.scaleY += (1 - this.scaleY) * lerpSpeed;

        // Dynamic Tilt Logic
        if (this.grounded) {
            // Tilting forward based on horizontal velocity
            this.tiltTarget = (this.vx / this.maxSpeed) * 0.15;
            // Add a little breathing/bobbing vibration when running
            if (Math.abs(this.vx) > 100) {
                const wave = Math.sin(Date.now() * 0.015);
                this.tiltTarget += wave * 0.02;
                this.scaleY += wave * 0.01;
            }
        } else {
            // Tilting based on vertical trajectory
            this.tiltTarget = Math.max(-0.3, Math.min(0.3, this.vy / 1000));
        }

        const tiltLerp = 1 - Math.pow(0.9, dt * 60);
        this.rotation += (this.tiltTarget - this.rotation) * tiltLerp;

        // Spring Jump Reset Logic
        // If falling AND not inside a solid block, disable collision ignore
        if (this.isSpringJumping) {
            // Check if we are inside a solid block
            // Helper to check 4 corners of the player
            const checkSolid = (lvl, x, y, w, h) => {
                const l = Math.floor(x / lvl.tileSize);
                const r = Math.floor((x + w) / lvl.tileSize);
                const t = Math.floor(y / lvl.tileSize);
                const b = Math.floor((y + h) / lvl.tileSize);
                // Check all tiles in bounding box (simple loop is safer than just corners)
                for (let yy = t; yy <= b; yy++) {
                    for (let xx = l; xx <= r; xx++) {
                        if (lvl.isSolid(xx, yy)) return true;
                    }
                }
                return false;
            };

            // If we've started falling (vy >= 0) AND we are in clear space, disable ghost mode
            if (this.vy >= 0 && !checkSolid(level, this.x, this.y, this.width, this.height)) {
                this.isSpringJumping = false;
            }
        }

        // Juice: Update Particles
        this.handleParticles(dt);

        // Update Speech
        this.speech.update(dt);
    }

    spawnDust(x, y) {
        // Random offset
        const px = x + (Math.random() * 10 - 5);
        const py = y; // At feet
        const vx = (Math.random() - 0.5) * 2;
        const vy = -(Math.random() * 2 + 0.5); // Upward
        this.particles.push(new Particle(px, py, vx, vy, 20, '#dcdde1', 4 * (this.tileSize / 32))); // Scale particle size
    }

    spawnDoubleJumpDust(x, y) {
        // Ring/Explosion effect in air
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const speed = 3;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            const px = x + vx * 2;
            const py = y + vy * 2;
            // White/Blueish sparkles
            this.particles.push(new Particle(px, py, vx, vy, 30, '#a4b0be', 3 * (this.tileSize / 32)));
        }
    }

    handleCollision(level, axis) {
        const left = Math.floor(this.x / this.tileSize);
        const right = Math.floor((this.x + this.width) / this.tileSize);
        const top = Math.floor(this.y / this.tileSize);
        const bottom = Math.floor((this.y + this.height) / this.tileSize);

        if (axis === 'x') {
            for (let r = top; r <= bottom; r++) {
                if (this.vx > 0) {
                    if (level.isSolid(right, r)) {
                        this.x = right * this.tileSize - this.width - 0.1;
                        this.vx = 0;
                        break;
                    }
                } else if (this.vx < 0) {
                    if (level.isSolid(left, r)) {
                        this.x = (left + 1) * this.tileSize + 0.1;
                        this.vx = 0;
                        break;
                    }
                }
            }
        } else {
            // Y-Axis Collision
            // If Spring Jumping is active and we are moving UP, ignore collision
            if (this.isSpringJumping && this.vy < 0) {
                return; // Ghost mode for ceiling
            }

            for (let c = left; c <= right; c++) {
                if (this.vy > 0) {
                    if (level.isSolid(c, bottom)) {
                        // If we are spring jumping (falling but stuck in wall), 
                        // we should technically ignore landing until we are out.
                        // But the isSpringJumping flag is cleared only when NOT solid.
                        // If we hit solid down, it means we must be out of wall partially?
                        // Actually, if we are inside wall, isSolid(c, bottom) will be true.
                        // We want to FALL THROUGH the specific blocks we are overlapping.

                        // Safety: If isSpringJumping is still true (meaning we haven't cleared the wall), ignore landing too?
                        // Yes, otherwise we might land "inside" the wall.
                        if (this.isSpringJumping) continue;

                        this.y = bottom * this.tileSize - this.height - 0.1;
                        this.vy = 0;
                        this.grounded = true;
                        break;
                    }
                } else if (this.vy < 0) {
                    if (level.isSolid(c, top)) {
                        this.y = (top + 1) * this.tileSize + 0.1;
                        this.vy = 0;
                        break;
                    }
                }
            }
        }
        if (this.x < 0) this.x = 0;
    }

    updateAnimation(dt) {
        if (this.grounded) {
            if (Math.abs(this.vx) > 0.5 * 60) {
                this.animator.setState('run');
            } else {
                this.animator.setState('idle');
            }
        } else {
            if (this.isGliding) {
                this.animator.setState('glide');
            } else {
                this.animator.setState('jump');
            }
        }

        this.animator.update(dt);

        // Sync back frame info if necessary (e.g. for debug or other checks)
        this.frame = this.animator.frame;
        this.state = this.animator.state;
    }

    draw(ctx, assets, camera) {
        // Draw Particles first (behind player)
        this.particles.forEach(p => p.draw(ctx, camera));

        // Get image based on current state (managed by animator/config logic)
        // We still need to help determine WHICH image to feed the animator
        // because Asset loading is separate.

        const animConfig = this.characterConfig || this.animator.config;
        const currentState = this.animator.state;

        let sprite;
        if (animConfig.type === 'SEPARATE') {
            const spriteKey = `player_${currentState}`;
            // Try specific state sprite, fallback to base 'player'
            sprite = assets.getImage(spriteKey) || assets.getImage('player');
        } else {
            sprite = assets.getImage('player');
        }

        if (!sprite) return; // Should be handled by Assets placeholder now, but safety check

        // Calculate draw position
        // Pivot is bottom center
        const x = this.x - camera.x + this.width / 2;
        const y = this.y - camera.y + this.height;

        // Visual Layout Logic (Size calculation)
        const visualScale = 1.5;
        let renderSize = this.tileSize * 1.5 * visualScale;

        // Apply per-state scale adjustment if defined in CharacterManager
        // This allows normalizing sizes across different sprite sheets (e.g. aligning head/feet)
        const stateConfig = animConfig.states && animConfig.states[currentState];
        if (stateConfig && typeof stateConfig.scale === 'number') {
            renderSize *= stateConfig.scale;
        }

        // Delegate drawing to Animator
        // returns renderedHeight for speech bubble positioning
        const renderedHeight = this.animator.draw(
            ctx,
            sprite,
            x, y,
            renderSize, renderSize, // width, height (animator will preserve aspect ratio based on these bounds)
            this.facingRight,
            this.scaleX, this.scaleY,
            this.rotation
        );

        this.lastRenderHeight = renderedHeight || renderSize; // Update for speech bubbles

        // Draw Golden Aura Effect
        if (this.hasGoldenAura) {
            this.auraTimer += 0.1;
            ctx.save();
            const bx = Math.floor(this.x - camera.x + this.width / 2);
            const by = Math.floor(this.y - camera.y + this.height / 2);

            // Outer glow
            const gradient = ctx.createRadialGradient(bx, by, 10, bx, by, 50);
            gradient.addColorStop(0, 'rgba(255, 215, 0, 0.4)');
            gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(bx, by, 50 + Math.sin(this.auraTimer) * 5, 0, Math.PI * 2);
            ctx.fill();

            // Sparkles
            if (Math.random() < 0.2) {
                this.particles.push(new Particle(
                    this.x + Math.random() * this.width,
                    this.y + Math.random() * this.height,
                    (Math.random() - 0.5) * 2,
                    -Math.random() * 3,
                    30,
                    '#ffd700',
                    Math.random() * 4 + 2
                ));
            }

            ctx.restore();
        }

        // Draw Speech Bubble
        this.speech.draw(ctx, camera);
    }

    handleParticles(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update(dt);
            if (this.particles[i].life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
}
