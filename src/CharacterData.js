
// スプライトシートの共通設定定義
// 新しいキャラクターを追加する際はこのファイルを編集してください

/**
 * 8x4分割 (クアドラント) レイアウト用ヘルパー
 * 左上: ジャンプ, 右上: 待機
 * 左下: 走る, 右下: 滑空
 */
export const SheetLayouts = {
    // 今回作成したカノン用レイアウト (走りが1行、他は2行)
    KANON_QUADRANT: {
        cols: 8,
        rows: 4,
        maxFrames: 8,
        states: {
            // [row, colOffset, colSpan, rowSpan, frames, scale]
            jump: { row: 0, colOffset: 0, cols: 4, rows: 2, frames: 8, scale: 1.0 }, // 左上
            idle: {
                row: 0, colOffset: 4, cols: 4, rows: 1, frames: 4, scale: 1.0, frameInterval: 12,
                offsetY: 4, offsetX: 4
            }, // 右上 (Upper half only)
            run: {
                row: 2, colOffset: 0, cols: 4, rows: 1, frames: 4, scale: 1.0, frameInterval: 12,
                trimTop: 8,  // 上のノイズ除去 (Increased to 8)
                trimLeft: 42 // 左の大きなノイズ除去 (Increased to 42)
            }, // 左下 (1行) - 4フレームなので少し遅くして滑らかに
            glide: {
                row: 2, colOffset: 4, cols: 4, rows: 2, frames: 8, scale: 1.0,
                trimLeft: 30, trimRight: 30 // 滑空時の左右ノイズ除去 (Increased to 30)
            }  // 右下
        }
    },
    // カノンV2: 1行=1モーションの素直な8x4レイアウト
    // Row 0: idle / Row 1: run / Row 2: jump / Row 3: glide
    KANON_STRIP_V2: {
        cols: 8,
        rows: 4,
        maxFrames: 8,
        states: {
            idle:  {
                row: 0, cols: 8, frames: 8, scale: 1.0, frameInterval: 12,
                sourceOffsetY: 12
            },
            run:   {
                row: 0, cols: 8, frames: 8, scale: 1.0, frameInterval: 4,
                spriteKey: 'player_run',
                sheetCols: 8,
                sheetRows: 1,
                // The strip already has identical foot baselines, so keep Y untouched.
                // Tiny X-only corrections reduce torso/head wobble without changing the art.
                frameOffsets: {
                    0: { x: -1 },
                    2: { x: 2 },
                    3: { x: -1 },
                    4: { x: -1 },
                    6: { x: 1 }
                }
            },
            jump:  {
                row: 2, cols: 8, frames: 8, scale: 1.0, frameInterval: 6,
                sourceOffsetY: 10
            },
            glide: { row: 3, cols: 8, frames: 8, scale: 1.0, frameInterval: 8 }
        }
    },
    // 標準的なアリスのような1枚シート (行ごとに状態が分かれているタイプ)
    STANDARD_STRIP: {
        cols: 8,
        rows: 4,
        maxFrames: 4,
        states: {
            idle: { row: 0, frames: 4 },
            run: { row: 1, frames: 4 },
            jump: { row: 2, frames: 4 },
            glide: { row: 2, frames: 4, colOffset: 4 } // ジャンプ行の後半を使用
        }
    },
    // モーション別 4x4 シート (待機/走る/ジャンプ/滑空を別ファイルで持つ)
    SEPARATE_4X4: {
        type: 'SEPARATE',
        cols: 4,
        rows: 4,
        maxFrames: 16,
        states: {
            idle: { frames: 16, cols: 4, rows: 4, frameInterval: 10 },
            run: { frames: 16, cols: 4, rows: 4, frameInterval: 5 },
            jump: { frames: 16, cols: 4, rows: 4, frameInterval: 5 },
            glide: { frames: 16, cols: 4, rows: 4, frameInterval: 6 }
        }
    }
};

export const CHARACTERS = [
    {
        id: 'alice',
        name: 'ALICE',
        spriteFile: 'player_alice.png',
        transparencyKey: null,
        titleImage: 'title_alice.png',
        description: 'ふわふわで元気なうさぎ',
        theme: {
            primaryColor: '#FFD700',
            secondaryColor: '#FFA500',
            backgroundColor: 'rgba(255, 215, 0, 0.1)'
        },
        stats: { speed: 1.0, jump: 1.0 },
        animation: {
            type: 'SHEET',
            ...SheetLayouts.STANDARD_STRIP,
            frameInterval: 10,
            visualOffsetY: 14, // アリスのスプライトは下に余白があるため
            renderEffect: {
                shadowBlur: 4,
                shadowColor: 'rgba(0, 0, 0, 0.4)'
            }
        },
        speechLines: [
            "ぴょんぴょん！今日も絶好調だよ！",
            "お耳ピーン！準備はいつでもOK！",
            "世界一高く跳んじゃうもんね、見てて！",
            "ねえねえ、いっしょにかけっこしよう？",
            "お散歩？お散歩いくの！？わーい！"
        ]
    },
    {
        id: 'kanon',
        name: 'KANON',
        spriteFile: 'kanon_idle.png',
        spriteFallbackFile: 'KANONmotion.png',
        spriteFiles: {
            idle: 'kanon_idle.png',
            run: 'kanon_run.png',
            jump: 'kanon_jump.png',
            glide: 'kanon_glide.png'
        },
        titleImage: 'title_kanon.png',
        transparencyKey: null,
        description: 'クールで知的な電子少女',
        theme: {
            primaryColor: '#FF69B4',
            secondaryColor: '#DDA0DD',
            backgroundColor: 'rgba(255, 182, 193, 0.15)'
        },
        stats: { speed: 1.0, jump: 1.0 },
        animation: {
            ...SheetLayouts.SEPARATE_4X4,
            frameInterval: 6,
            bleed: 2.0,
            visualOffsetY: 0,
            renderEffect: {
                shadowBlur: 4,
                shadowColor: '#000000'
            }
        },
        speechLines: [
            "……行くわよ。準備はいい？",
            "効率的に進めましょう。",
            "この程度、想定内ね。",
            "無駄な動きは嫌いよ。",
            "……別に、心配してるわけじゃないんだから。"
        ]
    }
];
