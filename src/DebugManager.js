import { DialogueData } from './data/DialogueData.js';
import { EndingData } from './data/EndingData.js';

export class DebugManager {
    constructor(game) {
        this.game = game;
        this.ctx = game.ctx;
        this.showHitboxes = false; // ヒットボックス表示フラグ
        this.enabled = true; // デバッグ機能自体の有効化フラグ
        this.isGodMode = false; // デフォルトで無敵モードOFF
        this.isVisible = false; // デバッグツールの表示状態
        this.debugClickCount = 0;
        this.lastDebugClickTime = 0;

        // HTML要素の参照
        this.elements = {
            toggle: document.getElementById('btn-debug-toggle'),
            menu: document.getElementById('debug-menu'),
            warp: document.getElementById('btn-debug-warp'),
            bossDamage: document.getElementById('btn-debug-boss-damage'),
            nextStage: document.getElementById('btn-debug-next-stage'),
            barrierBreak: document.getElementById('btn-debug-barrier-break'),

            // Stage Warps
            warpSt2: document.getElementById('btn-debug-warp-st2'),
            warpSt3: document.getElementById('btn-debug-warp-st3'),
            warpSt4: document.getElementById('btn-debug-warp-st4'),
            warpSt5: document.getElementById('btn-debug-warp-st5'),

            // Dialogue Editor (Simple)
            editorModal: document.getElementById('dialogue-editor-modal'),
            editorSelect: document.getElementById('editor-id-select'),
            editorRows: document.getElementById('editor-rows-container'),
            editorBtnClose: document.getElementById('editor-btn-close'),
            editorBtnPlay: document.getElementById('editor-btn-play'),
            editorBtnSave: document.getElementById('editor-btn-save'),
            editorBtnCopy: document.getElementById('editor-btn-copy'),

            // New Preview Buttons
            // New Preview Elements
            roomBtnPreview: document.getElementById('room-btn-preview'),
            previewModal: document.getElementById('preview-select-modal'),
            previewBtnEndingAlice: document.getElementById('preview-btn-ending-alice'),
            previewBtnEndingKanon: document.getElementById('preview-btn-ending-kanon'),
            previewBtnResult: document.getElementById('preview-btn-result'),
            previewBtnClose: document.getElementById('preview-btn-close'),
            editorViewpointSelect: document.getElementById('editor-viewpoint-select'),

            // Debug Room
            debugRoomEntry: document.getElementById('debug-room-btn'),
            debugRoomOverlay: document.getElementById('debug-room-overlay'),
            roomBtnDialogue: document.getElementById('room-btn-dialogue'),
            roomBtnBack: document.getElementById('room-btn-back'),

            // Preview Elements (Removed in simple editor, but keeping references safe or null)
            previewText: null,
            trigger: document.getElementById('debug-trigger'),
            container: document.getElementById('debug-container')
        };

        this.currentEditorId = null;

        this.init();
    }

