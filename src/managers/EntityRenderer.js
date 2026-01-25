import * as PIXI from 'pixi.js';

/**
 * EntityRenderer
 * Handles rendering of game entities (Enemies, Gizmos, Platforms) using PixiJS.
 * Manages sprite pooling and dynamic textures.
 */
export class EntityRenderer {
    constructor(game) {
        this.game = game;
        this.pixi = game.pixi;
        this.container = null;
        this.isReady = false;

        // Entity -> Sprite Mapping
        this.sprites = new Map();

        // Texture Cache for Procedural Objects
        this.textures = {};
    }

    init() {
        if (!this.pixi || !this.pixi.isReady) return;

        this.container = new PIXI.Container();
        this.container.label = 'entities_dynamic';
        // Insert into the entities layer (or world layer if preferred)
        // Ideally above tiles, below player?
        // Let's put it in the 'world' layer, but after tiles.
        this.pixi.layers.world.addChild(this.container);

        this.generateTextures();
        this.isReady = true;
    }

    generateTextures() {
        // 1. Ring Texture (Procedural)
        {
            const g = new PIXI.Graphics();
            // Outer Ring
            g.circle(64, 64, 60).stroke({ width: 10, color: 0xffffff });
            // Inner Triangle (Arrow)
            g.poly([new PIXI.Point(44, 34), new PIXI.Point(104, 64), new PIXI.Point(44, 94)]).fill(0xffffff);

            this.textures['ring'] = this.pixi.app.renderer.generateTexture(g);
        }

        // 2. Spring Texture (Procedural fallback if no asset)
        {
            const g = new PIXI.Graphics();
            g.rect(0, 16, 64, 48).fill(0xe67e22); // Box
            g.rect(0, 0, 64, 16).fill(0xf1c40f);  // Top plate
            this.textures['spring'] = this.pixi.app.renderer.generateTexture(g);
        }
    }

    update(dt, camera) {
        if (!this.isReady) return;

        // Set to track which entities were updated this frame
        const activeEntities = new Set();

        // 1. Update/Create Sprites for all lists
        // NOTE: Order determines Z-sorting implicitly within this container
        this.processList(this.game.springs, activeEntities, 'spring');
        this.processList(this.game.movingPlatforms, activeEntities, 'moving_platform');
        this.processList(this.game.fallingPlatforms, activeEntities, 'falling_platform');
        this.processList(this.game.clouds, activeEntities, 'cloud_platform'); // Cloud Platform
        this.processList(this.game.rings, activeEntities, 'ring');
        this.processList(this.game.enemies, activeEntities, 'enemy');
        this.processList(this.game.level.entities.filter(e => !e.collected && ['C', 'S', 'G', 'R'].includes(e.type)), activeEntities, 'collectible');

        // 2. Cleanup stale sprites
        for (const [entity, sprite] of this.sprites.entries()) {
            if (!activeEntities.has(entity)) {
                this.container.removeChild(sprite);
                sprite.destroy();
                this.sprites.delete(entity);
            }
        }
    }

    processList(list, activeSet, defaultType) {
        if (!list) return;
        list.forEach(entity => {
            // Cull off-screen entities loosely
            // Skip things that are way off screen to save Sprite creation/update
            // But be careful not to cull things that should be visible
            // const dx = entity.x - this.game.camera.x;
            // if (dx < -200 || dx > this.game.width + 200) return; 

            activeSet.add(entity);
            let sprite = this.sprites.get(entity);

            if (!sprite) {
                sprite = this.CreateSprite(entity, defaultType);
                if (sprite) {
                    this.container.addChild(sprite);
                    this.sprites.set(entity, sprite);
                }
            }

            if (sprite) {
                this.UpdateSprite(sprite, entity, defaultType);
            }
        });
    }

    CreateSprite(entity, type) {
        let sprite = new PIXI.Sprite();
        sprite.anchor.set(0.5); // Default center anchor for easier rotation/scaling

        if (type === 'ring') {
            sprite.texture = this.textures['ring'];
        } else if (type === 'spring') {
            sprite.anchor.set(0, 0); // Springs usually top-left origin in logic
            // Try explicit asset first
            const tex = this.game.assets.getTexture('spring');
            if (tex && tex.source) sprite.texture = tex;
            else sprite.texture = this.textures['spring'];
        } else if (type === 'enemy') {
            const configType = entity.constructor.name;
            if (configType === 'DrillEnemy') {
                const tex = this.game.assets.getTexture('fuwamoko');
                if (tex && tex.source) sprite.texture = tex;
                sprite.anchor.set(0, 0); // Drill Logic draws from top-left
            } else if (configType === 'CloudEnemy') {
                const tex = this.game.assets.getTexture('enemy_cloud');
                if (tex && tex.source) sprite.texture = tex;
                sprite.anchor.set(0, 0);
            }
        } else if (type === 'collectible') {
            let key = 'carrot'; // 'C'
            if (entity.type === 'S') key = 'golden_carrot';
            if (entity.type === 'G') key = 'golden_pillar'; // Example

            // Pixi v8 texture fetch
            const tex = this.game.assets.getTexture(key);
            if (tex && tex.source) sprite.texture = tex;
            sprite.anchor.set(0, 0);
        } else if (type === 'cloud_platform') {
            const tex = this.game.assets.getTexture('enemy_cloud'); // Reuse? Or specific platform?
            // Actually CloudPlatform usually draws a cloud
            if (tex && tex.source) sprite.texture = tex;
            sprite.anchor.set(0, 0);
        } else if (type === 'moving_platform' || type === 'falling_platform') {
            // Platform Logic
            const config = this.game.currentStageConfig.theme;
            const tex = this.game.assets.getTexture(config.platformTile);
            if (tex && tex.source) sprite.texture = tex;
            sprite.anchor.set(0, 0);
        }

        return sprite;
    }

    UpdateSprite(sprite, entity, type) {
        // Sync Position (World Space)
        // Parent container is in 'world' layer, which is moved by -camera.x
        // So we set sprite.x to entity.x (absolute world position)
        // WAIT. TileRenderer sets world.x = -camera.x.
        // So sprite.x should be entity.x.

        sprite.x = entity.x;
        sprite.y = entity.y;

        if (type === 'ring') {
            // Center adjustment because ring logic uses top-left but draws centered
            sprite.x += 64;
            sprite.y += 64;

            // Rotation & Color
            let angle = 0;
            if (entity.type === 'up') angle = -Math.PI / 4;
            if (entity.type === 'down') angle = Math.PI / 4;
            sprite.rotation = angle;

            // Scaling pulse
            // We can read internal timer if accessible, or just use generic time
            const pulse = 1.0 + Math.sin(Date.now() / 100) * 0.1;
            sprite.scale.set(pulse);

            // Tint
            if (entity.type === 'super') {
                const hue = (Date.now() / 5) % 360; // Fast rainbow
                // Hue to Hex is complex, simplified:
                sprite.tint = 0xff00ff; // Magenta for now
            } else {
                sprite.tint = entity.active ? 0x0abde3 : 0x636e72;
            }

        } else if (type === 'spring') {
            // Simple bounce effect if triggered?
            // Entity usually has 'frame' or state.
            if (entity.cooldown > 0) {
                sprite.scale.y = 0.5; // Compressed
                sprite.y += entity.height * 0.5;
            } else {
                sprite.scale.y = 1.0;
            }
        } else if (type === 'enemy') {
            // Mirroring
            if (entity.vx > 0) {
                sprite.scale.x = -1;
                sprite.x += entity.width; // Offset for flip
            } else {
                sprite.scale.x = 1;
            }
        }
    }
}
