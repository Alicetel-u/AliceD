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

        this.container = new PIXI.Container();
        this.pixi.layers.world.addChild(this.container);

        // Create a single 8x8 white dot texture for particles
        const g = new PIXI.Graphics();
        g.rect(0, 0, 8, 8).fill(0xffffff);
        this.dotTexture = this.pixi.app.renderer.generateTexture(g);

        this.isReady = true;
    }

    update(env, player, camera) {
        if (!this.isReady) return;

        // Clear for this frame (simple immediate mode emulation)
        this.container.removeChildren();

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
            // Text particles are better rendered in DOM/Canvas for crisp text, 
            // but for now we skip them in WebGL or implement BitmapText later.
            // Skipping text particles here to let Canvas 2D handle them if not fully migrated,
            // or we need to add Pixi Text support.
            if (p.type === 'text') return;

            const sprite = new PIXI.Sprite(this.dotTexture);

            const dx = (p.screenSpace ? p.x : p.x - camera.x);
            const dy = (p.screenSpace ? p.y : p.y - camera.y);

            sprite.x = dx;
            sprite.y = dy;
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
                } else {
                    sprite.tint = 0xffffff;
                }
            }

            this.container.addChild(sprite);
        });
    }
}
