import { BossBehaviors } from '../data/BossBehaviors';

export class Boss {
    constructor(x, y, tileSize, config) {
        this.x = x;
        this.y = y;
        this.tileSize = tileSize;
        this.width = tileSize * 9.0;
        this.height = tileSize * 9.0;

        this.config = config || {};
        this.hp = this.config.hp || 3;
        this.maxHp = this.hp;
        this.state = 'IDLE'; // IDLE, ATTACK, HURT, DEAD, CAST_FLOOR, CAST_WAVE, WAVES_ACTIVE
        this.timer = 0;
        this.defeated = false;

        // Movement
        this.baseY = y;
        this.floatY = 0;

        // Attack pattern
        this.projectiles = [];
        this.isInvulnerable = false; // Set to true for special boss phases
        this.rotation = 0;
        this.spinSpeed = 0;
        this.targetDashX = 0;
        this.targetDashY = 0;
        this.dashStarted = false;

        // Shadow Floor Hazard
        this.floorHazard = {
            active: false,
            warning: false,
            timer: 0,
            y: 0,
            height: 0
        };

        // Dark Wave Hazard
        this.waves = []; // {x, y, vx, vy, width, height, type}

        // Toy King Hazard
        this.toyPresents = [];

        // Nurse Hazard (Refined)
        this.pills = []; // Bouncing pills
        this.scalpelDash = { active: false, warning: false, y: 0, timer: 0 };
        this.vitalLasers = []; // Horizontal lasers
    }

    isSister() {
        return this.config.image && this.config.image.includes('sister');
    }

    isToyKing() {
        return this.config.image && this.config.image.includes('toy_king');
    }

    isNurse() {
        return this.config.image && this.config.image.includes('nurse');
    }

    isGod() {
        return this.config.image && this.config.image.includes('god');
    }

    update(dt, player, camera, screenWidth, env) {
        if (this.defeated && this.state !== 'DEAD') return;

        this.timer += dt;

        // --- Common Projectile & Hazard Check ---
        this.updateProjectiles(dt);
        this.checkProjectileCollisions(player, env);

        if (this.isSister()) {
            this.updateShadowFloor(dt, player, env, camera);
            this.updateDarkWaves(dt, player, env);
        }

        if (this.isToyKing()) {
            this.updateToyPresents(dt, player, env);
        }

        if (this.isNurse()) {
            this.updatePills(dt, player, env, camera);
            this.updateVitalLasers(dt, player, env, camera, screenWidth);
            this.updateScalpelDash(dt, player, camera, screenWidth);
            this.updateToyPresents(dt, player, env);
        }

        if (this.isGod()) {
            this.updateGodAttacks(dt, player, env);
            this.updateDarkWaves(dt, player, env);
        }

        // --- DYNAMIC BEHAVIOR DISPATCHER (しくみ) --- 
        // BossBehaviorsにある関数を優先実行し、なければLegacy/Common Branchへ
        if (BossBehaviors[this.state]) {
            BossBehaviors[this.state](this, { dt, player, camera, screenWidth, env });
        } else if (this.state === 'BATTLE') {
            // General Battle Movement
            const needsShield = this.isSister() || this.isToyKing();
            if (needsShield && !this.isInvulnerable) {
                // ... legacy logic for shield ...
                if (typeof this.hasRetreated === 'undefined') this.hasRetreated = false;
                let targetY = camera.y + 150;
                this.floatY = Math.sin(this.timer * 2) * 20;
                this.baseY += (targetY - this.baseY) * (dt * 2.0);
                this.y = this.baseY + this.floatY;

                if (!this.hasRetreated) {
                    let idealX = camera.x + screenWidth * 0.82;
                    this.x += (idealX - this.x) * (dt * 2.0);
                    if (this.x > camera.x + screenWidth * 0.81) {
                        this.hasRetreated = true;
                    }
                }
            } else {
                // Default BATTLE movement re-use
                BossBehaviors['BATTLE_MOVE'](this, { dt, player, camera, screenWidth });
            }

            // FIX: Stage 1 Boss (Mochitsuki) Passive Attack
            // AI設定があっても、待機中(BATTLE)に定期的に弾を撃つようにする
            // ここに配置することで、攻撃遷移(interval)を待たずに実行される
            // バリア破壊後（＝HPが減って弱体化/Weak画像になった後）は止める
            // Stage 1ボスはHP3なので、残り1になったら弱体化(Weak)として攻撃停止
            const isWeakened = (this.hp <= 1);

            if (this.config.image === 'boss_mochitsuki' && !this.defeated && !isWeakened) {
                if (!this.passiveFireTimer) this.passiveFireTimer = 0;
                this.passiveFireTimer += dt;
                if (this.passiveFireTimer > 2.0) { // 2秒間隔
                    this.fireProjectile(player);
                    this.passiveFireTimer = 0;
                }
            }

            // --- Dynamic Attack Selection (しくみ) ---
            const ai = this.config.ai;
            if (ai) {
                const interval = ai.attackInterval || 3.0;
                if (this.timer > interval) {
                    let pool = ai.attackPool;
                    if (ai.phases) {
                        const hpRatio = this.hp / this.maxHp;
                        const activePhase = ai.phases.find(p => {
                            if (p.hpRange) return hpRatio >= p.hpRange[0] && hpRatio <= p.hpRange[1];
                            return true;
                        }) || ai.phases[0];
                        pool = activePhase.attackPool;
                    }

                    if (pool && pool.length > 0) {
                        let selectedState = pool[0];
                        if (typeof pool[0] === 'object') {
                            const totalWeight = pool.reduce((sum, a) => sum + (a.weight || 0), 0);
                            let r = Math.random() * totalWeight;
                            for (const attack of pool) {
                                r -= (attack.weight || 0);
                                if (r <= 0) {
                                    selectedState = attack.state;
                                    break;
                                }
                            }
                        } else {
                            selectedState = pool[Math.floor(Math.random() * pool.length)];
                        }
                        this.state = selectedState;
                        this.timer = 0;
                    }
                }
            } else {
                // Default legacy behavior for bosses without AI config (Stage 1)
                if (this.timer % 1.5 < dt) this.fireProjectile(player);
                if (this.timer > 8.0) {
                    this.state = 'SPIN_PREP';
                    this.timer = 0;
                    this.spinSpeed = 0;
                    this.dashStarted = false;
                    this.hasRetreated = false;
                }
            }
        } else if (this.state === 'SPIN_PREP' || this.state === 'SPIN_DASH' || this.state === 'SPIN_OFFSCREEN' || this.state === 'SPIN_RECOVER') {
            this.handleMochitsukiSpin(dt, player, camera, screenWidth);
        } else if (this.state === 'WAIT' || this.state === 'ATTACK' || this.state === 'HURT') {
            // Move/Float during these transition states so boss doesn't freeze
            BossBehaviors['BATTLE_MOVE'](this, { dt, player, camera, screenWidth });
            if (this.state === 'ATTACK' && this.timer > 1.0) this.state = 'BATTLE';
            if (this.state === 'HURT' && this.timer > 0.5) this.state = 'BATTLE';
        } else if (this.state === 'DEAD') {
            let targetY = camera.y + 100;
            let idealX = camera.x + screenWidth * 0.5;
            this.x += (idealX - this.x) * (dt * 1.0);
            this.baseY += (targetY - this.baseY) * (dt * 1.0);
            this.y = this.baseY + Math.sin(Date.now() / 250) * 10;
        }

        // --- Common Effects ---
        this.updateEffects(env, dt);

        // --- ENFORCE SCREEN BOUNDS (Invisible Walls) ---
        this.enforceScreenBounds(camera, screenWidth);
    }

