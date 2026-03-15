import * as PIXI from 'pixi.js';

/**
 * EffectRenderer
 * Handles rendering of visual effects and particles using PixiJS.
 * Pixi v8 compatible. Uses sprite pooling to avoid per-frame allocations.
 */
export class EffectRenderer {
    constructor(game) {
        this.game = game;
        this.pixi = game.pixi;
        this.container = null;
        this.isReady = false;
        this.dotTexture = null;

        // Sprite pools (avoid new Sprite() every frame)
        this._worldPool = [];
        this._uiPool = [];
        this._worldUsed = 0;
        this._uiUsed = 0;
    }

    init() {
        if (!this.pixi || !this.pixi.isReady) return;

        this.container = new PIXI.Container();
        this.pixi.layers.world.addChild(this.container);

        this.uiContainer = new PIXI.Container();
        this.pixi.layers.ui.addChild(this.uiContainer);

        const g = new PIXI.Graphics();
        g.rect(0, 0, 8, 8).fill(0xffffff);
        this.dotTexture = this.pixi.app.renderer.generateTexture(g);

        this.isReady = true;
    }

    // プールからSpriteを取得 (なければ生成)
    _getSprite(pool, parent) {
        for (let i = 0; i < pool.length; i++) {
            if (!pool[i].visible) {
                pool[i].visible = true;
                return pool[i];
            }
        }
        // プール拡張
        const sprite = new PIXI.Sprite(this.dotTexture);
        sprite.anchor.set(0.5);
        parent.addChild(sprite);
        pool.push(sprite);
        return sprite;
    }

    update(env, player, camera) {
        if (!this.isReady) return;

        // 全スプライトを非表示にリセット (removeChildrenせずに再利用)
        for (const s of this._worldPool) s.visible = false;
        for (const s of this._uiPool) s.visible = false;

        if (env && env.particles) {
            this._renderParticles(env.particles, camera);
        }
        if (player && player.particles) {
            this._renderParticles(player.particles, camera);
        }
    }

    _renderParticles(particles, camera) {
        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            if (p.type === 'text') continue;

            const isUI = !!p.screenSpace;
            const pool = isUI ? this._uiPool : this._worldPool;
            const parent = isUI ? this.uiContainer : this.container;
            const sprite = this._getSprite(pool, parent);

            sprite.x = p.x;
            sprite.y = p.y;

            const s = (p.size || 4) / 8;
            sprite.scale.set(s);

            let alpha = 1.0;
            if (p.fade && p.life < 40) alpha = p.life / 40;
            else if (p.life < 20) alpha = p.life / 20;
            sprite.alpha = alpha;

            if (p.color && typeof p.color === 'string' && p.color.startsWith('#')) {
                sprite.tint = parseInt(p.color.replace('#', '0x'), 16);
            } else {
                sprite.tint = 0xffffff;
            }
        }
    }
}
