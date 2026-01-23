export class ParallaxBackground {
    constructor(width, height) {
        this.resize(width, height);
        this.layers = [];
    }

    addLayer(image, speed, alignBottom = false, filter = 'none') {
        this.layers.push({ image, speed, alignBottom, filter });
    }

    resize(width, height) {
        this.width = width;
        this.height = height;
    }

    draw(ctx, camera) {
        this.layers.forEach(layer => {
            if (!layer.image) return;

            const imgW = layer.image.width;
            const imgH = layer.image.height;
            const speed = layer.speed;

            // Apply filter if specified
            if (layer.filter && layer.filter !== 'none') {
                ctx.save();
                ctx.filter = layer.filter;
            }

            // Calculate offset based on camera position
            let offset = Math.floor((-camera.x * speed) % imgW);
            // Ensure we start drawing from slightly left of screen if needed
            if (offset > 0) offset -= imgW;

            let drawY = 0;
            if (layer.alignBottom) {
                drawY = this.height - imgH;
            }

            for (let x = offset; x < this.width; x += imgW) {
                ctx.drawImage(layer.image, (x) | 0, (drawY) | 0, imgW, imgH);

                // Vertical tiling for Sky (if not bottom aligned)
                if (!layer.alignBottom && imgH < this.height) {
                    for (let j = 1; j * imgH < this.height; j++) {
                        ctx.drawImage(layer.image, (x) | 0, (drawY + j * imgH) | 0, imgW, imgH);
                    }
                }
            }

            // Restore context if filter was applied
            if (layer.filter && layer.filter !== 'none') {
                ctx.restore();
            }
        });
    }
}