    enforceScreenBounds(camera, screenWidth) {
        // Only skip clamping for specific states that MUST go off-screen
        const offScreenAllowed = ['SPIN_DASH', 'SPIN_OFFSCREEN', 'SPIN_RECOVER', 'SYRINGE_DASH', 'TOY_STAMP'];
        if (offScreenAllowed.includes(this.state)) return;

        // Death sequence also should stay semi-visible
        // Let's keep them within screen padding
        const padding = 10; // Small padding
        const minX = camera.x + padding;
        const maxX = camera.x + screenWidth - this.width - padding;

        if (this.x < minX) this.x = minX;
        if (this.x > maxX) this.x = maxX;
    }

    // --- Mochitsuki Logic Refactored ---
    handleMochitsukiSpin(dt, player, camera, screenWidth) {
        if (this.state === 'SPIN_PREP') {
            // 1. 予備動作
            this.spinSpeed += dt * 30;
            this.rotation += this.spinSpeed * dt;

            // 画面右端付近の定位置をキープ（カメラに追従）
            const targetX = camera.x + screenWidth * 0.8;
            const targetY = player.y - 80;

            // 追従を強くしてスクロールに振り落とされないようにする
            this.x += (targetX - this.x) * (dt * 10.0);
            this.y += (targetY - this.y) * (dt * 5.0);

            if (this.timer > 1.5) {
                this.state = 'SPIN_DASH';
                this.timer = 0;
                if (player.game.audio && player.game.audio.playBoost) player.game.audio.playBoost();
            }
        } else if (this.state === 'SPIN_DASH') {
            // 2. 超高速左突進（プレイヤーを追い抜いて左外へ消える）
            this.rotation += this.spinSpeed * dt;

            // プレイヤーの進行方向と逆行するため、相対的に非常に速く見える
            // プレイヤーの速度 + 固定の突進速度
            const dashSpeed = 2500;
            this.x -= dashSpeed * dt;

            // 完全に画面外（左側）へ
            if (this.x + this.width < camera.x - 200) {
                this.state = 'SPIN_OFFSCREEN';
                this.timer = 0;
            }
        } else if (this.state === 'SPIN_OFFSCREEN') {
            // 3. 画面外で追い越し準備
            this.rotation += this.spinSpeed * dt;

            // しばらく待ってから右端（前方）から出現させる
            if (this.timer > 0.8) {
                this.state = 'SPIN_RECOVER';
                this.timer = 0;
                // カメラの右端外側にワープ
                this.x = camera.x + screenWidth + 400;
                this.y = camera.y - 300; // 画面上部から帰還
                this.isReturning = true; // 当たり判定・ダメージなし
            }
        } else if (this.state === 'SPIN_RECOVER') {
            // 4. 前方から安全に帰還（半透明・上空）
            this.spinSpeed *= Math.pow(0.9, dt * 60);
            this.rotation += this.spinSpeed * dt;

            // 再び右側の定位置へ
            const targetX = camera.x + screenWidth * 0.8;
            const targetY = this.baseY;

            // スムーズに合流
            this.x += (targetX - this.x) * (dt * 2.0);
            this.y += (targetY - this.y) * (dt * 2.0);

            if (this.timer > 1.5) {
                this.state = 'BATTLE';
                this.timer = 0;
                this.rotation = 0;
                this.spinSpeed = 0;
                this.isReturning = false;
            }
        }
    }

    // --- Sister Logic ---


    updateShadowFloor(dt, player, env, camera) {
        if (this.floorHazard.warning || this.floorHazard.active) {
            this.floorHazard.timer -= dt;

            // Transition from Warning to Active
            if (this.floorHazard.warning) {
                // Lock Camera Y when warning starts
                if (camera.lockY === null) camera.lockY = camera.y;

                if (this.floorHazard.timer <= 0) {
                    this.floorHazard.warning = false;
                    this.floorHazard.active = true;
                    this.floorHazard.timer = 2.0; // Burst duration (spikes stay for 2s)

                    // Play eruption sound if possible
                    if (player.game && player.game.audio) {
                        player.game.audio.playBossImpact();
                    }
                }
            }

            if (this.floorHazard.active) {
                // Logic: Hit player if they are in the bottom 300px zone during eruption
                const screenH = camera.height || 600;
                const screenBottomY = camera.y + screenH;
                const hazardHeight = 300; // Increased height to reach higher

                const playerBottom = player.y + player.height;

                // Check if player is near the ground level (swamp level)
                // Use a threshold relative to camera bottom
                if (playerBottom > screenBottomY - hazardHeight) {
                    // Continuous Damage (Poison) - No knockback
                    if (!this.floorHazard.damageTimer) this.floorHazard.damageTimer = 0;
                    this.floorHazard.damageTimer -= dt;

                    if (this.floorHazard.damageTimer <= 0) {
                        player.game.takeDamage(this); // Normal damage (knocks back)
                        this.floorHazard.damageTimer = 0.5;

                        // Impact particles
                        if (env) {
                            for (let i = 0; i < 5; i++) {
                                env.particles.push({
                                    x: player.x + Math.random() * player.width,
                                    y: player.y + player.height,
                                    vx: (Math.random() - 0.5) * 200, vy: -300, life: 0.5, size: 10, color: '#8e44ad'
                                });
                            }
                        }
                    }
                }
            }

            if (this.floorHazard.active && this.floorHazard.timer <= 0) {
                this.floorHazard.active = false;
                // Unlock Camera
                if (camera.lockY !== null) camera.lockY = null;
            }
        }
    }

    updateDarkWaves(dt, player, env) {
        for (let i = this.waves.length - 1; i >= 0; i--) {
            const w = this.waves[i];
            w.x += w.vx * dt;
            w.life -= dt;

            // Ani
            w.anim += dt * 10;

            // Coll
            if (
                player.x < w.x + w.width &&
                player.x + player.width > w.x &&
                player.y < w.y + w.height &&
                player.y + player.height > w.y
            ) {
                // --- SAFEGUARD: Explicitly check Attack Type ---
                if (w.type === 'JUDGMENT_RAY') {
                    // STAGE 5: Vertical Ray - Avoid by Jumping
                    if (player.grounded) {
                        player.game.takeDamage(this, 0.2, true);
                        this._spawnZapEffect(env, player);
                    }
                } else if (w.type === 'SISTER_WAVE') {
                    // STAGE 2: Horizontal Wave - Hit touches hitbox
                    player.game.takeDamage(this, 0.2, true);
                    this._spawnZapEffect(env, player);
                } else if (w.isLaser) {
                    // Fallback for legacy "isLaser" if any
                    player.game.takeDamage(this, 0.2, true);
                } else {
                    // Standard Projectile-like Wave (destroys on impact)
                    player.game.takeDamage(this);
                    this.waves.splice(i, 1);
                    continue;
                }
            }

            if (w.life <= 0) this.waves.splice(i, 1);
        }
    }

