/**
 * StagePlacements.js
 * "Flow-based" Level Design
 * プレイヤーが止まらずに走り抜けられる、リズム感を重視した配置。
 * 
 * ■ Rules:
 * - 加速リングは高所空中(y>=5)のみ
 * - 開始30ブロックはセーフゾーン（x<30は敵・危険設置不可）
 * - スタート地点後方(x<20)にはアイテム配置不可
 * - 雲は高所(y>=4)のみ
 * - 進行不能配置の回避
 * 
 * ■ Type Legend:
 * c : ニンジン
 * C : 雲足場
 * S : スピード
 * O : 右加速リング (High Air)
 * U : 上加速リング
 * X : 超加速リング (Super)
 * E : 敵
 * F : 空中敵
 * B : ブロック
 * J : ジャンプ台
 * R : 報酬箱
 * H : 穴
 * W : 壁
 */

export const StagePlacements = {
    // Stage 1: Green Hill 風
    1: [
        // --- Intro (Safe Zone) ---
        // Player spawns at x=15. Start items at x=20.
        { x: 20, y: 1, type: 'c' }, { x: 25, y: 1, type: 'c' },

        // --- Sequence A: First Encounter & Spring ---
        { x: 35, y: 0, type: 'E' },
        { x: 40, y: 1, type: 'B' }, { x: 40, y: 2, type: 'J' },
        { x: 43, y: 6, type: 'c' }, { x: 44, y: 7, type: 'c' }, { x: 45, y: 7, type: 'c' },
        { x: 47, y: 9, type: 'B' }, { x: 48, y: 9, type: 'B' }, { x: 49, y: 9, type: 'B' },
        { x: 48, y: 10, type: 'S' },

        // --- Sequence B: Dash & Smash (High Air Ring) ---
        { x: 63, y: 1, type: 'B' }, { x: 63, y: 2, type: 'J' },
        { x: 68, y: 5, type: 'O' },

        { x: 75, y: 1, type: 'E' }, { x: 77, y: 1, type: 'E' }, { x: 79, y: 1, type: 'E' },

        // --- Sequence C: Rhythm Jumps (Safe Wall) ---
        { x: 88, y: 1, type: 'J' }, // 詰み防止のためジャンプ台に変更
        { x: 90, type: 'W' },
        { x: 89, y: 2, type: 'c' }, { x: 90, y: 4, type: 'c' },

        { x: 93, y: 1, type: 'J' }, // 詰み防止のためジャンプ台に変更
        { x: 95, type: 'W' }, { x: 100, type: 'H' }, { x: 101, type: 'H' },
        { x: 103, y: 3, type: 'F' },

        // --- Sequence D: Enemy Chain ---
        { x: 120, y: 0, type: 'H' }, { x: 121, y: 0, type: 'H' }, { x: 122, y: 0, type: 'H' }, { x: 123, y: 0, type: 'H' },
        { x: 120, y: 3, type: 'F' }, { x: 122, y: 4, type: 'F' },
        { x: 125, y: 6, type: 'c' }, { x: 126, y: 6, type: 'c' },

        // --- Climax (Sky High) ---
        { x: 148, y: 1, type: 'B' }, { x: 148, y: 2, type: 'J' },
        { x: 153, y: 6, type: 'O' },
        { x: 158, y: 7, type: 'O' },

        { x: 165, y: 1, type: 'J' },
        { x: 170, y: 8, type: 'c' }, { x: 171, y: 8, type: 'c' },


        // --- Extension for Full Map Cover ---
        // Section F: Rolling Hills
        { x: 200, y: 0, type: 'E' }, { x: 205, y: 0, type: 'E' }, { x: 210, y: 0, type: 'E' },
        { x: 220, y: 1, type: 'B' }, { x: 220, y: 2, type: 'J' },
        { x: 225, y: 5, type: 'c' }, { x: 230, y: 4, type: 'c' },

        // Section G: Final Run
        { x: 260, y: 1, type: 'S' },
        { x: 280, type: 'H' }, { x: 281, type: 'H' }, { x: 282, type: 'H' },
        { x: 280, y: 3, type: 'F' },
        { x: 285, y: 1, type: 'B' }, { x: 285, y: 2, type: 'J' },

        { x: 300, y: 6, type: 'O' }, { x: 310, y: 6, type: 'c' }, { x: 315, y: 6, type: 'c' },
        { x: 320, type: 'W' }
    ],

    // Stage 2: High Speed Highway
    2: [
        // --- Intro ---
        { x: 20, y: 1, type: 'S' }, // Start with turbo

        // --- Sequence A: The Gap Run ---
        { x: 40, type: 'H' }, { x: 41, type: 'H' },
        { x: 45, type: 'H' }, { x: 46, type: 'H' },
        { x: 50, type: 'H' }, { x: 51, type: 'H' },
        { x: 43, y: 0, type: 'E' }, { x: 48, y: 0, type: 'E' },

        // --- Sequence B: High Road / Low Road ---
        { x: 70, y: 1, type: 'B' }, { x: 70, y: 2, type: 'J' },
        { x: 76, y: 6, type: 'B' }, { x: 77, y: 6, type: 'B' }, { x: 78, y: 6, type: 'B' },
        { x: 77, y: 7, type: 'c' },
        { x: 75, y: 0, type: 'E' }, { x: 78, y: 0, type: 'E' },

        // --- Merge & Dash (High Ring) ---
        { x: 88, y: 1, type: 'B' }, { x: 88, y: 2, type: 'J' },
        { x: 97, y: 6, type: 'O' },

        // Long gap
        { x: 98, y: 0, type: 'H' }, { x: 99, y: 0, type: 'H' },
        { x: 100, y: 3, type: 'B' },
        { x: 101, y: 0, type: 'H' }, { x: 102, y: 0, type: 'H' },
        { x: 99, y: 4, type: 'F' },

        // --- Extension for Full Map Cover ---
        // Section D: Speed Highway II
        { x: 140, y: 1, type: 'S' },
        { x: 160, type: 'H' }, { x: 161, type: 'H' }, { x: 162, type: 'H' },
        { x: 165, type: 'H' }, { x: 166, type: 'H' },
        { x: 160, y: 4, type: 'F' }, { x: 165, y: 4, type: 'F' },

        // Section E: Ring Loop
        { x: 200, y: 1, type: 'B' }, { x: 200, y: 2, type: 'J' },
        { x: 205, y: 7, type: 'O' },
        { x: 215, y: 6, type: 'O' },
        { x: 225, y: 5, type: 'O' },

        // Section F: Monster Dash
        { x: 250, y: 0, type: 'E' }, { x: 252, y: 0, type: 'E' }, { x: 254, y: 0, type: 'E' },
        { x: 256, y: 0, type: 'E' }, { x: 258, y: 0, type: 'E' },
        { x: 260, y: 1, type: 'S' }, // Last boost

        { x: 300, type: 'W' }
    ],

    // Stage 3: Toy Box Chaos (Remastered)
    3: [
        // --- Intro: Welcome to the Toy Box ---
        { x: 20, y: 1, type: 'c' }, { x: 22, y: 2, type: 'c' }, { x: 24, y: 3, type: 'c' },
        { x: 26, y: 1, type: 'c' }, { x: 28, y: 2, type: 'c' }, { x: 30, y: 3, type: 'c' },

        // --- Section A: The Building Blocks Tower ---
        { x: 35, y: 1, type: 'B' }, { x: 35, y: 2, type: 'J' },
        { x: 38, y: 4, type: 'B' }, { x: 39, y: 4, type: 'B' },
        { x: 42, y: 6, type: 'B' }, { x: 43, y: 6, type: 'B' }, { x: 44, y: 6, type: 'B' },
        { x: 43, y: 7, type: 'S' },

        // --- Section B: Domino Enemies ---
        { x: 50, y: 0, type: 'E' }, { x: 52, y: 0, type: 'E' }, { x: 54, y: 0, type: 'E' },
        { x: 56, y: 0, type: 'E' }, { x: 58, y: 0, type: 'E' },
        { x: 50, y: 4, type: 'c' }, { x: 54, y: 4, type: 'c' }, { x: 58, y: 4, type: 'c' },

        // --- Section C: Sky Coaster (Ring Chain) ---
        { x: 65, y: 1, type: 'B' }, { x: 65, y: 2, type: 'J' },
        { x: 70, y: 6, type: 'O' },
        { x: 75, y: 7, type: 'O' },
        { x: 80, y: 5, type: 'O' },

        // Floating targets
        { x: 72, y: 8, type: 'F' }, { x: 77, y: 8, type: 'F' },

        // --- Section D: Toy Trap (Pit & Springs) ---
        { x: 90, type: 'H' }, { x: 91, type: 'H' }, { x: 92, type: 'H' },
        { x: 91, y: 4, type: 'C' },
        { x: 95, y: 1, type: 'J' },

        // --- Section E: The Big Drop ---
        { x: 105, y: 1, type: 'B' }, { x: 105, y: 2, type: 'B' }, { x: 105, y: 3, type: 'J' },
        { x: 105, y: 8, type: 'c' }, { x: 105, y: 9, type: 'c' }, { x: 105, y: 10, type: 'c' },

        // --- Section F: Chaos Finale ---
        { x: 120, y: 1, type: 'E' }, { x: 125, y: 3, type: 'F' }, { x: 130, y: 0, type: 'E' },
        { x: 135, y: 1, type: 'S' },

        // --- Section G: The Spring Field (Second Half) ---
        { x: 160, y: 1, type: 'J' }, { x: 165, y: 2, type: 'J' }, { x: 170, y: 3, type: 'J' },
        { x: 162, y: 5, type: 'c' }, { x: 167, y: 6, type: 'c' }, { x: 172, y: 7, type: 'c' },
        { x: 175, y: 7, type: 'F' },

        // --- Section H: Cloud Road to Heaven ---
        { x: 200, type: 'H' }, { x: 201, type: 'H' }, { x: 202, type: 'H' }, { x: 203, type: 'H' },
        { x: 200, y: 5, type: 'C' }, { x: 202, y: 8, type: 'C' }, { x: 205, y: 6, type: 'C' },
        { x: 208, y: 4, type: 'E' },
        { x: 208, y: 4, type: 'B' }, { x: 208, y: 5, type: 'E' },

        // --- Section I: The Gauntlet ---
        { x: 240, y: 0, type: 'E' }, { x: 242, y: 0, type: 'E' }, { x: 244, y: 0, type: 'E' },
        { x: 250, y: 3, type: 'F' }, { x: 252, y: 4, type: 'F' }, { x: 254, y: 3, type: 'F' },

        // --- Section J: Ring Dash Finish ---
        { x: 280, y: 1, type: 'B' }, { x: 280, y: 2, type: 'J' },
        { x: 285, y: 6, type: 'O' }, { x: 290, y: 6, type: 'O' }, { x: 295, y: 6, type: 'O' },
        { x: 300, y: 8, type: 'c' }, { x: 301, y: 8, type: 'c' },

        // Goal Wall
        { x: 320, type: 'W' }
    ],

    // Stage 4: Bullet Hell & High Altitude Infection
    4: [
        // --- Intro & High Sky Start ---
        { x: 20, y: 1, type: 'c' }, { x: 25, y: 1, type: 'c' },
        { x: 28, y: 6, type: 'C' }, { x: 30, y: 6, type: 'C' },
        // NEW: Super High Start Layer
        { x: 25, y: 10, type: 'B' }, { x: 27, y: 10, type: 'O' }, { x: 29, y: 10, type: 'B' },
        { x: 31, y: 11, type: 'J' }, // Jump pad to start the sky run

        // --- Sequence A: Multi-Layered Barrage ---
        { x: 35, y: 0, type: 'E' }, { x: 37, y: 0, type: 'E' }, { x: 39, y: 0, type: 'E' },
        { x: 36, y: 3, type: 'F' }, { x: 38, y: 3, type: 'F' },
        // High Air Ambush
        { x: 40, y: 7, type: 'F' }, { x: 42, y: 8, type: 'F' },
        // NEW: Stratosphere Route (y=11+)
        { x: 35, y: 12, type: 'B' }, { x: 37, y: 12, type: 'O' }, { x: 39, y: 12, type: 'B' },
        { x: 41, y: 13, type: 'O' }, { x: 43, y: 13, type: 'B' },
        { x: 45, y: 14, type: 'O' }, { x: 47, y: 14, type: 'O' }, // Sky dash

        // --- Sequence B: Stairway to Heaven (Extended) ---
        { x: 55, y: 1, type: 'B' }, { x: 55, y: 2, type: 'J' },
        { x: 58, y: 6, type: 'B' }, { x: 60, y: 7, type: 'B' }, { x: 62, y: 8, type: 'B' },
        { x: 64, y: 9, type: 'O' },
        // NEW: Heaven's Gate Layer
        { x: 58, y: 13, type: 'C' }, { x: 60, y: 13, type: 'C' }, { x: 62, y: 13, type: 'C' },
        { x: 64, y: 14, type: 'O' }, { x: 66, y: 14, type: 'O' }, { x: 68, y: 14, type: 'O' },

        { x: 59, y: 6, type: 'O' },
        { x: 62, type: 'H' }, { x: 63, type: 'H' }, { x: 64, type: 'H' }, { x: 65, type: 'H' }, { x: 66, type: 'H' },
        { x: 64, y: 4, type: 'F' },
        { x: 75, y: 2, type: 'c' }, { x: 76, y: 2, type: 'c' },
        { x: 75, y: 8, type: 'c' }, { x: 76, y: 8, type: 'c' },

        // --- Sequence C: The High Speed Zone ---
        { x: 87, y: 1, type: 'B' }, { x: 87, y: 2, type: 'J' },

        // Mid-High Platform Chain
        { x: 90, y: 6, type: 'B' }, { x: 92, y: 7, type: 'B' }, { x: 94, y: 8, type: 'B' },
        { x: 96, y: 8, type: 'B' }, { x: 98, y: 8, type: 'B' },
        // NEW: Orbital Layer
        { x: 90, y: 13, type: 'B' }, { x: 92, y: 14, type: 'B' }, { x: 94, y: 15, type: 'B' },
        { x: 96, y: 15, type: 'O' }, { x: 98, y: 15, type: 'O' }, { x: 100, y: 15, type: 'O' },

        { x: 94, y: 10, type: 'F' }, // Enemy below the orbital layer
        { x: 92, y: 5, type: 'O' },
        { x: 97, y: 5, type: 'O' },

        { x: 105, y: 1, type: 'J' },
        { x: 108, type: 'W' },
        { x: 106, y: 6, type: 'F' }, { x: 106, y: 8, type: 'F' },

        // --- Mid-Section: Sky Hospital Towers ---
        { x: 120, y: 1, type: 'J' },
        { x: 122, y: 5, type: 'B' }, { x: 124, y: 6, type: 'B' },
        { x: 126, y: 8, type: 'C' }, { x: 128, y: 8, type: 'C' }, { x: 130, y: 8, type: 'C' },
        // NEW: Roof Top Run
        { x: 122, y: 13, type: 'B' }, { x: 124, y: 13, type: 'B' }, { x: 126, y: 13, type: 'B' },
        { x: 128, y: 14, type: 'O' }, { x: 130, y: 14, type: 'O' }, { x: 132, y: 14, type: 'O' },

        { x: 132, y: 9, type: 'B' }, { x: 133, y: 9, type: 'B' }, { x: 134, y: 9, type: 'B' },
        { x: 133, y: 10, type: 'E' },
        { x: 136, y: 7, type: 'F' }, { x: 138, y: 6, type: 'F' },

        // --- Section D: Infection High & Low ---
        { x: 150, y: 0, type: 'E' }, { x: 152, y: 0, type: 'E' },
        { x: 150, y: 4, type: 'B' }, { x: 152, y: 5, type: 'B' }, { x: 154, y: 6, type: 'B' },
        // NEW: High Infection Zone
        { x: 150, y: 12, type: 'B' }, { x: 152, y: 12, type: 'B' }, { x: 154, y: 12, type: 'B' },
        { x: 156, y: 13, type: 'O' }, { x: 158, y: 13, type: 'O' }, { x: 160, y: 13, type: 'O' },

        { x: 160, y: 3, type: 'F' }, { x: 162, y: 3, type: 'F' },
        { x: 160, y: 8, type: 'F' }, // Enemy between layers

        // --- Section E: The Great Wall Climb ---
        { x: 180, type: 'H' }, { x: 181, type: 'H' },
        { x: 180, y: 3, type: 'B' }, { x: 182, y: 5, type: 'B' }, { x: 184, y: 7, type: 'B' },
        { x: 186, y: 9, type: 'J' },
        // NEW: Peak Performance
        { x: 186, y: 14, type: 'O' }, { x: 188, y: 14, type: 'O' }, { x: 190, y: 15, type: 'O' },
        { x: 192, y: 13, type: 'F' }, // Guarding the peak

        { x: 190, y: 1, type: 'S' },
        { x: 190, y: 11, type: 'O' },

        // --- Section F: Cloud City Sprint ---
        { x: 220, y: 1, type: 'B' }, { x: 220, y: 2, type: 'J' },
        { x: 224, y: 6, type: 'C' }, { x: 226, y: 7, type: 'C' }, { x: 228, y: 8, type: 'C' },
        { x: 230, y: 9, type: 'O' },
        // NEW: Top of the Clouds
        { x: 224, y: 13, type: 'C' }, { x: 226, y: 13, type: 'C' }, { x: 228, y: 13, type: 'C' },
        { x: 230, y: 14, type: 'O' }, { x: 232, y: 14, type: 'O' }, { x: 234, y: 14, type: 'O' },

        { x: 232, y: 8, type: 'C' }, { x: 234, y: 7, type: 'C' },
        { x: 230, y: 3, type: 'F' },
        { x: 230, y: 11, type: 'F' },

        // --- Section G: Final Descent ---
        { x: 260, y: 0, type: 'E' }, { x: 265, y: 0, type: 'E' },
        { x: 262, y: 5, type: 'B' }, { x: 264, y: 5, type: 'B' }, { x: 263, y: 6, type: 'E' },
        { x: 270, type: 'H' }, { x: 271, type: 'H' }, { x: 272, type: 'H' },
        { x: 271, y: 4, type: 'T' },
        { x: 271, y: 8, type: 'F' },

        // Finish Dash
        { x: 280, y: 1, type: 'J' },
        { x: 285, y: 6, type: 'O' }, { x: 290, y: 7, type: 'B' }, { x: 295, y: 8, type: 'B' },
        { x: 298, y: 9, type: 'c' }, { x: 299, y: 9, type: 'c' },
        // NEW: Final High Loop
        { x: 285, y: 13, type: 'O' }, { x: 288, y: 14, type: 'O' }, { x: 291, y: 15, type: 'O' },

        { x: 300, type: 'W' }
    ],

    // Stage 5: Final Ascent (Pacing: Dash -> Storm -> Rest -> Dash)
    5: [
        // --- Start: Safe Zone (0-50 blocks) ---
        // Nothing here

        // --- Wave 2: Relay 1 ---
        { x: 60, y: 5, type: 'B' },
        { x: 60, y: 6, type: 'X' }, { x: 60, y: 7, type: 'X' }, { x: 60, y: 8, type: 'X' }, { x: 60, y: 9, type: 'X' },

        // Storm 2
        { x: 68, y: 6, type: 'F' }, { x: 70, y: 6, type: 'F' }, { x: 72, y: 6, type: 'F' },
        { x: 70, y: 0, type: 'E' }, { x: 72, y: 0, type: 'E' }, { x: 74, y: 0, type: 'E' },

        // Rest Area 2
        { x: 80, y: 0, type: 'c' }, { x: 85, y: 0, type: 'S' }, // Small turbo pickup in rest area

        // --- Wave 3: Relay 2 ---
        { x: 100, y: 5, type: 'B' },
        { x: 100, y: 6, type: 'X' }, { x: 100, y: 7, type: 'X' }, { x: 100, y: 8, type: 'X' }, { x: 100, y: 9, type: 'X' },

        // Storm 3
        { x: 108, y: 8, type: 'F' }, { x: 110, y: 7, type: 'F' }, { x: 112, y: 6, type: 'F' },
        { x: 114, y: 5, type: 'F' }, { x: 116, y: 4, type: 'F' },

        // Rest Area 3
        { x: 125, y: 0, type: 'c' }, { x: 130, y: 0, type: 'c' },

        // --- Wave 4: Relay 3 ---
        { x: 145, y: 5, type: 'B' },
        { x: 145, y: 6, type: 'X' }, { x: 145, y: 7, type: 'X' }, { x: 145, y: 8, type: 'X' }, { x: 145, y: 9, type: 'X' },

        // Storm 4 (Dense)
        { x: 152, y: 5, type: 'F' }, { x: 154, y: 5, type: 'F' }, { x: 156, y: 5, type: 'F' },
        { x: 152, y: 0, type: 'E' }, { x: 154, y: 0, type: 'E' }, { x: 156, y: 0, type: 'E' },

        // Rest Area 4
        { x: 165, y: 0, type: 'c' }, { x: 170, y: 1, type: 'B' }, { x: 170, y: 2, type: 'J' },

        // --- Wave 5: Relay 4 ---
        { x: 185, y: 5, type: 'B' },
        { x: 185, y: 6, type: 'X' }, { x: 185, y: 7, type: 'X' }, { x: 185, y: 8, type: 'X' }, { x: 185, y: 9, type: 'X' },

        // Storm 5 (Final Charge)
        { x: 195, y: 4, type: 'F' }, { x: 195, y: 8, type: 'F' },
        { x: 197, y: 3, type: 'F' }, { x: 197, y: 7, type: 'F' },

        // Final Rest / Goal Area
        { x: 210, y: 0, type: 'c' }, { x: 215, y: 0, type: 'c' },

        { x: 230, type: 'W' },

    ]
};
