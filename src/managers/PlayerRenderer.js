import * as PIXI from 'pixi.js';

/**
 * PlayerRenderer
 * Handles rendering of the player character using PixiJS.
 */
export class PlayerRenderer {
    constructor(game) {
        this.game = game;
        this.pixi = game.pixi;
        this.sprite = null;
        this.isReady = false;
    }

    init() {
        if (!this.pixi || !this.pixi.isReady) return;

        this.sprite = new PIXI.Sprite();
        this.sprite.anchor.set(0.5, 1.0); // 足元を基準にする
        this.pixi.layers.entities.addChild(this.sprite);

        this.isReady = true;
    }

    update(player, camera) {
        if (!this.isReady || !player) return;

        const anim = player.animator;
        const config = player.characterConfig || anim.config;
        const stateConfig = config.states[anim.state] || config.states.idle || {};

        // 1. 使用するテクスチャの決定
        let textureKey;
        if (config.type === 'SEPARATE') {
            textureKey = `player_${anim.state}`;
            if (!this.game.assets.textures[textureKey]) {
                textureKey = 'player';
            }
        } else {
            textureKey = 'player';
        }

        const texture = this.game.assets.getTexture(textureKey);
        // Pixi v8: texture.source が存在することを確認
        if (!texture || !texture.source) return;

        // 2. フレーム矩形の計算 (SpriteAnimator と同期)
        const sheetCols = stateConfig.sheetCols || config.cols || 1;
        const animCols = stateConfig.cols || sheetCols;
        const maxFrames = stateConfig.frames || config.maxFrames || 1;

        let sheetRows = config.rows || 1;
        if (config.type !== 'SHEET' && stateConfig.rows) {
            sheetRows = stateConfig.rows;
        }

        const currentFrame = anim.frame % maxFrames;

        // Pixi v8: baseTexture -> source
        const sw = texture.source.width / sheetCols;
        const sh = texture.source.height / sheetRows;

        const relCol = currentFrame % animCols;
        const relRow = Math.floor(currentFrame / animCols);

        const col = (stateConfig.colOffset || 0) + relCol;
        const row = (stateConfig.row || 0) + relRow;

        const bleed = config.bleed !== undefined ? config.bleed : 1.0;
        const leftGuard = 2.0;
        const trimLeft = (stateConfig.trimLeft || 0);
        const trimRight = (stateConfig.trimRight || 0);
        const trimTop = (stateConfig.trimTop || 0);
        const trimBottom = (stateConfig.trimBottom || 0);

        const frameX = Math.round(col * sw) + bleed + leftGuard + trimLeft;
        const frameY = Math.round(row * sh) + bleed + trimTop;
        const frameW = Math.max(1, Math.round(sw) - (bleed * 2) - leftGuard - trimLeft - trimRight);
        const frameH = Math.max(1, Math.round(sh) - (bleed * 2) - trimTop - trimBottom);

        // NaN チェック (安全策)
        if (isNaN(frameX) || isNaN(frameY) || isNaN(frameW) || isNaN(frameH)) return;

        const frameRect = new PIXI.Rectangle(frameX, frameY, frameW, frameH);

        // テクスチャの更新 (フレームやソースが変わった場合のみ)
        if (!this.sprite.texture ||
            !this.sprite.texture.frame.equals(frameRect) ||
            this.sprite.texture.source !== texture.source) {

            this.sprite.texture = new PIXI.Texture({
                source: texture.source,
                frame: frameRect
            });
        }

        // 3. 座標とスケールの設定
        const visualOffsetY = config.visualOffsetY || 0;
        this.sprite.x = player.x - camera.x + player.width / 2;
        this.sprite.y = player.y - camera.y + player.height + visualOffsetY;

        // 表示サイズ
        const visualScale = 1.5;
        let renderWidth = player.tileSize * 1.5 * visualScale;
        let renderHeight = renderWidth * (sh / sw); // アスペクト比を維持

        if (stateConfig.scale) {
            renderWidth *= stateConfig.scale;
            renderHeight *= stateConfig.scale;
        }

        this.sprite.width = renderWidth * Math.abs(player.scaleX);
        this.sprite.height = renderHeight * Math.abs(player.scaleY);

        // 向き (Mirroring)
        this.sprite.scale.x = Math.abs(this.sprite.scale.x) * (player.facingRight ? 1 : -1);

        // 回転
        this.sprite.rotation = player.rotation;

        // アニメーションごとのオフセット適用
        let offX = (stateConfig.offsetX || 0) * player.scaleX;
        let offY = (stateConfig.offsetY || 0) * player.scaleY;
        if (stateConfig.frameOffsets && stateConfig.frameOffsets[currentFrame]) {
            const fOff = stateConfig.frameOffsets[currentFrame];
            if (fOff.x !== undefined) offX += fOff.x * player.scaleX;
            if (fOff.y !== undefined) offY += fOff.y * player.scaleY;
        }

        this.sprite.x += offX * (player.facingRight ? 1 : -1);
        this.sprite.y += offY;

        // 特殊効果 (無敵点滅など)
        if (player.hasGoldenAura) {
            this.sprite.tint = 0xffffcc;
        } else {
            this.sprite.tint = 0xffffff;
        }

        // ダメージ時の点滅
        if (this.game.damageCooldown > 0) {
            this.sprite.alpha = (Math.floor(Date.now() / 50) % 2 === 0) ? 0.3 : 0.8;
        } else {
            this.sprite.alpha = 1.0;
        }
    }
}
