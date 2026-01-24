/**
 * StageValidator.js
 * ステージ設定データの整合性をチェックし、不足している値を安全なデフォルト値で埋めます。
 * これにより、設定ミスによるゲームクラッシュを防ぎます。
 */

export class StageValidator {
    /**
     * ステージ設定を検証し、安全な設定オブジェクトを返します。
     * @param {Object} config 生のステージ設定オブジェクト
     * @returns {Object} 検証済みの安全な設定オブジェクト
     */
    static validate(config) {
        if (!config) {
            console.error('StageValidator: Config is null or undefined. Using fallback.');
            return this.getFallbackConfig();
        }

        // Deep copy to avoid mutating original if needed, but here we just ensure properties exist.
        const safeConfig = { ...config };

        // 1. Theme Validation
        safeConfig.theme = {
            backgroundType: "color",
            backgroundImage: null,
            backgroundColor: "#000000",
            groundTile: "grass_block",
            dirtTile: "dirt_block",
            platformTile: "crate",
            backgroundLayers: [],
            ...(config.theme || {})
        };

        // 2. Generation Validation (最も重要)
        safeConfig.generation = {
            length: 100,
            holes: 0.0,
            platforms: 0.0,
            features: {}, // features 自体がない場合
            ...(config.generation || {})
        };

        // Features の各確率値を検証 (0.0 ~ 1.0 にクランプし、undefinedなら 0.0)
        const rawFeatures = config.generation.features || {};
        safeConfig.generation.features = {
            springs: this.clamp(rawFeatures.springs),
            rings: this.clamp(rawFeatures.rings),
            clouds: this.clamp(rawFeatures.clouds),
            moving: this.clamp(rawFeatures.moving),
            falling: this.clamp(rawFeatures.falling),
            enemies: this.clamp(rawFeatures.enemies),
            flyers: this.clamp(rawFeatures.flyers),
            carrots: this.clamp(rawFeatures.carrots)
        };

        // 3. Physics Validation
        safeConfig.physics = {
            gravity: 1500,
            friction: 0.9,
            ...(config.physics || {})
        };

        // 4. Boss Validation
        if (config.boss) {
            safeConfig.boss = {
                name: "Unknown Boss",
                hp: 5,
                bgm: "BOSS_WAR",
                ai: { attackInterval: 3.0, phases: [], attackPool: [] },
                ...config.boss
            };
        }
        // Boss is optional for some stages? (Assuming yes)

        return safeConfig;
    }

    /**
     * 値を 0.0 ~ 1.0 の範囲に収めます。数値でない場合は def (デフォルト0.0) を返します。
     */
    static clamp(value, def = 0.0) {
        if (typeof value !== 'number' || isNaN(value)) return def;
        return Math.max(0.0, Math.min(1.0, value));
    }

    static getFallbackConfig() {
        return {
            id: 0,
            name: "Emergency Fallback Stage",
            theme: { backgroundColor: "#333", groundTile: "grass_block", dirtTile: "dirt_block" },
            generation: { length: 50, holes: 0, platforms: 0, features: {} },
            physics: { gravity: 1500, friction: 0.9 },
            bgm: "GAME"
        };
    }
}
