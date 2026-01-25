export class ParallaxBackground {
    constructor(width, height) {
        this.resize(width, height);
        this.layers = [];
    }

    addLayer(image, speed, alignBottom = false, filter = 'none') {
        let finalImage = image;

        // Pre-filter image if filter is specified to avoid per-frame ctx.filter overhead
        if (filter && filter !== 'none') {
            const canvas = document.createElement('canvas');
            canvas.width = image.width;
            canvas.height = image.height;
            const ctx = canvas.getContext('2d');
            ctx.filter = filter;
            ctx.drawImage(image, 0, 0);
            finalImage = canvas; // Use the filtered canvas as the image source
        }

        this.layers.push({ image: finalImage, speed, alignBottom });
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
                    // Optimized vertical fill
                    for (let currY = drawY + imgH; currY < this.height; currY += imgH) {
                        ctx.drawImage(layer.image, (x) | 0, (currY) | 0, imgW, imgH);
                    }
                }
            }
        });
    }
}
