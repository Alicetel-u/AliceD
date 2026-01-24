import { Sanitizer } from './Sanitizer.js';
import { CHARACTERS } from './CharacterData.js';

// キャラクター管理システム
export class CharacterManager {
    constructor() {
        // 利用可能なキャラクターの定義 (CharacterData.jsから読み込み)
        this.characters = CHARACTERS.map(config => this.prepareCharacter(config));

        // 現在選択中のキャラクターID
        this.currentCharacterId = this.loadSelectedCharacter();
    }

    /**
     * キャラクター設定を正規化し、不備を補完・サニタイズする
     */
    prepareCharacter(config) {
        // IDのサニタイズ
        const rawId = config.id || config.name || 'char_' + Date.now();
        config.id = Sanitizer.toSafeId(rawId);

        // ファイル名のサニタイズ（参照時に問題が出ないように）
        if (config.spriteFile) config.spriteFile = Sanitizer.toSafeFileName(config.spriteFile);
        if (config.titleImage) config.titleImage = Sanitizer.toSafeFileName(config.titleImage);

        if (config.spriteFiles) {
            for (let key in config.spriteFiles) {
                config.spriteFiles[key] = Sanitizer.toSafeFileName(config.spriteFiles[key]);
            }
        }

        // アニメーション設定のデフォルト補完
        if (!config.animation) {
            config.animation = {
                type: 'SHEET',
                cols: 1,
                rows: 1,
                maxFrames: 1,
                frameInterval: 10,
                states: {
                    idle: { row: 0, frames: 1 }
                }
            };
        }

        return config;
    }

    /**
     * 新しいキャラクターを動的に登録する
     */
    registerCharacter(config) {
        const prepared = this.prepareCharacter(config);

        // 既存のIDがあれば上書き、なければ追加
        const index = this.characters.findIndex(c => c.id === prepared.id);
        if (index !== -1) {
            this.characters[index] = prepared;
        } else {
            this.characters.push(prepared);
        }

        return prepared.id;
    }

    // 選択中のキャラクターを取得
    getCurrentCharacter() {
        return this.characters.find(c => c.id === this.currentCharacterId) || this.characters[0];
    }

    // キャラクターを選択
    selectCharacter(characterId) {
        const character = this.characters.find(c => c.id === characterId);
        if (character) {
            this.currentCharacterId = characterId;
            this.saveSelectedCharacter(characterId);
            return true;
        }
        return false;
    }

    // 次のキャラクターを選択
    selectNextCharacter() {
        const currentIndex = this.characters.findIndex(c => c.id === this.currentCharacterId);
        const nextIndex = (currentIndex + 1) % this.characters.length;
        this.selectCharacter(this.characters[nextIndex].id);
        return this.getCurrentCharacter();
    }

    // 前のキャラクターを選択
    selectPreviousCharacter() {
        const currentIndex = this.characters.findIndex(c => c.id === this.currentCharacterId);
        const prevIndex = (currentIndex - 1 + this.characters.length) % this.characters.length;
        this.selectCharacter(this.characters[prevIndex].id);
        return this.getCurrentCharacter();
    }

    // 全キャラクターのリストを取得
    getAllCharacters() {
        return this.characters;
    }

    // LocalStorageから選択キャラクターを読み込み
    loadSelectedCharacter() {
        const saved = localStorage.getItem('selectedCharacter');
        if (saved && this.characters.find(c => c.id === saved)) {
            return saved;
        }
        return this.characters[0].id; // デフォルトは最初のキャラ
    }

    // LocalStorageに選択キャラクターを保存
    saveSelectedCharacter(characterId) {
        localStorage.setItem('selectedCharacter', characterId);
    }

    // キャラクター数を取得
    getCharacterCount() {
        return this.characters.length;
    }
}
