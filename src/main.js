import { Game } from './Game.js';

const canvas = document.getElementById('game-canvas');

// 仮想解像度の設定（16:9）
const VIRTUAL_WIDTH = 1600;
const VIRTUAL_HEIGHT = 900;
const ASPECT_RATIO = VIRTUAL_WIDTH / VIRTUAL_HEIGHT;

function resize() {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    // PCの場合（幅が768pxより大きい）は全画面表示（余白なし）
    // モバイルの場合（幅が768px以下）はアスペクト比維持でフィットさせる
    const isMobile = screenWidth <= 768;

    let canvasWidth, canvasHeight;
    let displayWidth, displayHeight;

    if (!isMobile) {
        // PC: 画面解像度に合わせてキャンバスサイズ自体を変更する（歪み防止）
        // ベースの高さを900pxとし、幅は画面比率に応じて可変にする
        canvasHeight = VIRTUAL_HEIGHT;
        canvasWidth = Math.ceil(canvasHeight * (screenWidth / screenHeight));

        displayWidth = screenWidth;
        displayHeight = screenHeight;
    } else {
        // Mobile: 16:9のアスペクト比を維持しつつ最大化
        // 内部解像度を少し下げて負荷軽減 (1600x900 -> 1152x648, 72%)
        // GPU負荷は約50%削減されます
        canvasWidth = 1152;
        canvasHeight = 648;

        const screenAspect = screenWidth / screenHeight;
        if (screenAspect > ASPECT_RATIO) {
            displayHeight = screenHeight;
            displayWidth = screenHeight * ASPECT_RATIO;
        } else {
            displayWidth = screenWidth;
            displayHeight = screenWidth / ASPECT_RATIO;
        }
    }

    // キャンバスの描画解像度を設定
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // キャンバスの表示サイズを設定
    canvas.style.width = displayWidth + 'px';
    canvas.style.height = displayHeight + 'px';

    // 中央配置（fixedで親要素の影響を排除）
    canvas.style.position = 'fixed';
    canvas.style.left = Math.floor((screenWidth - displayWidth) / 2) + 'px';
    canvas.style.top = Math.floor((screenHeight - displayHeight) / 2) + 'px';
    canvas.style.zIndex = '1';

    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    // Pass resize to game if initialized
    if (window.gameInstance) {
        window.gameInstance.resize(canvasWidth, canvasHeight);
    }
}

window.addEventListener('resize', resize);
resize();

const game = new Game(canvas);
window.gameInstance = game; // Expose for resize handler

game.start().catch(console.error);
