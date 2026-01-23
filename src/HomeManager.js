export class HomeManager {
    constructor(game) {
        this.game = game;
        this.ctx = game.ctx;

        // ホーム画面専用の状態管理
        this.activeTab = 'MAIN'; // MAIN, CHAR_SELECT, GACHA, RESULTS
        this.blinkTimer = 0;

        // プレミアム演出用
        this.particles = [];
        this.logoFloat = 0;
        this.musicListInitialized = false;
        this.currentMusicId = null;

        this.setupUI();
    }

    setupUI() {
        // Gacha Button Action
        const gachaBtn = document.getElementById('btn-home-gacha');
        if (gachaBtn) {
            gachaBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (this.game.score >= 10) {
                    this.game.gacha.triggerSingleGacha();
                } else {
                    alert('ニンジンが足りません！ (必要: 10)');
                }
            });
        }
    }

    updateCurrency() {
        const el = document.getElementById('home-currency');
        if (el) el.innerText = this.game.score;
    }

    renderMiniCollection() {
        const container = document.getElementById('home-mini-collection');
        if (!container) return;

        // パフォーマンス: 内容が多いため毎フレーム再生成は避ける（変更検知が必要だが、今回は簡易的に全クリア）
        // 実際には dirty flag を使うのが良いが、Home画面なので負荷は低い
        if (this.game.gacha.isDirtyCollection !== false) { // isDirtyフラグ的なものを想定
            // 毎回描画すると重い可能性があるが、アイテム数が少なければOK
        }

        container.innerHTML = '';
        const allItems = this.game.gacha.items;
        const collection = this.game.gacha.collection;

        // 簡易表示: 最初の16個だけ表示、あるいは全表示
        allItems.forEach(item => {
            const hasItem = collection[item.id] > 0;
            const div = document.createElement('div');
            div.className = `mini-item ${hasItem ? '' : 'locked'}`;

            if (hasItem) {
                div.innerHTML = this.game.gacha.getIconHtml(item, 24);
                div.title = item.name;
            } else {
                div.title = "???";
            }
            container.appendChild(div);
        });
    }

    setupSections() {
        // Home専用の更新セクション
        // Home専用の更新セクション
        this.inputCooldown = 0;
        this.lastState = 'BOOT';

        this.game.sections.register('HomeSystem', {
            update: (dt) => {
                // Detect state entry to HOME
                if (this.game.state === 'HOME' && this.lastState !== 'HOME') {
                    this.inputCooldown = 0.5; // 0.5 sec lockout
                }
                this.lastState = this.game.state;

                if (this.inputCooldown > 0) {
                    this.inputCooldown -= dt;
                }

                // ビジュアル更新（表示切替ロジックを含むため常時実行）
                this.updateVisuals(dt);

                // 入力処理はHOME画面のみ (かつクールダウン明け)
                if (this.game.state === 'HOME' && this.inputCooldown <= 0) {
                    this.handleInput();
                }
            }
        });

        // Home専用の描画セクション（背景演出）
        this.game.sections.register('HomeVisuals', {
            draw: () => {
                if (this.game.state !== 'HOME') return;
                this.drawBackground();
            }
        });

        // Home専用の描画セクション（UIレイヤー）
        this.game.sections.register('HomeUI', {
            draw: () => {
                if (this.game.state !== 'HOME') return;
                this.drawUI();
            }
        });
    }

    updateVisuals(dt) {
        this.blinkTimer += dt;
        this.logoFloat += dt * 2;

        // UIパネルの表示切替
        const gachaPanel = document.getElementById('home-gacha-panel');
        const collectionPanel = document.getElementById('home-collection-panel');

        // 状態チェックを厳密に行う：HOME以外なら絶対に隠す
        if (this.game.state !== 'HOME') {
            if (gachaPanel && !gachaPanel.classList.contains('hidden')) gachaPanel.classList.add('hidden');
            if (collectionPanel && !collectionPanel.classList.contains('hidden')) collectionPanel.classList.add('hidden');
        } else {
            // HOMEの場合のみ表示
            // 一時的にガチャとコレクション画面を非表示にする（ユーザーリクエスト）
            if (gachaPanel && !gachaPanel.classList.contains('hidden')) gachaPanel.classList.add('hidden');
            if (collectionPanel && !collectionPanel.classList.contains('hidden')) collectionPanel.classList.add('hidden');

            /* 元のコードを保持
            if (gachaPanel) gachaPanel.classList.remove('hidden');
            if (collectionPanel) {
                collectionPanel.classList.remove('hidden');
                this.renderMiniCollection();
            }
            */
            this.updateCurrency();
        }

        // ホーム画面専用のパーティクル（キラキラ）
        if (Math.random() < 0.05) {
            this.particles.push({
                x: Math.random() * this.game.width,
                y: this.game.height + 10,
                size: Math.random() * 3 + 1,
                speed: Math.random() * 50 + 20,
                alpha: 1.0
            });
        }

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.y -= p.speed * dt;
            p.alpha -= dt * 0.5;
            if (p.alpha <= 0) this.particles.splice(i, 1);
        }
    }

    handleInput() {
        // Prevent background clicks if Music Room is open
        const musicPanel = document.getElementById('music-room-panel');
        if (musicPanel && !musicPanel.classList.contains('hidden')) {
            return;
        }

        const input = this.game.input;

        if (input.pointerPressed) {
            const mx = input.pointerX;
            const my = input.pointerY;

            const allChars = this.game.characterManager.getAllCharacters();
            const cardW = 300;
            const cardH = 400;
            const spacing = 50;
            const totalW = (cardW * allChars.length) + (spacing * (allChars.length - 1));
            const startX = (this.game.width - totalW) / 2;
            const centerY = this.game.height / 2;

            allChars.forEach((char, i) => {
                const x = Math.floor(startX + i * (cardW + spacing));
                const individualFloat = Math.sin(this.logoFloat + i * 1.5) * 15;
                const y = Math.floor(centerY - (cardH / 2) + individualFloat);

                // クリック判定（描画と同様の範囲で行う）
                if (mx >= x && mx <= x + cardW && my >= y && my <= y + cardH) {
                    this.selectAndStart(char.id);
                }
            });

            // Music Room Button Hit Test
            // Position: Center Bottom under cards
            const musicBtnW = 200;
            const musicBtnH = 50;
            const musicBtnX = (this.game.width - musicBtnW) / 2;
            const musicBtnY = this.game.height - 100;

            if (mx >= musicBtnX && mx <= musicBtnX + musicBtnW && my >= musicBtnY && my <= musicBtnY + musicBtnH) {
                this.openMusicRoom();
            }
        }
    }

    async selectAndStart(charId) {
        // 現在のキャラと違う場合のみ切り替え
        if (this.game.characterManager.getCurrentCharacter().id !== charId) {
            // 正しいメソッド名 selectCharacter に修正
            this.game.characterManager.selectCharacter(charId);
            await this.game.reloadCharacterSprite();
        }
        this.game.startGame();
    }

    drawBackground() {
        const titleBg = this.game.assets.getImage('bg_title');
        if (titleBg) {
            // "Cover" fit logic
            const imgAspect = titleBg.width / titleBg.height;
            const screenAspect = this.game.width / this.game.height;

            let drawW, drawH, offsetX, offsetY;

            if (screenAspect > imgAspect) {
                // Screen is wider than image: match width, crop height
                drawW = this.game.width;
                drawH = drawW / imgAspect;
                offsetX = 0;
                offsetY = (this.game.height - drawH) / 2;
            } else {
                // Screen is taller than image: match height, crop width
                drawH = this.game.height;
                drawW = drawH * imgAspect;
                offsetX = (this.game.width - drawW) / 2;
                offsetY = 0;
            }

            this.ctx.drawImage(titleBg, offsetX, offsetY, drawW, drawH);

            // Overlay removed
        } else {
            // Fallback
            this.ctx.fillStyle = '#54a0ff';
            this.ctx.fillRect(0, 0, this.game.width, this.game.height);
        }
    }

    drawUI() {
        const allChars = this.game.characterManager.getAllCharacters();
        const cardW = 300;
        const cardH = 400;
        const spacing = 50;
        const totalW = (cardW * allChars.length) + (spacing * (allChars.length - 1));
        const startX = (this.game.width - totalW) / 2;
        const centerY = this.game.height / 2;

        // タイトルロゴ描画セクションを削除（真っさらな状態にする）

        // キャラクターカード（ふよふよ浮く）
        allChars.forEach((char, i) => {
            const x = Math.floor(startX + i * (cardW + spacing));
            const individualFloat = Math.sin(this.logoFloat + i * 1.5) * 15;
            const y = Math.floor(centerY - (cardH / 2) + individualFloat);

            // ホバー判定を先に定義（エラー防止）
            const isHovered = (
                this.game.input.pointerX >= x &&
                this.game.input.pointerX <= x + cardW &&
                this.game.input.pointerY >= y &&
                this.game.input.pointerY <= y + cardH
            );

            // ホバー時のスケールアップ演出
            const scale = isHovered ? 1.05 : 1.0;
            const drawW = Math.floor(cardW * scale);
            const drawH = Math.floor(cardH * scale);
            const dx = Math.floor(x - (drawW - cardW) / 2);
            const dy = Math.floor(y - (drawH - cardH) / 2);

            const theme = char.theme || { primaryColor: '#FFF' };

            // --- カード本体の描画 ---
            this.ctx.save();

            // 外光（カード背後のグロー）
            if (isHovered) {
                this.ctx.shadowBlur = 40;
                this.ctx.shadowColor = theme.primaryColor;
            } else {
                this.ctx.shadowBlur = 10;
                this.ctx.shadowColor = 'rgba(0,0,0,0.2)';
            }
            this.ctx.shadowOffsetY = 15;

            // カードのベース
            this.ctx.beginPath();
            if (this.ctx.roundRect) this.ctx.roundRect(dx, dy, drawW, drawH, 26);
            else this.ctx.rect(dx, dy, drawW, drawH);
            this.ctx.fillStyle = isHovered ? '#FFF' : 'rgba(255, 255, 255, 0.98)';
            this.ctx.fill();
            this.ctx.restore(); // シャドウ設定を破棄

            // 枠線
            this.ctx.strokeStyle = isHovered ? theme.primaryColor : 'rgba(0,0,0,0.06)';
            this.ctx.lineWidth = isHovered ? 6 : 2;
            this.ctx.stroke();

            // --- 画像表示エリア ---
            this.ctx.save();
            const imgMargin = 12;
            const imgW = drawW - (imgMargin * 2);
            const imgH = Math.floor(drawH * 0.55);
            this.ctx.beginPath();
            if (this.ctx.roundRect) this.ctx.roundRect(dx + imgMargin, dy + imgMargin, imgW, imgH, 20);
            else this.ctx.rect(dx + imgMargin, dy + imgMargin, imgW, imgH);
            this.ctx.clip();

            const titleImg = this.game.assets.getImage(`title_${char.id}`);
            if (titleImg) {
                const imgAspect = titleImg.width / titleImg.height;
                const areaAspect = imgW / imgH;
                let iw, ih;
                if (imgAspect > areaAspect) {
                    ih = imgH;
                    iw = Math.floor(ih * imgAspect);
                } else {
                    iw = imgW;
                    ih = Math.floor(iw / imgAspect);
                }
                const ix = dx + imgMargin + Math.floor((imgW - iw) / 2);
                const iy = dy + imgMargin + Math.floor((imgH - ih) / 2);
                this.ctx.drawImage(titleImg, ix, iy, iw, ih);
            }

            // カード表面の「光沢（シャイン）」エフェクト
            if (isHovered) {
                const shineX = (this.logoFloat * 450) % (drawW * 3) - drawW;
                const shineGrad = this.ctx.createLinearGradient(dx + shineX, dy, dx + shineX + 100, dy + drawH);
                shineGrad.addColorStop(0, 'rgba(255,255,255,0)');
                shineGrad.addColorStop(0.5, 'rgba(255,255,255,0.5)');
                shineGrad.addColorStop(1, 'rgba(255,255,255,0)');
                this.ctx.globalCompositeOperation = 'overlay';
                this.ctx.fillStyle = shineGrad;
                this.ctx.fillRect(dx, dy, drawW, drawH);
                this.ctx.globalCompositeOperation = 'source-over';
            }
            this.ctx.restore();

            // --- プレミアム・テキストエリア（一切ダブらせない） ---
            const textY = Math.floor(dy + drawH * 0.73);
            const plateW = Math.floor(drawW * 0.88);
            const plateH = 50;
            const plateX = Math.floor(dx + (drawW - plateW) / 2);
            const plateY = textY - 36;

            // ネームプレート背景
            this.ctx.save();
            this.ctx.shadowBlur = 0; // 影を完全オフ
            this.ctx.shadowOffsetX = 0;
            this.ctx.shadowOffsetY = 0;

            this.ctx.fillStyle = isHovered ? theme.primaryColor : 'rgba(0,0,0,0.04)';
            this.ctx.beginPath();
            if (this.ctx.roundRect) this.ctx.roundRect(plateX, plateY, plateW, plateH, 25);
            else this.ctx.rect(plateX, plateY, plateW, plateH);
            this.ctx.fill();

            // プレートの境界線ハイライト
            this.ctx.strokeStyle = isHovered ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.05)';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();

            // キャラクター名（鮮明な1重の文字）
            this.ctx.textAlign = 'center';
            this.ctx.font = 'bold 32px "Outfit", sans-serif';
            if (isHovered) {
                // わずかなアウトラインで文字を立たせる（ズレなし）
                this.ctx.strokeStyle = 'rgba(0,0,0,0.1)';
                this.ctx.lineWidth = 2;
                this.ctx.strokeText(char.name, Math.floor(dx + drawW / 2), textY);
                this.ctx.fillStyle = '#FFF';
            } else {
                this.ctx.fillStyle = theme.primaryColor;
            }
            this.ctx.fillText(char.name, Math.floor(dx + drawW / 2), textY);

            // 説明文
            this.ctx.font = '600 15px "Outfit", sans-serif';
            this.ctx.fillStyle = isHovered ? 'rgba(0,0,0,0.6)' : '#666';
            this.ctx.fillText(char.description, Math.floor(dx + drawW / 2), textY + 45);

            // READYガイド
            if (isHovered) {
                this.ctx.font = 'bold 12px monospace';
                this.ctx.fillStyle = theme.primaryColor;
                this.ctx.fillText("READY TO DASH", Math.floor(dx + drawW / 2), textY + 74);

                this.ctx.strokeStyle = theme.primaryColor;
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.moveTo(dx + drawW / 2 - 30, textY + 80);
                this.ctx.lineTo(dx + drawW / 2 + 30, textY + 80);
                this.ctx.stroke();
            }
            this.ctx.restore();
        });

        // --- Music Room Button ---
        const musicBtnW = 220;
        const musicBtnH = 50;
        const musicBtnX = (this.game.width - musicBtnW) / 2;
        const musicBtnY = this.game.height - 100;

        const isMusicHovered = (
            this.game.input.pointerX >= musicBtnX &&
            this.game.input.pointerX <= musicBtnX + musicBtnW &&
            this.game.input.pointerY >= musicBtnY &&
            this.game.input.pointerY <= musicBtnY + musicBtnH
        );

        this.ctx.save();
        if (isMusicHovered) {
            this.ctx.shadowBlur = 20;
            this.ctx.shadowColor = '#00d2ff';
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        } else {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        }

        // Button Base
        this.ctx.strokeStyle = '#00d2ff';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        if (this.ctx.roundRect) this.ctx.roundRect(musicBtnX, musicBtnY, musicBtnW, musicBtnH, 25);
        else this.ctx.rect(musicBtnX, musicBtnY, musicBtnW, musicBtnH);
        this.ctx.fill();
        this.ctx.stroke();

        // Text & Icon
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.font = 'bold 18px "Outfit", sans-serif';
        this.ctx.fillStyle = '#fff';
        this.ctx.fillText("♫ MUSIC ROOM ♫", musicBtnX + musicBtnW / 2, musicBtnY + musicBtnH / 2);

        this.ctx.restore();
    }

    // セクションのエラーハンドリング用（必要に応じて）
    onSectionError(sectionName, error) {
        console.error(`[HomeManager] Crash in ${sectionName}:`, error);
        // 万が一HomeUIが落ちても、黒画面にならないようにフォールバックを描画するなどの安全策
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.game.width, this.game.height);
        this.ctx.fillStyle = '#FFF';
        this.ctx.fillText("Home Screen Error - Press Space to start anyway", 20, 20);
    }
    // --- Music Room Logic ---
    openMusicRoom() {
        if (!this.musicListInitialized) {
            this.initMusicList();
        }
        const panel = document.getElementById('music-room-panel');
        if (panel) {
            panel.classList.remove('hidden');
            this.game.input.reset(); // Clear clicks
        }
    }

    closeMusicRoom() {
        const panel = document.getElementById('music-room-panel');
        if (panel) {
            panel.classList.add('hidden');
            // Stop preview if playing? Maybe keep playing for ambient experience.
            // Let's keep playing until user explicitly stops or starts game.
        }
    }

    toggleMusicPlay() {
        if (!this.currentMusicId) return;

        const audio = this.game.audio.bgmAudio;
        if (audio.paused) {
            audio.play().catch(e => console.warn(e));
            this.updateMusicUIState(true);
        } else {
            audio.pause();
            this.updateMusicUIState(false);
        }
    }

    playTrack(track) {
        if (this.currentMusicId === track.id) {
            // Toggle if same
            this.toggleMusicPlay();
            return;
        }

        this.currentMusicId = track.id;
        this.game.audio.playBGM(track.id);
        this.updateMusicInfo(track);
        this.updateMusicUIState(true);

        // Update list active state
        document.querySelectorAll('.track-item').forEach(el => el.classList.remove('active'));
        const activeItem = document.getElementById(`track-item-${track.id}`);
        if (activeItem) activeItem.classList.add('active');
    }

    updateMusicInfo(track) {
        const titleEl = document.getElementById('music-np-title');
        const artistEl = document.getElementById('music-np-artist');
        if (titleEl) titleEl.innerText = track.title;
        if (artistEl) artistEl.innerText = track.artist;
    }

    updateMusicUIState(isPlaying) {
        const cdArt = document.getElementById('music-cd-art');
        const btnPlay = document.getElementById('btn-music-play');
        const btnStop = document.getElementById('btn-music-stop');

        if (isPlaying) {
            if (cdArt) cdArt.classList.add('playing');
            if (btnPlay) btnPlay.classList.add('hidden');
            if (btnStop) btnStop.classList.remove('hidden');
        } else {
            if (cdArt) cdArt.classList.remove('playing');
            if (btnPlay) btnPlay.classList.remove('hidden');
            if (btnStop) btnStop.classList.add('hidden');
        }
    }

    initMusicList() {
        // Define Tracks
        const TRACKS = [
            // BATTLES (Main Focus)
            { id: 'BOSS_WAR', title: 'RABBIT WARS -Battle of the Moon-', artist: 'Luna Beat', isBattle: true },
            { id: 'BOSS_SISTER', title: 'SISTER\'S PRAYER -Corrupted Faith-', artist: 'Holy Bell', isBattle: true },
            { id: 'BOSS_TOY', title: 'TOYBOX CARNIVAL -Plastic Nightmare-', artist: 'Pixie Toys', isBattle: true },
            { id: 'BOSS_NURSE', title: 'EMERGENCY CALL -Code Red-', artist: 'Sanitizer', isBattle: true },
            { id: 'BOSS_FINAL', title: 'GENESIS -The End of All-', artist: 'Deus Ex', isBattle: true },
            // WORLD
            { id: 'TITLE', title: 'Welcome to AliceD', artist: 'Usagi Sound', isBattle: false },
            { id: 'GAME', title: 'Green Hill Dash', artist: 'Usagi Sound', isBattle: false },
            { id: 'SISTER', title: 'Monastery Walk', artist: 'Holy Bell', isBattle: false },
            { id: 'TOY', title: 'Toy Block Mountains', artist: 'Pixie Toys', isBattle: false },
            { id: 'HOSPITAL', title: 'Silent Hospital', artist: 'Sanitizer', isBattle: false },
            { id: 'HEAVEN', title: 'Stairway to Heaven', artist: 'Deus Ex', isBattle: false },
            { id: 'ENDING', title: 'Memories of Rabbit', artist: 'Usagi Sound', isBattle: false },
        ];

        const battleContainer = document.getElementById('music-list-battle');
        const worldContainer = document.getElementById('music-list-world');

        if (!battleContainer || !worldContainer) return;

        battleContainer.innerHTML = '';
        worldContainer.innerHTML = '';

        TRACKS.forEach(track => {
            const item = document.createElement('div');
            item.className = 'track-item';
            item.id = `track-item-${track.id}`;
            item.innerHTML = `
                <div class="track-info">
                    <div class="t-title">${track.title}</div>
                    <div class="t-artist">${track.artist}</div>
                </div>
                <div class="t-play">▶</div>
            `;
            item.onclick = () => this.playTrack(track);

            if (track.isBattle) {
                battleContainer.appendChild(item);
            } else {
                worldContainer.appendChild(item);
            }
        });

        // Controls
        const btnPlay = document.getElementById('btn-music-play');
        const btnStop = document.getElementById('btn-music-stop');
        const btnClose = document.getElementById('btn-close-music');

        if (btnPlay) btnPlay.onclick = () => this.toggleMusicPlay();
        if (btnStop) btnStop.onclick = () => this.toggleMusicPlay();
        if (btnClose) btnClose.onclick = () => this.closeMusicRoom();

        this.musicListInitialized = true;
    }
}
