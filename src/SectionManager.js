/**
 * セクション管理システム
 * 各機能モジュールを疎結合に保ち、一つのエラーが全体を停止させるのを防ぎます。
 */
export class SectionManager {
    constructor(game) {
        this.game = game;
        this.sections = new Map();
        this.errorCounts = new Map();
        this.maxErrors = 3; // 連続エラーの許容回数
    }

    /**
     * セクションを登録する
     * @param {string} name セクション名
     * @param {Object} module 実行するオブジェクト
     */
    register(name, module) {
        this.sections.set(name, module);
        this.errorCounts.set(name, 0);
        console.log(`Section [${name}] registered.`);
    }

    /**
     * セクションの処理を安全に実行する
     * @param {string} name セクション名
     * @param {string} methodName 実行するメソッド名
     * @param  {...any} args 引数
     */
    run(name, methodName, ...args) {
        const module = this.sections.get(name);
        if (!module || typeof module[methodName] !== 'function') return null;

        if (this.errorCounts.get(name) >= this.maxErrors) {
            // エラーが多すぎる場合は、そのセクションをスキップ（または簡易復帰）
            return null;
        }

        try {
            const result = module[methodName](...args);
            this.errorCounts.set(name, 0); // 成功したらエラーカウントをリセット
            return result;
        } catch (error) {
            const count = this.errorCounts.get(name) + 1;
            this.errorCounts.set(name, count);

            console.error(`Error in Section [${name}.${methodName}] (Fail count: ${count}):`, error);

            if (count >= this.maxErrors) {
                console.warn(`Section [${name}] disabled due to repeated failures.`);
            }

            // 各セクション固有のリカバリ処理があれば実行
            if (typeof module.onSectionError === 'function') {
                module.onSectionError(methodName, error);
            }

            return null;
        }
    }

    /**
     * 指定したメソッドを持つ全セクションを実行する（例：update, draw）
     */
    runAll(methodName, ...args) {
        for (const name of this.sections.keys()) {
            this.run(name, methodName, ...args);
        }
    }
}
