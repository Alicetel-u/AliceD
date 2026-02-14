import * as PIXI from 'pixi.js';

/**
 * TileRenderer
 * Handles rendering of the stage tiles using PixiJS.
 * Pixi v8 compatible.
 */
export class TileRenderer {
    constructor(game) {
        this.game = game;
        this.pixi = game.pixi;
        this.tileSize = game.tileSize;
        this.isReady = false;
        this.container = null;
        this.lastGrid = null; // Store for catch-up
        this.pixiInitialized = false;
    }

    init() {
        // init is handled by rebuild mostly
        this.isReady = (this.pixi && this.pixi.isReady);
    }

    /**
     * Clear and rebuild the entire tilemap in WebGL
     * @param {Array} grid 2D array of tile characters
     */
    rebuild(grid) {
        this.lastGrid = grid;
        if (!this.pixi || !this.pixi.isReady) return;

        // Use the world layer
        this.container = this.pixi.layers.world;

        // Clear existing sprites from previous stage
        // Note: We only remove sprites added by TileRenderer. 
        // Ideally we should have a sub-container for tiles if 'world' has other things.
        // For now, let's assume 'world' is for tiles + maybe projectiles.
        // Safer: Create a sub-container.
        if (!this.tileContainer) {
            this.tileContainer = new PIXI.Container();
            this.pixi.layers.world.addChildAt(this.tileContainer, 0); // Background of world
        }

        this.tileContainer.removeChildren();
        this.tileSprites = [];

        const rows = grid.length;
        const cols = grid[0].length;
        const config = this.game.currentStageConfig.theme;

        // Texture optimization
        const groundTex = this.game.assets.getTexture(config.groundTile);
        const dirtTex = this.game.assets.getTexture(config.dirtTile);
        const platformTex = this.game.assets.getTexture(config.platformTile);

        // Iterate grid and place sprites
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                const tile = grid[y][x];
                let texture = null;

                if (tile === '#') texture = groundTex;
                else if (tile === 'D') texture = dirtTex; // 'D' used for dirt in Level.js generator
                else if (tile === '=') texture = dirtTex; // Fallback
                else if (tile === 'B' || tile === 'P') texture = platformTex;

                if (texture) {
                    const sprite = new PIXI.Sprite(texture);
                    sprite.x = x * this.tileSize;
                    sprite.y = y * this.tileSize;
                    sprite.width = this.tileSize;
                    sprite.height = this.tileSize;
                    this.tileContainer.addChild(sprite);
                    this.tileSprites.push(sprite);
                }
            }
        }

        console.log(`[TileRenderer] Rebuilt WebGL map with ${this.tileSprites.length} tiles.`);
        this.isReady = true;
    }

    update(camera) {
        if (!this.pixiInitialized && this.pixi && this.pixi.isReady && this.lastGrid) {
            this.rebuild(this.lastGrid);
            this.pixiInitialized = true;
        }

        if (!this.isReady || !this.pixi.layers.world) return;

        // Move the entire world layer opposite to camera
        this.pixi.layers.world.x = -camera.x;
        this.pixi.layers.world.y = -camera.y;
    }
}
