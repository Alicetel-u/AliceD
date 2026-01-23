import { Game } from './Game.js';

const canvas = document.getElementById('game-canvas');

// 仮想解像度の設定（16:9） - より広く見えるように1600x900に調整
const VIRTUAL_WIDTH = 1600;
const VIRTUAL_HEIGHT = 900;

function resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Set canvas dimensions to direct window size
    canvas.width = width;
    canvas.height = height;

    canvas.style.width = '100%';
    canvas.style.height = '100%';

    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    // Pass resize to game if initialized
    if (window.gameInstance) {
        window.gameInstance.resize(width, height);
    }
}

window.addEventListener('resize', resize);
resize();

const game = new Game(canvas);
window.gameInstance = game; // Expose for resize handler

game.start().catch(console.error);
