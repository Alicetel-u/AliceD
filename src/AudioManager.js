export class AudioManager {
    constructor() {
        this.ctx = null;

        // BGM Streaming
        this.bgmAudio = new Audio();
        this.bgmAudio.loop = true;

        this.isMuted = false;
        this.volume = 0.3;
        this.bgmAudio.volume = this.volume;

        this.initialized = false;
        this.currentBgmType = null;
        this.lastPlayTimes = {}; // Rate limiting for SE
    }

    async init() {
        if (this.initialized) return;

        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();

        // SE用のコンテキスト再開（念のため）
        if (this.ctx.state === 'suspended' && !this.isMuted) {
            await this.ctx.resume();
        }

        this.initialized = true;
    }

    playBGM(type) {
        // --- 特殊ケース: 停止 ---
        if (!type || type === 'NONE') {
            this.stopBGM();
            return;
        }

        // ファイルパス定義
        let src = '';
        if (type === 'TITLE') {
            src = './assets/audio/title3.mp3';
        } else if (type === 'BOSS') {
            src = './assets/audio/huwamoko_last_jump.mp3';
        } else if (type === 'BOSS_WAR') {
            src = './assets/audio/rabbit_war.mp3';
        } else if (type === 'GAME') {
            src = './assets/audio/bgm.mp3';
        } else if (type === 'SISTER') {
            src = './assets/audio/sister.mp3';
        } else if (type === 'BOSS_SISTER') {
            src = './assets/audio/sisterboss.mp3';
        } else if (type === 'BOSS_NURSE') {
            src = './assets/audio/byouinboss.mp3';
        } else if (type === 'TOY') {
            src = './assets/audio/omocha.mp3';
        } else if (type === 'BOSS_TOY') {
            src = './assets/audio/stage3boss.mp3';
        } else if (type === 'HEAVEN') {
            src = './assets/audio/heaven.mp3';
        } else if (type === 'BOSS_FINAL') {
            src = './assets/audio/stage5boss.mp3';
        } else if (type === 'HOSPITAL') {
            src = './assets/audio/stage4.mp3';
        } else if (type === 'ENDING') {
            src = './assets/audio/ending.mp3';
        }

        if (!src) {
            console.warn(`Unknown BGM type: ${type}. Stopping music.`);
            this.stopBGM();
            return;
        }

        // すでに同じタイプのBGMが再生中なら何もしない（パスが変わる可能性はあるが、簡易判定）
        if (this.currentBgmType === type && !this.bgmAudio.paused) return;

        // BGM切り替え
        // 同じsrcなら再生し直さない
        if (this.bgmAudio.src.endsWith(src.substring(2))) { // substring('./')
            if (this.bgmAudio.paused) {
                this.bgmAudio.play().catch(e => console.warn(e));
            }
            return;
        }

        this.bgmAudio.src = src;
        this.bgmAudio.play().catch(e => {
            console.warn('BGM Playback failed (Autoplay policy? / File not found):', e);
        });

        this.currentBgmType = type;
    }

    stopBGM() {
        this.bgmAudio.pause();
        this.bgmAudio.currentTime = 0;
        this.currentBgmType = null;
    }

    playTitleBGM() {
        this.playBGM('TITLE');
    }

    playGameBGM() {
        this.playBGM('GAME');
    }

    playBossBGM() {
        this.playBGM('BOSS');
    }

    toggleMute() {
        this.isMuted = !this.isMuted;

        // Mute BGM
        this.bgmAudio.muted = this.isMuted;

        // Mute SE (Suspend Context)
        if (this.ctx) {
            if (this.isMuted) {
                this.ctx.suspend();
            } else {
                this.ctx.resume();
            }
        }
        return this.isMuted;
    }

    // --- Sound Effects (Web Audio API) ---
    // SEは短いためメモリ展開（Oscillator生成）でも負荷は低いので維持

    playJump() {
        if (!this.initialized || !this.ctx) return;
        const nowMs = Date.now();
        if (nowMs - (this.lastPlayTimes['jump'] || 0) < 60) return;
        this.lastPlayTimes['jump'] = nowMs;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.type = 'sine';

        const now = this.ctx.currentTime;
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.linearRampToValueAtTime(600, now + 0.15); // Slide up

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

        osc.start(now);
        osc.stop(now + 0.15);
    }

    playLand() {
        if (!this.initialized || !this.ctx) return;
        const nowMs = Date.now();
        if (nowMs - (this.lastPlayTimes['land'] || 0) < 60) return;
        this.lastPlayTimes['land'] = nowMs;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.type = 'square'; // More impact

        const now = this.ctx.currentTime;
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.1);

        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

        osc.start(now);
        osc.stop(now + 0.1);
    }

    playCollect() {
        if (!this.initialized || !this.ctx) return;
        const now = this.ctx.currentTime;

        // Ding 1
        this.playTone(880, now, 0.1, 'sine'); // A5
        // Ding 2
        this.playTone(1174.66, now + 0.1, 0.2, 'sine'); // D6
    }

    playRecovery() {
        if (!this.initialized || !this.ctx) return;
        const now = this.ctx.currentTime;
        // Lower rising sparkly sound
        this.playTone(440, now, 0.1, 'sine'); // A4
        this.playTone(660, now + 0.05, 0.12, 'sine'); // E5
        this.playTone(880, now + 0.1, 0.15, 'sine'); // A5
        this.playTone(1320, now + 0.15, 0.2, 'sine'); // E6
        this.playTone(1760, now + 0.2, 0.4, 'sine'); // A6
    }

    playWin() {
        if (!this.initialized || !this.ctx) return;
        const now = this.ctx.currentTime;
        // Fanfare-ish
        this.playTone(523.25, now, 0.2, 'square'); // C5
        this.playTone(659.25, now + 0.2, 0.2, 'square'); // E5
        this.playTone(783.99, now + 0.4, 0.2, 'square'); // G5
        this.playTone(1046.50, now + 0.6, 0.8, 'square'); // C6
    }

    playFall() {
        if (!this.initialized || !this.ctx) return;
        const now = this.ctx.currentTime;
        // 情けない下降音 "ヒュ〜〜ン..."
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.type = 'sawtooth'; // ギザギザした音で情けなさを強調
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.6); // 急降下

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

        osc.start(now);
        osc.stop(now + 0.6);
    }

    playDamage() {
        if (!this.initialized || !this.ctx) return;
        const now = this.ctx.currentTime;

        // Impact noise (Buff!)
        const bufferSize = this.ctx.sampleRate * 0.15; // 0.15 sec
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.3, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        noise.connect(noiseGain);
        noiseGain.connect(this.ctx.destination);
        noise.start(now);

        // Pathetic fall-tone (Pyuuu...)
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.3); // Drop pitch low

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.3);

        osc.start(now);
        osc.stop(now + 0.3);
    }

    playTone(freq, time, duration, type = 'sine') {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.type = type;
        osc.frequency.value = freq;

        gain.gain.setValueAtTime(0.1, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + duration);

        osc.start(time);
        osc.stop(time + duration);
    }

    playBarrierBreak() {
        if (!this.initialized || !this.ctx) return;
        const now = this.ctx.currentTime;

        // 1. High frequency shatter (Glass-like)
        for (let i = 0; i < 3; i++) {
            this.playTone(1500 + Math.random() * 1000, now + i * 0.05, 0.4, 'sawtooth');
        }

        // 2. Satisfying Low Impact (Explosion-like)
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.type = 'square';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.5);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);

        // 3. Noise Burst for texture
        const bufferSize = this.ctx.sampleRate * 0.4;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const nGain = this.ctx.createGain();
        nGain.gain.setValueAtTime(0.2, now);
        nGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        noise.connect(nGain);
        nGain.connect(this.ctx.destination);
        noise.start(now);
    }

    playBossExplosion() {
        if (!this.initialized || !this.ctx) return;
        const now = this.ctx.currentTime;

        // 1. Deep Sub-bass Thump (The heavy kick)
        const sub = this.ctx.createOscillator();
        const subGain = this.ctx.createGain();
        sub.connect(subGain);
        subGain.connect(this.ctx.destination);
        sub.type = 'sine';
        sub.frequency.setValueAtTime(60, now);
        sub.frequency.exponentialRampToValueAtTime(10, now + 0.8);
        subGain.gain.setValueAtTime(0.5, now);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
        sub.start(now);
        sub.stop(now + 0.8);

        // 2. Tearing/Crackling Crack (The initial burst)
        for (let i = 0; i < 5; i++) {
            const crackTime = now + i * 0.05;
            this.playTone(100 + Math.random() * 200, crackTime, 0.2, 'square');
        }

        // 3. Main Fireball Noise (The "Whoosh")
        const bufferSize = this.ctx.sampleRate * 2.0; // 2 seconds of decay
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            // Noise that decays over time
            data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const nGain = this.ctx.createGain();
        nGain.gain.setValueAtTime(0.4, now);
        nGain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
        noise.connect(nGain);
        nGain.connect(this.ctx.destination);
        noise.start(now);

        // 4. Final Shimmer (The sparkling finish)
        this.playTone(2000, now + 0.5, 1.0, 'sine');
    }

    playBossAlarm() {
        if (!this.initialized || !this.ctx) return;
        const now = this.ctx.currentTime;
        // Rhythmic Siren
        for (let i = 0; i < 4; i++) {
            const time = now + i * 0.4;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(400, time);
            osc.frequency.exponentialRampToValueAtTime(800, time + 0.25);
            gain.gain.setValueAtTime(0.15, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + 0.35);
            osc.start(time);
            osc.stop(time + 0.4);
        }
    }

    playBossDamage() {
        if (!this.initialized || !this.ctx) return;
        const now = this.ctx.currentTime;

        // 1. Sharp Punch (Impact)
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.type = 'square';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(10, now + 0.2);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);

        // 2. Crunch Noise (Destruction texture)
        const bufferSize = this.ctx.sampleRate * 0.3;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const nGain = this.ctx.createGain();
        nGain.gain.setValueAtTime(0.2, now);
        nGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        noise.connect(nGain);
        nGain.connect(this.ctx.destination);
        noise.start(now);
    }

    playBossImpact() {
        if (!this.initialized || !this.ctx) return;
        const now = this.ctx.currentTime;
        // Heavy metallic impact
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.5);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);

        // Clang texture
        this.playTone(80, now, 0.5, 'square');
        this.playTone(150, now, 0.4, 'square');
    }

    playLaser() {
        if (!this.initialized || !this.ctx) return;
        const now = this.ctx.currentTime;

        // 1. Charge-up Whistle (Quick slide up)
        const whistle = this.ctx.createOscillator();
        const wGain = this.ctx.createGain();
        whistle.connect(wGain);
        wGain.connect(this.ctx.destination);
        whistle.type = 'sine';
        whistle.frequency.setValueAtTime(200, now);
        whistle.frequency.exponentialRampToValueAtTime(1200, now + 0.2);
        wGain.gain.setValueAtTime(0, now);
        wGain.gain.linearRampToValueAtTime(0.2, now + 0.1);
        wGain.gain.linearRampToValueAtTime(0, now + 0.2);
        whistle.start(now);
        whistle.stop(now + 0.2);

        // 2. Main Beam (Low Frequency Roar)
        const beam = this.ctx.createOscillator();
        const bGain = this.ctx.createGain();
        beam.connect(bGain);
        bGain.connect(this.ctx.destination);
        beam.type = 'sawtooth';
        beam.frequency.setValueAtTime(100, now + 0.2);
        beam.frequency.linearRampToValueAtTime(80, now + 1.2); // Slight drop
        bGain.gain.setValueAtTime(0.4, now + 0.2);
        bGain.gain.exponentialRampToValueAtTime(0.01, now + 1.2);
        beam.start(now + 0.2);
        beam.stop(now + 1.2);

        // 3. High Frequency Buzz
        const buzz = this.ctx.createOscillator();
        const buzzGain = this.ctx.createGain();
        buzz.connect(buzzGain);
        buzzGain.connect(this.ctx.destination);
        buzz.type = 'square';
        buzz.frequency.setValueAtTime(440, now + 0.2);
        buzzGain.gain.setValueAtTime(0.1, now + 0.2);
        buzzGain.gain.exponentialRampToValueAtTime(0.01, now + 1.0);
        buzz.start(now + 0.2);
        buzz.stop(now + 1.0);

        // 4. Beam Noise (Texture)
        const bufferSize = this.ctx.sampleRate * 1.5;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const nGain = this.ctx.createGain();
        nGain.gain.setValueAtTime(0.15, now + 0.2);
        nGain.gain.exponentialRampToValueAtTime(0.01, now + 1.2);
        noise.connect(nGain);
        nGain.connect(this.ctx.destination);
        noise.start(now + 0.2);
    }
}
