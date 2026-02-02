import { Game } from './Game.js';

const canvas = document.getElementById('game-canvas');

// 仮想解像度の設定（16:9）
const VIRTUAL_WIDTH = 1600;
const VIRTUAL_HEIGHT = 900;
const ASPECT_RATIO = VIRTUAL_WIDTH / VIRTUAL_HEIGHT;

function resize() {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const screenAspect = screenWidth / screenHeight;

    let canvasWidth, canvasHeight;
    let displayWidth, displayHeight;

    // 常に16:9のアスペクト比を維持
    if (screenAspect > ASPECT_RATIO) {
        // 画面が横長すぎる場合：高さに合わせる
        displayHeight = screenHeight;
        displayWidth = screenHeight * ASPECT_RATIO;
    } else {
        // 画面が縦長の場合：横幅に合わせる
        displayWidth = screenWidth;
        displayHeight = screenWidth / ASPECT_RATIO;
    }

    // キャンバスの描画解像度（常に仮想解像度を使用）
    canvasWidth = VIRTUAL_WIDTH;
    canvasHeight = VIRTUAL_HEIGHT;

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
