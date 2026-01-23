export class Camera {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.x = 0;
        this.y = 0;
        this.shakeTimer = 0;
        this.shakeIntensity = 0;
        this.lockY = null; // New: Allows freezing vertical scroll
        this.minX = 0;     // New: Prevents camera from scrolling backward past this point
    }

    follow(target, levelWidth, levelHeight, dt, offsetX = null) {
        // Position of the target within the camera screen
        // Default is center (this.width / 2)
        const screenX = offsetX !== null ? offsetX : this.width / 2;

        // Calculate camera X to keep target at screenX
        let targetX = target.x + target.width / 2 - screenX;
        let targetY = target.y + target.height / 2 - this.height / 2;

        // Clamp to level bounds
        targetX = Math.max(this.minX, Math.min(targetX, levelWidth - this.width));
        targetY = Math.max(0, Math.min(targetY, levelHeight - this.height));

        // Smooth follow? For now instant snap + Shake
        this.x = targetX;

        if (this.lockY !== null) {
            this.y = this.lockY;
        } else {
            this.y = targetY;
        }

        // Apply Shake
        if (this.shakeTimer > 0) {
            const offsetX = (Math.random() - 0.5) * 2 * this.shakeIntensity;
            const offsetY = (Math.random() - 0.5) * 2 * this.shakeIntensity;
            this.x += offsetX;
            this.y += offsetY;
            this.shakeTimer -= dt;
        }
    }

    shake(duration, intensity) {
        this.shakeTimer = duration;
        this.shakeIntensity = intensity;
    }
}
