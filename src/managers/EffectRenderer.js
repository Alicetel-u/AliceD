import * as PIXI from 'pixi.js';

/**
 * EffectRenderer
 * Handles rendering of visual effects and particles using PixiJS.
 * Pixi v8 compatible.
 */
export class EffectRenderer {
    constructor(game) {
        this.game = game;
        this.pixi = game.pixi;
        this.container = null;
        this.isReady = false;

        // Use a simple circle/square graphics as a shared texture pool
        this.dotTexture = null;
    }

    init() {
        if (!this.pixi || !this.pixi.isReady) return;

        // World-space particles (move with camera)
        this.container = new PIXI.Container();
        this.pixi.layers.world.addChild(this.container);

        // Screen-space particles (static UI)
        this.uiContainer = new PIXI.Container();
        this.pixi.layers.ui.addChild(this.uiContainer);

        // Create a single 8x8 white dot texture for particles
        const g = new PIXI.Graphics();
        g.rect(0, 0, 8, 8).fill(0xffffff);
        this.dotTexture = this.pixi.app.renderer.generateTexture(g);

        this.isReady = true;
    }

    update(env, player, camera) {
        if (!this.isReady) return;

        // Clear for this frame
        this.container.removeChildren();
        this.uiContainer.removeChildren();

        // 1. Environment Particles
        if (env && env.particles) {
            this.renderParticleArray(env.particles, camera);
        }

        // 2. Player Particles
        if (player && player.particles) {
            this.renderParticleArray(player.particles, camera);
        }
    }

    renderParticleArray(particles, camera) {
        particles.forEach(p => {
            // Text particles handling
            // If it's text, we might skip it or implement BitmapText later.
            // For now, let's skip text particles in WebGL to rely on Canvas fallback 
            // OR simple graphics placeholder? Canvas fallback in Game.js handles text better.
            if (p.type === 'text') return;

            const sprite = new PIXI.Sprite(this.dotTexture);

            let targetContainer = this.container;

            if (p.screenSpace) {
                targetContainer = this.uiContainer;
                sprite.x = p.x;
                sprite.y = p.y;
            } else {
                // World space (container moves with camera)
                sprite.x = p.x;
                sprite.y = p.y;
            }

            sprite.anchor.set(0.5);

            // Size relative to 8x8 texture
            const s = (p.size || 4) / 8;
            sprite.scale.set(s);

            // Color & Alpha
            let alpha = 1.0;
            if (p.fade && p.life < 40) alpha = p.life / 40;
            else if (p.life < 20) alpha = p.life / 20;

            sprite.alpha = alpha;

            // Tinting (Pixi uses hex colors)
            if (p.color) {
                // Simple CSS to Hex conversion
                if (typeof p.color === 'string' && p.color.startsWith('#')) {
                    sprite.tint = parseInt(p.color.replace('#', '0x'), 16);
                } else if (p.color && p.color.startsWith('hsl')) {
                    // HSL parsing unsupported in simple strip, default white
                    sprite.tint = 0xffffff;
                } else {
                    sprite.tint = 0xffffff;
                }
            }

            targetContainer.addChild(sprite);
        });
    }
}
