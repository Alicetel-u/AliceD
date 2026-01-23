
export const DialogueData = {
    // --- STAGE 1 (Forest of Rabbits) ---
    // Story: Alice starts her journey to find Kanon who disappeared.
    'STAGE1_OPENING': [
        {
            "name": "アリス",
            "text": "いい天気！今日こそ大好きなあのこを見つけるよっ！",
            "side": "left",
            "image": "alicetalk1"
        },
        {
            "name": "アリス",
            "text": "邪魔する敵はふっ飛ばしちゃうからね！",
            "side": "left",
            "image": "alicetalk1"
        }
    ],
    'STAGE1_MID': [
        { name: "アリス", text: "ふぅ…意外と道が長いなぁ。", side: "left", image: "alicetalk1" },
        { name: "アリス", text: "でも負けない！ニンジンパワーで突き進むよ！", side: "left", image: "alicetalk1" }
    ],
    'STAGE1_BOSS_START': [
        {
            "name": "月の守護者：モチツキ・タイタン",
            "text": "我は月の守護者、モチツキ・タイタン！",
            "side": "right",
            "image": ""
        },
        {
            "name": "月の守護者：モチツキ・タイタン",
            "text": "この先の聖地へは通さん！餅にしてやる！",
            "side": "right",
            "image": "",
            "keepLeft": true
        },
        {
            "name": "アリス",
            "text": "お餅も好きだけど…今はニンジンが食べたいの！どいてよ！",
            "side": "left",
            "image": "alicetalk1",
            "keepRight": true
        }
    ],
    'STAGE1_BARRIER_BREAK': [
        {
            "name": "モチツキ・タイタン",
            "text": "ぐぬぬ…我が結界が…！",
            "side": "right",
            "image": ""
        },
        {
            "name": "アリス",
            "text": "チャンス！今なら<span style='color:#f1c40f;'>ジャンプ攻撃</span>が通じるよっ！",
            "side": "left",
            "image": "alicetalk1"
        }
    ],
    'STAGE1_BOSS_DEFEAT': [
        {
            "name": "月の守護者：モチツキ・タイタン",
            "text": "み、見事だ…まさかウサギに負けるとは…。",
            "side": "right",
            "image": ""
        },
        {
            "name": "アリス",
            "text": "やったー！私の勝ちね！",
            "side": "left",
            "image": "alicetalk1",
            "keepRight": true
        },
        {
            "name": "アリス",
            "text": "さあ、新しい場所へ！カノンちゃんを探しに行こう！",
            "side": "left",
            "image": "alicetalk1"
        }
    ],

    // --- STAGE 2 (Monastery) ---
    // Story: Alice finds a bad sister, defeats her, and sees she looks like Kanon.
    'STAGE2_OPENING': [
        { name: "アリス", text: "なんだか怪しげな修道院に来ちゃった。", side: "left", image: "alicetalk1" },
        { name: "アリス", text: "カノンちゃん、こんなところにいるのかな…？", side: "left", image: "alicetalk1" }
    ],
    'STAGE2_MID': [
        { name: "アリス", text: "暗くて怖いけど、勇気を出して進まなきゃ！", side: "left", image: "alicetalk1" },
        { name: "アリス", text: "誰かが見てる気がする…。", side: "left", image: "alicetalk1" }
    ],
    'STAGE2_BOSS_START': [
        { name: "深淵の幻影：シスター？？？", text: "迷える子ウサギよ……。その小さな体で、いつまで『希望』なんて重い荷物を背負い続けるのですか？", side: "right", image: "boss_sister_s" },
        { name: "アリス", text: "なんてこと言うの！ あなたみたいな悪いシスターさんは、私が成敗するんだから！", side: "left", image: "alicetalk1", keepRight: true },
        { name: "深淵の幻影：シスター？？？", text: "成敗……？ ふふ、違いますよ。私はただ、この辛い物語の『幕』を下ろしてあげたいだけなのです。", side: "right", image: "boss_sister_s", keepLeft: true }
    ],
    'STAGE2_BARRIER_BREAK': [
        {
            "name": "深淵の幻影：シスター？？？",
            "text": "ああ……なぜ拒むのです？ 諦めれば、楽になれるというのに……！",
            "side": "right",
            "image": "boss_sister_k"
        },
        {
            "name": "アリス",
            "text": "えっ……その顔……ウソでしょ！？",
            "side": "left",
            "image": "alicetalk1"
        },
        {
            "name": "アリス",
            "text": "カノンちゃん！？ どうして！？なんで……！",
            "side": "left",
            "image": "alicetalk1"
        }
    ],
    'STAGE2_BOSS_DEFEAT': [
        { name: "カノン？", text: "……痛いよ、アリス……。もう、何もかも疲れちゃったよ……。", side: "right", image: "boss_sister_k" },
        { name: "アリス", text: "待って！ 説明してよカノンちゃん！", side: "left", image: "alicetalk1", keepRight: true },
        { name: "カノン？", text: "（悲しげな祈りの言葉を残し、彼女は霧のように消えた……）", side: "right", image: "hidden" },
        { name: "アリス", text: "なんで……どうして……。", side: "left", image: "alicetalk1" }
    ],

    // --- STAGE 3 (Toy Box) ---
    // Story: Alice realizes she is a stuffed rabbit, old and worn out, but dedicated to saving Kanon.
    'STAGE3_OPENING': [
        {
            "name": "アリス",
            "text": "おもちゃがいっぱい……。ねえ、私の体、少し糸がほつれてない？",
            "side": "left",
            "image": "alicetalk1"
        },
        {
            "name": "アリス",
            "text": "カノンちゃんに直してもらわなきゃ。……あれ、糸って何？",
            "side": "left",
            "image": "alicetalk1"
        }
    ],
    'STAGE3_MID': [
        { name: "アリス", text: "思い出した……。私、ずっとカノンちゃんのベッドの横にいた。", side: "left", image: "alicetalk1" },
        { name: "アリス", text: "カノンちゃんが苦しい時、ずっと手を握って……ううん、握られていたんだ。", side: "left", image: "alicetalk1" }
    ],
    'STAGE3_BOSS_START': [
        { name: "キング・レゴロ", text: "我は玩具の王なり。古びたウサギよ、汝の役目は終わったのだ。", side: "right", image: "boss_toy_king" },
        { name: "キング・レゴロ", text: "綿は痩せ、色は褪せた。主（あるじ）も居らぬ今、土に還るがよい！", side: "right", image: "boss_toy_king", keepLeft: true },
        { name: "アリス", text: "違う！ 私の役目は終わってない！ カノンちゃんが待ってるの！", side: "left", image: "alicetalk1" }
    ],
    'STAGE3_BARRIER_BREAK': [
        {
            "name": "キング・レゴロ",
            "text": "認めよ！ 汝の時間はもう残されていないのだ！",
            "side": "right",
            "image": "boss_toy_king"
        },
        {
            "name": "アリス",
            "text": "分かってるよ！ 私が一番分かってる！ だから……！",
            "side": "left",
            "image": "alicetalk1"
        },
        {
            "name": "アリス",
            "text": "このボロボロの体でも、最後に一つだけできることがあるはず！！",
            "side": "left",
            "image": "alicetalk1"
        }
    ],
    'STAGE3_BOSS_DEFEAT': [
        { name: "キング・レゴロ", text: "見事なり……。その灯火、主のために使い果たすが良い……。", side: "right", image: "boss_toy_king_weak" },
        { name: "アリス", text: "ありがとう、王様。私、行くね。", side: "left", image: "alicetalk1", keepRight: true },
        { name: "アリス", text: "私の命、(カノン)ちゃんの笑顔のためにあるんだ。最後の灯、全部あの子に届けるよ！", side: "left", image: "alicetalk1" }
    ],

    // --- STAGE 4 (Hospital) ---
    // Story: Alice learns Kanon is terminally ill and she herself is ending her life.
    'STAGE4_OPENING': [
        { name: "アリス", text: "急に景色が寂しくなった…。消毒液の匂いがする。", side: "left", image: "alicetalk1" },
        { name: "アリス", text: "ここはカノンちゃんが入院していた病院…だよね。", side: "left", image: "alicetalk1" }
    ],
    'STAGE4_MID': [
        { name: "アリス", text: "カノンちゃん、病気でずっと一人ぼっちだった。", side: "left", image: "alicetalk1" },
        { name: "アリス", text: "私はずっとそばにいた。カノンちゃんが眠るまで、ずっと。", side: "left", image: "alicetalk1" }
    ],
    'STAGE4_BOSS_START': [
        { name: "絶望に至る病：KANON", text: "いたい……くるしい……。誰か……この痛みを止めて……。", side: "right", image: "boss_nurse" },
        { name: "アリス", text: "カノンちゃん！？ ……ううん、違う。これはカノンちゃんの「痛み」そのものなんだ。", side: "left", image: "alicetalk1", keepRight: true },
        { name: "絶望に至る病：KANON", text: "アリス……助けて……壊して……。もう楽になりたいの……！", side: "right", image: "boss_nurse", keepLeft: true },
        { name: "アリス", text: "ごめんね……今すぐ楽にしてあげる。だから、許して……！", side: "left", image: "alicetalk1", keepRight: true }
    ],
    'STAGE4_BARRIER_BREAK': [
        { name: "絶望に至る病：KANON", text: "ああっ！！ 痛い！ でも……体が、軽くなっていく……。", side: "right", image: "boss_nurse" },
        { name: "アリス", text: "泣かないで！ 私が全部背負うから！ その苦しみも、絶望も！", side: "left", image: "alicetalk1" }
    ],
    'STAGE4_BOSS_DEFEAT': [
        { name: "絶望に至る病：KANON", text: "ありがとう、アリス……。やっと、眠れる……。", side: "right", image: "boss_nurse_weak" },
        { name: "アリス", text: "おやすみ……。でも、まだ終わりじゃない。", side: "left", image: "alicetalk1", keepRight: true },
        { name: "アリス", text: "待ってて、本物のカノンちゃん。今度こそ、私が守ってみせるから！", side: "left", image: "alicetalk1" }
    ],

    // --- STAGE 5 (Heaven's Stairs) ---
    // Story: Alice reaches Heaven, finds God (Reaper), sacrifices her life to save Kanon.
    'STAGE5_OPENING': [
        { name: "アリス", text: "なにここ…空気がとても澄んでいる。", side: "left", image: "alicetalk1" },
        { name: "アリス", text: "ここが天国の階段。一番上まで行けば、願いを叶えてくれるかな。", side: "left", image: "alicetalk1" }
    ],
    'STAGE5_MID': [
        { name: "アリス", text: "わたしの最後の命、振り絞るよっ！", side: "left", image: "alicetalk1" },
        { name: "アリス", text: "待っててね、カノンちゃん。今助けるから！", side: "left", image: "alicetalk1" }
    ],
    'STAGE5_BOSS_START': [
        { name: "デウス・エクス", text: "よく来たな、地上のうさぎよ。", side: "right", image: "boss_god" },
        { name: "アリス", text: "あなたは神様？お願い、カノンちゃんの病気を治して！", side: "left", image: "alicetalk1", keepRight: true },
        { name: "アリス", text: "……もちろん。私の命、全部使っていいよ。", side: "left", image: "alicetalk1", keepRight: true },
        { name: "デウス・エクス", text: "アレは私が連れて行くと決めた、初めから決めていたのだ。", side: "right", image: "boss_god", keepLeft: true },
        { name: "デウス・エクス", text: "彼女の魂の輝きを刈り取る、それが理（ことわり）なのだよ。", side: "right", image: "boss_god", keepLeft: true },
        { name: "アリス", text: "そんな理（ことわり）……", side: "left", image: "alicetalk1", keepRight: true },
        { name: "アリス", text: "<span class='text-impact'>わたしが全部壊してやるっ！！</span>", side: "left", image: "alicetalk1", keepRight: true }
    ],
    'STAGE5_BARRIER_BREAK': [
        { name: "デウス・エクス", text: "素晴らしい輝きだ。だが、死神の鎌からは逃れられん！", side: "right", image: "boss_reaper" },
        { name: "アリス", text: "死神！？あなたがカノンちゃんを連れて行こうとしてるの！？", side: "left", image: "alicetalk1" },
        { name: "アリス", text: "そんなの、絶対に許さないんだから！！", side: "left", image: "alicetalk1" }
    ],
    'STAGE5_BOSS_DEFEAT': [
        { name: "アリス", text: "あ……体が光ってる……。", side: "left", image: "alicetalk1", keepRight: true },
        { name: "カノンの声", text: "アリス……？", side: "right", image: "hidden" },
        { name: "アリス", text: "あはは、カノンちゃん。おはよう。……バイバイ。", side: "left", image: "alicetalk1" }
    ],

    // ==========================================
    // --- KANON'S STORY (Digital World Survival) ---
    // ==========================================

    // --- STAGE 1 : Rabbit Forest ---
    // Story: Kanon wakes up alone, resisting "cleanup" programs.
    // --- STAGE 1 : Rabbit Forest ---
    // Story: Kanon is cheerful but senses something is slightly off.
    'STAGE1_OPENING_KANON': [
        { name: "カノン", text: "あれ？ アリスがいない……。かくれんぼかな？", side: "left", image: "kanontalk1" },
        { name: "カノン", text: "もー、しょうがないなぁ。すぐ見つけてあげるからね！", side: "left", image: "kanontalk1" }
    ],
    'STAGE1_MID_KANON': [
        { name: "カノン", text: "綺麗な森……。でも、なんだかキラキラしすぎてるかも？", side: "left", image: "kanontalk1" },
        { name: "カノン", text: "ねえアリスー！ どこー？ おやつ食べて待っててもいいんだよー！", side: "left", image: "kanontalk1" }
    ],
    'STAGE1_BOSS_START_KANON': [
        { name: "不要データ排除：モチツキ・タイタン", text: "ピー……ガガ……未確認オブジェクト……排除……。", side: "right", image: "boss_mochitsuki" },
        { name: "カノン", text: "わっ、びっくりした！ なにこのロボット、ちょっと通りたいだけなんですけど！", side: "left", image: "kanontalk1", keepRight: true },
        { name: "不要データ排除：モチツキ・タイタン", text: "バグ駆除モード起動。ターゲットロック。", side: "right", image: "boss_mochitsuki", keepLeft: true }
    ],
    'STAGE1_BARRIER_BREAK_KANON': [
        { name: "不要データ排除：モチツキ・タイタン", text: "装・甲・破・損……警告……。", side: "right", image: "boss_mochitsuki" },
        { name: "カノン", text: "もう、しつこいなぁ！ 私、急いでるんだから邪魔しないでよ！", side: "left", image: "kanontalk1" }
    ],
    'STAGE1_BOSS_DEFEAT_KANON': [
        { name: "不要データ排除：モチツキ・タイタン", text: "システム……ダウン……。", side: "right", image: "boss_mochitsuki" },
        { name: "カノン", text: "ふぅ、やっと通れる。待っててねアリス、今行くよー！", side: "left", image: "kanontalk1" }
    ],

    // --- STAGE 2 : Mysterious Monastery ---
    // Story: A hint of sadness. The enemy reflects her hidden resignation.
    'STAGE2_OPENING_KANON': [
        { name: "カノン", text: "ここ、随分と静かだね……。なんだか、少し寂しいかも。", side: "left", image: "kanontalk1" },
        { name: "カノン", text: "アリス、こんな暗いところに隠れてるの？ 怖くない？", side: "left", image: "kanontalk1" }
    ],
    'STAGE2_MID_KANON': [
        { name: "カノン", text: "……誰かの声がする。ずっと祈ってるみたい。", side: "left", image: "kanontalk1" },
        { name: "カノン", text: "「もう楽になっていい」……？ なにそれ、変な言葉。", side: "left", image: "kanontalk1" }
    ],
    'STAGE2_BOSS_START_KANON': [
        { name: "深淵の幻影：シスター？？？", text: "おかわいそうな方……迷い続けているのですね。", side: "right", image: "boss_sister_s" },
        { name: "カノン", text: "誰？ 私は迷ってないよ、友達を探してるだけだもん。", side: "left", image: "kanontalk1", keepRight: true },
        { name: "深淵の幻影：シスター？？？", text: "いいえ、あなたは探しているのではなく、逃げているのです。「終わり」から。", side: "right", image: "boss_sister_s", keepLeft: true }
    ],
    'STAGE2_BARRIER_BREAK_KANON': [
        { name: "深淵の幻影：シスター？？？", text: "ああ……拒絶するのですか？ こんなにも穏やかな「諦め」を。", side: "right", image: "boss_sister_k" },
        { name: "カノン", text: "諦めるなんて言葉、大っ嫌い！ 私は絶対に見つけるまでは止まらない！", side: "left", image: "kanontalk1" }
    ],
    'STAGE2_BOSS_DEFEAT_KANON': [
        { name: "深淵の幻影：シスター？？？", text: "そうですか……では、進みなさい。その先に待つのが絶望だとしても。", side: "right", image: "boss_sister_k" },
        { name: "カノン", text: "……消えちゃった。あの人、私と同じ顔をしてた気がする……。", side: "left", image: "kanontalk1", keepRight: true },
        { name: "カノン", text: "（胸がざわざわする。何か悪いことが起きてるのかな……）", side: "left", image: "kanontalk1" }
    ],

    // --- STAGE 3 : Toy Box ---
    // Story: Realization hits. She is an avatar in a digital dream, shielding her dying self.
    'STAGE3_OPENING_KANON': [
        { name: "カノン", text: "……変だ。おもちゃに触っても、「重さ」を感じない。", side: "left", image: "kanontalk1" },
        { name: "カノン", text: "まるですごく精巧に作られたホログラムみたい……。ここは、現実じゃないの？", side: "left", image: "kanontalk1" }
    ],
    'STAGE3_MID_KANON': [
        { name: "カノン", text: "思い出した……。私、動けなかったはずだ。", side: "left", image: "kanontalk1" },
        { name: "カノン", text: "白い天井、たくさんの管、動かない足……。じゃあ、今動いている私は「ナニ」？", side: "left", image: "kanontalk1" }
    ],
    'STAGE3_BOSS_START_KANON': [
        { name: "玩具の王：キング・レゴロ", text: "帰りたくなかろう？ 向こう側には「痛み」と「終わり」しかないのだから。", side: "right", image: "boss_toy_king" },
        { name: "カノン", text: "……やっぱり。あなたは私をここに閉じ込めるための、優しい牢獄の看守なのね。", side: "left", image: "kanontalk1", keepRight: true },
        { name: "玩具の王：キング・レゴロ", text: "賢しい子よ。此処で永遠に遊んでいれば、苦しみなど知らずに済むものを！", side: "right", image: "boss_toy_king", keepLeft: true }
    ],
    'STAGE3_BARRIER_BREAK_KANON': [
        { name: "玩具の王：キング・レゴロ", text: "やめろ！ この世界を壊せば、お前は無慈悲な現実に晒されるぞ！！", side: "right", image: "boss_toy_king" },
        { name: "カノン", text: "それでもいい！ 偽物の幸せの中で笑ってるなんて、そんなの、私が一番許せない！！", side: "left", image: "kanontalk1" }
    ],
    'STAGE3_BOSS_DEFEAT_KANON': [
        {
            "name": "玩具の王：キング・レゴロ",
            "text": "……愚かな。だが、その愚直さこそが「生」なのかもしれぬな……。",
            "side": "right",
            "image": "boss_toy_king_weak"
        },
        {
            "name": "カノン",
            "text": "ありがとう、王様。夢を見せてくれて。……でも、もう起きなきゃ。",
            "side": "left",
            "image": "kanontalk1",
            "keepRight": true
        },
        {
            "name": "カノン",
            "text": "アリスが待ってる、私を呼んでる気がするの。",
            "side": "left",
            "image": "kanontalk1"
        }
    ],

    // --- STAGE 4 : Hospital ---
    // Story: The glitching reality. Fighting the personification of her own pain.
    'STAGE4_OPENING_KANON': [
        { name: "カノン", text: "景色が歪んで……白い壁が見える。消毒液の匂い……。", side: "left", image: "kanontalk1" },
        { name: "カノン", text: "ここ、私の病室だ。……嫌だ、戻りたくないよ……！", side: "left", image: "kanontalk1" }
    ],
    'STAGE4_MID_KANON': [
        { name: "カノン", text: "（ピー……ピー……）聞こえる、あれは私の心電図の音。", side: "left", image: "kanontalk1" },
        { name: "カノン", text: "ねえアリス、助けて！ 怖いよ、息が苦しいよ……！", side: "left", image: "kanontalk1" }
    ],
    'STAGE4_BOSS_START_KANON': [
        { name: "絶望に至る病：KANON", text: "あ……あぁ……イタイ……助ケテ……誰カ……。", side: "right", image: "boss_nurse" },
        { name: "カノン", text: "！！ ……嘘、あれは私？ あんな姿で、苦しんで……。", side: "left", image: "kanontalk1", keepRight: true },
        { name: "絶望に至る病：KANON", text: "オ前モ……コウナルンダ……。逃ゲ場ナンテ……ドコニモナイ……ッ！！", side: "right", image: "boss_nurse", keepLeft: true }
    ],
    'STAGE4_BARRIER_BREAK_KANON': [
        { name: "絶望に至る病：KANON", text: "嫌ダ……死ニタクナイ……ッ！！ 体ガ……崩レテイク……ッ！！", side: "right", image: "boss_nurse" },
        { name: "カノン", text: "泣かないで……！ 私だって怖い、怖いよ！ でもここで負けたら、アリスに会えないんだ！", side: "left", image: "kanontalk1" }
    ],
    'STAGE4_BOSS_DEFEAT_KANON': [
        { name: "絶望に至る病：KANON", text: "……アリス……会イタカッタ……。", side: "right", image: "boss_nurse_weak" },
        { name: "カノン", text: "……私、行くね。あなたの分も、絶対にアリスを見つけ出すから。", side: "left", image: "kanontalk1", keepRight: true },
        { name: "カノン", text: "待っててアリス。どれだけ苦しくても、最後のひと呼吸まで、私は走り続けるよ……！", side: "left", image: "kanontalk1" }
    ],

    // --- STAGE 5 : Heaven's Stairs ---
    // Story: The final ascent against the System Reaper. Reaching Alice.
    'STAGE5_OPENING_KANON': [
        { name: "カノン", text: "光の階段……。ここを登れば、きっと会える。", side: "left", image: "kanontalk1" },
        { name: "カノン", text: "足が重い、視界がぼやける。……でも、行かなきゃ！", side: "left", image: "kanontalk1" }
    ],
    'STAGE5_MID_KANON': [
        { name: "カノン", text: "アリスーーッ！！ 返事をしてよ、アリスーーッ！！", side: "left", image: "kanontalk1" },
        { name: "カノン", text: "（お願い、神様。どうかもう一度だけ、あの子に……！）", side: "left", image: "kanontalk1" }
    ],
    'STAGE5_BOSS_START_KANON': [
        { name: "デウス・エクス", text: "Time out. 対象コード：KANON。全機能停止プロセスへ移行。", side: "right", image: "boss_god" },
        { name: "カノン", text: "！！ あそこに倒れてるの……アリス！？ そんな……動いてよアリス！！", side: "left", image: "kanontalk1", keepRight: true },
        { name: "デウス・エクス", text: "無駄だ。彼女のデータは既にパージされた。次は貴様の番だ。", side: "right", image: "boss_god", keepLeft: true }
    ],
    'STAGE5_BARRIER_BREAK_KANON': [
        { name: "デウス・エクス", text: "Fatal Error. 異常な感情係数を検知。強制排除を実行する！", side: "right", image: "boss_reaper" },
        { name: "カノン", text: "邪魔しないで！！ アリスは私の……私の一番大切な友達なんだ！！", side: "left", image: "kanontalk1" },
        { name: "カノン", text: "システムでも神様でも関係ない！ 二人の時間を返してよ！！", side: "left", image: "kanontalk1" }
    ],
    'STAGE5_BOSS_DEFEAT_KANON': [
        { name: "デウス・エクス", text: "……Process Terminated. ……Have a nice dream.", side: "right", image: "boss_reaper" },
        { name: "カノン", text: "……はぁ、はぁ……。アリス……！", side: "left", image: "kanontalk1", keepRight: true },
        { name: "アリス", text: "……みぃつけた。", side: "right", image: "alicetalk1" },
        { name: "カノン", text: "え……？ アリス……？", side: "left", image: "kanontalk1", keepRight: true },
        { name: "アリス", text: "ずっと待ってたよ、カノンちゃん。……もう痛くない？", side: "right", image: "alicetalk1" },
        { name: "カノン", text: "う、うわぁぁぁん！！ アリスぅぅぅ！！ 会いたかったよぉぉ！！", side: "left", image: "kanontalk1", keepRight: true },
        { name: "システム", text: "（二つの魂は寄り添い、温かな光の中へと溶けていった……）", side: "center", image: "hidden" }
    ]
};
