import * as PIXI from 'pixi.js';

export class ParallaxBackground {
    constructor(width, height, pixiManager = null) {
        this.width = width;
        this.height = height;
        this.pixi = pixiManager;
        this.layers = [];
        // No resize call needed in constructor usually, but consistency is good
    }

    addLayer(image, speed, alignBottom = false, filter = 'none') {
        // filter string (e.g. "brightness(0.6)") is passed but we don't process image here anymore.
        // We will parse it in createPixiSprite to apply tint.

        const layer = { image, speed, alignBottom, filter, sprite: null, shadowSprite: null };
        this.layers.push(layer);

        // If WebGL is ready, create Pixi TilingSprite immediately
        if (this.pixi && this.pixi.isReady) {
            this.createPixiSprite(layer);
        }
    }

    createPixiSprite(layer) {
        if (!layer.image) return;

        // Pixi v8 handles Texture from Image/Canvas automatically
        const texture = PIXI.Texture.from(layer.image);

        // TilingSprite for infinite scrolling
        const sprite = new PIXI.TilingSprite({
            texture: texture,
            width: this.width,
            height: layer.alignBottom ? texture.height : this.height
        });

        // Apply tint if filter is brightness
        if (layer.filter && layer.filter.includes('brightness')) {
            // Extract brightness value: brightness(0.6) -> 0.6
            const match = layer.filter.match(/brightness\(([^)]+)\)/);
            if (match) {
                const b = parseFloat(match[1]);
                // Convert brightness float to hex tint (assuming white base)
                const val = Math.floor(255 * b);
                // Create gray scale tint
                sprite.tint = (val << 16) | (val << 8) | val;
            }
        }
        // Tint default is 0xFFFFFF (white/no change)
        if (layer.filter && layer.filter.includes('shadow')) {
            // Create a shadow sprite (darkened and offset)
            const shadow = new PIXI.TilingSprite({
                texture: texture,
                width: this.width,
                height: layer.alignBottom ? texture.height : this.height
            });
            shadow.tint = 0x000000;
            shadow.alpha = 0.5;
            // Slightly offset to the right and down
            shadow.tilePosition.set(5, 5);

            if (layer.alignBottom) {
                shadow.y = this.height - texture.height;
            }
            layer.shadowSprite = shadow;
            if (this.pixi.layers.background) {
                this.pixi.layers.background.addChild(shadow);
            }
        }

        if (layer.alignBottom) {
            sprite.y = this.height - texture.height;
        }

        layer.sprite = sprite;
        if (this.pixi.layers.background) {
            this.pixi.layers.background.addChild(sprite);
        }
    }

    /**
     * Clear all layers and cleanup Pixi objects to prevent duplicates
     */
    clear() {
        this.layers.forEach(layer => {
            if (layer.shadowSprite) {
                if (this.pixi && this.pixi.layers.background) {
                    this.pixi.layers.background.removeChild(layer.shadowSprite);
                }
                layer.shadowSprite.destroy({ children: true, texture: false, baseTexture: false });
            }
            if (layer.sprite) {
                if (this.pixi && this.pixi.layers.background) {
                    this.pixi.layers.background.removeChild(layer.sprite);
                }
                // Completely destroy to free memory
                layer.sprite.destroy({ children: true, texture: false, baseTexture: false });
            }
        });
        this.layers = [];
    }

    resize(width, height) {
        this.width = width;
        this.height = height;

        this.layers.forEach(layer => {
            if (layer.sprite) {
                layer.sprite.width = width;
                if (!layer.alignBottom) layer.sprite.height = height;
                else layer.sprite.y = height - layer.sprite.texture.height;

                if (layer.shadowSprite) {
                    layer.shadowSprite.width = width;
                    if (!layer.alignBottom) layer.shadowSprite.height = height;
                    else layer.shadowSprite.y = height - layer.shadowSprite.texture.height;
                }
            }
        });
    }

    update(camera) {
        // Update Pixi positions if sprites exist
        this.layers.forEach(layer => {
            if (layer.sprite) {
                // TilingSprite uses tilePosition (UV offset) for scrolling
                // NOTE: Pixi TilingSprite tilePosition is positive -> scroll left?
                // Usually tilePosition.x = -cameraX works for "camera moving right"
                layer.sprite.tilePosition.x = -camera.x * layer.speed;
                if (layer.shadowSprite) {
                    layer.shadowSprite.tilePosition.x = -camera.x * layer.speed;
                }
            }
        });
    }

    draw(ctx, camera) {
        // If Pixi is active, we don't need to draw to 2D canvas at all
        // This prevents double rendering behind the WebGL canvas
        if (this.pixi && this.pixi.isReady) return;

        // Fallback to Canvas 2D
        this.layers.forEach(layer => {
            if (!layer.image) return;

            const imgW = layer.image.width;
            const imgH = layer.image.height;
            const speed = layer.speed;

            let offset = Math.floor((-camera.x * speed) % imgW);
            if (offset > 0) offset -= imgW;

            let drawY = 0;
            if (layer.alignBottom) {
                drawY = this.height - imgH;
            }

            for (let x = offset; x < this.width; x += imgW) {
                ctx.drawImage(layer.image, (x) | 0, (drawY) | 0, imgW, imgH);
                if (!layer.alignBottom && imgH < this.height) {
                    for (let currY = drawY + imgH; currY < this.height; currY += imgH) {
                        ctx.drawImage(layer.image, (x) | 0, (currY) | 0, imgW, imgH);
                    }
                }
            }
        });
    }
}
