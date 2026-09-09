
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
            idle:  { row: 0, cols: 8, frames: 8, scale: 1.0, frameInterval: 12 },
            run:   { row: 1, cols: 8, frames: 8, scale: 1.0, frameInterval: 5 },
            jump:  { row: 2, cols: 8, frames: 8, scale: 1.0, frameInterval: 6 },
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
        spriteFile: 'KANONmotion_v2.png',
        spriteFallbackFile: 'KANONmotion.png', // V2 asset未配置時も旧スプライトで安全に起動
        titleImage: 'title_kanon.png',
        transparencyKey: null,
        description: 'クールで知的な電子少女',
        theme: {
            primaryColor: '#FF69B4',
            secondaryColor: '#DDA0DD',
            backgroundColor: 'rgba(255, 182, 193, 0.15)'
        },
        stats: { speed: 1.0, jump: 1.0 },
        // V2は整数グリッドの8x4。旧シート向けの大きなtrim/bleed補正は使わない
        animation: {
            type: 'SHEET',
            ...SheetLayouts.KANON_STRIP_V2,
            frameInterval: 8,
            bleed: 0,
            leftGuard: 0,
            visualOffsetY: 0,
            renderEffect: {
                shadowBlur: 2,
                shadowColor: 'rgba(0, 0, 0, 0.45)'
            }
        },
        // 新画像がまだ配信されていない場合だけ旧KANONmotion.png用設定へ戻す
        fallbackAnimation: {
            type: 'SHEET',
            ...SheetLayouts.KANON_QUADRANT,
            frameInterval: 6,
            bleed: 4.0,
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