    _spawnZapEffect(env, player) {
        if (env && Math.random() < 0.3) {
            env.particles.push({
                x: player.x + Math.random() * player.width,
                y: player.y + Math.random() * player.height,
                vx: (Math.random() - 0.5) * 5,
                vy: (Math.random() - 0.5) * 5,
                life: 15, size: 5, color: '#fff'
            });
        }
    }

    fireDarkWaves(camera, screenWidth) {
        // Horizontal Eraser: Single thick laser at Mid or Top height
        const screenH = camera.height || 600;

        // Randomly pick Mid or Top ratio
        const isTop = Math.random() < 0.5;
        const ratio = isTop ? 0.35 : 0.65; // Top or Mid
        const waveY = camera.y + screenH * ratio;

        this.waves.push({
            x: this.x,
            y: waveY - 50, // Center the thick laser (height around 100)
            vx: -800, // Faster laser
            vy: 0,
            width: 400, // Very long
            height: 100, // Thick laser
            life: 3.0,
            anim: 0,
            type: 'SISTER_WAVE'
        });
    }


    updateProjectiles(dt) {
        this.projectiles.forEach((proj, index) => {
            proj.x += proj.vx * dt;
            proj.y += proj.vy * dt;
            proj.life -= dt;
            if (proj.life <= 0) this.projectiles.splice(index, 1);
        });
    }

