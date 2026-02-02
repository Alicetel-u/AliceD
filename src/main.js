import { Game } from './Game.js';

const canvas = document.getElementById('game-canvas');

// 仮想解像度の設定（16:9） - より広く見えるように1600x900に調整
const VIRTUAL_WIDTH = 1600;
const VIRTUAL_HEIGHT = 900;
const ASPECT_RATIO = VIRTUAL_WIDTH / VIRTUAL_HEIGHT; // 16:9 = 1.777...

function resize() {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const screenAspect = screenWidth / screenHeight;

    let canvasWidth, canvasHeight;
    let cssWidth, cssHeight;

    // モバイル判定（縦長画面 or 幅768px以下）
    const isMobilePortrait = screenAspect < 1 || screenWidth <= 768;

    if (isMobilePortrait) {
        // モバイル縦持ち: 横幅に合わせて16:9を維持
        // キャンバス解像度は仮想解像度を使用（ゲーム全体が見える）
        canvasWidth = VIRTUAL_WIDTH;
        canvasHeight = VIRTUAL_HEIGHT;

        // 表示サイズは横幅100%、高さはアスペクト比から計算
        cssWidth = screenWidth;
        cssHeight = screenWidth / ASPECT_RATIO;

        // 画面に収まるように調整
        if (cssHeight > screenHeight * 0.7) {
            cssHeight = screenHeight * 0.7;
            cssWidth = cssHeight * ASPECT_RATIO;
        }
    } else {
        // PC/タブレット横向き: 画面全体を使用
        canvasWidth = screenWidth;
        canvasHeight = screenHeight;
        cssWidth = screenWidth;
        cssHeight = screenHeight;
    }

    // キャンバスの描画解像度を設定
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // キャンバスの表示サイズを設定
    canvas.style.width = cssWidth + 'px';
    canvas.style.height = cssHeight + 'px';

    // 中央配置
    canvas.style.position = 'absolute';
    canvas.style.left = ((screenWidth - cssWidth) / 2) + 'px';
    canvas.style.top = ((screenHeight - cssHeight) / 2) + 'px';

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
