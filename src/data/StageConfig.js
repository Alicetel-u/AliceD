/**
 * Stage Configuration Manager
 * ステージごとの設定（背景、ブロック、ボス、生成パラメータ）を管理します。
 * 
 * ■ How to Swap Backgrounds & Blocks (背景やブロックの差し替え方法):
 * 1. Add your image files to `public/assets/img/`.
 *    (画像を `public/assets/img/` フォルダに追加してください)
 *    Example: `my_new_bg.webp`, `my_new_block.webp`
 * 
 * 2. Update the `theme` section for the desired stage below.
 *    (以下のステージ設定の `theme` セクションを修正してください)
 *    - backgroundImage: "my_new_bg" (Simple 1-layer setup)
 *    - groundTile: "my_new_block"
 * 
 * ■ How to use Dual/Multi-Layer Backgrounds (二重・多重背景のやり方):
 *    Instead of `backgroundImage`, use `backgroundLayers` list:
 *    backgroundLayers: [
 *       { image: "my_sky", speed: 0, alignBottom: false },      // Far back (Sky)
 *       { image: "my_mountains", speed: 0.2, alignBottom: true }, // Middle (Slow)
 *       { image: "my_trees", speed: 0.5, alignBottom: true }      // Front (Fast)
 *    ]
 * 
 * ■ How to Add a New Stage (新しいステージの追加):
 * 1. Copy an existing stage block (e.g., stage 5).
 * 2. Increment the key and id (e.g., Change `5:` to `6:` and `id: 5` to `id: 6`).
 * 3. Update the names and asset keys.
 * 4. The game will automatically load the new assets if the files exist.
 */
