export class Assets {
  constructor() {
    this.images = {};
    this.placeholders = {};
  }

  async loadImages(sources, onProgress = null) {
    let loadedCount = 0;
    const totalCount = sources.length;

    const promises = sources.map(source => {
      return new Promise((resolve) => {
        const tryLoad = (src, attempt = 1) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.src = src;

          img.onload = () => {
            try {
              if (source.transparencyKey) {
                this.images[source.name] = this.processTransparency(img, source.transparencyKey);
              } else {
                this.images[source.name] = img;
              }
            } catch (e) {
              console.warn(`Failed to process transparency for ${source.name}, using raw image`, e);
              this.images[source.name] = img;
            }
            loadedCount++;
            if (onProgress) onProgress(loadedCount, totalCount);
            resolve(this.images[source.name]);
          };

          img.onerror = () => {
            // フォールバックロジック: パスを変えて再トライ
            if (attempt === 1) {
              let nextSrc = src;
              if (src.includes('./assets/') && !src.includes('./assets/img/')) {
                nextSrc = src.replace('./assets/', './assets/img/');
              } else if (src.includes('./assets/img/')) {
                nextSrc = src.replace('./assets/img/', './assets/');
              } else if (!src.startsWith('./')) {
                nextSrc = `./assets/img/${src}`;
              }

              if (nextSrc !== src) {
                tryLoad(nextSrc, 2);
                return;
              }
            }

            console.error(`Failed to load image: ${source.src}. Generating placeholder.`);
            this.images[source.name] = this.createPlaceholder(source.name);
            loadedCount++;
            if (onProgress) onProgress(loadedCount, totalCount);
            resolve(this.images[source.name]);
          };
        };

        tryLoad(source.src);
      });
    });
    return Promise.all(promises);
  }

  createPlaceholder(name) {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    // 背景色を名前から適当に決める
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const color = `hsl(${Math.abs(hash) % 360}, 70%, 50%)`;

    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 64, 64);
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 4;
    ctx.strokeRect(5, 5, 54, 54);

    ctx.fillStyle = 'white';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(name.substring(0, 8), 32, 32);
    return canvas;
  }

  processTransparency(img, keyColor) {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // If AUTO, only use if the pixel is NOT already transparent, otherwise default to a color that won't match much
    const useAuto = keyColor === 'AUTO' && data[3] > 128;
    const rKey = useAuto ? data[0] : (keyColor !== 'AUTO' ? parseInt(keyColor.slice(1, 3), 16) : -255);
    const gKey = useAuto ? data[1] : (keyColor !== 'AUTO' ? parseInt(keyColor.slice(3, 5), 16) : -255);
    const bKey = useAuto ? data[2] : (keyColor !== 'AUTO' ? parseInt(keyColor.slice(5, 7), 16) : -255);

    for (let i = 0; i < data.length; i += 4) {
      // If the pixel is already transparent, skip it entirely
      if (data[i + 3] < 200) continue;

      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Strict threshold (30 instead of 80) to avoid nuking similar colors
      if (Math.abs(r - rKey) < 30 && Math.abs(g - gKey) < 30 && Math.abs(b - bKey) < 30) {
        data[i + 3] = 0;
      }
    }
    ctx.putImageData(imageData, 0, 0);
    return canvas; // Return context's canvas directly to avoid async toDataURL reload
  }

  getImage(name) {
    // 画像がない場合は、その場で作って返す（絶対にnullを返さない）
    if (!this.images[name]) {
      console.warn(`Image "${name}" not found. creating on-the-fly placeholder.`);
      this.images[name] = this.createPlaceholder(name);
    }
    return this.images[name];
  }

  deleteImage(name) {
    if (this.images[name]) {
      delete this.images[name];
    }
  }
}
