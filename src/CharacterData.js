
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
        spriteFile: 'KANONmotion.png',
        titleImage: 'title_kanon.png',
        transparencyKey: null,
        description: 'クールで知的な電子少女',
        theme: {
            primaryColor: '#FF69B4',
            secondaryColor: '#DDA0DD',
            backgroundColor: 'rgba(255, 182, 193, 0.15)'
        },
        stats: { speed: 1.0, jump: 1.0 },
        // ここで定義したレイアウトを使用
        animation: {
            type: 'SHEET',
            ...SheetLayouts.KANON_QUADRANT,
            frameInterval: 6,
            bleed: 4.0, // Aggressive bleed to guarantee no edge noise from non-integer height (147.5px)
            visualOffsetY: 0, // カノンのスプライトは余白が少ない（または異なる）ため
            renderEffect: {
                shadowBlur: 4,   // より太い淵取り
                shadowColor: '#000000' // 黒い淵取り
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
