import { DialogueData } from '../data/DialogueData.js';

export class DialogueManager {
    constructor(game) {
        this.game = game;
        this.active = false;
        this.dialogueQueue = [];
        this.currentDialogue = null;
        this.charIndex = 0;
        this.textSpeed = 30; // ms per char
        this.timer = 0;
        this.isTyping = false;
        this.autoHideTimer = 0;
        this.autoAdvanceTimer = 0;
        this.onComplete = null;

        // DOM Cache
        this.overlay = document.getElementById('dialogue-overlay');
        this.leftPortrait = document.getElementById('portrait-left');
        this.rightPortrait = document.getElementById('portrait-right');
        this.nameLabel = document.getElementById('dialogue-name-label');
        this.textBox = document.getElementById('dialogue-text');
        this.nextIndicator = document.getElementById('dialogue-next-indicator');
        this.dialogueBox = document.getElementById('dialogue-box');

        // Event Listener for advancing text
        if (this.dialogueBox) {
            this.dialogueBox.addEventListener('click', () => this.onInteract());
        }

        // Key listener hooks into Game input, or we can add global here
        window.addEventListener('keydown', (e) => {
            if (this.active && (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyZ')) {
                this.onInteract();
            }
        });
    }

    hasDialogue(id) {
        return !!DialogueData[id];
    }

    startDialogue(idOrData, onComplete = null) {
        let data = idOrData;
        this.currentDialogueId = null;

        if (typeof idOrData === 'string') {
            let targetId = idOrData;

            // Character Specific Branching (e.g. STAGE1_OPENING_KANON)
            if (this.game.characterManager) {
                const char = this.game.characterManager.getCurrentCharacter();
                if (char && char.id) {
                    // Try finding "KEY_KANON" etc.
                    const charSpecificId = `${idOrData}_${char.id.toUpperCase()}`;
                    if (DialogueData[charSpecificId]) {
                        targetId = charSpecificId;
                        console.log(`[DialogueManager] Switching to character specific dialogue: ${targetId}`);
                    }
                }
            }

            data = DialogueData[targetId];
            this.currentDialogueId = targetId;
        }

        if (!data || data.length === 0) {
            if (onComplete) onComplete();
            return;
        }

        this.onComplete = onComplete;
        this.active = true;
        this.dialogueQueue = [...data];
        this.overlay.classList.remove('hidden');
        // this.game.isPaused = true; // Removed per user request

        // Pause BGM volume slightly?
        if (this.game.audio && this.game.audio.bgm) {
            this.game.audio.bgm.volume = 0.3;
        }

        this.showNextLine();
    }

    showNextLine() {
        if (this.dialogueQueue.length === 0) {
            this.endDialogue();
            return;
        }

        this.currentDialogue = this.dialogueQueue.shift();
        this.charIndex = 0;
        this.textBox.innerHTML = '';
        this.nextIndicator.style.display = 'none';

        // Check for HTML tags
        const hasTags = this.currentDialogue.text.includes('<');

        if (hasTags) {
            // Skip typing effect for rich text to avoid broken tags
            this.textBox.innerHTML = this.currentDialogue.text;
            this.isTyping = false;
            this.nextIndicator.style.display = 'block';
            this.autoAdvanceTimer = 0;
        } else {
            this.isTyping = true;
        }

        this.updateVisuals();
    }

    updateVisuals() {
        const d = this.currentDialogue;

        // Name
        this.nameLabel.textContent = d.name || "???";

        // Side styling & Image Handling
        const isRight = d.side === 'right';
        const activeSide = isRight ? this.rightPortrait : this.leftPortrait;
        const otherSide = isRight ? this.leftPortrait : this.rightPortrait;
        const keepOther = isRight ? d.keepLeft : d.keepRight;

        // 1. Name Styling
        if (isRight) this.nameLabel.classList.add('enemy-side');
        else this.nameLabel.classList.remove('enemy-side');

        // 2. Active Side State
        activeSide.classList.remove('portrait-dimmed');
        activeSide.classList.add('portrait-active');

        // 3. Image Visibility (Hide if no image provided)
        if (d.image) {
            const path = `./assets/img/portraits/${d.image}.webp`;
            if (!activeSide.src.includes(d.image)) {
                activeSide.src = path;
            }
            activeSide.classList.remove('hidden');
        } else {
            activeSide.classList.add('hidden');
        }

        // 4. Other Side State
        otherSide.classList.add('portrait-dimmed');
        otherSide.classList.remove('portrait-active');

        if (!keepOther) {
            otherSide.classList.add('hidden');
        }
    }

    update(dt) {
        if (!this.active || !this.currentDialogue) return;

        if (this.isTyping) {
            this.timer += dt * 1000;
            if (this.timer > this.textSpeed) {
                this.timer = 0;
                const fullText = this.currentDialogue.text;

                if (this.charIndex < fullText.length) {
                    this.textBox.textContent += fullText[this.charIndex];
                    this.charIndex++;
                    // Typing sound?
                } else {
                    this.isTyping = false;
                    this.nextIndicator.style.display = 'block';
                    this.autoAdvanceTimer = 0;
                }
            }
        } else {
            // Auto Advance Logic (Enabled)
            this.autoAdvanceTimer += dt;
            if (this.autoAdvanceTimer > 2.0) { // 2s wait per line
                this.autoAdvanceTimer = 0;
                this.onInteract();
            }
        }
    }

    onInteract() {
        if (!this.active) return;

        if (this.isTyping) {
            // Skip typing
            this.textBox.innerHTML = this.currentDialogue.text;
            this.charIndex = this.currentDialogue.text.length;
            this.isTyping = false;
            this.nextIndicator.style.display = 'block';
        } else {
            // Next line
            this.showNextLine();
        }
    }

    endDialogue() {
        this.active = false;
        this.overlay.classList.add('hidden');
        // this.game.isPaused = false;
        this.currentDialogue = null;

        // Check for Ending Trigger
        /* 
        if (this.currentDialogueId === 'STAGE5_BOSS_DEFEAT' || this.currentDialogueId === 'STAGE5_BOSS_DEFEAT_KANON') {
            const fade = document.getElementById('white-fade-overlay');
            if (fade) {
                fade.classList.add('visible');
            }
        }
        */

        // Restore Volume
        if (this.game.audio && this.game.audio.bgm) {
            this.game.audio.bgm.volume = 0.8; // Default volume
        }

        if (this.onComplete) {
            this.onComplete();
            this.onComplete = null;
        }
    }
}
