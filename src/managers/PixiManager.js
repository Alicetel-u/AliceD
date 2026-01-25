import * as PIXI from 'pixi.js';

/**
 * PixiJS Manager
 * WebGL レンダリングエンジンとシーンの階層構造を管理します。
 * Pixi v8 に準拠。
 */
export class PixiManager {
    constructor(game) {
        this.game = game;
        this.app = null;
        this.container = null; // メインゲームコンテナ
        this.isReady = false;

        // レイヤー構造
        this.layers = {
            background: null,
            world: null,
            entities: null,
            foreground: null,
            ui: null
        };
    }

    async init(width, height) {
        console.log('[PixiManager] Initializing PixiJS v8...');

        this.app = new PIXI.Application();

        await this.app.init({
            width: width,
            height: height,
            backgroundAlpha: 0, // Canvas 2D を透過して見えるように設定
            antialias: true,
            resolution: window.devicePixelRatio || 1,
            autoDensity: true,
            preference: 'webgl'
        });

        // PixiJS のキャンバスを配置する DOM 要素
        const pixiContainer = document.createElement('div');
        pixiContainer.id = 'pixi-container';
        pixiContainer.style.position = 'absolute';
        pixiContainer.style.top = '0';
        pixiContainer.style.left = '0';
        pixiContainer.style.width = '100%';
        pixiContainer.style.height = '100%';
        pixiContainer.style.pointerEvents = 'none'; // 入力は既存のレイヤーに任せる
        pixiContainer.style.zIndex = '5'; // ワールドの上、UIの下に配置

        const appElement = document.getElementById('app');
        if (appElement) {
            appElement.appendChild(pixiContainer);
            pixiContainer.appendChild(this.app.canvas);
        }

        // レイヤー(Container)のセットアップ
        this.setupLayers();

        this.isReady = true;
        console.log('[PixiManager] PixiJS Ready.');

        return this.app;
    }

    setupLayers() {
        // ルートとなるコンテナ
        this.container = new PIXI.Container();
        this.app.stage.addChild(this.container);

        // Z-Index 管理用のレイヤーを作成
        Object.keys(this.layers).forEach(layerName => {
            const layer = new PIXI.Container();
            layer.label = layerName;
            this.layers[layerName] = layer;
            this.container.addChild(layer);
        });
    }

    resize(width, height) {
        if (!this.isReady) return;
        this.app.renderer.resize(width, height);
    }

    update(dt) {
        if (!this.isReady) return;
        // 基本的には Game ループから各レンダラーの update を呼び出します
    }

    /**
     * 全レイヤーの要素をクリア
     */
    clear() {
        if (!this.isReady) return;
        Object.values(this.layers).forEach(layer => {
            if (layer) layer.removeChildren();
        });
    }
}