    init() {
        // --- SECRET TRIGGER LOGIC (Bottom-Left 3 Clicks) ---
        if (this.elements.trigger) {
            this.elements.trigger.addEventListener('click', (e) => {
                const now = Date.now();
                if (now - this.lastDebugClickTime > 3000) {
                    this.debugClickCount = 0; // Reset if too slow (3s)
                }

                this.debugClickCount++;
                this.lastDebugClickTime = now;

                console.log(`[Debug] Secret trigger clicked: ${this.debugClickCount}/3`);

                if (this.debugClickCount >= 3) {
                    this.isVisible = true; // 3回クリックで常に出現
                    this.debugClickCount = 0;
                    console.log(`[Debug] Debug tool activated via secret trigger`);

                    // 全ステージ共通で表示を確実にするため、明示的にスタイルを更新
                    if (this.elements.container) {
                        this.elements.container.style.display = 'block';
                    }
                    if (this.elements.debugRoomEntry) {
                        this.elements.debugRoomEntry.style.display = 'flex';
                    }
                }
                e.stopPropagation();
            });
        }

        if (!this.elements.toggle || !this.elements.menu) return;

        // --- DEBUG ROOM LOGIC ---
        if (this.elements.debugRoomEntry) {
            // Force high z-index to ensure clickable
            this.elements.debugRoomEntry.style.zIndex = "99999";
            this.elements.debugRoomEntry.style.pointerEvents = "all";

            this.elements.debugRoomEntry.onclick = (e) => {
                console.log("[DebugManager] Debug Room Button Clicked!");
                e.preventDefault();
                e.stopPropagation();
                if (this.elements.debugRoomOverlay) {
                    this.elements.debugRoomOverlay.classList.remove('hidden');
                    this.elements.debugRoomOverlay.style.display = 'flex';
                    this.elements.debugRoomOverlay.style.zIndex = "100000"; // Ensure overlay is on top
                    this.updateInputBlockState();
                }
            };
        }
        if (this.elements.roomBtnBack) {
            this.elements.roomBtnBack.addEventListener('click', (e) => {
                if (this.elements.debugRoomOverlay) {
                    this.elements.debugRoomOverlay.style.display = 'none';
                    this.updateInputBlockState();
                }
            });
        }

        // Add Ending Preview Buttons to Debug Room
        if (this.elements.debugRoomOverlay && !this.elements.debugRoomOverlay.querySelector('#btn-debug-ending-alice')) {
            const content = this.elements.debugRoomOverlay.querySelector('.modal-content') || this.elements.debugRoomOverlay;

            const createEndBtn = (id, label, color, endingId) => {
                const btn = document.createElement('button');
                btn.id = id;
                btn.innerText = label;
                btn.style.cssText = `margin: 5px; padding: 10px 20px; background: ${color}; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;`;
                btn.onclick = () => {
                    this.elements.debugRoomOverlay.style.display = 'none';
                    this.updateInputBlockState();

                    if (endingId === 'RESULT') {
                        console.log("Debug: Force Result Screen");
                        this.game.state = 'PLAYING'; // Fake state
                        this.game.gameWon = true;
                        this.game.stageScoreGained = 12345; // Test Score
                        if (this.game.resultSection) this.game.resultSection.reset();
                        return;
                    }

                    console.log(`Debug: Starting Ending [${endingId}]`);
                    this.game.state = 'ENDING';
                    this.game.endingSection.start(endingId);
                };
                content.appendChild(btn);
            };

            createEndBtn('btn-debug-ending-alice', '🎬 Alice Ending', '#ff6b81', 'ALICE_TRUE');
            createEndBtn('btn-debug-ending-kanon', '🎬 Kanon Ending', '#a29bfe', 'KANON_TRUE');
            createEndBtn('btn-debug-result', '🏆 Force Result', '#0984e3', 'RESULT');
        }
        if (this.elements.roomBtnDialogue) {
            this.elements.roomBtnDialogue.addEventListener('click', (e) => {
                if (this.elements.editorModal) {
                    this.elements.editorModal.classList.remove('hidden');
                    this.elements.editorModal.style.display = 'flex';
                    // Hide room overlay to focus oneditor
                    if (this.elements.debugRoomOverlay) this.elements.debugRoomOverlay.style.display = 'none';
                    this.updateInputBlockState();
                    this.initSimpleEditor();
                }
            });
        }

        // メニューの閉じる (歯車マークで消える)
        if (this.elements.toggle) {
            this.elements.toggle.style.cursor = 'pointer';
            this.elements.toggle.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.isVisible = false;
                console.log(`[Debug] Debug tool hidden via gear mark`);

                // 即座に非表示を反映
                if (this.elements.container) {
                    this.elements.container.style.display = 'none';
                }
                if (this.elements.debugRoomEntry) {
                    this.elements.debugRoomEntry.style.display = 'none';
                }
            });
        }

        // BOSSワープ
        if (this.elements.warp) {
            this.elements.warp.addEventListener('click', (e) => {
                e.stopPropagation();
                this.warpToBoss();
            });
        }

        // BOSS DAMAGE (-5)
        if (this.elements.bossDamage) {
            this.elements.bossDamage.addEventListener('click', (e) => {
                e.stopPropagation();
                const boss = this.game.boss;
                if (boss && !boss.defeated) {
                    boss.hp -= 5;
                    boss.flashTime = 0.5; // Flash effect
                    console.log(`[Debug] Boss HP -5. Current: ${boss.hp}`);

                    // Kill if 0
                    if (boss.hp <= 0) {
                        boss.hp = 0;
                        if (typeof boss.die === 'function') boss.die();
                        else boss.defeated = true;
                    }
                } else {
                    console.log("[Debug] No active boss found.");
                }
            });
        }

        // BARRIER BREAK (+100)
        if (this.elements.barrierBreak) {
            this.elements.barrierBreak.addEventListener('click', (e) => {
                e.stopPropagation();
                this.game.score += 100;
                this.game.stageScoreGained += 100;
                this.game.updateScoreUI();
                this.game.saveProgress();
                console.log("[Debug] Barrier Break Score +100 added.");
            });
        }

        // NEXT STAGE
        if (this.elements.nextStage) {
            this.elements.nextStage.addEventListener('click', (e) => {
                e.stopPropagation();
                if (this.game.state === 'PLAYING' || this.game.state === 'BOSS_BATTLE') {
                    this.game.nextStage();
                } else {
                    console.log("[Debug] Can only skip stage while playing.");
                }
            });
        }

        // STAGE WARP BUTTONS
        [2, 3, 4, 5].forEach(st => {
            const btn = this.elements[`warpSt${st}`];
            if (btn) {
                btn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    console.log(`[Debug] Warping to Stage ${st}`);

                    // 読み込み画面を表示
                    const loadingScreen = document.getElementById('loading-screen');
                    if (loadingScreen) {
                        loadingScreen.classList.remove('hidden');
                        const info = document.getElementById('loading-status');
                        if (info) info.textContent = `WARPING TO STAGE ${st}...`;
                    }

                    this.game.stage = st;
                    this.game.gameWon = false;
                    this.game.state = 'LOADING_STAGE';
                    this.game.knockbackTimer = 0;
                    this.game.timeScale = 1.0;
                    this.game.stageScoreGained = 0;

                    // アセットの動的ロード
                    await this.game.loadStageAssets(st);

                    // Reset Level
                    this.game.initLevel();
                    this.game.updateStageUI();
                    this.game.updateScoreUI();
                    this.game.saveProgress();

                    if (loadingScreen) {
                        loadingScreen.classList.add('hidden');
                    }

                    // Play BGM
                    if (this.game.currentStageConfig && this.game.currentStageConfig.bgm) {
                        this.game.audio.playBGM(this.game.currentStageConfig.bgm);
                    } else {
                        this.game.audio.playGameBGM();
                    }

                    this.game.state = 'STAGE_INTRO';
                    this.game.introTimer = 0;
                    this.updateInputBlockState();
                    // Keep menu state as is (do not hide)
                });
            }
        });

        // Add "Play All Alice" button dynamically if not exists (for Editor)
        if (this.elements.editorModal && !document.getElementById('editor-btn-play-all-alice')) {
            const btnContainer = this.elements.editorModal.querySelector('.editor-panel > div'); // First div (header)
            if (btnContainer) {
                const playAllBtn = document.createElement('button');
                playAllBtn.id = 'editor-btn-play-all-alice';
                playAllBtn.innerText = '🐰 Play All (Alice)';
                playAllBtn.style.cssText = "margin-left: 10px; background: #ff9f43; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; font-size: 14px; padding: 5px 15px;";

                playAllBtn.onclick = () => {
                    this.playAllAliceDialogues();
                };

                // Add to header next to Close
                btnContainer.insertBefore(playAllBtn, this.elements.editorBtnClose);
            }
        }

        // --- Simple Editor Events ---
        if (this.elements.editorModal) {
            // Editor Select (Scene ID)
            if (this.elements.editorSelect) {
                this.elements.editorSelect.addEventListener('change', (e) => {
                    this.switchViewpoint();
                });
            }

            // Viewpoint Select
            if (this.elements.editorViewpointSelect) {
                this.elements.editorViewpointSelect.addEventListener('change', (e) => {
                    this.switchViewpoint();
                });
            }

            // Play Button
            if (this.elements.editorBtnPlay) {
                this.elements.editorBtnPlay.addEventListener('click', () => {
                    // Auto save before play
                    this.saveEditorData();
                    if (this.currentEditorId) {
                        this.elements.editorModal.style.display = 'none';
                        this.elements.editorModal.classList.add('hidden');
                        // Keep input blocked or manage it?
                        // Usually playback blocks input anyway.

                        if (this.game.dialogueManager) {
                            this.game.dialogueManager.startDialogue(this.currentEditorId, () => {
                                // Re-open editor after dialogue?
                                this.elements.editorModal.style.display = 'flex';
                            });
                        }
                    } else {
                        alert("会話シーンを選択してください");
                    }
                });
            }

            // Save Button
            if (this.elements.editorBtnSave) {
                this.elements.editorBtnSave.addEventListener('click', () => {
                    this.saveEditorData();
                    alert("変更を一時保存しました。(リロードでリセットされます)");
                });
            }

            // Copy Button
            if (this.elements.editorBtnCopy) {
                this.elements.editorBtnCopy.addEventListener('click', () => {
                    this.copyToClipboard();
                });
            }

            // Preview Button (Open Modal)
            if (this.elements.roomBtnPreview) {
                this.elements.roomBtnPreview.addEventListener('click', () => {
                    if (this.elements.previewModal) {
                        this.elements.previewModal.classList.remove('hidden');
                        this.elements.previewModal.style.display = 'flex';
                        if (this.elements.debugRoomOverlay) this.elements.debugRoomOverlay.style.display = 'none';
                    }
                });
            }

            // Modal: Alice Ending
            if (this.elements.previewBtnEndingAlice) {
                this.elements.previewBtnEndingAlice.addEventListener('click', () => {
                    this.playEndingDebug('ALICE_TRUE');
                    this.closePreviewModal();
                });
            }
            // Modal: Kanon Ending
            if (this.elements.previewBtnEndingKanon) {
                this.elements.previewBtnEndingKanon.addEventListener('click', () => {
                    this.playEndingDebug('KANON_TRUE');
                    this.closePreviewModal();
                });
            }
            // Modal: Result
            if (this.elements.previewBtnResult) {
                this.elements.previewBtnResult.addEventListener('click', () => {
                    this.playResultDebug();
                    this.closePreviewModal();
                });
            }
            // Modal: Close
            if (this.elements.previewBtnClose) {
                this.elements.previewBtnClose.addEventListener('click', () => {
                    this.closePreviewModal(true); // true = Reopen Debug Room
                });
            }

            // Close Button
            if (this.elements.editorBtnClose) {
                this.elements.editorBtnClose.addEventListener('click', () => {
                    this.elements.editorModal.style.display = 'none';
                    this.elements.editorModal.classList.add('hidden');
                    // Re-open debug room
                    if (this.elements.debugRoomOverlay) this.elements.debugRoomOverlay.style.display = 'flex';
                    this.updateInputBlockState();
                });
            }
        }

        // キーボードショートカット (例: 'H'キーでヒットボックス切り替え)
        window.addEventListener('keydown', (e) => {
            if (e.code === 'KeyH') {
                this.showHitboxes = !this.showHitboxes;
                console.log(`[Debug] Hitboxes: ${this.showHitboxes ? 'ON' : 'OFF'}`);
            }
        });
    }

    initSimpleEditor() {
        // Populate Select if empty
        if (this.elements.editorSelect && this.elements.editorSelect.options.length <= 1) {
            const keys = Object.keys(DialogueData).filter(k => !k.endsWith('_KANON')); // List only base keys
            keys.forEach(key => {
                const opt = document.createElement('option');
                opt.value = key;
                opt.textContent = key;
                this.elements.editorSelect.appendChild(opt);
            });

            // Add Ending Option
            const endOpt = document.createElement('option');
            endOpt.value = 'ENDING';
            endOpt.textContent = 'ENDING (エンディング)';
            this.elements.editorSelect.appendChild(endOpt);
        }
    }

    switchViewpoint() {
        const baseId = this.elements.editorSelect.value;
        if (!baseId) {
            this.currentEditorId = null;
            this.renderEditorRows(null);
            return;
        }

        const viewpoint = this.elements.editorViewpointSelect ? this.elements.editorViewpointSelect.value : 'ALICE';
        let targetId = baseId;
        let isEnding = false;

        if (baseId === 'ENDING') {
            isEnding = true;
            if (viewpoint === 'KANON') targetId = 'KANON_TRUE';
            else targetId = 'ALICE_TRUE';
        } else {
            if (viewpoint === 'KANON') {
                if (!targetId.endsWith('_KANON')) targetId += '_KANON';
            } else {
                targetId = baseId;
            }

            // Clone if missing (Dialogue only)
            if (!DialogueData[targetId] && DialogueData[baseId]) {
                DialogueData[targetId] = JSON.parse(JSON.stringify(DialogueData[baseId]));
            }
        }

        this.currentEditorId = targetId;
        this.currentIsEnding = isEnding;
        this.renderEditorRows(targetId, isEnding);
    }

    renderEditorRows(id, isEnding = false) {
        if (!this.elements.editorRows) return;
        this.elements.editorRows.innerHTML = '';

        if (!id) {
            this.elements.editorRows.innerHTML = '<div style="text-align: center; color: #bdc3c7; margin-top: 50px;">シーンを選択してください</div>';
            return;
        }

        if (isEnding) {
            this.renderEndingEditorRows(id);
        } else {
            this.renderDialogueEditorRows(id);
        }
    }

    renderEndingEditorRows(id) {
        const data = EndingData[id];
        if (!data) {
            this.elements.editorRows.innerHTML = '<div style="text-align: center; color: #e74c3c;">データが見つかりません</div>';
            return;
        }

        data.forEach((scene, index) => {
            const row = document.createElement('div');
            row.style.cssText = "display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; background: rgba(0,0,0,0.4); padding: 15px; border-radius: 8px; border: 1px solid #555;";

            // Header (Scene Type, Duration)
            const header = document.createElement('div');
            header.style.cssText = "display: flex; justify-content: space-between; align-items: center; color: #f1c40f; font-weight: bold;";
            header.innerHTML = `<span>Scene #${index + 1} (${scene.type})</span>`;

            // Duration Input
            const durWrapper = document.createElement('div');
            durWrapper.innerHTML = '<span style="color:#aaa; font-size:12px;">Duration(ms): </span>';
            const durInput = document.createElement('input');
            durInput.type = 'number';
            durInput.className = 'editor-end-dur';
            durInput.value = scene.duration;
            durInput.dataset.index = index;
            durInput.style.cssText = "width: 80px; padding: 4px; border-radius: 4px;";
            durWrapper.appendChild(durInput);
            header.appendChild(durWrapper);
            row.appendChild(header);

            // Image Select
            const imgWrapper = document.createElement('div');
            imgWrapper.style.cssText = "margin-bottom: 5px; display: flex; align-items: top; gap: 10px;"; // align top for preview layout
            imgWrapper.innerHTML = '<span style="color:#aaa; font-size:12px; min-width:60px; padding-top: 8px;">Image:</span>';

            // Container for Select and Preview
            const selContainer = document.createElement('div');
            selContainer.style.cssText = "flex: 1; display: flex; flex-direction: column; gap: 5px;";

            const imgSelect = document.createElement('select');
            imgSelect.className = 'editor-end-img';
            imgSelect.dataset.index = index;
            imgSelect.style.cssText = "width: 100%; padding: 6px; border-radius: 4px; background: #dfe6e9; border: 1px solid #bdc3c7;";

            // Preview Image
            const prevImg = document.createElement('img');
            prevImg.style.cssText = "max-width: 100%; max-height: 120px; object-fit: contain; border: 1px solid #555; background: #000; display: none; margin-top: 5px; border-radius: 4px;";

            // Preview Update Function
            const updatePreview = (val) => {
                if (!val) {
                    prevImg.style.display = 'none';
                    return;
                }
                prevImg.style.display = 'block';

                if (val.includes('.')) {
                    // Direct file path (assume relative to assets/img/ending/)
                    prevImg.src = `./assets/img/ending/${val}`;
                } else {
                    // Asset Key
                    const asset = this.game.assets.images[val];
                    if (asset && asset.src) {
                        prevImg.src = asset.src;
                    } else {
                        // Fallback guessing
                        prevImg.src = `./assets/img/ending/${val}.webp`;
                    }
                }
            };

            const imgOpts = [
                { v: "", l: "(No Image/Default)" },
                { v: "aliceend1.webp", l: "aliceend1.webp" },
                { v: "aliceend2.webp", l: "aliceend2.webp" },
                { v: "aliceend3.webp", l: "aliceend3.webp" },
                { v: "aliceend4.webp", l: "aliceend4.webp" },
                { v: "aliceend5.webp", l: "aliceend5.webp" },
                { v: "kanonend1.webp", l: "kanonend1.webp" },
                { v: "kanonend2.webp", l: "kanonend2.webp" },
                { v: "kanonend3.webp", l: "kanonend3.webp" },
                { v: "aliceend1.webp", l: "aliceend1.webp" },
                { v: "aliceend2.webp", l: "aliceend2.webp" },
                { v: "aliceend3.webp", l: "aliceend3.webp" },
                { v: "aliceend4.webp", l: "aliceend4.webp" },
                { v: "aliceend5.webp", l: "aliceend5.webp" },
                { v: "ending_hug", l: "Key: ending_hug" },
                { v: "ending_memory", l: "Key: ending_memory" },
                { v: "boss_god_cutin", l: "Key: boss_god_cutin" }
            ];

            const currentImg = scene.image || scene.bgImage || "";
            // Add custom if not in list
            if (currentImg && !imgOpts.some(o => o.v === currentImg)) {
                imgOpts.push({ v: currentImg, l: currentImg });
            }

            imgOpts.forEach(o => {
                const opt = document.createElement('option');
                opt.value = o.v;
                opt.textContent = o.l;
                if (currentImg === o.v) opt.selected = true;
                imgSelect.appendChild(opt);
            });

            // Init preview
            updatePreview(currentImg);

            // Change Event
            imgSelect.addEventListener('change', (e) => {
                updatePreview(e.target.value);
            });

            selContainer.appendChild(imgSelect);
            selContainer.appendChild(prevImg);
            imgWrapper.appendChild(selContainer);
            row.appendChild(imgWrapper);

            // SubText (Narrative)
            const subInput = document.createElement('input');
            subInput.className = 'editor-end-sub';
            subInput.dataset.index = index;
            subInput.placeholder = "サブテキスト (ナレーション・状況説明)";
            subInput.value = scene.subText || '';
            subInput.style.cssText = "width: 100%; padding: 12px; border-radius: 4px; border: 1px solid #7f8c8d; background: #ecf0f1; font-size: 18px;";
            row.appendChild(subInput);

            // Text (Array -> Multi-line)
            const textArea = document.createElement('textarea');
            textArea.className = 'editor-end-text';
            textArea.dataset.index = index;
            textArea.placeholder = "メインテキスト (改行で複数行)";
            textArea.value = (scene.text || []).join('\n');
            textArea.style.cssText = "width: 100%; height: 120px; padding: 12px; border-radius: 4px; border: 1px solid #7f8c8d; background: #fff; line-height: 1.5; font-size: 20px; font-family: sans-serif;";
            row.appendChild(textArea);

            this.elements.editorRows.appendChild(row);
        });
    }

    renderDialogueEditorRows(id) {
        if (!DialogueData[id]) {
            this.elements.editorRows.innerHTML = '<div style="text-align: center; color: #bdc3c7; margin-top: 50px;">データがありません</div>';
            return;
        }
        const data = DialogueData[id];
        // ... (Original Logic for Dialogue Render) ...
        data.forEach((line, index) => {
            const row = document.createElement('div');
            row.style.cssText = "display: flex; gap: 20px; margin-bottom: 15px; background: rgba(0,0,0,0.3); padding: 15px; border-radius: 8px;";

            // Info Column
            const infoCol = document.createElement('div');
            infoCol.style.cssText = "width: 220px; display: flex; flex-direction: column; gap: 10px; justify-content: flex-start; padding-top: 5px;";
            const nameLabel = document.createElement('div');
            nameLabel.textContent = line.name;
            nameLabel.style.cssText = "font-weight: bold; color: #f1c40f; font-size: 20px;";
            infoCol.appendChild(nameLabel);

            // Controls
            const controlWrapper = document.createElement('div');
            controlWrapper.style.cssText = "display: flex; flex-direction: column; gap: 10px; margin-top: 5px;";

            const sideSel = document.createElement('select');
            sideSel.className = "editor-line-side";
            sideSel.style.cssText = "font-size: 16px; padding: 8px; border-radius: 4px; border: 1px solid #7f8c8d; cursor: pointer;";
            ['left', 'right'].forEach(s => {
                const opt = document.createElement('option');
                opt.value = s;
                opt.textContent = s.toUpperCase();
                if (line.side === s) opt.selected = true;
                sideSel.appendChild(opt);
            });
            controlWrapper.appendChild(sideSel);

            const imgSel = document.createElement('select');
            imgSel.className = "editor-line-image";
            imgSel.style.cssText = "font-size: 16px; padding: 8px; width: 100%; border-radius: 4px; border: 1px solid #7f8c8d; cursor: pointer;";
            const imgs = [
                { v: "", l: "(Nothing)" },
                { v: "alicetalk1", l: "Alice" },
                { v: "kanontalk1", l: "Kanon" },
                { v: "boss_mochitsuki", l: "Boss(Mochi)" },
                { v: "boss_talk1", l: "Boss(Talk)" },
                { v: "boss_sister_s", l: "Sister S" },
                { v: "boss_sister_k", l: "Sister K" }
            ];
            if (line.image && !imgs.some(i => i.v === line.image)) imgs.push({ v: line.image, l: line.image });
            imgs.forEach(i => {
                const opt = document.createElement('option');
                opt.value = i.v;
                opt.textContent = i.l;
                if (line.image === i.v) opt.selected = true;
                imgSel.appendChild(opt);
            });
            controlWrapper.appendChild(imgSel);
            infoCol.appendChild(controlWrapper);

            // Text Input
            const textCol = document.createElement('div');
            textCol.style.flex = "1";
            const textArea = document.createElement('textarea');
            textArea.className = "editor-line-text";
            textArea.dataset.index = index;
            textArea.value = line.text;
            textArea.style.cssText = "width: 100%; height: 100px; padding: 15px; border-radius: 6px; border: 2px solid #7f8c8d; background: #ecf0f1; color: #2c3e50; font-size: 22px; line-height: 1.5; resize: vertical; font-family: sans-serif;";
            textCol.appendChild(textArea);

            row.appendChild(infoCol);
            row.appendChild(textCol);
            this.elements.editorRows.appendChild(row);
        });
    }

    saveEditorData() {
        if (!this.currentEditorId) return;

        if (this.currentIsEnding) {
            // Save Ending Data
            const data = EndingData[this.currentEditorId];
            if (!data) return;

            const rows = this.elements.editorRows.children;
            Array.from(rows).forEach((row, index) => {
                const textInput = row.querySelector('.editor-end-text');
                const subInput = row.querySelector('.editor-end-sub');
                const durInput = row.querySelector('.editor-end-dur');
                const imgInput = row.querySelector('.editor-end-img');

                if (data[index]) {
                    if (textInput) data[index].text = textInput.value.split('\n');
                    if (subInput) data[index].subText = subInput.value;
                    if (durInput) data[index].duration = parseInt(durInput.value) || 0;
                    if (imgInput) {
                        if (imgInput.value) {
                            data[index].image = imgInput.value;
                            // Clear bgImage to avoid conflict if image is set
                            delete data[index].bgImage;
                        } else {
                            delete data[index].image;
                            delete data[index].bgImage;
                        }
                    }
                }
            });
        } else {
            // Save Dialogue Data
            if (!DialogueData[this.currentEditorId]) return;
            const inputs = this.elements.editorRows.querySelectorAll('.editor-line-text');
            const data = DialogueData[this.currentEditorId];

            inputs.forEach(input => {
                const index = parseInt(input.dataset.index);
                const row = input.parentNode.parentNode;
                const sideEl = row.querySelector('.editor-line-side');
                const imgEl = row.querySelector('.editor-line-image');

                if (data[index]) {
                    data[index].text = input.value;
                    if (sideEl) data[index].side = sideEl.value;
                    if (imgEl) data[index].image = imgEl.value;
                }
            });
        }

        console.log(`[Debug] Saved changes for ${this.currentEditorId}`);
    }

    copyToClipboard() {
        if (!this.currentEditorId) return;
        this.saveEditorData(); // Save first

        let data;
        let promptHeader = "以下の会話データを更新してください。";

        if (this.currentIsEnding) {
            data = EndingData[this.currentEditorId];
            promptHeader = "エンディングデータを更新してください。";
        } else {
            data = DialogueData[this.currentEditorId];
        }

        if (!data) return;

        const json = JSON.stringify(data, null, 4);

        // Get Viewpoint
        const viewpoint = this.elements.editorViewpointSelect ? this.elements.editorViewpointSelect.value : 'ALICE';
        const targetId = this.currentEditorId;

        const prompt = `会話パートを編集すること
${promptHeader}
対象ID: '${targetId}'
視点: ${viewpoint}

\`\`\`javascript
${json}
\`\`\`
`;

        navigator.clipboard.writeText(prompt).then(() => {
            alert(`データをコピーしました！（AI指示形式）\n\n対象ID: ${targetId}\n視点: ${viewpoint}\n\nこの内容でファイルを更新するか、\nAIチャットに貼り付けて修正指示を出してください。`);
        }).catch(err => {
            console.error('Copy failed:', err);
            alert("コピーに失敗しました。");
        });
    }

    updateInputBlockState() {
        if (!this.game.input) return;

        const roomOpen = this.elements.debugRoomOverlay && this.elements.debugRoomOverlay.style.display === 'flex';
        const editorOpen = this.elements.editorModal && this.elements.editorModal.style.display === 'flex';

        this.game.input.setBlocked(roomOpen || editorOpen);
    }

    closePreviewModal(reopenRoom = false) {
        if (this.elements.previewModal) {
            this.elements.previewModal.style.display = 'none';
            this.elements.previewModal.classList.add('hidden');
        }
        if (reopenRoom && this.elements.debugRoomOverlay) {
            this.elements.debugRoomOverlay.style.display = 'flex';
        }
        this.updateInputBlockState();
    }

    playEndingDebug(targetId = null) {
        // IDが指定されなければ現在のキャラクターに基づく
        let endingId = targetId;
        if (!endingId) {
            const charId = this.game.characterManager.getCurrentCharacter().id;
            endingId = (charId === 'kanon') ? 'KANON_TRUE' : 'ALICE_TRUE';
        }

        if (this.game.endingSection) {
            this.game.state = 'ENDING';
            this.game.endingSection.start(endingId);
            console.log(`[Debug] Playing Ending: ${endingId}`);
        }
    }

    playResultDebug() {
        console.log("[Debug] Playing Result Preview");
        this.game.gameWon = true;

        // Mock data
        if (this.game.score === 0) this.game.score = 5000;
        this.game.stageDamageCount = Math.floor(Math.random() * 5);
        this.game.stageStartTime = Date.now() - 125000; // 2m 5s ago
        this.game.lives = 3;

        // Force Result trigger in next update
        // Note: Game.js update checks for gameWon and triggers ResultSection update

        if (this.game.resultSection) {
            this.game.resultSection.reset();
        }
    }

    warpToBoss() {
        const { game } = this;
        if ((game.state === 'PLAYING' || game.state === 'RESPAWN_WAIT') && game.boss && game.player) {
            const targetX = game.boss.x - 500;
            const targetCol = Math.floor(targetX / game.tileSize);

            let groundY = -1;
            for (let row = 0; row < game.level.rows; row++) {
                if (game.level.isSolid(targetCol, row)) {
                    groundY = row * game.tileSize;
                    break;
                }
            }

            game.player.x = targetX;
            if (groundY !== -1) {
                game.player.y = groundY - game.tileSize;
            } else {
                game.player.y = game.player.lastSafeY || (game.height - game.tileSize * 2);
            }

            game.player.vx = 0;
            game.player.vy = 0;
            game.camera.x = game.player.x - game.width / 2;
            game.state = 'PLAYING';
        }
    }

    toggleGodMode() {
        this.isGodMode = !this.isGodMode;
        if (this.elements.god) {
            if (this.isGodMode) {
                this.elements.god.innerText = "🛡️ 無敵モード: ON";
                this.elements.god.style.background = "#9b59b6"; // Purple
            } else {
                this.elements.god.innerText = "🛡️ 無敵モード: OFF";
                this.elements.god.style.background = "#7f8c8d"; // Gray
            }
        }
    }

    update(dt) {
        if (!this.enabled) return;

        // 全体のデバッグツールの表示状態を反映 (isVisibleが唯一のソース)
        if (this.elements.container) {
            this.elements.container.style.display = this.isVisible ? 'block' : 'none';
        }

        // Title Screen Debug Button (Debug Room Entry) Visibility
        if (this.elements.debugRoomEntry) {
            if (this.isVisible) {
                this.elements.debugRoomEntry.style.display = 'flex';
                this.elements.debugRoomEntry.style.zIndex = "10000"; // 確実に上に
            } else {
                this.elements.debugRoomEntry.style.display = 'none';
            }
        }
    }

    draw() {
        if (!this.enabled) return;

        // ヒットボックスの描画
        if (this.showHitboxes) {
            this.drawDebugVisuals();
        }
    }

    playAllAliceDialogues() {
        console.log("Playing all Alice dialogues...");
        const keys = Object.keys(DialogueData).filter(k => k.startsWith('STAGE') && !k.includes('_KANON'));

        // Custom Sort
        const orderSuffix = ['OPENING', 'MID', 'BOSS_START', 'BARRIER_BREAK', 'BOSS_DEFEAT'];

        keys.sort((a, b) => {
            // Extract Stage Number
            const stageA = parseInt(a.match(/STAGE(\d+)/)[1]);
            const stageB = parseInt(b.match(/STAGE(\d+)/)[1]);

            if (stageA !== stageB) return stageA - stageB;

            // Extract Suffix
            const sufA = a.replace(`STAGE${stageA}_`, '');
            const sufB = b.replace(`STAGE${stageB}_`, '');

            return orderSuffix.indexOf(sufA) - orderSuffix.indexOf(sufB);
        });

        console.log("Sequence:", keys);

        // Hide editor
        if (this.elements.editorModal) {
            this.elements.editorModal.style.display = 'none';
            this.elements.editorModal.classList.add('hidden');
        }
        this.updateInputBlockState();

        // Recursively play
        let index = 0;
        const playNext = () => {
            if (index >= keys.length) {
                console.log("All dialogues finished.");
                alert("全会話再生終了しました！");
                return;
            }

            const key = keys[index];
            console.log(`Playing: ${key}`);
            index++;

            if (this.game.dialogueManager) {
                this.game.dialogueManager.startDialogue(key, () => {
                    setTimeout(playNext, 500);
                });
            }
        };

        playNext();
    }

    drawDebugVisuals() {
        const { ctx, game } = this;
        const { camera } = game;

        ctx.save();
        ctx.lineWidth = 2;

        // プレイヤーのヒットボックス
        if (game.player) {
            ctx.strokeStyle = 'lime';
            ctx.strokeRect(
                game.player.x - camera.x,
                game.player.y - camera.y,
                game.player.width,
                game.player.height
            );
        }

        // 敵のヒットボックス
        game.enemies.forEach(en => {
            if (en.dead) return;
            ctx.strokeStyle = 'red';
            ctx.strokeRect(
                en.x - camera.x,
                en.y - camera.y,
                en.width || 64,
                en.height || 64
            );
        });

        // ボスのヒットボックス
        if (game.boss && !game.boss.defeated) {
            ctx.strokeStyle = 'magenta';
            ctx.strokeRect(
                game.boss.x - camera.x,
                game.boss.y - camera.y,
                game.boss.width,
                game.boss.height
            );
        }

        ctx.restore();
    }
}
