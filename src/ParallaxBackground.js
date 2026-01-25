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
        let finalImage = image;

        // Pre-filter image if filter is specified (2D only logic preserved for creating texture source)
        if (filter && filter !== 'none') {
            const canvas = document.createElement('canvas');
            canvas.width = image.width;
            canvas.height = image.height;
            const ctx = canvas.getContext('2d');
            ctx.filter = filter;
            ctx.drawImage(image, 0, 0);
            finalImage = canvas;
        }

        const layer = { image: finalImage, speed, alignBottom, filter, sprite: null };
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
