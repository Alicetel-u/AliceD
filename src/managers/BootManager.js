
export class BootManager {
    constructor(game) {
        this.game = game;
        this.state = 'LOGO'; // LOGO, LOADING, READY, FINISHED
        this.timer = 0;

        // DOM Elements
        this.loadingScreen = document.getElementById('loading-screen');
        this.logoWrapper = document.querySelector('.logo-wrapper');
        this.loadingBar = document.getElementById('loading-bar-container');

        this.assetsLoaded = false;
        this.isInitialized = false;
    }

    init() {
        if (this.isInitialized) return;

        // Ensure everything is set for the start of the sequence
        if (this.loadingScreen) this.loadingScreen.classList.remove('hidden');
        if (this.logoWrapper) this.logoWrapper.classList.add('active');
        if (this.loadingBar) this.loadingBar.classList.add('hidden');

        // Set game state to a temporary 'BOOT' so it doesn't draw "CLICK TO START" yet
        this.game.state = 'BOOT';

        this.isInitialized = true;
    }

    setLoadingPromise(promise) {
        promise.then(() => {
            this.assetsLoaded = true;
        });
    }

    update(dt) {
        if (!this.isInitialized || this.state === 'FINISHED') return;

        this.timer += dt;

        switch (this.state) {
            case 'LOGO':
                if (this.timer > 2.5) {
                    this.state = 'LOADING';
                    this.timer = 0;
                    if (this.logoWrapper) this.logoWrapper.style.display = 'none';
                    if (this.loadingBar) this.loadingBar.classList.remove('hidden');
                }
                break;

            case 'LOADING':
                let p = 0;
                if (this.game.assets && this.game.assets.totalImages > 0) {
                    p = this.game.assets.loadedImages / this.game.assets.totalImages;
                } else {
                    p = Math.min(this.timer / 2.0, 1.0);
                }

                this.updateLoadingUI(p);

                // Transition when assets are done and minimum time passed
                if (this.assetsLoaded && p >= 1.0 && this.timer > 1.5) {
                    this.finishSequence();
                }
                break;
        }
    }

    updateLoadingUI(p) {
        const fill = document.getElementById('carrot-bar-fill');
        const pct = document.getElementById('loading-percentage');
        const bunny = document.getElementById('bunny-runner');

        if (fill) fill.style.width = `${p * 100}%`;
        if (pct) pct.textContent = `${Math.floor(p * 100)}%`;
        if (bunny) bunny.style.left = `${p * 100}%`;
    }

    finishSequence() {
        this.state = 'FINISHED';
        if (this.loadingScreen) this.loadingScreen.classList.add('hidden');

        // Transition Game to Start Screen (Canvas)
        this.game.state = 'WAIT_FOR_INPUT';
    }
}
