export class Environment {
    constructor(width, height) {
        this.resize(width, height);
        this.particles = [];
    }

    resize(width, height) {
        this.width = width;
        this.height = height;
    }

    update(dt) {
        const dtFrames = dt * 60;
        // Hard limit particles for performance
        const MAX_PARTICLES = 200;

        // Spawn ambient particles
        if (this.particles.length < 30 && Math.random() < 0.05 * dtFrames) {
            this.spawn();
        }

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];

            // Physics
            if (p.friction) {
                p.vx *= Math.pow(p.friction, dtFrames);
                p.vy *= Math.pow(p.friction, dtFrames);
            }
            if (p.gravity) {
                p.vy += p.gravity * dtFrames;
            }

            if (p.attachTo) {
                if (typeof p.offsetX === 'undefined') {
                    p.offsetX = p.x - p.attachTo.x;
                    p.offsetY = p.y - p.attachTo.y;
                }
                p.offsetX += p.vx * dtFrames;
                p.offsetY += p.vy * dtFrames;
                p.x = p.attachTo.x + p.offsetX;
                p.y = p.attachTo.y + p.offsetY;
            } else {
                p.x += p.vx * dtFrames;
                p.y += p.vy * dtFrames;
            }

            // Growth
            if (p.grow) {
                p.size += p.grow * dtFrames;
            }

            p.life -= dtFrames;

            // Wrap or Respawn (Only for ambient screen space particles)
            if (p.screenSpace && !p.type) {
                if (p.y > this.height) {
                    p.y = -10;
                    p.x = Math.random() * this.width;
                }
                if (p.x > this.width) p.x = 0;
                if (p.x < 0) p.x = this.width;
            }

            if (p.life <= 0 || (this.particles.length > MAX_PARTICLES && i < this.particles.length - MAX_PARTICLES)) {
                this.particles.splice(i, 1);
            }
        }
    }

    spawn() {
        this.particles.push({
            x: Math.random() * this.width,
            y: Math.random() * this.height,
            vx: Math.random() * 1 - 0.5,
            vy: Math.random() * 0.5 + 0.2,
            life: 600 + Math.random() * 600,
            size: Math.random() * 3 + 1,
            color: Math.random() > 0.5
                ? 'rgba(255, 255, 255, 0.3)'
                : 'rgba(150, 255, 150, 0.4)',
            screenSpace: true
        });
    }

    draw(ctx, camera) {
        const pCount = this.particles.length;
        if (pCount === 0) return;

        ctx.save();
        for (let i = 0; i < pCount; i++) {
            const p = this.particles[i];
            const dx = (p.screenSpace ? p.x : p.x - camera.x) | 0;
            const dy = (p.screenSpace ? p.y : p.y - camera.y) | 0;

            // Simple off-screen clipping
            if (dx < -100 || dx > this.width + 100 || dy < -100 || dy > this.height + 100) continue;

            // Global Fade
            let alpha = 1.0;
            if (p.fade && p.life < 40) {
                alpha = p.life / 40;
            } else if (p.life < 20) {
                alpha = p.life / 20;
            }
            ctx.globalAlpha = alpha;

            if (p.type === 'text') {
                ctx.save();

                if (p.rainbow) {
                    const hue = (Date.now() / 2) % 360;
                    ctx.fillStyle = `hsl(${hue}, 100%, 70%)`;
                } else {
                    ctx.fillStyle = p.color || '#FFF';
                }

                if (p.blink) {
                    if (Math.floor(Date.now() / 50) % 2 === 0) {
                        ctx.globalAlpha *= 0.3;
                    }
                }

                let displaySize = p.size || 20;
                if (p.pulse) {
                    displaySize += Math.sin(Date.now() / 150) * (displaySize * 0.2);
                } else if (p.rainbow) {
                    displaySize += Math.sin(Date.now() / 100) * 10;
                }

                ctx.font = `${p.bold ? 'bold ' : ''}${displaySize | 0}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';

                ctx.strokeStyle = '#000';
                ctx.lineWidth = (displaySize * 0.15) | 0;
                ctx.strokeText(p.text, dx, dy);
                ctx.fillText(p.text, dx, dy);

                ctx.restore();
            } else {
                ctx.fillStyle = p.color;

                // Circular Glow (Fast replacement for shadowBlur)
                if (p.glow) {
                    ctx.globalAlpha = alpha * 0.3;
                    ctx.beginPath();
                    ctx.arc(dx, dy, p.size * 2, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.globalAlpha = alpha;
                }

                // Main particle
                if (p.grow || p.glow) {
                    ctx.beginPath();
                    ctx.arc(dx, dy, p.size | 0, 0, Math.PI * 2);
                    ctx.fill();
                } else {
                    const s = p.size | 0;
                    ctx.fillRect(dx - s / 2 | 0, dy - s / 2 | 0, s, s);
                }
            }
        }
        ctx.restore();
    }
}
