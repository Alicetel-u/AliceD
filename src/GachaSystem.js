export class GachaSystem {
    constructor(game) {
        this.game = game;
        this.cost = 10;
        this.items = [
            // Common (Garakuta) - 60%
            { id: 1, name: "ただの石", icon: "item_stone", rarity: "common", buff: { type: "DEF", value: 0.1, desc: "ダメージ軽減 +0.1%" } },
            { id: 2, name: "雑草", icon: "🌿", rarity: "common", buff: { type: "JUMP", value: 0.2, desc: "ジャンプ力 +0.2%" } },
            { id: 3, name: "枯れ葉", icon: "🍂", rarity: "common", buff: { type: "SPD", value: 0.1, desc: "速度 +0.1%" } },
            { id: 4, name: "かじられた人参", icon: "item_nibbled_carrot", rarity: "common", buff: { type: "CRIT", value: 0.2, desc: "クリティカル獲得率 +0.2%" } },
            { id: 5, name: "どんぐり", icon: "🌰", rarity: "common", buff: { type: "DEF", value: 0.1, desc: "ダメージ軽減 +0.1%" } },
            { id: 6, name: "空き缶", icon: "item_empty_can", rarity: "common", buff: { type: "SPD", value: 0.1, desc: "速度 +0.1%" } },
            { id: 7, name: "古びた靴", icon: "👞", rarity: "common", buff: { type: "SPD", value: 0.3, desc: "速度 +0.3%" } },
            { id: 8, name: "折れた枝", icon: "🪵", rarity: "common", buff: { type: "JUMP", value: 0.2, desc: "ジャンプ力 +0.2%" } },
            { id: 9, name: "紙くず", icon: "📄", rarity: "common", buff: { type: "CRIT", value: 0.1, desc: "クリティカル獲得率 +0.1%" } },
            { id: 10, name: "ボタン", icon: "🔘", rarity: "common", buff: { type: "DEF", value: 0.2, desc: "ダメージ軽減 +0.2%" } },
            { id: 11, name: "ホコリ", icon: "🌫️", rarity: "common", buff: { type: "SPD", value: 0.05, desc: "速度 +0.05%" } },
            { id: 12, name: "ミミズ", icon: "🪱", rarity: "common", buff: { type: "JUMP", value: 0.1, desc: "ジャンプ力 +0.1%" } },

            // Rare - 25%
            { id: 20, name: "タンポポ", icon: "🌼", rarity: "rare", buff: { type: "SPD", value: 0.5, desc: "速度 +0.5%" } },
            { id: 21, name: "きれいなキノコ", icon: "🍄", rarity: "rare", buff: { type: "JUMP", value: 0.8, desc: "ジャンプ力 +0.8%" } },
            { id: 22, name: "赤い木の実", icon: "🍒", rarity: "rare", buff: { type: "CRIT", value: 1.0, desc: "クリティカル獲得率 +1.0%" } },
            { id: 23, name: "綺麗な貝殻", icon: "🐚", rarity: "rare", buff: { type: "DEF", value: 0.5, desc: "ダメージ軽減 +0.5%" } },
            { id: 24, name: "ビー玉", icon: "🔵", rarity: "rare", buff: { type: "CRIT", value: 0.5, desc: "クリティカル獲得率 +0.5%" } },
            { id: 25, name: "ひまわりの種", icon: "🌻", rarity: "rare", buff: { type: "SPD", value: 0.4, desc: "速度 +0.4%" } },

            // Super Rare - 10%
            { id: 40, name: "四葉のクローバー", icon: "🍀", rarity: "super_rare", buff: { type: "CRIT", value: 5.0, desc: "クリティカル獲得率 +5.0%" } },
            { id: 41, name: "うさぎのぬいぐるみ", icon: "🐰", rarity: "super_rare", buff: { type: "DEF", value: 3.0, desc: "ダメージ軽減 +3.0%" } },
            { id: 42, name: "銀のスプーン", icon: "🥄", rarity: "super_rare", buff: { type: "CRIT", value: 2.5, desc: "クリティカル獲得率 +2.5%" } },
            { id: 43, name: "懐中時計", icon: "⌚", rarity: "super_rare", buff: { type: "SPD", value: 2.0, desc: "速度 +2.0%" } },

            // Epic - 4%
            { id: 60, name: "金の王冠", icon: "👑", rarity: "epic", buff: { type: "DEF", value: 10.0, desc: "ダメージ軽減 +10.0%" } },
            { id: 61, name: "ダイヤモンド", icon: "💎", rarity: "epic", buff: { type: "CRIT", value: 10.0, desc: "クリティカル獲得率 +10.0%" } },
            { id: 62, name: "魔法のステッキ", icon: "🪄", rarity: "epic", buff: { type: "JUMP", value: 15.0, desc: "ジャンプ力 +15.0%" } },
            { id: 63, name: "虹色の羽", icon: "🪶", rarity: "epic", buff: { type: "SPD", value: 10.0, desc: "速度 +10.0%" } },

            // Legendary - 1%
            { id: 80, name: "伝説の聖剣", icon: "item_holy_sword", rarity: "legendary", buff: { type: "SPD", value: 25.0, desc: "速度 +25.0%" } },
            { id: 81, name: "宇宙の欠片", icon: "item_space_fragment", rarity: "legendary", buff: { type: "DEF", value: 50.0, desc: "ダメージ軽減 +50.0%" } },
            { id: 82, name: "黄金のニンジン像", icon: "item_carrot_statue", rarity: "legendary", buff: { type: "CRIT", value: 50.0, desc: "クリティカル獲得率 +50.0%" } }
        ];

        // Load collection
        const saved = localStorage.getItem('rabbit_dash_collection');
        this.collection = saved ? JSON.parse(saved) : {};

        this.stats = { SPD: 0, JUMP: 0, CRIT: 0, DEF: 0 };
        this.setupUI();
        this.updateStats();
        this.updateUI();
    }

    updateStats() {
        this.stats = { SPD: 0, JUMP: 0, CRIT: 0, DEF: 0 };
        Object.keys(this.collection).forEach(id => {
            const item = this.items.find(i => i.id == id);
            const count = this.collection[id];
            if (item && item.buff) {
                this.stats[item.buff.type] += item.buff.value * count;
            }
        });
    }

    getStats() { return this.stats; }

    getTotalPoints() {
        const rarityWeights = { 'common': 1, 'rare': 5, 'super_rare': 20, 'epic': 100, 'legendary': 500 };
        let total = 0;
        Object.keys(this.collection).forEach(id => {
            const item = this.items.find(i => i.id == id);
            const count = this.collection[id];
            if (item) total += (rarityWeights[item.rarity] || 0) * count;
        });
        return total;
    }

    setupUI() {
        this.modal = document.getElementById('gacha-modal');
        this.resultArea = document.getElementById('gacha-result-area');
        this.itemsContainer = document.getElementById('items-container');
        const closeBtn = document.getElementById('btn-close-gacha');
        if (closeBtn) closeBtn.style.display = 'none';
        const toggleBtn = document.getElementById('collection-toggle');
        if (toggleBtn) toggleBtn.onclick = (e) => { e.stopPropagation(); this.openManual(); };
        this.canClose = false;
        // リスナーを参照保持して重複防止（constructorは1回だけ呼ばれる想定だが安全のため）
        if (!this._closeClickHandler) {
            this._closeClickHandler = () => { if (this.canClose) this.close(); };
            this._closeKeyHandler = () => { if (this.canClose) this.close(); };
            window.addEventListener('click', this._closeClickHandler);
            window.addEventListener('keydown', this._closeKeyHandler);
        }
    }

    openManual() {
        if (!this.modal.classList.contains('hidden')) return;
        this.game.running = false;
        this.modal.classList.remove('hidden');
        this.resultArea.innerHTML = `<div style="padding: 10px;"><h2 style="color: #ff9f43;">🎒 コレクション一覧</h2><p style="font-size: 0.9rem; color: #666;">集めたアイテムのステータスを確認できます。</p></div>`;
        this.updateUI();
        this.canClose = true;
    }

    close() {
        if (!this.canClose) return;
        this.canClose = false;
        this.modal.classList.add('hidden');
        if (this.game.state !== 'HOME' && !this.game.running) {
            this.game.running = true;
            this.game.lastTime = performance.now();
            requestAnimationFrame((t) => this.game.loop(t));
        }
    }

    pullAndSave(forceRarity = null, isEvent = false) {
        let rarity = 'common';
        if (forceRarity) { rarity = forceRarity; }
        else {
            const rand = Math.random() * 100;
            if (rand < 1) rarity = 'legendary'; else if (rand < 5) rarity = 'epic'; else if (rand < 15) rarity = 'super_rare'; else if (rand < 40) rarity = 'rare'; else rarity = 'common';
        }
        let pool = this.items.filter(i => i.rarity === rarity);
        if (pool.length === 0) pool = this.items.filter(i => i.rarity === 'common');
        const item = pool[Math.floor(Math.random() * pool.length)];
        if (!this.collection[item.id]) this.collection[item.id] = 0;
        this.collection[item.id]++;
        this.save();
        return { item, isDuplicate: this.collection[item.id] > 1 };
    }

    triggerEventGacha() {
        this.game.running = false;
        this.modal.classList.remove('hidden');
        this.resultArea.innerHTML = `<div style="margin: 20px 0;"><div class="reward-box" id="clear-reward-box">🎁</div><h2 style="color: #ff4757; animation: bounce 0.5s infinite alternate;">STAGE CLEAR BONUS!</h2><p>プレゼントボックスをタップして開けよう！</p><p style="font-weight: bold; color: #ff9f43;">✨ 5回連続ガチャ ✨</p></div>`;
        const box = document.getElementById('clear-reward-box');
        box.onclick = () => { box.style.pointerEvents = 'none'; this.startMultiGacha(5); };
    }

    startMultiGacha(count) {
        this.resultArea.innerHTML = `<div class="reward-box" style="animation: shake 0.2s infinite;">🎁</div><h3>開封中...</h3>`;
        if (this.game.audio && this.game.audio.playWin) this.game.audio.playWin();
        setTimeout(() => {
            this.spawnRarityConfetti('legendary');
            this.resultArea.innerHTML = `<div style="font-size: 80px;">✨</div><div class="multi-results" id="multi-results-container"></div><h3 id="multi-status">お宝発見！</h3>`;
            const container = document.getElementById('multi-results-container');
            const items = [];
            for (let i = 0; i < count; i++) items.push(this.pullAndSave(null, true));
            items.forEach((res, i) => {
                setTimeout(() => {
                    const itemDiv = document.createElement('div');
                    itemDiv.className = 'multi-item';
                    itemDiv.style.animationDelay = `${i * 0.2}s`;
                    const rarityColor = this.getRarityColor(res.item.rarity);
                    itemDiv.innerHTML = `<div class="gacha-capsule" style="background: ${rarityColor}; width: 60px; height: 60px; font-size: 30px; margin: 5px;">${this.getIconHtml(res.item)}</div><div style="font-size: 10px; font-weight: bold; color: ${res.isDuplicate ? '#95a5a6' : '#e67e22'}">${res.isDuplicate ? '既持' : 'NEW!'}</div>`;
                    container.appendChild(itemDiv);
                    if (['super_rare', 'epic', 'legendary'].includes(res.item.rarity)) this.spawnRarityConfetti(res.item.rarity);
                    if (i === count - 1) {
                        setTimeout(() => {
                            document.getElementById('multi-status').innerText = '全て獲得しました！';
                            this.updateUI(); this.canClose = true;
                            const footer = document.createElement('p'); footer.style.color = '#7f8c8d'; footer.style.marginTop = '20px'; footer.innerText = '- クリックまたは何かキーを押して閉じる -';
                            this.resultArea.appendChild(footer);
                        }, 1000);
                    }
                }, i * 300);
            });
        }, 1000);
    }

    getIconHtml(item, size = 32) {
        const asset = this.game.assets.getImage(item.icon);
        if (asset) return `<img src="${asset.src}" style="width: ${size}px; height: ${size}px; object-fit: contain;">`;
        return item.icon;
    }

    triggerSingleGacha() { this.game.running = false; this.modal.classList.remove('hidden'); this.startSingleGachaReveal(); }

    startSingleGachaReveal() {
        this.resultArea.innerHTML = `<div class="reward-box" style="animation: shake 0.2s infinite;">🎁</div><h3>開封中...</h3>`;
        setTimeout(() => { const { item, isDuplicate } = this.pullAndSave(null, true); this.startRoulette(item, isDuplicate); }, 800);
    }

    startRoulette(finalItem, isDuplicate) {
        let cycles = 0; const maxCycles = 12; let delay = 30;
        const loop = () => {
            if (cycles >= maxCycles) { this.showSingleResult(finalItem, isDuplicate); return; }
            const randomItem = this.items[Math.floor(Math.random() * this.items.length)];
            this.resultArea.innerHTML = `<div class="gacha-capsule" style="background: #eee; transform: scale(0.9); margin: 20px auto;">${this.getIconHtml(randomItem, 48)}</div><h3 style="color: #48dbfb;">お楽しみ中...</h3>`;
            cycles++; if (cycles > 8) delay *= 1.4; setTimeout(loop, delay);
        };
        loop();
    }

    showSingleResult(item, isDuplicate) {
        const rarityColor = this.getRarityColor(item.rarity);
        this.spawnRarityConfetti(item.rarity);
        if (this.game.audio && this.game.audio.playWin) this.game.audio.playWin();
        this.resultArea.innerHTML = `<div class="multi-item" style="margin: 20px 0; animation: popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);"><div class="gacha-capsule" style="background: ${rarityColor}; width: 100px; height: 100px; font-size: 50px; margin: 0 auto; box-shadow: 0 0 20px ${rarityColor};">${this.getIconHtml(item, 64)}</div><h3 style="margin: 15px 0; font-size: 1.5rem;">${item.name}</h3><div style="font-weight: bold; font-size: 1.2rem; margin-bottom: 10px; color: ${isDuplicate ? '#95a5a6' : '#e67e22'}">${isDuplicate ? '既持' : '✨ NEW! ✨'}</div><div style="color: #636e72; font-style: italic;">${item.buff.desc}</div></div><p style="color: #2ecc71; font-weight: bold;">ステータスがアップしました！</p><p style="color: #7f8c8d; margin-top: 20px;">- クリックまたは何かキーを押して閉じる -</p>`;
        this.updateUI(); this.canClose = true;
    }

    spawnRarityConfetti(rarity) {
        const count = rarity === 'legendary' ? 150 : (rarity === 'epic' ? 80 : 40);
        const colors = rarity === 'legendary' ? ['#ff00cc', '#3333ff', '#fff'] : ['#fab1a0', '#ffeaa7'];
        const centerX = this.game.width / 2; const centerY = this.game.height / 2;
        for (let i = 0; i < count; i++) {
            this.game.env.particles.push({ x: centerX, y: centerY, vx: (Math.random() - 0.5) * 20, vy: (Math.random() - 0.5) * 20, life: 180, size: Math.random() * 8 + 5, color: colors[Math.floor(Math.random() * colors.length)], screenSpace: true });
        }
    }

    getRarityColor(rarity) {
        if (rarity === 'legendary') return 'linear-gradient(45deg, #ff00cc, #3333ff)';
        if (rarity === 'epic') return '#a29bfe'; if (rarity === 'super_rare') return '#fab1a0'; if (rarity === 'rare') return '#ffeaa7';
        return '#dfe6e9';
    }

    updateUI() { this.updateStats(); this.renderCollection(); this.renderStockIcons(); this.renderStatsView(); }

    renderStatsView() { const statsArea = document.getElementById('collection-stats-area'); if (statsArea) statsArea.innerHTML = ''; }

    renderStockIcons() {
        // Character collection icons in the top-right are disabled per user request
        const hub = document.getElementById('collection-hub');
        if (hub) hub.style.display = 'none';
        return;
    }

    renderCollection() {
        this.itemsContainer.innerHTML = '';
        Object.keys(this.collection).forEach(id => {
            const count = this.collection[id]; const item = this.items.find(i => i.id == id);
            if (!item) return;
            const div = document.createElement('div'); div.className = `collection-item ${item.rarity}`; div.style.position = 'relative';
            div.innerHTML = `<div style="font-size: 28px; display: flex; justify-content: center; align-items: center;">${this.getIconHtml(item, 40)}</div><span class="count" style="position: absolute; bottom: 2px; right: 2px; font-size: 10px; font-weight: bold; background: rgba(0,0,0,0.4); color: white; padding: 1px 3px; border-radius: 4px;">x${count}</span><div class="buff-desc" style="display:none; position:absolute; bottom:100%; left:50%; transform:translateX(-50%); background:#333; color:#fff; font-size:10px; padding:4px 8px; border-radius:4px; white-space:nowrap; z-index:1000;">${item.buff.desc}</div>`;
            div.onmouseover = () => div.querySelector('.buff-desc').style.display = 'block';
            div.onmouseout = () => div.querySelector('.buff-desc').style.display = 'none';
            if (item.rarity === 'legendary') div.style.background = 'linear-gradient(135deg, #ff9ff3, #feca57)';
            this.itemsContainer.appendChild(div);
        });
    }

    save() { localStorage.setItem('rabbit_dash_collection', JSON.stringify(this.collection)); this.game.saveProgress(); }

    resetCollection() { this.collection = {}; this.save(); this.updateUI(); }
}
