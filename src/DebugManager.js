import { DialogueData } from './data/DialogueData.js';
import { EndingData } from './data/EndingData.js';
import { StageConfig } from './data/StageConfig.js';

export class DebugManager {
    constructor(game) {
        this.game = game;
        this.ctx = game.ctx;
        this.showHitboxes = false; // ヒットボックス表示フラグ
        this.enabled = true; // デバッグ機能自体の有効化フラグ
        this.isGodMode = false; // デフォルトで無敵モードOFF
        this.isVisible = false; // デバッグツールの表示状態
        this.isAutoPlay = false; // オートプレイモード
        this.autoPlayJumpCooldown = 0; // ジャンプのクールダウン
        this.debugClickCount = 0;
        this.lastDebugClickTime = 0;

        // --- Full Auto Debug ---
        this.isFullAuto = false;
        this._asyncBusy = false;
        this._savedScore = null;
        this._dialogueAdvanceTimer = 0;
        this._bossHpTimer = 0;
        this._resultSkipTimer = 0;
        this._endingAdvanceTimer = 0;
        this._fullAutoStartTime = 0;
        this._fullAutoErrors = 0;
        this._errorHandler = null;
        this._rejectionHandler = null;
        this.fullAutoLog = [];
        this._telemetryTimer = 0;
        this._fpsFrames = 0;
        this._fpsTime = 0;
        this._fpsValue = 60;
        this._stateTransitions = [];
        this._lastTrackedState = null;

        // ボススキル検証
        this._bossSkillLog = {};       // { stage: [ { skill, time } ] }
        this._lastBossState = null;
        this._bossSkillAnomalies = [];

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

            // AutoPlay & GodMode & FullAuto
            autoPlay: document.getElementById('btn-debug-autoplay'),
            god: document.getElementById('btn-debug-godmode'),
            fullAuto: document.getElementById('btn-debug-fullauto'),

            // Preview Elements (Removed in simple editor, but keeping references safe or null)
            previewText: null,
            trigger: document.getElementById('debug-trigger'),
            container: document.getElementById('debug-container')
        };

        this.currentEditorId = null;

