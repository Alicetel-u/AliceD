/**
 * EndingData.js
 * エンディングのストーリーデータと演出定義
 * 
 * ■ 画像の差し替え方法:
 * エンディング用画像は `public/assets/img/ending/` フォルダ内で管理されます。
 * 各シーンの `image` プロパティに対応するファイル（例: kanon_wake.webp）を同フォルダに配置してください。
 * 指定がない場合は背景色や既存のアセットが使用されます。
 */

export const EndingData = {
    // アリス（ウサギ）視点のトゥルーエンド
    ALICE_TRUE: [
        {
            "id": 1,
            "type": "scene",
            "text": [
                "「お願い…！ 神様…！」"
            ],
            "subText": "アリスは最後の力を振り絞り、天を見上げた。",
            "image": "aliceend1.webp",
            "bgColor": "#fff",
            "duration": 4000,
            "fade": "in"
        },
        {
            "id": 2,
            "type": "scene",
            "text": [
                "「私の命… 残りの全部をあげるから…！」",
                "「カノンちゃんを連れて行かないで！！」"
            ],
            "image": "aliceend2.webp",
            "effect": "shake",
            "duration": 5000,
            "subText": ""
        },
        {
            "id": 3,
            "type": "blackout",
            "text": [
                "その願いは, 皮肉にも届いてしまった。"
            ],
            "subText": "目の前の『神』だと思っていた存在は, 命を刈り取る『死神』だったのだから。",
            "bgColor": "#000",
            "duration": 6000
        },
        {
            "id": 4,
            "type": "scene",
            "bgColor": "#000",
            "text": [
                "(ピッ… ピッ… ピッ… )"
            ],
            "subText": "静寂な病室に, 無機質な電子音が響き渡る。",
            "duration": 4000
        },
        {
            "id": 5,
            "type": "scene",
            "bgColor": "#000",
            "text": [
                "「…先生！ バイタルが戻りました！」",
                "「奇跡だ… あの状態から持ち直すなんて…」"
            ],
            "effect": "flash_white",
            "duration": 4000,
            "subText": ""
        },
        {
            "id": 6,
            "type": "image",
            "image": "aliceend3.webp",
            "fallbackColor": "#ffd1dc",
            "text": [
                "「…ん……」",
                "(ここは… 病院…？)"
            ],
            "subText": "長い夢からカノンは目を覚ました。身体は重いが, どこか温かい。まるで誰かに守られていたような…。",
            "duration": 8000
        },
        {
            "id": 8,
            "type": "image",
            "image": "aliceend4.webp",
            "fallbackColor": "#ff9ff3",
            "text": [
                "傍らには, まるで奏音を待つかのように",
                "ウサギの人形が静かに佇んでいた。"
            ],
            "subText": "もう二度と動くことはないけれど, その顔は, 優しく微笑んでいるように見えた。",
            "duration": 10000,
            "textOffsetY": 150
        },
        {
            "id": 10,
            "type": "image",
            "image": "aliceend5.webp",
            "text": [
                "「ありがとう… アリス…」"
            ],
            "duration": 5000,
            "subText": ""
        },
        {
            "id": 99,
            "type": "fin",
            "text": [
                "Fin"
            ],
            "subText": "Thank you for playing.",
            "duration": 99999
        }
    ],

    // カノン（奏音）視点のトゥルーエンド
    KANON_TRUE: [
        {
            "id": 1,
            "type": "scene",
            "bgColor": "#a29bfe",
            "filter": "sepia(60%)",
            "text": [
                "アリスと私は、いつも一緒だった。"
            ],
            "subText": "でも、私の入院で、二人は離れ離れになってしまった。",
            "duration": 5000,
            "fade": "in",
            "image": "kanonend3.webp",
            "textOffsetY": -50
        },
        {
            "id": 2,
            "type": "scene",
            "bgColor": "#000",
            "text": [
                "治療のため、私の脳波は電子の世界へ送られた。"
            ],
            "subText": "それが、この世界の『カノン』。",
            "duration": 5000,
            "image": "kanonend2.webp",
            "textOffsetY": -50
        },
        {
            "id": 3,
            "type": "scene",
            "effect": "shake",
            "text": [
                "命の灯火が消えかけた、その時――"
            ],
            "subText": "奇跡が起きた。",
            "duration": 4000
        },
        {
            "id": 4,
            "type": "blackout",
            "text": [
                "温かい……"
            ],
            "subText": "どうして助かったのか、理屈じゃなく心でわかった。",
            "duration": 4000
        },
        {
            "id": 5,
            "type": "scene",
            "image": "kanonend1.webp",
            "text": [
                "『アリスと、一緒になったんだね』"
            ],
            "duration": 5000,
            "subText": ""
        },
        {
            "id": 6,
            "type": "scene",
            "image": "aliceend3.webp",
            "filter": "brightness(120%)",
            "text": [
                "(……ん……)"
            ],
            "subText": "光が溢れ、私は現実の『奏音』として目を覚ます。",
            "duration": 4000
        },
        {
            "id": 7,
            "type": "image",
            "image": "aliceend4.webp",
            "text": [
                "胸の中に感じる、確かな温もり。"
            ],
            "duration": 5000,
            "subText": "",
            "noFadeOut": true,
            "noAnim": true,
            "textOffsetY": 150
        },
        {
            "id": 8,
            "type": "image",
            "image": "aliceend4.webp",
            "text": [
                "傍らにウサギの人形が、誰かを待ってるみたいに。"
            ],
            "subText": "もうただの人形かもしれない。でも、私の心にはキミがいる。",
            "duration": 6000,
            "noFadeIn": true,
            "noAnim": true,
            "textOffsetY": 150
        },
        {
            "id": 9,
            "type": "image",
            "image": "aliceend5.webp",
            "text": [
                "「ずっと一緒だよ、アリス」"
            ],
            "duration": 5000,
            "subText": ""
        },
        {
            "id": 99,
            "type": "fin",
            "text": [
                "Fin"
            ],
            "subText": "True Ending - Kanon & Alice",
            "duration": 15000
        }
    ]
};
