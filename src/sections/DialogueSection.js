import { DialogueData } from '../data/DialogueData.js';

export class DialogueSection {
    constructor(game) {
        this.game = game;
        this.dialogueManager = game.dialogueManager;
    }

    update(dt) {
        // Manager handles the update loop logic
        // We can add triggers here if needed, but Manager does self-update
    }

    // Helper to request dialogue by ID
    play(id) {
        const data = DialogueData[id];
        if (data) {
            console.log(`[Dialogue] Playing sequence: ${id}`);
            this.dialogueManager.startDialogue(data);
        } else {
            console.warn(`[Dialogue] ID not found: ${id}`);
        }
    }
}