    checkProjectileCollisions(player, env) {
        // Standard Projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            const dist = Math.hypot((p.x) - (player.x + player.width / 2), (p.y) - (player.y + player.height / 2));
            if (dist < p.size + player.width / 2) {
                player.game.takeDamage(this);
                this.projectiles.splice(i, 1);
                // Effect
                env.particles.push({
                    x: p.x, y: p.y, life: 20, size: 30, color: '#fff', fade: true
                });
            }
        }
    }

    updateEffects(env, dt) {
        if (!this.isInvulnerable && !this.defeated && env) {
            // Convert per-frame 0.25 chance @ 60fps to time-based probability
            // (1 - (1-0.25)^(1/60)) * 60 approx 15 particles per second
            if (Math.random() < 15 * dt) {
                const isSmoke = Math.random() < 0.4;
                env.particles.push({
                    x: this.x + Math.random() * this.width,
                    y: this.y + Math.random() * this.height,
                    vx: (Math.random() - 0.5) * 4,
                    vy: -Math.random() * 5 - 2,
                    life: 40 + Math.random() * 30,
                    size: isSmoke ? 10 + Math.random() * 15 : 4 + Math.random() * 3,
                    color: isSmoke ? 'rgba(70, 70, 70, 0.5)' : '#f1c40f',
                    glow: !isSmoke,
                    fade: true,
                    gravity: isSmoke ? -0.1 : 0.3
                });
            }
        }
    }

    fireProjectile(player) {
        const scale = this.tileSize / 64;
        const speed = 450 * scale; // Slightly faster for better threat

        // Use centers for accurate aiming
        const startX = this.x + this.width / 2;
        const startY = this.y + this.height / 2;
        const targetX = player.x + player.width / 2;
        const targetY = player.y + player.height / 2;

        const baseAngle = Math.atan2(targetY - startY, targetX - startX);
        const spread = Math.PI / 8; // Narrower spread (was PI/2)
        const angle = baseAngle + (Math.random() - 0.5) * spread;
        this.projectiles.push({
            x: this.x + this.width / 2,
            y: this.y + this.height / 2,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 5,
            size: 40 * scale,
            seed: Math.random() * 10
        });
    }

    takeDamage() {
        if (this.state === 'HURT' || this.defeated) return false;
        if (this.state === 'SPIN_PREP' || this.state === 'SPIN_DASH' || this.state === 'SPIN_RECOVER') return false;

        // Stage 1 (Mochitsuki) logic
        const isStandard = !this.isSister() && !this.isToyKing() && !this.isNurse() && !this.isGod();
        // if (isStandard && !this.hasRetreated) return false; // REMOVED: Stage 1 boss doesn't use retreat logic

        // Stage 2/3 (Barrier) logic
        // If they have a shield (isInvulnerable), they can't take HP damage directly
        if (this.isInvulnerable) return false;

        this.hp--;
        this.state = 'HURT';
        this.timer = 0;

        if (this.hp <= 0) {
            this.defeated = true;
            this.state = 'DEAD';
            this.projectiles = []; // Clear projectiles on defeat
            this.waves = []; // Clear waves
            this.floorHazard.active = false;
        }
        return true;
    }

    draw(ctx, assets, camera) {
        if (this.defeated) return;

        const gx = Math.floor(this.x - camera.x);
        const gy = Math.floor(this.y - camera.y);

        // --- Sister: Draw Floor Hazard ---
        if (this.isSister()) {
            this.drawShadowFloor(ctx, camera);
            this.drawDarkWaves(ctx, camera);
        }

        if (this.isToyKing()) {
            this.drawToyPresents(ctx, assets, camera);
        }
        if (this.isNurse()) {
            this.drawNurseHazards(ctx, assets, camera);
        }
        if (this.isGod()) {
            this.drawDarkWaves(ctx, camera);
            this.drawGodAttacks(ctx, camera);
        }

        ctx.save();
        ctx.translate(gx + this.width / 2, gy + this.height / 2);

        if (this.state === 'HURT') {
            ctx.translate(Math.random() * 10 - 5, Math.random() * 10 - 5);
        }
        if (this.rotation !== 0) ctx.rotate(this.rotation);

        let bossImgKey = this.config.image || 'boss_mochitsuki';
        // Only show weak image if barrier is broken
        if (!this.isInvulnerable && this.config.imageWeak) {
            bossImgKey = this.config.imageWeak;
        }

        const bossImg = assets.getImage(bossImgKey) || assets.getImage('boss_mochitsuki');

        if (bossImg) {
            const isSpinning = this.state === 'SPIN_PREP' || this.state === 'SPIN_DASH';
            const isHurt = this.state === 'HURT';
            const isReturning = this.isReturning;

            if (isSpinning) {
                const pulse = Math.sin(Date.now() / 50) * 0.2 + 0.8;
                ctx.beginPath();
                ctx.strokeStyle = `rgba(255, 71, 87, ${0.4 * pulse})`;
                ctx.lineWidth = 15;
                ctx.arc(0, 0, this.width * 0.55, this.timer * 10, this.timer * 10 + Math.PI * 0.5);
                ctx.stroke();
            }

            if (isHurt) {
                ctx.globalAlpha = Math.floor(Date.now() / 50) % 2 === 0 ? 0.3 : 0.8;
            }

            // White rim effect for Sister Boss (Stage 2)
            if (this.isSister()) {
                ctx.shadowColor = 'white';
                ctx.shadowBlur = 10; // Creates a white glow/rim around the sprite
            }

            ctx.drawImage(bossImg, -this.width / 2 | 0, -this.height / 2 | 0, this.width | 0, this.height | 0);

            ctx.globalAlpha = 1.0;
        }
        ctx.restore();

        // 2. Overlays
        ctx.save();
        if (this.isInvulnerable) {
            ctx.strokeStyle = this.isSister() ? 'rgba(155, 89, 182, 0.6)' : 'rgba(79, 172, 254, 0.6)'; // Purple for sister
            ctx.lineWidth = 15;
            ctx.beginPath();
            ctx.arc(gx + this.width / 2, gy + this.height / 2, this.width * 0.6, 0, Math.PI * 2);
            ctx.stroke();
        }

        // HP Bar
        const barW = this.width;
        const barH = 12;
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(gx, gy - 30, barW, barH);
        ctx.fillStyle = '#ff4757';
        ctx.fillRect(gx, gy - 30, barW * (this.hp / this.maxHp), barH);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(gx, gy - 30, barW, barH);

        // Name
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 4;
        ctx.font = 'bold 22px sans-serif';
        ctx.textAlign = 'center';
        const bossName = this.config.name || "月の守護者：モチツキ・タイタン";
        ctx.strokeText(bossName, gx + this.width / 2, gy - 40);
        ctx.fillText(bossName, gx + this.width / 2, gy - 40);
        ctx.restore();

        // 3. Projectiles
        for (let i = 0; i < this.projectiles.length; i++) {
            // ... existing projectile draw
            const proj = this.projectiles[i];
            const px = (proj.x - camera.x) | 0;
            const py = (proj.y - camera.y) | 0;
            const pulse = (Math.sin(Date.now() / 50 + proj.seed) * 0.3 + 0.7);
            const baseSize = proj.size;

            ctx.save();
            ctx.shadowColor = '#00d2ff';
            ctx.shadowBlur = 15 * pulse;
            ctx.globalAlpha = 0.6 * pulse;
            ctx.fillStyle = '#4facfe';
            ctx.beginPath();
            ctx.arc(px, py, baseSize * 1.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1.0;
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(px, py, baseSize * 0.6, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    drawShadowFloor(ctx, camera) {
        if (this.floorHazard.warning || this.floorHazard.active) {
            const screenH = camera.height || 600;
            const screenW = camera.width || 800;
            const time = Date.now();

            if (this.floorHazard.warning) {
                // --- RICH WARNING PHASE ---
                // Background Pulse
                const pulse = Math.sin(time / 100) * 0.5 + 0.5;
                const hazardH = 300; // Match the actual hazard height (increased from 150)
                const grad = ctx.createLinearGradient(0, screenH - hazardH, 0, screenH);
                grad.addColorStop(0, 'rgba(155, 89, 182, 0)');
                grad.addColorStop(1, `rgba(155, 89, 182, ${0.2 + pulse * 0.3})`);
                ctx.fillStyle = grad;
                ctx.fillRect(0, screenH - hazardH, screenW, hazardH);

                // Flickering Caution Tape Bar
                const isFlash = Math.floor(time / 150) % 2 === 0;
                ctx.fillStyle = isFlash ? '#ff4757' : '#8e44ad';
                ctx.fillRect(0, screenH - 5, screenW, 5); // Bottom line

                // Top Hazard Limit Line (Visualizing the max spike height)
                const limitY = screenH - 300;
                ctx.fillRect(0, limitY, screenW, 4);

                // Arrows pointing down from limit line
                if (isFlash) {
                    ctx.beginPath();
                    for (let ax = 0; ax < screenW; ax += 100) {
                        ctx.moveTo(ax, limitY);
                        ctx.lineTo(ax + 10, limitY + 10);
                        ctx.lineTo(ax + 20, limitY);
                    }
                    ctx.fillStyle = '#ff4757';
                    ctx.fill();
                }

                // Text with Shadow Bloom (Aligned with Warning Line)
                ctx.save();
                ctx.shadowColor = isFlash ? '#ff4757' : '#8e44ad';
                ctx.shadowBlur = 15;
                ctx.fillStyle = '#fff';
                ctx.font = '900 40px sans-serif';
                ctx.textAlign = 'center';
                // Place text just below the limit line
                ctx.fillText("⚠️ DANGER ⚠️", screenW / 2, limitY + 50);

                ctx.font = 'bold 18px sans-serif';
                ctx.fillStyle = isFlash ? '#fff' : '#ffcccc';
                ctx.fillText("HAZARD BOUNDARY", screenW / 2, limitY + 80);
                ctx.restore();
            } else if (this.floorHazard.active) {
                // --- RICH ACTIVE PHASE (TRIPLE LAYER SPIKES) ---
                const baseH = 300; // Max height

                // 1. BACK LAYER (Deep Indigo - Slow & Short)
                this._drawSpikeLayer(ctx, screenW, screenH, baseH * 0.6, '#4b0082', time / 200, 80, 0.4);

                // 2. MIDDLE LAYER (Slate Blue - Medium & Sharp)
                this._drawSpikeLayer(ctx, screenW, screenH, baseH * 0.8, '#2c3e50', time / 150, 60, 0.7);

                // 3. FRONT LAYER (Glowing Abyssal - Fast & Tall)
                ctx.save();
                ctx.shadowColor = '#8e44ad';
                ctx.shadowBlur = 20;
                this._drawSpikeLayer(ctx, screenW, screenH, baseH, '#1a1a1a', time / 100, 40, 1.0, true);
                ctx.restore();

                // 4. MIST AT BASE
                const mistGrad = ctx.createLinearGradient(0, screenH - 80, 0, screenH);
                mistGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
                mistGrad.addColorStop(1, 'rgba(44, 62, 80, 0.8)');
                ctx.fillStyle = mistGrad;
                ctx.fillRect(0, screenH - 80, screenW, 80);
            }
        }
    }

    // Helper for rendering a single layer of procedural spikes
    _drawSpikeLayer(ctx, w, h, maxH, color, time, spikeW, alpha, withHighlights = false) {
        ctx.globalAlpha = alpha;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(0, h);

        for (let x = 0; x <= w + spikeW; x += spikeW) {
            // Procedural variation for organic look
            const seed = (x * 0.73) % 100;
            const hVar = Math.sin(time + x * 0.02) * 30 + Math.cos(time * 0.5 + seed) * 20;
            const currentH = maxH + hVar;

            ctx.lineTo(x, h - currentH);
            ctx.lineTo(x + spikeW / 2, h);
        }
        ctx.closePath();
        ctx.fill();

        if (withHighlights) {
            // Draw glowing tips for the front layer
            ctx.strokeStyle = '#9b59b6';
            ctx.lineWidth = 3;
            ctx.globalAlpha = 0.8;
            ctx.stroke();
        }
        ctx.globalAlpha = 1.0;
    }

    drawDarkWaves(ctx, camera) {
        this.waves.forEach(w => {
            const wx = w.x - camera.x;
            const wy = w.y - camera.y;

            ctx.save();

            const isLaserType = w.isLaser || w.type === 'SISTER_WAVE' || w.type === 'JUDGMENT_RAY';

            if (isLaserType) {
                const pulse = Math.sin(Date.now() / 50) * 0.15 + 0.85;
                const time = Date.now() / 1000;
                const isVertical = w.height > w.width;

                // 1. Wide Outer Glow
                ctx.shadowColor = '#9b59b6';
                ctx.shadowBlur = 30 * pulse;
                ctx.globalAlpha = 0.3 * pulse;
                ctx.fillStyle = '#8e44ad';

                if (isVertical) {
                    ctx.fillRect(wx - 10, wy, w.width + 20, w.height);
                } else {
                    ctx.fillRect(wx, wy - 10, w.width, w.height + 20);
                }

                // 2. Main Beam Gradient
                const grad = isVertical
                    ? ctx.createLinearGradient(wx, wy, wx + w.width, wy) // Vertical beam gradient (left to right)
                    : ctx.createLinearGradient(wx, wy, wx, wy + w.height); // Horizontal beam gradient (top to bottom)

                grad.addColorStop(0, 'rgba(155, 89, 182, 0)');
                grad.addColorStop(0.2, 'rgba(155, 89, 182, 0.8)');
                grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.9)');
                grad.addColorStop(0.8, 'rgba(155, 89, 182, 0.8)');
                grad.addColorStop(1, 'rgba(155, 89, 182, 0)');

                ctx.globalAlpha = 1.0;
                ctx.shadowBlur = 0;
                ctx.fillStyle = grad;
                ctx.fillRect(wx, wy, w.width, w.height);

                // 3. Central "Hot" Core (Electric White)
                ctx.fillStyle = '#fff';
                ctx.globalAlpha = 0.6 + Math.random() * 0.2;
                if (isVertical) {
                    ctx.fillRect(wx + w.width * 0.42, wy, w.width * 0.16, w.height);
                } else {
                    ctx.fillRect(wx, wy + w.height * 0.42, w.width, w.height * 0.16);
                }

                // 4. Energy Streaks (moving lines)
                ctx.strokeStyle = '#d6a2e8';
                ctx.lineWidth = 2;
                ctx.globalAlpha = 0.4;
                for (let i = 0; i < 3; i++) {
                    const offset = (time * 2000 + i * 100) % 200;
                    ctx.setLineDash([20, 40]);
                    ctx.lineDashOffset = -offset;
                    ctx.beginPath();

                    if (isVertical) {
                        const lineX = wx + (w.width * (0.2 + i * 0.3));
                        ctx.moveTo(lineX, wy);
                        ctx.lineTo(lineX, wy + w.height);
                    } else {
                        const lineY = wy + (w.height * (0.2 + i * 0.3));
                        ctx.moveTo(wx, lineY);
                        ctx.lineTo(wx + w.width, lineY);
                    }
                    ctx.stroke();
                }
                ctx.setLineDash([]); // Reset

                // 5. Scrolling Energy Particles (Diamonds)
                ctx.globalAlpha = 0.8;
                for (let i = 0; i < 8; i++) {
                    let px, py;
                    if (isVertical) {
                        px = wx + (Math.sin(time * 10 + i) * (w.width * 0.3)) + w.width / 2;
                        py = wy + ((time * 1500 + i * 200) % (w.height + 100));
                    } else {
                        px = wx + ((time * 1500 + i * 200) % (w.width + 100));
                        py = wy + (Math.sin(time * 10 + i) * (w.height * 0.3)) + w.height / 2;
                    }

                    const size = 6 + Math.sin(time * 5 + i) * 3;

                    ctx.save();
                    ctx.translate(px, py);
                    ctx.rotate(Math.PI / 4 + time * 5);
                    ctx.fillStyle = '#fff';
                    ctx.fillRect(-size / 2, -size / 2, size, size);
                    ctx.restore();
                }
            } else {
                // Classic Wave (Fallback)
                ctx.translate(wx + w.width / 2, wy + w.height / 2);
                ctx.fillStyle = '#9b59b6';
                ctx.shadowColor = '#8e44ad';
                ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.arc(0, 0, w.height / 2, Math.PI / 2, Math.PI * 1.5);
                ctx.fill();
            }

            ctx.restore();
        });
    }

    updateToyPresents(dt, player, env) {
        const camera = player.game.camera;
        for (let i = this.toyPresents.length - 1; i >= 0; i--) {
            const p = this.toyPresents[i];

            p.life -= dt;
            // Warning Timer (Decrease always so it can go negative for persistence)
            p.warning -= dt;

            // Movement Block
            if (p.warning > 0) {
                // In most stages, block movement during warning
                // (Note: If we want Stage 3 to have NO static delay, we move here)
                continue;
            }

            // Movement logic
            if (p.isStuck) {
                p.stuckTimer -= dt;
                if (p.stuckTimer <= 0) p.life = 0;
            } else if (p.type === 'stuck_needle') {
                p.y += (p.vy || 0) * dt;
                const groundY = camera.y + 540 - p.height;
                if (p.y >= groundY) {
                    p.y = groundY;
                    p.isStuck = true;
                    if (player.game.audio) player.game.audio.playLand();
                }
            } else if (p.type === 'bounce_ball') {
                p.vy += p.gravity * dt;
                p.x += p.vx * dt;
                p.y += p.vy * dt;

                const groundY = (camera.y + (camera.height || 600) - p.height);
                if (p.y > groundY) {
                    p.y = groundY;
                    const oldVy = Math.abs(p.vy);
                    p.vy = -oldVy * p.bounce;

                    // Only play sound if the impact is significant to avoid "machine gun" sound on settle
                    if (player.game.audio && oldVy > 200) {
                        player.game.audio.playLand();
                    }
                }
            } else {
                p.x += (p.vx || 0) * dt;
                p.y += (p.vy || 0) * dt;
            }

            // Collision with player (Check ALL presents, not just stuck ones)
            if (
                player.x < p.x + p.width &&
                player.x + player.width > p.x &&
                player.y < p.y + p.height &&
                player.y + player.height > p.y
            ) {
                player.game.takeDamage(this);
                this.toyPresents.splice(i, 1);
                continue;
            }

            if (p.life <= 0) this.toyPresents.splice(i, 1);
        }
    }

    drawToyPresents(ctx, assets, camera) {
        this.toyPresents.forEach(p => {
            const px = p.x - camera.x;
            const py = p.y - camera.y;

            // --- ENHANCED WARNING: TOY MARCH / VACCINE RAIN ---
            // For Stage 3 'march', we keep drawing the warning until it's well into the screen
            const isMarch = p.type === 'march';
            if (p.warning > (isMarch ? -1.0 : 0)) {
                const alpha = Math.sin(Date.now() / 50) * 0.3 + 0.6;
                ctx.save();
                const isVertical = Math.abs(p.vx || 0) < 1;

                if (isVertical) {
                    // Vertical Warning (Vaccine Rain etc)
                    // 1. Dark background bar for contrast
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                    ctx.fillRect(px - 10, 0, p.width + 20, camera.height);

                    // 2. Glowing Beam
                    const beamGrad = ctx.createLinearGradient(px, 0, px + p.width, 0);
                    beamGrad.addColorStop(0, `rgba(255, 0, 0, 0)`);
                    beamGrad.addColorStop(0.5, `rgba(255, 0, 0, ${alpha * 0.7})`);
                    beamGrad.addColorStop(1, `rgba(255, 0, 0, 0)`);
                    ctx.fillStyle = beamGrad;
                    ctx.fillRect(px, 0, p.width, camera.height);

                    // 3. Central Dotted Line
                    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
                    ctx.lineWidth = 6;
                    ctx.setLineDash([40, 30]);
                    ctx.beginPath();
                    ctx.moveTo(px + p.width / 2, 0);
                    ctx.lineTo(px + p.width / 2, camera.height);
                    ctx.stroke();

                    // 4. Large Icon
                    ctx.fillStyle = '#fff';
                    ctx.shadowColor = '#ff3838'; ctx.shadowBlur = 15;
                    ctx.font = '900 40px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText("⚠️", px + p.width / 2, 60 + alpha * 15);
                    ctx.font = '900 20px sans-serif';
                    ctx.fillText("CAUTION", px + p.width / 2, 100 + alpha * 15);
                } else {
                    // Horizontal Warning (Toy March)
                    // 1. Dark background bar for contrast
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
                    ctx.fillRect(0, py - 5, camera.width, p.height + 10);

                    // 2. High Vis Flash
                    const beamGrad = ctx.createLinearGradient(0, py, 0, py + p.height);
                    beamGrad.addColorStop(0, `rgba(255, 56, 56, 0.1)`);
                    beamGrad.addColorStop(0.5, `rgba(255, 56, 56, ${alpha * 0.6})`);
                    beamGrad.addColorStop(1, `rgba(255, 56, 56, 0.1)`);
                    ctx.fillStyle = beamGrad;
                    ctx.fillRect(0, py, camera.width, p.height);

                    // 3. Warning Strip Border
                    ctx.strokeStyle = `rgba(255, 255, 0, ${alpha * 0.8})`;
                    ctx.lineWidth = 4;
                    ctx.setLineDash([50, 20]);
                    ctx.strokeRect(0, py, camera.width, p.height);

                    // 4. Text & Icons
                    ctx.fillStyle = '#fff';
                    ctx.shadowColor = '#ff0000'; ctx.shadowBlur = 20;
                    ctx.font = '900 32px sans-serif';
                    ctx.textAlign = 'center';

                    const textY = py + p.height / 2 + 10;
                    const flash = Math.floor(Date.now() / 200) % 2 === 0;

                    if (flash) {
                        ctx.fillStyle = '#fff';
                        ctx.fillText("⚠️   DANGER: INCOMING OBJECT   ⚠️", camera.width / 2, textY);
                    } else {
                        ctx.fillStyle = '#ff4757';
                        ctx.fillText("⚠️   DANGER: INCOMING OBJECT   ⚠️", camera.width / 2, textY);
                    }
                }
                ctx.restore();
                if (!isMarch) return;
            }

            if (p.type === 'stuck_needle') {
                // --- ENHANCED RED SYRINGE (VACCINE RAIN) ---
                ctx.save();
                ctx.translate(px + p.width / 2, py + p.height / 2);

                // Subtle pulse
                const pulse = Math.sin(Date.now() / 100) * 0.05 + 1.0;
                ctx.scale(pulse, pulse);

                // 1. Strong Red Shadow/Glow for Visibility
                ctx.shadowBlur = 25;
                ctx.shadowColor = 'rgba(255, 71, 87, 0.9)';

                // 2. Syringe Body (Glass tube)
                ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
                ctx.strokeStyle = '#1e272e'; // Darker stroke
                ctx.lineWidth = 3;
                const bodyW = p.width * 0.8;
                const bodyH = p.height * 0.7;
                ctx.fillRect(-bodyW / 2, -bodyH / 2, bodyW, bodyH);
                ctx.strokeRect(-bodyW / 2, -bodyH / 2, bodyW, bodyH);

                // 3. Liquid (Deep Red)
                const liquidLevel = 0.65 + Math.sin(Date.now() / 250) * 0.05;
                ctx.fillStyle = '#ff4757';
                ctx.fillRect(-bodyW / 2 + 3, bodyH / 2 - (bodyH * liquidLevel), bodyW - 6, bodyH * liquidLevel - 3);

                // Highlight for gloss
                ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                ctx.fillRect(-bodyW / 2 + 5, bodyH / 2 - (bodyH * liquidLevel) + 5, 5, bodyH * liquidLevel - 10);

                // 4. Plunger (Dark Gray)
                ctx.fillStyle = '#2f3542';
                ctx.fillRect(-bodyW * 0.45, -bodyH / 2 - 18, bodyW * 0.9, 18);
                ctx.fillRect(-3, -bodyH / 2 - 18, 6, 18);

                // 5. Needle (Steel texture)
                ctx.strokeStyle = '#57606f';
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.moveTo(0, bodyH / 2);
                ctx.lineTo(0, p.height / 2 + 25);
                ctx.stroke();

                // 6. Core Danger Glow
                ctx.globalAlpha = 0.8;
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(0, 0, 6, 0, Math.PI * 2);
                ctx.fill();

                ctx.restore();
            }
            else if (p.type === 'needle') {
                // ... Nurse needle logic (Original fallback) ...
                ctx.save();
                ctx.fillStyle = '#dfe4ea';
                ctx.fillRect(px, py, p.width, p.height);
                ctx.fillStyle = 'rgba(112, 161, 255, 0.5)';
                ctx.fillRect(px + 2, py + p.height * 0.3, p.width - 4, p.height * 0.6);
                ctx.strokeStyle = '#2f3542'; ctx.lineWidth = 2;
                ctx.strokeRect(px, py, p.width, p.height);
                ctx.beginPath();
                ctx.moveTo(px + p.width / 2, py + p.height);
                ctx.lineTo(px + p.width / 2, py + p.height + 20);
                ctx.stroke();
                ctx.restore();

            } else if (p.type === 'bounce_ball') {
                // --- 2. ENHANCED BOUNCING BALL ---
                ctx.save();
                const time = Date.now();

                // Motion Glow / Trail
                const pulse = Math.sin(time / 100) * 0.2 + 0.8;
                ctx.shadowBlur = 30 * pulse;
                ctx.shadowColor = '#f1c40f';

                // Draw trailing ghost balls (visual only)
                for (let i = 1; i <= 3; i++) {
                    ctx.globalAlpha = 0.2 / i;
                    ctx.beginPath();
                    ctx.arc(px + p.width / 2 - (p.vx * 0.02 * i), py + p.height / 2 - (p.vy * 0.02 * i), (p.width / 2) * (1 - i * 0.1), 0, Math.PI * 2);
                    ctx.fillStyle = '#f39c12';
                    ctx.fill();
                }

                ctx.globalAlpha = 1.0;
                ctx.translate(px + p.width / 2, py + p.height / 2);
                ctx.rotate(time / 150); // Fast spinning for energy

                // Gradient Ball
                const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, p.width / 2);
                grad.addColorStop(0, '#fff'); // White hot core
                grad.addColorStop(0.3, '#f1c40f');
                grad.addColorStop(1, '#d35400');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(0, 0, p.width / 2, 0, Math.PI * 2);
                ctx.fill();

                // White Stripe
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 12;
                ctx.beginPath();
                ctx.moveTo(-p.width / 2, 0);
                ctx.lineTo(p.width / 2, 0);
                ctx.stroke();

                ctx.restore();
            } else {
                // Default Marching Block
                const img = assets.getImage('crate');
                if (img) {
                    ctx.save();
                    // Pulse or outline if march?
                    if (p.type === 'march') {
                        ctx.shadowBlur = 15;
                        ctx.shadowColor = '#ff4757';
                    }
                    ctx.drawImage(img, px, py, p.width, p.height);
                    ctx.restore();
                } else {
                    ctx.fillStyle = '#eb4d4b';
                    ctx.fillRect(px, py, p.width, p.height);
                }
            }
        });
    }

    updateNurseHazards(dt, player, env) {
        // Shared logic with updateToyPresents since they use the same array
        this.updateToyPresents(dt, player, env);
    }

    updatePills(dt, player, env, camera) {
        for (let i = this.pills.length - 1; i >= 0; i--) {
            const p = this.pills[i];

            p.life -= dt;
            p.x += (p.vx || 0) * dt;
            p.y += (p.vy || 0) * dt;

            if (!p.noGravity) {
                p.vy += 1200 * dt;
                const groundY = (camera.y + (camera.height || 600)) - 40;
                if (p.y > groundY) {
                    p.y = groundY;
                    p.vy = -Math.abs(p.vy) * 0.7;
                }
            }

            // Hit Player
            const dist = Math.hypot((p.x) - (player.x + player.width / 2), (p.y) - (player.y + player.height / 2));
            if (dist < p.width) {
                player.game.takeDamage(this);
                this.pills.splice(i, 1);
                continue;
            }

            if (p.life <= 0) this.pills.splice(i, 1);
        }
    }

    updateVitalLasers(dt, player, env, camera, screenWidth) {
        for (let i = this.vitalLasers.length - 1; i >= 0; i--) {
            const v = this.vitalLasers[i];
            v.life -= dt;

            // Warmup transition is handled here for simplicity if not in draw
            if (v.isWarmup) {
                v.warmupTimer -= dt;
                if (v.warmupTimer <= 0) v.isWarmup = false;
            }

            // Hit Timer Update (Cooldown for multi-hit)
            if (v.hitTimer > 0) v.hitTimer -= dt;

            // Only collide if active
            if (!v.isWarmup) {
                if (
                    player.x < v.x + v.width &&
                    player.x + player.width > v.x &&
                    player.y < v.y + v.height &&
                    player.y + player.height > v.y
                ) {
                    // Multihit damage for lasers (Continuous rapid fire)
                    if (v.hitTimer <= 0) {
                        const dmg = v.damageMult || 1.0;
                        player.game.takeDamage(this, 0, true, dmg); // Cooldown 0 for continuous hit
                        v.hitTimer = 0.08; // ~12 hits per second (da-da-da-da-da!)
                    }
                }
            }

            if (v.life <= 0) this.vitalLasers.splice(i, 1);
        }
    }

    updateScalpelDash(dt, player, camera, screenWidth) {
        if (this.scalpelDash.active) {
            const hitboxH = this.height * 0.6;
            const hitboxY = this.y + (this.height - hitboxH) / 2;

            if (
                player.x < this.x + this.width &&
                player.x + player.width > this.x &&
                player.y < hitboxY + hitboxH &&
                player.y + player.height > hitboxY
            ) {
                player.game.takeDamage(this);
            }
        }
    }

    fireVitalLaser(ratio, camera, screenWidth, damageMult = 1.0) {
        const screenH = camera.height || 600;
        const yPos = camera.y + screenH * ratio;

        this.vitalLasers.push({
            x: camera.x,
            y: yPos - 10,
            width: screenWidth,
            height: 20,
            life: 1.0, // Increased from 0.8
            isWarmup: true,
            warmupTimer: 0.6, // Increased from 0.3
            damageMult: damageMult,
            hitTimer: 0 // Initialize hit timer
        });
    }

    drawNurseHazards(ctx, assets, camera) {
        // Pills
        this.pills.forEach(p => {
            const px = p.x - camera.x;
            const py = p.y - camera.y;
            ctx.save();
            ctx.translate(px, py);
            ctx.rotate(Date.now() / 200);

            // High visibility glow
            ctx.shadowBlur = 20;
            ctx.shadowColor = p.color;

            // Main Pill Body
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(0, 0, p.width / 2, 0, Math.PI * 2);
            ctx.fill();

            // White half
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(0, 0, p.width / 2, Math.PI, 0);
            ctx.fill();

            // Outline for contrast against ANY background
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, p.width / 2, 0, Math.PI * 2);
            ctx.stroke();

            // Center line
            ctx.beginPath();
            ctx.moveTo(-p.width / 2, 0);
            ctx.lineTo(p.width / 2, 0);
            ctx.stroke();

            // Glare/Reflection
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.beginPath();
            ctx.arc(-p.width * 0.1, -p.width * 0.1, p.width * 0.15, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        });

        // Vital Lasers
        this.vitalLasers.forEach(v => {
            const vy = v.y - camera.y;
            ctx.save();
            if (v.isWarmup) {
                const alpha = Math.sin(Date.now() / 50) * 0.2 + 0.4;
                // 1. Area Highlight (Transparent zone for the hit area)
                ctx.fillStyle = `rgba(255, 71, 87, ${alpha * 0.4})`;
                ctx.fillRect(0, vy, camera.width, v.height);

                // 2. Animated Warning Line
                ctx.strokeStyle = '#ff4757';
                ctx.lineWidth = 3;
                ctx.setLineDash([20, 15]);
                ctx.lineDashOffset = -(Date.now() / 15) % 35;
                ctx.beginPath();
                ctx.moveTo(0, vy + v.height / 2);
                ctx.lineTo(camera.width, vy + v.height / 2);
                ctx.stroke();

                // 3. Danger Icon at screen edge
                ctx.fillStyle = '#fff';
                ctx.font = '900 16px sans-serif';
                ctx.textAlign = 'left';
                ctx.shadowColor = '#ff4757';
                ctx.shadowBlur = 10;
                ctx.fillText("⚠️ DANGER", 15, vy + v.height / 2 + 6);
            }
            else {
                ctx.fillStyle = 'rgba(255, 71, 87, 0.8)';
                ctx.shadowBlur = 15;
                ctx.shadowColor = '#ff4757';
                ctx.fillRect(0, vy, camera.width, v.height);
                ctx.fillStyle = '#fff';
                ctx.globalAlpha = 0.5;
                ctx.fillRect(0, vy + v.height * 0.4, camera.width, v.height * 0.2);
            }
            ctx.restore();
        });

        // Scalpel Dash Warning
        if (this.scalpelDash.warning) {
            const sy = this.scalpelDash.y - camera.y;
            ctx.save();
            ctx.fillStyle = 'rgba(255, 71, 87, 0.2)';
            ctx.fillRect(0, sy - 50, camera.width, 100);
            ctx.strokeStyle = '#ff4757';
            ctx.lineWidth = 3;
            ctx.setLineDash([20, 10]);
            ctx.beginPath();
            ctx.moveTo(0, sy);
            ctx.lineTo(camera.width, sy);
            ctx.stroke();
            ctx.restore();
        }

        // New Vaccine Rain hazards (Syringes)
        this.drawToyPresents(ctx, assets, camera);
    }

    updateGodAttacks(dt, player, env) {
        // Initialize Glitch Press State if missing
        if (!this.glitchPress) {
            this.glitchPress = { active: false, timer: 0, warning: false, isTop: false, cooldown: 4.0, duration: 0, hitActive: false, originX: 0, originY: 0 };
        }

        const press = this.glitchPress;
        const camera = player.game.camera; // Access camera

        if (this.defeated || this.state === 'DEAD') {
            press.active = false;
            press.warning = false;
            return;
        }

        if (!press.active && !press.warning) {
            // Cooldown Phase (Only progress if Boss is in neutral BATTLE state)
            // Prevents overlapping with other attacks like GOD_LASER
            if (this.state === 'BATTLE') {
                press.cooldown -= dt;
            }

            if (press.cooldown <= 0) {
                // START WARNING
                press.warning = true;
                press.active = false;
                press.timer = 2.0; // Warning duration (Set to 2.0s)
                press.isTop = Math.random() < 0.5; // Random Top or Bottom
                press.cooldown = 5.0 + Math.random() * 2.0;

                // LOCK COORDINATES
                press.originX = camera.x - 100; // Start slightly behind
                press.originY = camera.y;

                // Play Glitch/Error Sound
                if (player.game.audio && player.game.audio.playBossAlarm) {
                    player.game.audio.playBossAlarm();
                }
            }
        } else if (press.warning) {
            // WARNING Phase
            press.timer -= dt;
            if (press.timer <= 0) {
                press.warning = false;
                press.active = true;
                press.hitActive = true;
                press.timer = 2.0; // Attack Burst Duration (Extended to 2.0s)

                // Play Heavy Impact Sound
                if (player.game.audio && player.game.audio.playBossImpact) {
                    player.game.audio.playBossImpact();
                }
                if (player.game.camera) player.game.camera.shake(0.5, 30);
            }
        } else if (press.active) {
            // ATTACK Phase (Hitbox Active)
            press.timer -= dt;

            if (press.hitActive) {
                const screenH = camera.height || 600;
                const screenW = (camera.width || 800) * 2.0; // WIDER AREA (2x screen)

                // ADJUSTMENT: Narrower hitbox (42%)
                const dangerH = screenH * 0.42;
                // Use LOCKED originY
                const dangerY = press.isTop ? press.originY : press.originY + screenH - dangerH;
                const dangerX = press.originX; // Locked X start

                // Check collision (World Space AABB)
                if (
                    player.x + player.width > dangerX &&
                    player.x < dangerX + screenW &&
                    player.y + player.height > dangerY &&
                    player.y < dangerY + dangerH
                ) {
                    // Multi-hit damage, No Knockback
                    // takeDamage(source, cooldownOverride, noKnockback, damageAmount)
                    // cooldown=0.1s, damage=1
                    player.game.takeDamage(this, 0.1, true, 1);
                }
            }

            if (press.timer <= 0) {
                press.active = false;
                press.hitActive = false;
            }
        }
    }

    drawGodAttacks(ctx, camera) {
        // --- GOD LASER RENDER ---
        if (this.godLaserWarning && this.godLaserY) {
            ctx.save();
            const pulse = Math.sin(Date.now() / 50) > 0;
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#f00';
            ctx.strokeStyle = pulse ? '#ff0044' : '#550000';
            ctx.lineWidth = 3; // Thicker

            // Draw Danger Zone Background (Faint)
            this.godLaserY.forEach(y => {
                const dy = Math.floor(y - camera.y);

                // Faint beam path background
                ctx.fillStyle = 'rgba(255, 0, 0, 0.1)';
                ctx.fillRect(0, dy - 20, camera.width, 40);

                // Laser Guide Line
                ctx.beginPath();
                ctx.moveTo(0, dy);
                ctx.lineTo(camera.width, dy);
                ctx.stroke();

                // "LOCK" text
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 16px monospace';
                ctx.textAlign = 'right';
                ctx.fillText("<< LOCK ON >>", camera.width - 50, dy - 5);
            });
            ctx.restore();
        }

        // Render Active Laser Beams (Stored in waves array)
        if (this.waves && this.waves.length > 0) {
            this.waves.forEach(wave => {
                if (wave.type === 'GOD_LASER_BEAM') {
                    const drawY = Math.floor(wave.y - camera.y);
                    // Beam Visuals: Black Core, Purple Edge, Red Glow
                    ctx.save();

                    // 1. Red Glow / Outer Aura
                    ctx.shadowBlur = 20;
                    ctx.shadowColor = '#f00';
                    ctx.fillStyle = 'rgba(155, 89, 182, 0.8)'; // Purple
                    ctx.fillRect(0, drawY - wave.height / 2, camera.width, wave.height);

                    // 2. Black Core
                    ctx.shadowBlur = 0;
                    ctx.fillStyle = '#000';
                    ctx.fillRect(0, drawY - wave.height / 2 + 5, camera.width, wave.height - 10);

                    // 3. Lightning / Energy effect inside
                    ctx.strokeStyle = '#f00';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(0, drawY);
                    for (let x = 0; x < camera.width; x += 20) {
                        ctx.lineTo(x, drawY + (Math.random() * 10 - 5));
                    }
                    ctx.stroke();

                    ctx.restore();
                }
            });
        }

        // --- GLITCH PRESS RENDER (Existing) ---
        if (!this.glitchPress) return;
        const press = this.glitchPress;
        const screenW = (camera.width || 800) * 2.0; // Draw wider area
        const screenH = camera.height || 600;

        if (press.warning || press.active) {
            // Use LOCKED World Coordinates, convert to Screen Coordinates
            const dangerH = screenH * 0.42;
            const worldY = press.isTop ? press.originY : press.originY + screenH - dangerH;

            // Convert to screen space relative to CURRENT camera
            const drawX = Math.floor(press.originX - camera.x);
            const drawY = Math.floor(worldY - camera.y);

            // Allow drawing even if partly offscreen (wider range)
            if (drawX > camera.width || drawX + screenW < 0) return;

            ctx.save();

            if (press.warning) {
                // Warning Visuals
                const pulse = Math.sin(Date.now() / 50) * 0.2 + 0.3;

                ctx.fillStyle = `rgba(255, 0, 0, ${pulse})`;
                ctx.fillRect(drawX, drawY, screenW, dangerH);

                // Noise Lines
                ctx.strokeStyle = '#ff0000';
                ctx.lineWidth = 2;
                ctx.globalAlpha = 0.5;
                for (let i = 0; i < 20; i++) { // More lines for wider area
                    const ly = drawY + Math.random() * dangerH;
                    ctx.beginPath();
                    ctx.moveTo(drawX, ly);
                    ctx.lineTo(drawX + screenW, ly);
                    ctx.stroke();
                }

                // WARNING TEXT
                ctx.fillStyle = '#fff';
                ctx.shadowColor = '#f00';
                ctx.shadowBlur = 10;
                ctx.font = '900 60px monospace';
                ctx.textAlign = 'center';
                const shakeX = Math.random() * 10 - 5;
                const shakeY = Math.random() * 10 - 5;
                const text = "SYSTEM ERROR";
                // Center text relative to current camera view, not the huge world rect
                // Find visible center within the danger zone
                const visibleX = Math.max(drawX, 0);
                const visibleW = Math.min(screenW - (Math.abs(drawX)), camera.width);
                const textCenterX = visibleX + visibleW / 2;

                // Fallback to simple center if complexity fails visually
                const simpleCenterX = (camera.width || 800) / 2;

                const centerY = drawY + dangerH / 2;

                ctx.fillText(text, simpleCenterX + shakeX, centerY + 20 + shakeY);
                ctx.font = 'bold 30px monospace';
                ctx.fillText("SECTOR CORRUPTION DETECTED", simpleCenterX, centerY + 60);

            } else if (press.active) {
                // Active Visuals
                ctx.fillStyle = '#000';
                ctx.fillRect(drawX, drawY, screenW, dangerH);

                // Matrix
                ctx.fillStyle = '#0f0';
                ctx.font = '20px monospace';
                for (let i = 0; i < 40; i++) { // More matrix rain
                    const cx = drawX + Math.random() * screenW;
                    const cy = drawY + Math.random() * dangerH;
                    ctx.fillText(String.fromCharCode(0x30A0 + Math.random() * 96), cx, cy);
                }

                // Flash
                ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.5})`;
                ctx.globalCompositeOperation = 'overlay';
                ctx.fillRect(drawX, drawY, screenW, dangerH);
            }

            ctx.restore();
        }
    }
}