export const StageConfig = {
    1: {
        id: 1,
        name: "うさぎの森",
        theme: {
            backgroundType: "image", backgroundImage: "bg_hills", backgroundColor: "#54a0ff",
            groundTile: "grass_block", dirtTile: "dirt_block", platformTile: "crate"
        },
        generation: {
            length: 400, holes: 0.05, platforms: 0.20,
            features: {
                springs: 0.25, rings: 0, clouds: 0, moving: 0, falling: 0,
                enemies: 0.15, flyers: 0.10, carrots: 0.60
            }
        },
        physics: { gravity: 1500, friction: 0.9 },
        enemies: { ground: 'fuwamoko', air: 'enemy_cloud' },
        boss: {
            name: "月の守護者：モチツキ・タイタン", image: "boss_mochitsuki", imageWeak: "boss_weak",
            cutin: "boss_cutin", hp: 5, bgm: "BOSS_WAR",
            ai: {
                attackInterval: 8.0,
                phases: [
                    { name: 'default', attackPool: ['SPIN_PREP'] }
                ]
            },
            bgmName: "RABBIT WARS -Battle of the Moon-"
        },
        bgm: "GAME"
    },
    2: {
        id: 2,
        name: "しんぴの修道院",
        theme: {
            backgroundType: "image", backgroundImage: "bg_monastery", backgroundColor: "#2c3e50",
            groundTile: "stone_block", dirtTile: "dark_stone_block", platformTile: "wood_plank"
        },
        generation: {
            length: 400, holes: 0.12, platforms: 0.25,
            features: {
                springs: 0.25, rings: 0.15, clouds: 0.10, moving: 0.10, falling: 0.10,
                enemies: 0.25, flyers: 0.20, carrots: 0.50
            }
        },
        physics: { gravity: 1600, friction: 0.92 },
        enemies: { ground: 'enemy_st2_ground.webp', air: 'enemy_st2_air.webp' },
        boss: {
            name: "深淵の幻影：シスター？？？", image: "boss_sister_s", imageWeak: "boss_sister_k",
            cutin: "boss_sister_cutin", hp: 6, bgm: "BOSS_SISTER",
            ai: {
                attackInterval: 3.0,
                attackPool: [
                    { state: 'CAST_WAVE', weight: 0.67 },
                    { state: 'CAST_FLOOR', weight: 0.33 }
                ]
            },
            bgmName: "SISTER'S PRAYER -Corrupted Faith-"
        },
        bgm: "SISTER"
    },
    3: {
        id: 3,
        name: "じあいのおもちゃ箱",
        theme: {
            // User provided custom background + Toy Mountains
            backgroundLayers: [
                { image: "bg_stage3_sky.webp", speed: 0.05, alignBottom: false }, // 奥：ステージ3用空
                { image: "bg_toy_mountains", speed: 0.2, alignBottom: true, filter: "brightness(0.6)" }   // 手前：おもちゃの山 (少し暗くして手前のブロックを目立たせる)
            ],
            backgroundColor: "#ff9ff3",
            groundTile: "toy_block_primary", dirtTile: "toy_block_secondary", platformTile: "toy_box_crate"
        },
        generation: {
            length: 400, holes: 0.25, platforms: 0.45,
            features: {
                // Gizmos limited to sum=1.0 (Always spawn something), Enemies ~3x
                springs: 0.30, rings: 0.25, clouds: 0.15, moving: 0.20, falling: 0.10,
                enemies: 0.75, flyers: 0.60, carrots: 0.80
            }
        },
        physics: { gravity: 1300, friction: 0.95 },
        enemies: { ground: 'enemy_st3_ground.webp', air: 'enemy_st3_air.webp' },
        boss: {
            name: "玩具の王：キング・レゴロ", image: "boss_toy_king", imageWeak: "boss_toy_king_weak",
            cutin: "boss_toy_king_cutin", hp: 7, bgm: "BOSS_TOY",
            ai: {
                attackInterval: 4.5,
                attackPool: ['TOY_MARCH', 'TOY_BOUNCE']
            },
            bgmName: "TOYBOX CARNIVAL -Plastic Nightmare-"
        },
        bgm: "TOY"
    },
    4: {
        id: 4,
        name: "静寂のホスピタル",
        theme: {
            // Darkened background for better visibility
            backgroundLayers: [
                { image: "bg_hospital", speed: 0.1, alignBottom: false, filter: "brightness(0.6)" }
            ],
            backgroundColor: "#d1ccc0",
            groundTile: "hospital_tile_floor", dirtTile: "hospital_tile_wall", platformTile: "stretcher_bed"
        },
        generation: {
            length: 400, holes: 0.30, platforms: 0.30,
            features: {
                springs: 0.15, rings: 0.10, clouds: 0.25, moving: 0.15, falling: 0.25,
                enemies: 0.40, flyers: 0.40, carrots: 0.45
            }
        },
        physics: { gravity: 1750, friction: 0.88 },
        enemies: { ground: 'enemy_st4_ground.png', air: 'enemy_st4_air.png' },
        boss: {
            name: "絶望に至る病：KANON", image: "boss_hospital_new.webp", imageWeak: "boss_nurse_weak",
            cutin: "boss_nurse_cutin", hp: 8, bgm: "BOSS_NURSE",
            ai: {
                attackInterval: 2.5,
                attackPool: [
                    { state: 'VITAL_CHECK_PREP', weight: 0.60 },
                    { state: 'VACCINE_RAIN', weight: 0.30 },
                    { state: 'PILL_BARRAGE', weight: 0.10 }
                ]
            },
            bgmName: "EMERGENCY CALL -Code Red-"
        },
        bgm: "HOSPITAL"
    },
    5: {
        id: 5,
        name: "天国への階段",
        theme: {
            // Darkened background for better visibility
            backgroundLayers: [
                { image: "bg_heaven", speed: 0.1, alignBottom: false, filter: "brightness(0.6)" }
            ],
            backgroundColor: "#f5f6fa",
            groundTile: "temple_tile_floor", dirtTile: "temple_tile_wall", platformTile: "golden_pillar"
        },
        generation: {
            length: 300, holes: 0.10, platforms: 0.50, // Ground returned for easy fighting
            features: {
                // Enemy Spam & Ring Rush Mode
                springs: 0.10, rings: 0.40, clouds: 0.20, moving: 0.20, falling: 0.10,
                enemies: 0.90, flyers: 0.90, carrots: 0.50
            }
        },
        physics: { gravity: 1200, friction: 0.95 }, // Normal gravity
        enemies: { ground: 'enemy_st5_ground.png', air: 'enemy_st5_air.webp' },
        boss: {
            name: "万物の始原：デウス・エクス", image: "boss_god", imageWeak: "boss_reaper",
            cutin: "boss_god_cutin", hp: 9, bgm: "BOSS_FINAL",
            ai: {
                attackInterval: 4.0,
                phases: [
                    { hpRange: [0.6, 1.0], attackPool: ['JUDGMENT_RAY', 'GOD_LASER'] },
                    { hpRange: [0.3, 0.6], attackPool: ['SOUL_SCYTHE', 'GOD_LASER'] },
                    { hpRange: [0.0, 0.3], attackPool: ['GOD_LASER'] }
                ]
            },
            bgmName: "GENESIS -The End of All-"
        },
        bgm: "NONE"
    }
};
