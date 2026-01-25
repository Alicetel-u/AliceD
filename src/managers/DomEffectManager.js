/**
 * DomEffectManager
 * Handles floating text effects using HTML DOM elements purely.
 * Replaces Canvas-based text particles for sharper text and better performance overlay.
 */
export class DomEffectManager {
    constructor(game) {
        this.game = game;
        this.container = null;
        this.effects = [];
    }

    init() {
        // Create container tailored for effects overlay
        this.container = document.createElement('div');
        this.container.id = 'dom-effects-layer';
        Object.assign(this.container.style, {
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            overflow: 'hidden',
            zIndex: '20' // Above Pixi Canvas (5), below UI Panels (usually higher)
        });

        const app = document.getElementById('app');
        if (app) {
            app.appendChild(this.container);
        }
    }

    /**
     * Spawn a new text effect
     * @param {string} text Text to display
     * @param {number} x World X (or Screen X if opts.screenSpace)
     * @param {number} y World Y (or Screen Y if opts.screenSpace)
     * @param {object} opts Options { color, size, life(frames), vx, vy, gravity, screenSpace, bold }
     */
    spawn(text, x, y, opts = {}) {
        if (!this.container) return;

        const el = document.createElement('div');
        el.textContent = text;

        // Base Styling
        Object.assign(el.style, {
            position: 'absolute',
            color: opts.color || '#ffffff',
            fontSize: (opts.size || 20) + 'px',
            fontWeight: opts.bold ? 'bold' : 'normal',
            fontFamily: '"Zen Maru Gothic", sans-serif',
            textShadow: '2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
            whiteSpace: 'nowrap',
            willChange: 'transform, opacity',
            transform: 'translate(-50%, -50%)', // Center alignment
            transition: 'none'
        });

        this.container.appendChild(el);

        const effect = {
            el: el,
            x: x,
            y: y,
            vx: opts.vx || 0,
            vy: opts.vy || 0,
            life: opts.life || 60,
            maxLife: opts.life || 60,
            gravity: opts.gravity || 0,
            screenSpace: opts.screenSpace || false,
            pulse: opts.pulse || false
        };

        this.effects.push(effect);
    }

    update(dt) {
        if (!this.container) return;

        // Convert dt to frames (approx) for logic compatibility
        // Or just use dt seconds. Our game logic often uses frames (life=60).
        // Let's assume life is in FRAMES (60fps). 
        const df = dt * 60;

        for (let i = this.effects.length - 1; i >= 0; i--) {
            const fx = this.effects[i];

            // Physics
            fx.x += fx.vx * df; // vx in pixels/frame? 
            // Usually vx is pixels/frame in original code (e.g. vx = -1.5)
            // If vx was pixels/second, we would use dt.
            // Original code: vx: (Math.random() - 0.5) * 8 -> seems like px/frame.

            fx.y += fx.vy * df;
            fx.vy += fx.gravity * df;
            fx.life -= df;

            // Render
            if (fx.life <= 0) {
                fx.el.remove();
                this.effects.splice(i, 1);
                continue;
            }

            // Calculate Position
            const drawX = fx.screenSpace ? fx.x : (fx.x - this.game.camera.x);
            const drawY = fx.screenSpace ? fx.y : (fx.y - this.game.camera.y);

            // Hide if off-screen (optimization)
            if (drawX < -100 || drawX > this.game.width + 100 || drawY < -100 || drawY > this.game.height + 100) {
                fx.el.style.display = 'none';
            } else {
                fx.el.style.display = 'block';
                fx.el.style.left = drawX + 'px';
                fx.el.style.top = drawY + 'px';
            }

            // Animation (Fade & Pulse)
            let opacity = 1.0;
            if (fx.life < 20) {
                opacity = fx.life / 20;
            }
            fx.el.style.opacity = opacity;

            let scale = 1.0;
            if (fx.pulse) {
                const age = fx.maxLife - fx.life;
                scale = 1.0 + Math.sin(age * 0.2) * 0.2;
            }
            // Grow in
            const age = fx.maxLife - fx.life;
            if (age < 5) {
                scale *= (age / 5);
            }

            fx.el.style.transform = `translate(-50%, -50%) scale(${scale})`;
        }
    }

    clear() {
        if (!this.container) return;
        this.container.innerHTML = '';
        this.effects = [];
    }
}
