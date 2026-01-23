import { Particle } from './entities/Particle.js';

export class Effects {
    static spawnFlashes(x, y, color, game) {
        // Create quick expanding circle particles or just use Particle class?
        // Let's assume we can add particles to Player's particle list or Game env.
        // Actually, let's just make a simple particle spawner that pushes to game.env.particles if possible, 
        // OR add a particles list to Game.
        // Easier: Use Environment particles for simple flash effects.

        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 / 8) * i;
            const speed = 2;
            game.env.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 20,
                size: 4,
                color: color
            });
        }
    }
}
