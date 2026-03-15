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
        // ファイルパス定義
        // ストリーミング再生なのでファイルが存在すれば即再生開始される
        let src = '';
        if (type === 'TITLE') {
            src = './assets/audio/title3.mp3';
        } else if (type === 'BOSS') {
            src = './assets/audio/huwamoko_last_jump.mp3';
        } else if (type === 'BOSS_WAR') {
            src = './assets/audio/rabbit_war.mp3';
        } else if (type === 'GAME') {
            // Random disabled, using default bgm
            src = './assets/audio/bgm.mp3';
            // src = './assets/bgm_game2.mp3'; // Reserved
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
        } else if (type === 'NONE') {
            this.stopBGM();
            return;
        }

        if (!src) return;

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

    // ノード終了時に自動disconnect（メモリリーク防止）
    _autoDisconnect(node) {
        node.onended = () => { try { node.disconnect(); } catch(e) {} };
    }

    // Oscillator+Gain のペアを生成（自動disconnect付き）
    _createOscGain(type = 'sine') {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        this._autoDisconnect(osc);
        return { osc, gain };
    }

    // Noise Buffer を生成（自動disconnect付き）
    _createNoise(duration) {
        const bufferSize = Math.floor(this.ctx.sampleRate * duration);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const gain = this.ctx.createGain();
        noise.connect(gain);
        gain.connect(this.ctx.destination);
        this._autoDisconnect(noise);
        return { noise, gain };
    }

    playJump() {
        if (!this.initialized || !this.ctx) return;
        const nowMs = Date.now();
        if (nowMs - (this.lastPlayTimes['jump'] || 0) < 60) return;
        this.lastPlayTimes['jump'] = nowMs;

        const { osc, gain } = this._createOscGain('sine');
        const now = this.ctx.currentTime;
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.linearRampToValueAtTime(600, now + 0.15);
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

        const { osc, gain } = this._createOscGain('square');
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
        const { osc, gain } = this._createOscGain('sawtooth');
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.6);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
        osc.start(now);
        osc.stop(now + 0.6);
    }

    playDamage() {
        if (!this.initialized || !this.ctx) return;
        const now = this.ctx.currentTime;

        // Impact noise
        const { noise, gain: nGain } = this._createNoise(0.15);
        nGain.gain.setValueAtTime(0.3, now);
        nGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        noise.start(now);

        // Fall-tone
        const { osc, gain } = this._createOscGain('triangle');
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.3);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
    }

    playTone(freq, time, duration, type = 'sine') {
        if (!this.ctx) return;
        const { osc, gain } = this._createOscGain(type);
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.1, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + duration);
        osc.start(time);
        osc.stop(time + duration);
    }

    playBarrierBreak() {
        if (!this.initialized || !this.ctx) return;
        const now = this.ctx.currentTime;
        for (let i = 0; i < 3; i++) {
            this.playTone(1500 + Math.random() * 1000, now + i * 0.05, 0.4, 'sawtooth');
        }
        const { osc, gain } = this._createOscGain('square');
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.5);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
        const { noise, gain: nGain } = this._createNoise(0.4);
        nGain.gain.setValueAtTime(0.2, now);
        nGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        noise.start(now);
    }

    playBossExplosion() {
        if (!this.initialized || !this.ctx) return;
        const now = this.ctx.currentTime;

        const { osc: sub, gain: subGain } = this._createOscGain('sine');
        sub.frequency.setValueAtTime(60, now);
        sub.frequency.exponentialRampToValueAtTime(10, now + 0.8);
        subGain.gain.setValueAtTime(0.5, now);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
        sub.start(now);
        sub.stop(now + 0.8);

        for (let i = 0; i < 5; i++) {
            this.playTone(100 + Math.random() * 200, now + i * 0.05, 0.2, 'square');
        }

        const { noise, gain: nGain } = this._createNoise(2.0);
        nGain.gain.setValueAtTime(0.4, now);
        nGain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
        noise.start(now);

        this.playTone(2000, now + 0.5, 1.0, 'sine');
    }

    playBossAlarm() {
        if (!this.initialized || !this.ctx) return;
        const now = this.ctx.currentTime;
        for (let i = 0; i < 4; i++) {
            const time = now + i * 0.4;
            const { osc, gain } = this._createOscGain('sawtooth');
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
        const { osc, gain } = this._createOscGain('square');
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(10, now + 0.2);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
        const { noise, gain: nGain } = this._createNoise(0.3);
        nGain.gain.setValueAtTime(0.2, now);
        nGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        noise.start(now);
    }

    playBossImpact() {
        if (!this.initialized || !this.ctx) return;
        const now = this.ctx.currentTime;
        const { osc, gain } = this._createOscGain('triangle');
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.5);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
        this.playTone(80, now, 0.5, 'square');
        this.playTone(150, now, 0.4, 'square');
    }

    playLaser() {
        if (!this.initialized || !this.ctx) return;
        const now = this.ctx.currentTime;

        const { osc: whistle, gain: wGain } = this._createOscGain('sine');
        whistle.frequency.setValueAtTime(200, now);
        whistle.frequency.exponentialRampToValueAtTime(1200, now + 0.2);
        wGain.gain.setValueAtTime(0, now);
        wGain.gain.linearRampToValueAtTime(0.2, now + 0.1);
        wGain.gain.linearRampToValueAtTime(0, now + 0.2);
        whistle.start(now);
        whistle.stop(now + 0.2);

        const { osc: beam, gain: bGain } = this._createOscGain('sawtooth');
        beam.frequency.setValueAtTime(100, now + 0.2);
        beam.frequency.linearRampToValueAtTime(80, now + 1.2);
        bGain.gain.setValueAtTime(0.4, now + 0.2);
        bGain.gain.exponentialRampToValueAtTime(0.01, now + 1.2);
        beam.start(now + 0.2);
        beam.stop(now + 1.2);

        const { osc: buzz, gain: buzzGain } = this._createOscGain('square');
        buzz.frequency.setValueAtTime(440, now + 0.2);
        buzzGain.gain.setValueAtTime(0.1, now + 0.2);
        buzzGain.gain.exponentialRampToValueAtTime(0.01, now + 1.0);
        buzz.start(now + 0.2);
        buzz.stop(now + 1.0);

        const { noise, gain: nGain } = this._createNoise(1.5);
        nGain.gain.setValueAtTime(0.15, now + 0.2);
        nGain.gain.exponentialRampToValueAtTime(0.01, now + 1.2);
        noise.start(now + 0.2);
    }
}
