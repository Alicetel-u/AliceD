import * as PIXI from 'pixi.js';

/**
 * Renders only the tiles around the viewport.
 *
 * The old implementation created a Sprite for every solid tile in the whole
 * (roughly 1,400-column) level.  A stage transition consequently allocated
 * thousands of new WebGL objects at once and detached the old ones without
 * destroying them.  Mobile browsers commonly stalled or killed the WebGL
 * context around stage 2 as a result.
 */
export class TileRenderer {
    constructor(game) {
        this.game = game;
        this.pixi = game.pixi;
        this.tileSize = game.tileSize;
        this.isReady = false;
        this.tileContainer = null;
        this.grid = null;
        this.spritePool = [];
        this.textures = null;
    }

    init() {
        this.isReady = !!(this.pixi && this.pixi.isReady);
    }

    rebuild(grid) {
        if (!this.pixi || !this.pixi.isReady || !grid || !grid.length) return;

        this.grid = grid;
        this.tileSize = this.game.tileSize;

        if (!this.tileContainer) {
            this.tileContainer = new PIXI.Container();
            this.tileContainer.label = 'visible_tiles';
            this.pixi.layers.world.addChildAt(this.tileContainer, 0);
        }

        const theme = this.game.currentStageConfig.theme;
        this.textures = {
            '#': this.game.assets.getTexture(theme.groundTile),
            'D': this.game.assets.getTexture(theme.dirtTile),
            '=': this.game.assets.getTexture(theme.dirtTile),
            'B': this.game.assets.getTexture(theme.platformTile),
            'P': this.game.assets.getTexture(theme.platformTile)
        };

        // Keep the small viewport-sized pool across stages.  Textures are
        // replaced below, so no stage-specific Sprite objects accumulate.
        for (const sprite of this.spritePool) sprite.visible = false;
        this.isReady = true;
        this.update(this.game.camera);
    }

    _getSprite(index) {
        let sprite = this.spritePool[index];
        if (!sprite) {
            sprite = new PIXI.Sprite();
            this.spritePool.push(sprite);
            this.tileContainer.addChild(sprite);
        }
        return sprite;
    }

    update(camera) {
        if (!this.isReady || !this.grid || !this.textures) return;

        const rows = this.grid.length;
        const cols = this.grid[0].length;
        const margin = 2;
        const startCol = Math.max(0, Math.floor(camera.x / this.tileSize) - margin);
        const endCol = Math.min(cols - 1, Math.ceil((camera.x + camera.width) / this.tileSize) + margin);
        const startRow = Math.max(0, Math.floor(camera.y / this.tileSize) - margin);
        const endRow = Math.min(rows - 1, Math.ceil((camera.y + camera.height) / this.tileSize) + margin);

        let used = 0;
        for (let y = startRow; y <= endRow; y++) {
            const row = this.grid[y];
            for (let x = startCol; x <= endCol; x++) {
                const texture = this.textures[row[x]];
                if (!texture) continue;

                const sprite = this._getSprite(used++);
                sprite.texture = texture;
                sprite.x = x * this.tileSize;
                sprite.y = y * this.tileSize;
                sprite.width = this.tileSize;
                sprite.height = this.tileSize;
                sprite.visible = true;
            }
        }

        for (let i = used; i < this.spritePool.length; i++) {
            this.spritePool[i].visible = false;
        }

        this.pixi.layers.world.x = -camera.x;
        this.pixi.layers.world.y = -camera.y;
    }
}
