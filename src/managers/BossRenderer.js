import * as PIXI from 'pixi.js';

/**
 * BossRenderer
 * Handles rendering of the boss and its projectiles using PixiJS.
 */
export class BossRenderer {
    constructor(game) {
        this.game = game;
        this.pixi = game.pixi;
        this.sprite = null;
        this.projectilesLayer = null;
        this.hpBarContainer = null;
        this.hpBarBg = null;
        this.hpBarFill = null;
        this.container = null;
        this.isReady = false;
    }

    init() {
        if (!this.pixi || !this.pixi.isReady) return;

        // ボス本体のコンテナ
        this.container = new PIXI.Container();
        this.pixi.layers.entities.addChild(this.container);

        this.sprite = new PIXI.Sprite();
        this.sprite.anchor.set(0.5);
        this.container.addChild(this.sprite);

        // 弾用の専用レイヤー (ワールド座標に同期)
        this.projectilesLayer = new PIXI.Container();
        this.pixi.layers.world.addChild(this.projectilesLayer);

        // HPバー (UIレイヤー)
        this.hpBarContainer = new PIXI.Container();
        this.pixi.layers.ui.addChild(this.hpBarContainer);

        this.hpBarBg = new PIXI.Graphics();
        this.hpBarFill = new PIXI.Graphics();
        this.hpBarContainer.addChild(this.hpBarBg);
        this.hpBarContainer.addChild(this.hpBarFill);

        this.isReady = true;
    }

    update(boss, camera) {
        if (!this.isReady || !boss || boss.defeated) {
            if (this.container) this.container.visible = false;
            if (this.hpBarContainer) this.hpBarContainer.visible = false;
            return;
        }

        this.container.visible = true;
        this.hpBarContainer.visible = (this.game.state === 'BOSS_BATTLE');

        // 1. ボス本体の更新
        const gx = boss.x - camera.x + boss.width / 2;
        const gy = boss.y - camera.y + boss.height / 2;
        this.sprite.x = gx;
        this.sprite.y = gy;
        this.sprite.rotation = boss.rotation;

        if (boss.state === 'HURT') {
            this.sprite.x += Math.random() * 10 - 5;
            this.sprite.y += Math.random() * 10 - 5;
            this.sprite.alpha = (Math.floor(Date.now() / 50) % 2 === 0) ? 0.3 : 0.8;
        } else {
            this.sprite.alpha = 1.0;
        }

        let bossImgKey = boss.config.image || 'boss_mochitsuki';
        if (!boss.isInvulnerable && boss.config.imageWeak) {
            bossImgKey = boss.config.imageWeak;
        }

        this.sprite.texture = this.game.assets.getTexture(bossImgKey);
        this.sprite.width = boss.width;
        this.sprite.height = boss.height;

        // 2. HPバーの更新 (Pixi v8 グラフィックス API)
        const barW = boss.width;
        const barH = 12;
        const bx = boss.x - camera.x;
        const by = boss.y - camera.y - 30;

        this.hpBarBg.clear();
        this.hpBarBg.rect(bx, by, barW, barH).fill({ color: 0x000000, alpha: 0.5 });
        this.hpBarBg.stroke({ width: 2, color: 0xffffff });
        this.hpBarBg.rect(bx, by, barW, barH).stroke();

        this.hpBarFill.clear();
        this.hpBarFill.rect(bx, by, barW * (boss.hp / boss.maxHp), barH).fill(0xff4757);

        // 3. 弾の更新 (簡易的な再生成。将来的にスプライトプールへの移行を検討)
        this.projectilesLayer.removeChildren();
        boss.projectiles.forEach(proj => {
            const px = proj.x;
            const py = proj.y;
            const size = proj.size;
            const pulse = (Math.sin(Date.now() / 50 + proj.seed) * 0.3 + 0.7);

            const pGfx = new PIXI.Graphics();
            pGfx.circle(px, py, size * 1.2).fill({ color: 0x4facfe, alpha: 0.6 * pulse });
            pGfx.circle(px, py, size * 0.6).fill(0xffffff);
            this.projectilesLayer.addChild(pGfx);
        });
    }
}
