/**
 * Boss Behaviors Registry
 * 各ボス状態のロジックを分離して管理します。
 * ここに新しい攻撃パターンを追加することで、Boss.js本体を汚さずに拡張可能です。
 */

export const BossBehaviors = {
    // --- 通用ロジック ---
    'IDLE': (boss, { dt }) => {
        const time = Date.now() / 1000;
        boss.floatY = Math.sin(time * 2) * 30;
        boss.y = boss.baseY + boss.floatY;
        if (boss.timer > 2.0) { // Slightly shorter idle
            boss.state = 'ATTACK';
            boss.timer = 0;
        }
    },

    'BATTLE_MOVE': (boss, { dt, player, camera, screenWidth }) => {
        const time = Date.now() / 1000;
        const minX = camera.x + screenWidth * 0.5;
        const maxX = camera.x + screenWidth - boss.width - 50;

        // 共通の移動ロジック
        let idealX = camera.x + screenWidth * 0.75;
        let wander = Math.sin(time * 0.5) * 100;
        let targetY = player.y - 150;
        boss.floatY = Math.sin(time * 3) * 60;
        let targetX = idealX + wander;
        targetX = Math.max(minX, Math.min(maxX, targetX));

        boss.x += (targetX - boss.x) * (dt * 2.0);
        if (boss.x < minX) boss.x = minX;
        boss.baseY += (targetY - boss.baseY) * (dt * 2.0);
        boss.y = boss.baseY + boss.floatY;
    },

    // --- ナース専用攻撃 (Stage 4) ---

    'PILL_BARRAGE': (boss, { dt, player, camera, screenWidth }) => {
        if (typeof boss.pillWaveCount === 'undefined') {
            boss.pillWaveCount = 6; // More waves, but easier to avoid
            boss.pillWaveTimer = 0.5;
        }

        boss.pillWaveTimer -= dt;
        if (boss.pillWaveTimer <= 0 && boss.pillWaveCount > 0) {
            // Choose a "hole" position (0: top, 1: mid, 2: low)
            const hole = Math.floor(Math.random() * 3);
            const heights = [0.22, 0.50, 0.78];
            const screenH = camera.height || 600;

            heights.forEach((h, index) => {
                if (index === hole) return;

                boss.pills.push({
                    x: camera.x + screenWidth + 100,
                    y: camera.y + screenH * h,
                    vx: -320, // Slowed down
                    vy: 0,
                    width: 50, height: 50, // Slightly smaller
                    color: index === 0 ? '#ff4757' : (index === 1 ? '#3498db' : '#2ecc71'),
                    life: 5.0,
                    noGravity: true
                });
            });

            if (player.game.audio) player.game.audio.playJump();
            boss.pillWaveCount--;
            boss.pillWaveTimer = 1.8; // More spacing for reaction
        }

        if (boss.pillWaveCount <= 0 && boss.timer > 8.0) {
            boss.state = 'BATTLE';
            boss.timer = 0;
            delete boss.pillWaveCount; delete boss.pillWaveTimer;
        }

        // Keep moving during barrage
        BossBehaviors['BATTLE_MOVE'](boss, { dt, player, camera, screenWidth });
    },

    'VITAL_CHECK_PREP': (boss, { dt, player, camera, screenWidth }) => {
        // Just move naturally during prep
        BossBehaviors['BATTLE_MOVE'](boss, { dt, player, camera, screenWidth });

        if (boss.timer > 1.5) {
            boss.state = 'VITAL_CHECK_FIRE';
            boss.timer = 0;
            boss.vitalPattern = [0.85, 0.35, 0.6, 0.1];
            boss.vitalIndex = 0;
            boss.vitalSubTimer = 0.5;
        }
    },

    'VITAL_CHECK_FIRE': (boss, { dt, player, camera, screenWidth }) => {
        if (boss.vitalIndex < boss.vitalPattern.length) {
            boss.vitalSubTimer -= dt;
            if (boss.vitalSubTimer <= 0) {
                const ratio = boss.vitalPattern[boss.vitalIndex];
                boss.fireVitalLaser(ratio, camera, screenWidth, 1);
                if (player.game.audio) player.game.audio.playLaser();
                boss.vitalIndex++;
                boss.vitalSubTimer = 1.2; // Increased from 1.0
            }
        } else if (boss.timer > 1.0) {
            boss.state = 'BATTLE';
            boss.timer = 0;
        }

        // Keep moving during vital check
        BossBehaviors['BATTLE_MOVE'](boss, { dt, player, camera, screenWidth });
    },

    'VACCINE_RAIN': (boss, { dt, player, camera, screenWidth }) => {
        // Just move naturally during prep/spawn
        BossBehaviors['BATTLE_MOVE'](boss, { dt, player, camera, screenWidth });

        if (typeof boss.rainCount === 'undefined') {
            boss.rainCount = 8;
            boss.rainTimer = 0.5;
        }

        boss.rainTimer -= dt;
        if (boss.rainTimer <= 0 && boss.rainCount > 0) {
            // Predict where the player will be (slightly ahead)
            const dropX = camera.x + screenWidth * 0.4 + Math.random() * (screenWidth * 0.5);

            boss.toyPresents.push({
                type: 'stuck_needle',
                x: dropX,
                y: camera.y - 120,
                vx: 0,
                vy: 1200, // Faster drop
                width: 40,
                height: 100,
                life: 5.0, // Total time on screen
                warning: 0.5,
                isStuck: false,
                stuckTimer: 3.0 // Stay on ground for 3 seconds
            });

            if (player.game.audio) player.game.audio.playJump();
            boss.rainCount--;
            boss.rainTimer = 0.4;
        }

        if (boss.rainCount <= 0 && boss.timer > 5.0) {
            boss.state = 'BATTLE';
            boss.timer = 0;
            delete boss.rainCount; delete boss.rainTimer;
        }
    },

    // --- シスター専用攻撃 (Stage 2) ---
    'CAST_FLOOR': (boss, { dt, camera, screenWidth }) => {
        boss.targetDashX = camera.x + screenWidth * 0.5;
        boss.x += (boss.targetDashX - boss.x) * (dt * 3.0);

        if (boss.timer > 1.0) {
            boss.floorHazard.warning = true;
            boss.floorHazard.timer = 3.0;
            boss.floorHazard.active = false;
            boss.state = 'BATTLE';
            boss.timer = 0;
        }
    },

    'CAST_WAVE': (boss, { dt, player, camera, screenWidth }) => {
        boss.x += ((camera.x + screenWidth - 200) - boss.x) * (dt * 3.0);

        if (boss.timer > 1.0) {
            if (typeof boss.burstCount === 'undefined') {
                boss.burstCount = 3;
                boss.burstTimer = 0;
            }

            boss.burstTimer -= dt;
            if (boss.burstTimer <= 0 && boss.burstCount > 0) {
                boss.fireDarkWaves(camera, screenWidth);
                if (player.game && player.game.audio) {
                    player.game.audio.playLaser();
                }
                boss.burstCount--;
                boss.burstTimer = 0.6;
            }

            if (boss.burstCount <= 0 && boss.burstTimer <= 0) {
                boss.state = 'BATTLE';
                boss.timer = 0;
                delete boss.burstCount;
                delete boss.burstTimer;
            }
        }
    },

    // --- トイキング専用攻撃 (Stage 3) ---
    'TOY_MARCH': (boss, { dt, player, camera, screenWidth }) => {
        boss.x += ((camera.x + screenWidth - 250) - boss.x) * (dt * 2.0);
        boss.baseY += ((camera.y + 150) - boss.baseY) * (dt * 2.0);
        boss.y = boss.baseY;

        if (boss.timer > 0.8) {
            if (typeof boss.marchCount === 'undefined') {
                boss.marchCount = 12;
                boss.marchTimer = 0;
            }
            boss.marchTimer -= dt;
            if (boss.marchTimer <= 0 && boss.marchCount > 0) {
                const lane = Math.floor(Math.random() * 4);
                const spawnY = camera.y + 100 + (lane * 125);

                boss.toyPresents.push({
                    type: 'march',
                    x: camera.x + screenWidth + 100,
                    y: spawnY,
                    vx: -700, vy: 0,
                    width: 80, height: 80,
                    life: 4.0,
                    warning: 1.0
                });
                boss.marchCount--;
                boss.marchTimer = 0.5;
                if (player.game && player.game.audio) player.game.audio.playJump();
            }
            if (boss.marchCount <= 0) {
                boss.state = 'BATTLE';
                boss.timer = 0;
                delete boss.marchCount; delete boss.marchTimer;
            }
        }
    },

    'TOY_BOUNCE': (boss, { dt, player, camera, screenWidth }) => {
        // Position boss ahead of camera
        const targetX = camera.x + screenWidth - 250;
        boss.x += (targetX - boss.x) * (dt * 2.5);
        boss.baseY += (camera.y + 100 - boss.baseY) * (dt * 2.5);
        boss.y = boss.baseY;

        if (typeof boss.ballCount === 'undefined') {
            boss.ballCount = 4; // Spawn 4 balls
            boss.ballTimer = 0.2;
        }

        boss.ballTimer -= dt;
        if (boss.ballTimer <= 0 && boss.ballCount > 0) {
            // Vary velocity for each ball to create a pattern
            const variations = [
                { vx: -450, vy: -700, bounce: 0.85 },
                { vx: -300, vy: -500, bounce: 0.75 },
                { vx: -600, vy: -900, bounce: 0.90 },
                { vx: -200, vy: -400, bounce: 0.80 }
            ];
            const v = variations[4 - boss.ballCount];

            boss.toyPresents.push({
                type: 'bounce_ball',
                x: boss.x + boss.width / 2,
                y: boss.y + 100,
                vx: v.vx,
                vy: v.vy,
                width: 70, height: 70,
                gravity: 1300,
                bounce: v.bounce,
                life: 10.0,
                warning: 0 // Optional: add warning if too hard
            });

            boss.ballCount--;
            boss.ballTimer = 0.6; // Interval between balls

            if (player.game && player.game.audio) player.game.audio.playLand();
        }

        if (boss.ballCount <= 0 && boss.timer > 6.0) {
            boss.state = 'BATTLE';
            boss.timer = 0;
            delete boss.ballCount; delete boss.ballTimer;
        }
    },

    // --- 最終ボス専用攻撃 (Stage 5) ---
    'JUDGMENT_RAY': (boss, { dt, player, camera, screenWidth }) => {
        boss.x += ((camera.x + screenWidth * 0.8) - boss.x) * (dt * 2.0);
        boss.y += (camera.y + 200 - boss.y) * (dt * 2.0);

        if (boss.timer > 1.0) {
            if (typeof boss.rayTimer === 'undefined') boss.rayTimer = 0;
            boss.rayTimer -= dt;
            if (boss.rayTimer <= 0) {
                boss.waves.push({
                    x: player.x - 20,
                    y: camera.y - 1000, // Extend upwards to hide top edge
                    width: 100,
                    height: (camera.height || 600) + 2000, // Ensure full vertical coverage
                    vx: 0,
                    vy: 0,
                    type: 'JUDGMENT_RAY', // Explicit Type for safety
                    life: 1.5
                });
                boss.rayTimer = 1.2;
                if (player.game && player.game.audio) player.game.audio.playLaser();
            }
            if (boss.timer > 4.5) {
                boss.state = 'BATTLE';
                boss.timer = 0;
                delete boss.rayTimer;
            }
        }
        boss.baseY = boss.y;
    },

    'SOUL_SCYTHE': (boss, { dt, player }) => {
        const targetX = player.x + (boss.x < player.x ? -150 : 150);
        boss.x += (targetX - boss.x) * (dt * 5.0);
        boss.y += (player.y - boss.y) * (dt * 5.0);

        if (boss.timer > 0.5 && boss.timer % 0.8 < dt) {
            const dist = Math.hypot(boss.x - player.x, boss.y - player.y);
            if (dist < 200) {
                player.game.takeDamage(boss);
                if (player.game.camera.shake) player.game.camera.shake(0.3, 30);
            }
        }

        if (boss.timer > 3.5) {
            boss.state = 'BATTLE';
            boss.timer = 0;
        }
        boss.baseY = boss.y;
    },

    'GOD_LASER': (boss, { dt, player, camera, screenWidth }) => {
        // Move to firing position (Right side, slightly elevated)
        const targetX = camera.x + screenWidth - 200;
        boss.x += (targetX - boss.x) * (dt * 3.0);

        // Initialize attack data
        if (typeof boss.godLaserCount === 'undefined') {
            boss.godLaserCount = 6;
            boss.godLaserTimer = 1.0; // Initial warning time
            boss.godLaserY = [];
            // Pre-calculate 6 target heights targeting random zones relative to player/screen
            for (let i = 0; i < 6; i++) {
                // Mix of aiming at player and random coverage
                const aimY = (i % 2 === 0) ? player.y : (camera.y + Math.random() * (camera.height || 600));
                // Clamp to screen
                const clampedY = Math.max(camera.y + 50, Math.min(camera.y + (camera.height || 600) - 50, aimY + (Math.random() * 100 - 50)));
                boss.godLaserY.push(clampedY);
            }
            // Trigger visual warning (Draw handled in Boss.js)
            boss.godLaserWarning = true;
        }

        boss.godLaserTimer -= dt;

        // Firing Logic
        if (boss.godLaserTimer <= 0 && boss.godLaserCount > 0) {
            // Clear warning lines immediately
            if (boss.godLaserWarning) boss.godLaserWarning = false;

            const beamIndex = 6 - boss.godLaserCount;
            const yPos = boss.godLaserY[beamIndex];

            // Spawn the actual laser object (Persistent hitbox)
            // Using existing projectile system or creating a new 'GOD_LASER_BEAM' type
            if (!boss.glitchPress) boss.glitchPress = {}; // Use similar structure or new array?
            // Let's use `waves` array with a special type
            boss.waves.push({
                x: camera.x, // Full width coverage starting from left? No, shoots from boss (right) to left.
                y: yPos - 30, // Centered on Y
                width: screenWidth + 200,
                height: 60, // Thick beam
                vx: -2000, // Very fast
                vy: 0,
                type: 'GOD_LASER_BEAM',
                life: 1.0, // Lasts for 1 second
                color: '#000', // Black core
                borderColor: '#9b59b6', // Purple edge
                accel: 0
            });

            // Camera shake & Sound
            if (player.game.camera.shake) player.game.camera.shake(0.4, 15);
            if (player.game.audio) player.game.audio.playLaser(); // Replace with heavier sound if avail

            boss.godLaserCount--;
            boss.godLaserTimer = 0.2; // Rapid fire interval (0.2s)
        }

        // Cleanup and finish
        if (boss.godLaserCount <= 0 && boss.timer > 4.0) { // Total duration safeguard
            boss.state = 'BATTLE';
            boss.timer = 0;
            boss.godLaserWarning = false;
            delete boss.godLaserCount;
            delete boss.godLaserTimer;
            delete boss.godLaserY;
        }
    }
};