        this.init();
    }

    init() {
        // --- KEYBOARD SHORTCUTS ---
        window.addEventListener('keydown', (e) => {
            if (e.code === 'F9') { e.preventDefault(); this.toggleAutoPlay(); }
            if (e.code === 'F8' && this.isVisible) { e.preventDefault(); this.toggleGodMode(); }
            if (e.code === 'F7') { e.preventDefault(); this.toggleFullAuto(); }
        });

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

            // --- Enable Enemy Config Button (Bottom Left Slot) ---
            // Assuming the layout is a grid or flex, we try to place it effectively.
            // If the user specific "bottom-left coming soon slot", it might be an empty div in the HTML.
            // We'll search for 'debug-room-coming-soon' ID or just append to the content and style it carefully.

            const comingSoonSlot = document.getElementById('debug-room-coming-soon');
            const targetContainer = comingSoonSlot || content;

            const enemyBtn = document.createElement('button');
            enemyBtn.id = 'btn-debug-enemy-config';
            enemyBtn.innerText = '👾 Enemy Config';
            // Style to look like other room buttons if possible, or distinctive
            enemyBtn.style.cssText = `margin: 5px; padding: 10px 20px; background: #8e44ad; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; width: 100%;`;

            if (comingSoonSlot) {
                // Clear "Coming Soon" text
                comingSoonSlot.innerHTML = '';
                comingSoonSlot.appendChild(enemyBtn);
                comingSoonSlot.style.opacity = "1"; // Ensure it's visible if it was faded
                comingSoonSlot.style.pointerEvents = "all";
            } else {
                // Fallback append
                content.appendChild(enemyBtn);
            }

            enemyBtn.onclick = () => {
                this.openEnemyConfig();
            };
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

        // AUTO PLAY
        if (this.elements.autoPlay) {
            this.elements.autoPlay.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleAutoPlay();
            });
        }

        // GOD MODE
        if (this.elements.god) {
            this.elements.god.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleGodMode();
            });
        }

        // FULL AUTO DEBUG
        if (this.elements.fullAuto) {
            this.elements.fullAuto.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleFullAuto();
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

    // --- Enemy Config Feature ---
    openEnemyConfig() {
        // Initialize Config Data if not exists
        if (!this.enemyConfigData) {
            this.enemyConfigData = {};
            this.initialEnemyConfigData = {}; // Store for change detection

            // Pull initial values from StageConfig
            for (let i = 1; i <= 5; i++) {
                const config = StageConfig[i];
                const ground = (config && config.enemies) ? config.enemies.ground : 'fuwamoko';
                const air = (config && config.enemies) ? config.enemies.air : 'enemy_cloud';

                const entry = {
                    ground: ground,
                    air: air,
                    groundName: ground,
                    airName: air
                };

                this.enemyConfigData[i] = { ...entry };
                this.initialEnemyConfigData[i] = { ...entry };
            }
        }

        let modal = document.getElementById('debug-enemy-config-modal');
        if (!modal) {
            modal = this.createEnemyConfigModal();
        }

        // Reset to Stage 1
        this.currentConfigStage = this.game.stage || 1;
        this.updateEnemyConfigUI(modal);

        modal.classList.remove('hidden');
        modal.style.display = 'flex';
        // Hide room overlay
        if (this.elements.debugRoomOverlay) this.elements.debugRoomOverlay.style.display = 'none';

        // Block Input
        this.updateInputBlockState();
    }

    updateEnemyConfigUI(modal) {
        // Highlight active tab
        const tabs = modal.querySelectorAll('.stage-tab');
        tabs.forEach(t => {
            if (parseInt(t.dataset.stage) === this.currentConfigStage) {
                t.style.background = '#3498db';
                t.style.color = 'white';
            } else {
                t.style.background = '#ecf0f1';
                t.style.color = '#2c3e50';
            }
        });

        // Update Inputs/Previews
        const data = this.enemyConfigData[this.currentConfigStage];
        this.updateEnemyPreview(modal, 'ground', data.ground, data.groundName);
        this.updateEnemyPreview(modal, 'air', data.air, data.airName);
    }

    updateEnemyPreview(modal, type, assetKey, fileName) {
        const img = modal.querySelector(`#preview-${type}`);
        const label = modal.querySelector(`#filename-${type}`);

        // Asset lookup
        // Note: assetKey might be a custom key like 'custom_st1_ground'
        const asset = this.game.assets.images[assetKey];
        if (img) {
            if (asset && asset.src) {
                img.src = asset.src;
            } else {
                // Fallback attempt?
                img.src = '';
            }
        }
        if (label) label.innerText = fileName || assetKey;
    }

    createEnemyConfigModal() {
        const modal = document.createElement('div');
        modal.id = 'debug-enemy-config-modal';
        modal.style.cssText = "position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); z-index: 100001; display: none; justify-content: center; align-items: center; flex-direction: column;";

        const content = document.createElement('div');
        content.style.cssText = "background: #fff; padding: 20px; border-radius: 10px; width: 700px; max-width: 95%; color: #000; text-align: center; box-shadow: 0 0 30px rgba(0,0,0,0.8); display: flex; flex-direction: column; gap: 15px;";

        // Header
        const header = document.createElement('div');
        header.style.cssText = "display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #eee; padding-bottom: 15px;";
        header.innerHTML = '<h2 style="margin:0;">👾 Enemy Config Editor</h2>';

        const exportBtn = document.createElement('button');
        exportBtn.innerText = "📋 Export JSON";
        exportBtn.style.cssText = "background: #2ecc71; color: white; border: none; padding: 8px 15px; border-radius: 4px; font-weight: bold; cursor: pointer;";
        exportBtn.onclick = () => this.exportEnemyConfigJSON();
        header.appendChild(exportBtn);
        content.appendChild(header);

        // Stage Tabs
        const tabContainer = document.createElement('div');
        tabContainer.style.cssText = "display: flex; gap: 10px; justify-content: center; margin-bottom: 10px;";
        for (let i = 1; i <= 5; i++) {
            const tab = document.createElement('button');
            tab.className = 'stage-tab';
            tab.dataset.stage = i;
            tab.innerText = `Stage ${i}`;
            tab.style.cssText = "padding: 10px 15px; border: 1px solid #bdc3c7; border-radius: 5px; cursor: pointer; font-weight: bold; transition: all 0.2s;";
            tab.onclick = () => {
                this.currentConfigStage = i;
                this.updateEnemyConfigUI(modal);
            };
            tabContainer.appendChild(tab);
        }
        content.appendChild(tabContainer);

        // Grid (Ground / Air)
        const grid = document.createElement('div');
        grid.style.cssText = "display: grid; grid-template-columns: 1fr 1fr; gap: 20px;";

        const createUploader = (type, title) => {
            const wrapper = document.createElement('div');
            wrapper.style.cssText = "border: 2px solid #f0f0f0; padding: 15px; border-radius: 8px; background: #fafafa;";

            const h3 = document.createElement('h3');
            h3.innerText = title;
            h3.style.margin = "0 0 10px 0; color: #7f8c8d;";
            wrapper.appendChild(h3);

            // Preview
            const img = document.createElement('img');
            img.id = `preview-${type}`;
            img.style.cssText = "width: 150px; height: 150px; object-fit: contain; border: 1px dashed #bdc3c7; background: #fff; margin-bottom: 5px;";
            wrapper.appendChild(img);

            // Filename Label
            const fname = document.createElement('div');
            fname.id = `filename-${type}`;
            fname.style.fontSize = "12px";
            fname.style.color = "#95a5a6";
            fname.style.marginBottom = "10px";
            fname.style.wordBreak = "break-all";
            fname.innerText = "(No file selected)";
            wrapper.appendChild(fname);

            // Controls
            const btnBox = document.createElement('div');

            const fileBtn = document.createElement('button');
            fileBtn.innerText = "📂 Select Image";
            fileBtn.style.cssText = "width: 100%; padding: 10px; background: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;";

            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.style.display = 'none';
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    this.handleEnemyImageUpload(type, file);
                }
            };
            fileBtn.onclick = () => input.click();
            btnBox.appendChild(fileBtn);
            wrapper.appendChild(btnBox);
            wrapper.appendChild(input); // Hidden

            return wrapper;
        };

        grid.appendChild(createUploader('ground', '🦔 Ground Enemy (Walker)'));
        grid.appendChild(createUploader('air', '🦅 Air Enemy (Flyer)'));

        content.appendChild(grid);

        // Close
        const closeBtn = document.createElement('button');
        closeBtn.innerText = "Close";
        closeBtn.style.cssText = "margin-top: 15px; padding: 10px 40px; background: #95a5a6; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; align-self: center;";
        closeBtn.onclick = () => {
            modal.style.display = 'none';
            if (this.elements.debugRoomOverlay) {
                this.elements.debugRoomOverlay.style.display = 'flex';
                this.updateInputBlockState();
            }
        };
        content.appendChild(closeBtn);

        modal.appendChild(content);
        document.body.appendChild(modal);
        return modal;
    }

    handleEnemyImageUpload(type, file) { // type: 'ground' or 'air'
        const stage = this.currentConfigStage;
        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target.result;
            const customKey = `custom_st${stage}_${type}_${Date.now()}`; // Unique key

            // 1. Create Image and Register to Assets
            const newImg = new Image();
            newImg.src = dataUrl;
            this.game.assets.images[customKey] = newImg;

            // 2. Update Data
            this.enemyConfigData[stage][type] = customKey;
            this.enemyConfigData[stage][`${type}Name`] = file.name;

            // 3. Update UI
            const modal = document.getElementById('debug-enemy-config-modal');
            this.updateEnemyConfigUI(modal);

            // 4. Update Current Stage Logic immediately?
            if (this.game.stage === stage) {
                if (!this.game.currentStageConfig.enemies) this.game.currentStageConfig.enemies = {};
                this.game.currentStageConfig.enemies[type] = customKey;
                console.log(`[Debug] Applied enemy config for CURRENT stage ${stage}: ${type} -> ${customKey}`);
            }
        };
        reader.readAsDataURL(file);
    }

    exportEnemyConfigJSON() {
        if (!this.enemyConfigData || !this.initialEnemyConfigData) return;

        // Simplify for export, only including changes
        const exportData = {};
        let hasAnyChange = false;

        for (let i = 1; i <= 5; i++) {
            const current = this.enemyConfigData[i];
            const initial = this.initialEnemyConfigData[i];

            const stageChanges = {};
            let hasStageChange = false;

            if (current.ground !== initial.ground) {
                stageChanges.ground = current.groundName || current.ground;
                hasStageChange = true;
            }
            if (current.air !== initial.air) {
                stageChanges.air = current.airName || current.air;
                hasStageChange = true;
            }

            if (hasStageChange) {
                exportData[i] = stageChanges;
                hasAnyChange = true;
            }
        }

        if (!hasAnyChange) {
            alert("変更された画像はありません。");
            return;
        }

        const json = JSON.stringify(exportData, null, 4);
        const text = `各ステージの雑魚敵の変更\n\n\`\`\`json\n${json}\n\`\`\``;

        navigator.clipboard.writeText(text).then(() => {
            alert("設定をクリップボードにコピーしました！\n（各ステージの雑魚敵の変更）");
        }).catch(err => {
            console.error(err);
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
            const ts = game.tileSize;

            // 安全な着地点を探す: ボス手前の複数列を試行
            let safeX = targetX;
            let safeY = game.level.height - ts * 3;

            for (let colOffset = 0; colOffset >= -10; colOffset--) {
                const col = Math.floor((targetX + colOffset * ts) / ts);
                if (col < 0 || col >= game.level.cols) continue;

                // 下から上に探索して、地面の上の空間を見つける
                for (let row = game.level.rows - 1; row >= 1; row--) {
                    if (game.level.isSolid(col, row) && !game.level.isSolid(col, row - 1) && !game.level.isSolid(col, row - 2)) {
                        // row が地面、row-1 と row-2 が空き → 安全
                        safeX = col * ts;
                        safeY = row * ts - game.player.height - 1;
                        colOffset = -999; // 外側ループ脱出
                        break;
                    }
                }
            }

            game.player.x = safeX;
            game.player.y = safeY;
            game.player.vx = 0;
            game.player.vy = 0;
            game.player.lastSafeX = safeX;
            game.player.lastSafeY = safeY;
            game.camera.x = game.player.x - game.width / 2;
            game.state = 'PLAYING';
        }
    }

    // toggleGodMode は末尾に統合済み（domEffects通知+player.invincible付き）

    update(dt) {
        if (!this.enabled) return;

        // FPS計測
        this._fpsFrames++;
        this._fpsTime += dt;
        if (this._fpsTime >= 1.0) {
            this._fpsValue = Math.round(this._fpsFrames / this._fpsTime);
            this._fpsFrames = 0;
            this._fpsTime = 0;
        }

        // オートプレイ処理
        if (this.isAutoPlay) {
            this.updateAutoPlay(dt);
        }

        // フルオートデバッグ処理
        if (this.isFullAuto) {
            this.updateFullAuto(dt);
            this.updateTelemetry(dt);
        }

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

        // フルオートテレメトリオーバーレイ
        if (this.isFullAuto) {
            this.drawTelemetry();
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

    // ===== AutoPlay =====

    // タイルが固体かチェック (ヘルパー)
    _isSolid(level, col, row) {
        if (row < 0 || row >= level.rows || col < 0 || col >= level.cols) return false;
        const t = level.matrix[row]?.[col];
        return t === '#' || t === 'D' || t === 'B';
    }

    // 指定列の地面Y座標を探す (上から探索、見つからなければ-1)
    _findGroundRow(level, col, startRow, maxDepth) {
        for (let dy = 0; dy <= maxDepth; dy++) {
            const row = startRow + dy;
            if (this._isSolid(level, col, row)) return row;
        }
        return -1;
    }

    updateAutoPlay(dt) {
        const game = this.game;
        const player = game.player;
        const level = game.level;
        const input = game.input;

        if (!player || !level || !level.matrix) return;
        if (game.state !== 'PLAYING' && game.state !== 'BOSS_BATTLE') return;
        if (game.isPaused) return;

        if (this.autoPlayJumpCooldown > 0) this.autoPlayJumpCooldown -= dt;

        const ts = game.tileSize || 64;
        const cx = player.x + player.width / 2;
        const cy = player.y + player.height / 2;
        const bottom = player.y + player.height;
        const playerCol = Math.floor(cx / ts);
        const playerRow = Math.floor(bottom / ts);
        const speed = Math.abs(player.vx) || 300; // 現在の走行速度 (px/s)

        let shouldJump = false;
        let shouldGlide = false;
        let jumpReason = '';

        // ===== 1. 地形スキャン: 前方の穴・壁・段差を検知 =====

        // 速度に応じた先読み距離 (最低4タイル、速度に応じて最大10タイル)
        const lookTiles = Math.max(4, Math.min(10, Math.ceil(speed * 0.8 / ts)));

        // 前方の地面プロファイルを構築
        let gapStart = -1;    // 穴の開始位置 (タイル単位の前方距離)
        let gapWidth = 0;     // 穴の幅
        let wallDist = -1;    // 壁までの距離

        for (let i = 1; i <= lookTiles; i++) {
            const col = Math.floor((cx + i * ts) / ts);
            if (col >= level.cols) break;

            // 壁チェック: プレイヤーの体の高さ (2タイル分) に固体があるか
            const bodyTopRow = Math.floor(player.y / ts);
            const bodyMidRow = Math.floor(cy / ts);
            const bodyBotRow = playerRow;
            if (this._isSolid(level, col, bodyTopRow) || this._isSolid(level, col, bodyMidRow) || this._isSolid(level, col, bodyBotRow)) {
                if (wallDist < 0) wallDist = i;
            }

            // 穴チェック: 足元から下方向に8タイル分の地面を探す
            const groundRow = this._findGroundRow(level, col, playerRow, 8);
            if (groundRow < 0 && gapStart < 0) {
                gapStart = i;
            }
            if (gapStart >= 0 && groundRow < 0) {
                gapWidth = i - gapStart + 1;
            }
            if (gapStart >= 0 && groundRow >= 0) {
                break; // 穴の終わりを見つけた
            }
        }

        // ===== 2. ジャンプ判定 =====

        // 2a. 穴の回避
        if (gapStart >= 0) {
            if (gapStart <= 1) {
                // 穴が目の前: 即ジャンプ (地面でも空中でも)
                shouldJump = true;
                jumpReason = `gap_now(w=${gapWidth})`;
                shouldGlide = true; // 常にグライドで安全マージン
            } else if (gapStart <= 3 && player.grounded) {
                // 穴まで2-3タイル: 地面にいるなら即ジャンプ（ギリギリ手前）
                shouldJump = true;
                jumpReason = `gap_edge(w=${gapWidth},d=${gapStart})`;
                if (gapWidth >= 2) shouldGlide = true;
            } else if (gapStart <= 5 && player.grounded && gapWidth >= 3) {
                // 幅広い穴が近い: 早めジャンプ+グライド準備
                shouldJump = true;
                shouldGlide = true;
                jumpReason = `gap_wide(w=${gapWidth},d=${gapStart})`;
            }
        }

        // 2b. 壁の回避
        if (!shouldJump && wallDist > 0 && wallDist <= 3) {
            shouldJump = true;
            jumpReason = `wall(d=${wallDist})`;
        }

        // 2c. 敵の回避
        if (!shouldJump && game.enemies) {
            for (const enemy of game.enemies) {
                if (enemy.dead) continue;
                const dx = enemy.x - cx;
                const dy = enemy.y - cy;
                if (dx > 0 && dx < ts * 5 && Math.abs(dy) < ts * 3) {
                    shouldJump = true;
                    jumpReason = `enemy(d=${(dx/ts).toFixed(1)})`;
                    break;
                }
            }
        }

        // ===== 3. 空中制御 (穴越え最重要) =====

        if (!player.grounded) {
            // 前方と真下の地面を幅広く探索
            const belowGround = this._findGroundRow(level, playerCol, playerRow, 10);
            const fwd1Ground = this._findGroundRow(level, Math.floor((cx + ts) / ts), playerRow, 10);
            const fwd2Ground = this._findGroundRow(level, Math.floor((cx + ts * 2) / ts), playerRow, 10);
            const fwd3Ground = this._findGroundRow(level, Math.floor((cx + ts * 3) / ts), playerRow, 10);

            const overPit = belowGround < 0 && fwd1Ground < 0;
            const landingAhead = fwd2Ground >= 0 || fwd3Ground >= 0;

            // 3a. 穴の上で落下中 → 追加ジャンプで高度回復
            if (overPit && player.vy > 50 && player.jumpCount < player.maxJumps) {
                // 前方に着地点がないor遠い → ジャンプで延命
                if (!landingAhead || player.vy > 400) {
                    shouldJump = true;
                    jumpReason = 'air_save';
                }
            }

            // 3b. 穴の上で下降中 → グライドで距離を稼ぐ
            if (player.vy > 0) {
                if (overPit) {
                    shouldGlide = true; // 穴の上 → 常にグライド
                } else if (belowGround >= 0 && belowGround - playerRow <= 3) {
                    shouldGlide = false; // 着地間近 → グライド解除
                }
            }

            // 3c. 全ジャンプ使い切り + 穴の上 + 着地点なし → グライド必須
            if (overPit && player.jumpCount >= player.maxJumps) {
                shouldGlide = true;
            }
        }

        // ===== 4. ボス戦AI =====
        if (game.state === 'BOSS_BATTLE' && game.boss && !game.boss.defeated) {
            const boss = game.boss;

            // プロジェクタイル回避
            if (boss.projectiles) {
                for (const proj of boss.projectiles) {
                    const dx = proj.x - cx;
                    const dy = proj.y - cy;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < ts * 5 && (proj.vx === undefined || proj.vx < 0 || dx < 0)) {
                        shouldJump = true; jumpReason = 'projectile'; break;
                    }
                }
            }

            // 波動回避
            if (boss.waves) {
                for (const wave of boss.waves) {
                    const futureX = wave.x + (wave.vx || -800) * 0.3;
                    if (cx > Math.min(wave.x, futureX) - ts && cx < wave.x + (wave.width || 400) + ts) {
                        if (bottom > wave.y - ts && player.y < wave.y + (wave.height || 100) + ts) {
                            shouldJump = true; shouldGlide = true; jumpReason = 'wave'; break;
                        }
                    }
                }
            }

            // 床ハザード (CAST_FLOOR)
            if (boss.floorHazard && boss.floorHazard.active && player.grounded) {
                shouldJump = true; shouldGlide = true; jumpReason = 'floor_hazard';
            }

            // ToyPresents / Pills / VitalLasers / ScalpelDash
            const hazards = [
                ...(boss.toyPresents || []),
                ...(boss.pills || [])
            ];
            for (const h of hazards) {
                if (Math.abs((h.x || 0) - cx) < ts * 3 && Math.abs((h.y || 0) - cy) < ts * 3) {
                    shouldJump = true; jumpReason = 'hazard'; break;
                }
            }
            if (boss.vitalLasers) {
                for (const v of boss.vitalLasers) {
                    if (Math.abs(cy - (v.y || 0)) < ts * 1.5) { shouldJump = true; jumpReason = 'laser'; break; }
                }
            }
            if (boss.scalpelDash?.active && Math.abs(cy - boss.scalpelDash.y) < ts * 2) {
                shouldJump = true; jumpReason = 'scalpel';
            }

            // SPIN_DASH / SOUL_SCYTHE
            if (boss.state === 'SPIN_DASH' && !boss.isReturning) { shouldJump = true; shouldGlide = true; jumpReason = 'spin_dash'; }
            if (boss.state === 'SOUL_SCYTHE' && Math.abs(boss.x - cx) < ts * 5) { shouldJump = true; jumpReason = 'soul_scythe'; }
        }

        // ===== 5. 入力実行 =====
        const canJump = player.grounded || player.jumpCount < player.maxJumps;

        if (shouldJump && this.autoPlayJumpCooldown <= 0 && canJump) {
            input._pointerPressedCurrentFrame = true;
            input.pointerDown = true;
            // 地面ジャンプは即座に、空中ジャンプは少し待って高度を稼ぐ
            if (player.grounded) {
                this.autoPlayJumpCooldown = 0.03; // 地面: ほぼ即時
            } else {
                // 空中: 落下速度に応じてタイミング調整
                // 速く落ちてるなら即ジャンプ、ゆっくりなら少し待つ
                this.autoPlayJumpCooldown = player.vy > 300 ? 0.05 : 0.2;
            }
        } else if (shouldGlide && !player.grounded && player.vy > 0) {
            input.pointerDown = true; // グライド維持
        } else if (!shouldJump && !shouldGlide) {
            input.pointerDown = false;
        }
    }

    toggleAutoPlay() {
        this.isAutoPlay = !this.isAutoPlay;
        console.log(`[Debug] AutoPlay: ${this.isAutoPlay ? 'ON' : 'OFF'}`);
        this.updateAutoPlayButton();
        if (this.game.domEffects) {
            this.game.domEffects.spawn(
                this.isAutoPlay ? '🤖 AUTO PLAY: ON' : '🤖 AUTO PLAY: OFF',
                this.game.width / 2, this.game.height / 2,
                { color: this.isAutoPlay ? '#2ecc71' : '#e74c3c', size: 40, bold: true, screenSpace: true, life: 90 }
            );
        }
    }

    updateAutoPlayButton() {
        if (!this.elements.autoPlay) return;
        if (this.isAutoPlay) {
            this.elements.autoPlay.style.background = '#2ecc71';
            this.elements.autoPlay.innerText = '🤖 AUTO: ON';
        } else {
            this.elements.autoPlay.style.background = '#6c5ce7';
            this.elements.autoPlay.innerText = '🤖 オートプレイ';
        }
    }

    toggleGodMode() {
        this.isGodMode = !this.isGodMode;
        console.log(`[Debug] GodMode: ${this.isGodMode ? 'ON' : 'OFF'}`);
        this.updateGodModeButton();
        if (this.game.domEffects) {
            this.game.domEffects.spawn(
                this.isGodMode ? '🛡️ GOD MODE: ON' : '🛡️ GOD MODE: OFF',
                this.game.width / 2, this.game.height / 2,
                { color: this.isGodMode ? '#9b59b6' : '#f1c40f', size: 40, bold: true, screenSpace: true, life: 90 }
            );
        }
        if (this.game.player) this.game.player.invincible = this.isGodMode;
    }

    updateGodModeButton() {
        if (!this.elements.god) return;
        if (this.isGodMode) {
            this.elements.god.style.background = '#9b59b6';
            this.elements.god.innerText = '🛡️ 無敵: ON';
        } else {
            this.elements.god.style.background = '#fdcb6e';
            this.elements.god.innerText = '🛡️ 無敵モード';
        }
    }

    // ===== Full Auto Debug =====

    toggleFullAuto() {
        this.isFullAuto = !this.isFullAuto;
        console.log(`[FullAuto] ${this.isFullAuto ? 'ON' : 'OFF'}`);

        if (this.isFullAuto) {
            if (!this.isAutoPlay) this.toggleAutoPlay();
            if (!this.isGodMode) this.toggleGodMode();

            // デバッグメニューを閉じて画面を見やすくする
            if (this.elements.menu) this.elements.menu.style.display = 'none';

            this._savedScore = this.game.score;
            this._fullAutoStartTime = Date.now();
            this._fullAutoErrors = 0;
            this.fullAutoLog = [];
            this._stateTransitions = [];
            this._lastTrackedState = null;
            this._asyncBusy = false;
            this._bossSkillLog = {};
            this._lastBossState = null;
            this._bossSkillAnomalies = [];

            this._errorHandler = (e) => {
                this._fullAutoErrors++;
                this.fullAutoLog.push({ type: 'error', time: Date.now(), message: e.message || String(e) });
            };
            this._rejectionHandler = (e) => {
                this._fullAutoErrors++;
                this.fullAutoLog.push({ type: 'rejection', time: Date.now(), message: e.reason?.message || String(e.reason) });
            };
            window.addEventListener('error', this._errorHandler);
            window.addEventListener('unhandledrejection', this._rejectionHandler);
        } else {
            if (this._errorHandler) { window.removeEventListener('error', this._errorHandler); this._errorHandler = null; }
            if (this._rejectionHandler) { window.removeEventListener('unhandledrejection', this._rejectionHandler); this._rejectionHandler = null; }
            // デバッグメニュー復帰
            if (this.elements.menu) this.elements.menu.style.display = '';

            if (this.fullAutoLog.length > 0) console.log('[FullAuto] Telemetry Log:', JSON.stringify(this.fullAutoLog, null, 2));
            if (this._stateTransitions.length > 0) console.log('[FullAuto] State Transitions:', this._stateTransitions);
            if (Object.keys(this._bossSkillLog).length > 0) console.log('[FullAuto] Boss Skill Log:', JSON.stringify(this._bossSkillLog, null, 2));
            if (this._bossSkillAnomalies.length > 0) console.warn('[FullAuto] Boss Skill ANOMALIES:', this._bossSkillAnomalies);
        }

        this.updateFullAutoButton();
        if (this.game.domEffects) {
            this.game.domEffects.spawn(
                this.isFullAuto ? '🔄 FULL AUTO: ON' : '🔄 FULL AUTO: OFF',
                this.game.width / 2, this.game.height / 2,
                { color: this.isFullAuto ? '#2ecc71' : '#e17055', size: 40, bold: true, screenSpace: true, life: 90 }
            );
        }
    }

    updateFullAutoButton() {
        if (!this.elements.fullAuto) return;
        if (this.isFullAuto) {
            this.elements.fullAuto.style.background = '#2ecc71';
            this.elements.fullAuto.innerText = '🔄 FULL AUTO: ON';
        } else {
            this.elements.fullAuto.style.background = '#e17055';
            this.elements.fullAuto.innerText = '🔄 フルオート';
        }
    }

    updateFullAuto(dt) {
        const game = this.game;

        // 状態遷移トラッキング
        const currentState = game.gameWon ? `${game.state}(WON)` : game.state;
        if (currentState !== this._lastTrackedState) {
            this._stateTransitions.push({ state: currentState, time: Date.now(), stage: game.stage });
            this._lastTrackedState = currentState;
            console.log(`[FullAuto] State: ${currentState} (Stage ${game.stage})`);
        }

        if (game.state === 'WAIT_FOR_INPUT') { window.dispatchEvent(new Event('click')); return; }

        if (game.state === 'HOME') {
            if (!this._asyncBusy) {
                this._asyncBusy = true;
                game.startGame().then(() => { this._asyncBusy = false; }).catch(e => { console.error('[FullAuto] startGame failed:', e); this._asyncBusy = false; });
            }
            return;
        }

        if (game.state === 'STAGE_INTRO') { game.introTimer = 3.0; return; }

        // 会話自動スキップ (全状態共通)
        if (game.dialogueManager && game.dialogueManager.active) {
            this._dialogueAdvanceTimer += dt;
            if (this._dialogueAdvanceTimer >= 0.15) {
                this._dialogueAdvanceTimer = 0;
                game.dialogueManager.onInteract();
            }
            return;
        }

        if (game.state === 'PLAYING') {
            // 落下ループ検知: 短時間に多数のRESPAWNが発生した場合はボスまでワープ
            if (!this._respawnCount) this._respawnCount = 0;
            if (!this._lastRespawnCheck) this._lastRespawnCheck = Date.now();

            // 30秒ごとにリセット
            if (Date.now() - this._lastRespawnCheck > 30000) {
                this._respawnCount = 0;
                this._lastRespawnCheck = Date.now();
            }
            return;
        }

        // RESPAWNING: カウント追跡 → 多すぎたらボスワープ
        if (game.state === 'RESPAWNING') {
            this._respawnCount = (this._respawnCount || 0) + 1;
            if (this._respawnCount > 30) {
                console.log('[FullAuto] Too many respawns, warping to boss...');
                this._respawnCount = 0;
                // 既存のwarpToBossを利用 (状態をPLAYINGにしてからワープ)
                game.state = 'PLAYING';
                if (game.player) {
                    game.player.vx = 0;
                    game.player.vy = 0;
                    game.damageCooldown = 3.0;
                }
                this.warpToBoss();
            }
            return;
        }

        if (game.state === 'LOADING_STAGE') return; // 非同期ロード待ち

        if (game.state === 'BOSS_BATTLE') {
            const boss = game.boss;
            const bossSection = game.bossEncounter;
            if (!boss || boss.defeated) {
                // ボス撃破時: スキル検証レポート出力
                if (boss && boss.defeated && !this._bossReportDone) {
                    this._bossReportDone = true;
                    this._reportBossSkills(game.stage);
                }
                return;
            }
            this._bossReportDone = false;
            if (bossSection && (bossSection.phase === 'WARNING' || bossSection.phase === 'APPEAR')) return;
            if (game.isPaused) return;

            // ===== ボススキル検証ログ =====
            this._trackBossSkill(game.stage, boss);

            // バリア未破壊: 自然にキャロット収集してバリア破壊を待つ（強制破壊しない）
            if (bossSection && bossSection.phase === 'FIGHT' && !bossSection.isVulnPhase) {
                // オートプレイがキャロット収集 → 自然にスコア蓄積 → バリア破壊
                return;
            }

            // バリア破壊後: 全スキル発動確認してからHP削減
            if (!boss.isInvulnerable && boss.hp > 0) {
                const primarySkills = this._getPrimarySkills(game.stage);
                const stageKey = `stage${game.stage}`;
                const log = this._bossSkillLog[stageKey] || [];
                const usedSkills = new Set(log.map(e => e.skill));

                const allFired = primarySkills.every(s => usedSkills.has(s));

                if (!allFired) {
                    if (!this._bossWaitStart) this._bossWaitStart = Date.now();
                    const waited = (Date.now() - this._bossWaitStart) / 1000;
                    if (waited > 90) {
                        // 90秒タイムアウト: 確率の低いスキルは諦めて撃破
                        const missing = primarySkills.filter(s => !usedSkills.has(s));
                        console.warn(`[FullAuto] Timeout (${waited.toFixed(0)}s). Missing: [${missing.join(', ')}] — proceeding with HP drain`);
                        this._bossSkillAnomalies.push(`Stage ${game.stage}: Skills not fired after ${waited.toFixed(0)}s: [${missing.join(', ')}]`);
                    } else {
                        return; // スキル待ち
                    }
                } else if (!this._allSkillsConfirmed) {
                    this._allSkillsConfirmed = true;
                    this._bossWaitStart = null;
                    console.log(`[FullAuto] ✓ All ${primarySkills.length} boss skills confirmed for Stage ${game.stage}! Starting HP drain.`);
                }

                this._bossHpTimer += dt;
                if (this._bossHpTimer >= 0.3) {
                    this._bossHpTimer = 0;
                    boss.hp -= 1;
                    boss.flashTime = 0.3;
                    console.log(`[FullAuto] Boss HP: ${boss.hp}/${boss.maxHp}`);
                    if (boss.hp <= 0) {
                        boss.hp = 0;
                        if (typeof boss.die === 'function') boss.die();
                        else boss.defeated = true;
                        this._allSkillsConfirmed = false;
                        this._bossWaitStart = null;
                    }
                }
            }
            return;
        }

        if (game.gameWon && game.state !== 'ENDING') {
            this._resultSkipTimer += dt;
            if (game.resultSection && game.resultSection.phase === 'WAIT') {
                if (this._resultSkipTimer >= 0.5 && !this._asyncBusy) {
                    this._resultSkipTimer = 0;
                    this._asyncBusy = true;
                    game.resultSection.reset();
                    game.nextStage().then(() => { this._asyncBusy = false; }).catch(e => { console.error('[FullAuto] nextStage failed:', e); this._asyncBusy = false; });
                }
            } else if (game.resultSection) {
                game.resultSection.timer += dt * 3;
            }
            return;
        }

        if (game.state === 'ENDING') {
            this._endingAdvanceTimer += dt;
            if (this._endingAdvanceTimer >= 0.5) {
                this._endingAdvanceTimer = 0;
                game.input._pointerPressedCurrentFrame = true;
                game.input.pointerDown = true;
            }
            if (game.endingSection && game.endingSection.state === 'FINISHED') {
                console.log('[FullAuto] Ending finished. Full auto complete!');
                this.toggleFullAuto();
            }
            return;
        }
    }

    // ボスの攻撃状態を追跡
    _trackBossSkill(stage, boss) {
        const stageKey = `stage${stage}`;
        if (!this._bossSkillLog[stageKey]) this._bossSkillLog[stageKey] = [];

        const bossState = boss.state;
        // 攻撃状態のみ記録 (IDLE, BATTLE, HURT, DEAD, WAIT は除外)
        const nonAttackStates = ['IDLE', 'BATTLE', 'HURT', 'DEAD', 'WAIT', 'BATTLE_MOVE', 'ATTACK'];
        if (nonAttackStates.includes(bossState)) {
            this._lastBossState = bossState;
            return;
        }

        // 新しい攻撃状態への遷移を検知
        if (bossState !== this._lastBossState) {
            this._lastBossState = bossState;
            const entry = { skill: bossState, time: Date.now(), hp: boss.hp, maxHp: boss.maxHp };
            this._bossSkillLog[stageKey].push(entry);
            console.log(`[BossSkill] Stage ${stage}: ${bossState} (HP: ${boss.hp}/${boss.maxHp})`);
        }
    }

    // ボス撃破時にスキル検証レポートを出力
    _reportBossSkills(stage) {
        const stageKey = `stage${stage}`;
        const log = this._bossSkillLog[stageKey] || [];

        // StageConfigから期待されるスキルを取得
        const expectedSkills = this._getExpectedSkills(stage);

        // 実際に使用されたスキルを集計
        const usedSkills = {};
        for (const entry of log) {
            usedSkills[entry.skill] = (usedSkills[entry.skill] || 0) + 1;
        }

        console.log(`\n===== [BossSkill Report] Stage ${stage} =====`);
        console.log(`Expected skills: [${expectedSkills.join(', ')}]`);
        console.log(`Used skills:`, usedSkills);
        console.log(`Total attacks: ${log.length}`);

        // 異常検知: 期待されるスキルが一度も使われていない
        const missingSkills = expectedSkills.filter(s => !usedSkills[s]);
        if (missingSkills.length > 0) {
            const msg = `Stage ${stage}: Missing expected skills: [${missingSkills.join(', ')}]`;
            console.warn(`[BossSkill ANOMALY] ${msg}`);
            this._bossSkillAnomalies.push(msg);
        }

        // 異常検知: 定義にないスキルが使われている
        const unexpectedSkills = Object.keys(usedSkills).filter(s => !expectedSkills.includes(s));
        if (unexpectedSkills.length > 0) {
            const msg = `Stage ${stage}: Unexpected skills used: [${unexpectedSkills.join(', ')}]`;
            console.warn(`[BossSkill ANOMALY] ${msg}`);
            this._bossSkillAnomalies.push(msg);
        }

        // 正常
        if (missingSkills.length === 0 && unexpectedSkills.length === 0) {
            console.log(`[BossSkill] Stage ${stage}: All skills OK ✓`);
        }

        console.log(`==========================================\n`);
    }

    // StageConfigからボスのトリガースキル (attackPoolに定義された親スキル) を取得
    _getPrimarySkills(stage) {
        const configs = {
            1: ['SPIN_PREP'],                 // SPIN_DASH等はSPIN_PREPから自動遷移
            2: ['CAST_WAVE', 'CAST_FLOOR'],
            3: ['TOY_MARCH', 'TOY_BOUNCE'],
            4: ['VITAL_CHECK_PREP', 'VACCINE_RAIN', 'TOY_BOUNCE', 'PILL_BARRAGE'],
            5: ['JUDGMENT_RAY', 'GOD_LASER', 'SOUL_SCYTHE']
        };
        return configs[stage] || [];
    }

    // StageConfigからボスの全スキル (サブ状態含む) を取得
    _getExpectedSkills(stage) {
        const stageConfigs = {
            1: ['SPIN_PREP', 'SPIN_DASH', 'SPIN_OFFSCREEN', 'SPIN_RECOVER'],
            2: ['CAST_WAVE', 'CAST_FLOOR'],
            3: ['TOY_MARCH', 'TOY_BOUNCE'],
            4: ['VITAL_CHECK_PREP', 'VITAL_CHECK_FIRE', 'VACCINE_RAIN', 'TOY_BOUNCE', 'PILL_BARRAGE'],
            5: ['JUDGMENT_RAY', 'GOD_LASER', 'SOUL_SCYTHE']
        };
        return stageConfigs[stage] || [];
    }

    updateTelemetry(dt) {
        this._telemetryTimer += dt;
        if (this._telemetryTimer < 0.5) return;
        this._telemetryTimer = 0;

        const game = this.game;
        this.fullAutoLog.push({
            timestamp: Date.now(), state: game.state, stage: game.stage,
            fps: this._fpsValue,
            particles: (game.env ? game.env.particles.length : 0) + (game.player ? game.player.particles.length : 0),
            enemies: game.enemies ? game.enemies.length : 0,
            domEffects: game.domEffects ? game.domEffects.effects.length : 0,
            memory: (performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576 * 10) / 10 : null),
            playerX: game.player ? Math.round(game.player.x) : 0
        });
        if (this.fullAutoLog.length > 600) this.fullAutoLog.shift();
    }

    drawTelemetry() {
        const ctx = this.ctx;
        const game = this.game;
        const x = game.width - 280;
        const y = 10;
        const lineH = 18;
        const pad = 10;

        const elapsed = Math.floor((Date.now() - this._fullAutoStartTime) / 1000);
        const min = String(Math.floor(elapsed / 60)).padStart(2, '0');
        const sec = String(elapsed % 60).padStart(2, '0');

        const particleCount = (game.env ? game.env.particles.length : 0) + (game.player ? game.player.particles.length : 0);
        const maxParticles = ('ontouchstart' in window) ? 70 : 300;
        const memoryMB = performance.memory ? (performance.memory.usedJSHeapSize / 1048576).toFixed(1) : 'N/A';
        const domFxCount = game.domEffects ? game.domEffects.effects.length : 0;
        const maxDomFx = ('ontouchstart' in window) ? 10 : 50;

        const lines = [
            'FULL AUTO DEBUG',
            `FPS: ${this._fpsValue}  Stage: ${game.stage}`,
            `State: ${game.state}${game.gameWon ? ' (WON)' : ''}`,
            `Particles: ${particleCount}/${maxParticles}`,
            `DOM Effects: ${domFxCount}/${maxDomFx}`,
            `Memory: ${memoryMB} MB`,
            `Elapsed: ${min}:${sec}`,
            `Errors: ${this._fullAutoErrors}`,
            `Skill Anomalies: ${this._bossSkillAnomalies.length}`
        ];

        const boxH = lines.length * lineH + pad * 2;
        const boxW = 260;

        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(x, y, boxW, boxH);
        ctx.strokeStyle = '#2ecc71';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, boxW, boxH);

        ctx.font = '14px monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        for (let i = 0; i < lines.length; i++) {
            ctx.fillStyle = i === 0 ? '#2ecc71' : '#ffffff';
            ctx.font = i === 0 ? 'bold 14px monospace' : '13px monospace';
            if (i >= lines.length - 2 && (this._fullAutoErrors > 0 || this._bossSkillAnomalies.length > 0)) {
                if (i === lines.length - 2 && this._fullAutoErrors > 0) ctx.fillStyle = '#e74c3c';
                if (i === lines.length - 1 && this._bossSkillAnomalies.length > 0) ctx.fillStyle = '#e74c3c';
            }
            if (i === 1 && this._fpsValue < 30) ctx.fillStyle = '#f39c12';
            ctx.fillText(lines[i], x + pad, y + pad + i * lineH);
        }
        ctx.restore();
    }
}
