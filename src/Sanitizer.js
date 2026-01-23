// ファイル名やIDを安全な形式（英数字とアンダースコアのみ）に変換するユーティリティ
export class Sanitizer {
    /**
     * 文字列を安全なID形式に変換する
     * 日本語文字などは16進数エンコードまたはハッシュ化される
     */
    static toSafeId(str) {
        if (!str) return 'id_' + Math.random().toString(36).substr(2, 9);

        // 英数字とアンダースコア以外を置換
        // 日本語が含まれる場合は、その部分を文字コードの組み合わせに変換
        let safe = str.replace(/[^\w]/g, (char) => {
            return '_' + char.charCodeAt(0).toString(16);
        });

        // 先頭が数字の場合はプレフィックスを付ける
        if (/^[0-9]/.test(safe)) {
            safe = 'char_' + safe;
        }

        return safe.toLowerCase();
    }

    /**
     * ファイルパスを安全にする（ディレクトリ名は維持し、ファイル名部分をサニタイズ）
     */
    static toSafeFileName(filePath) {
        if (!filePath) return 'unknown_file';

        const parts = filePath.split('/');
        const fileName = parts.pop();
        const extensionMatch = fileName.match(/\.[^.]+$/);
        const extension = extensionMatch ? extensionMatch[0] : '';
        const baseName = extensionMatch ? fileName.slice(0, -extension.length) : fileName;

        const safeBaseName = baseName.replace(/[^\w]/g, (char) => {
            return char.charCodeAt(0).toString(16);
        });

        parts.push(safeBaseName + extension);
        return parts.join('/');
    }
}
