/**
 * Polyfills.js
 * 古いブラウザや環境ごとのAPI差異を吸収し、
 * 描画エラーによるクラッシュを防ぐための互換性パッチです。
 */

export function applyPolyfills(ctx) {
    // CanvasRenderingContext2D.prototype.roundRect Polyfill
    // roundRect (角丸矩形) がない環境では、通常の rect (矩形) に置き換えるか、パスで描画します。
    if (!ctx.roundRect) {
        console.warn('Canvas.roundRect is not supported. Applying polyfill.');

        ctx.roundRect = function (x, y, w, h, radii) {
            // 単純な互換性のため、通常の矩形を使用する (安全策)
            // 角丸を厳密に再現したい場合は arcTo を使うパス描画が必要だが、
            // エラー回避を優先して rect に委譲する。
            this.rect(x, y, w, h);

            /* 
            // もし将来的に見た目も再現したくなったら以下のコードを有効化する
            if (!radii) radii = 0;
            if (typeof radii === 'number') radii = {tl: radii, tr: radii, br: radii, bl: radii};
            else radii = {tl: 0, tr: 0, br: 0, bl: 0, ...radii}; 
            
            this.beginPath();
            this.moveTo(x + radii.tl, y);
            this.lineTo(x + w - radii.tr, y);
            this.quadraticCurveTo(x + w, y, x + w, y + radii.tr);
            this.lineTo(x + w, y + h - radii.br);
            this.quadraticCurveTo(x + w, y + h, x + w - radii.br, y + h);
            this.lineTo(x + radii.bl, y + h);
            this.quadraticCurveTo(x, y + h, x, y + h - radii.bl);
            this.lineTo(x, y + radii.tl);
            this.quadraticCurveTo(x, y, x + radii.tl, y);
            this.closePath();
            */
        };
    }
}
