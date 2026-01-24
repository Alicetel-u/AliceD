import fs from 'fs';
import path from 'path';

const srcDir = 'src';

function processFiles(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            processFiles(fullPath);
        } else if (entry.name.endsWith('.js')) {
            // 元のファイルがどのようなエンコーディングでも対応できるようにBufferで読み込む
            const buffer = fs.readFileSync(fullPath);

            // UTF-8として文字列化して置換
            // 元のファイルが真っ当なバックアップであれば、UTF-8（BOMあり/なし）のはず
            let content = buffer.toString('utf8');

            // 念のため、文字化けしたような痕跡がないかチェック（ヌル文字などが混じっていないか）
            if (content.includes('\u0000')) {
                // UTF-16LEの可能性を考慮
                content = buffer.toString('utf16le');
            }

            // 画像拡張子の置換
            const newContent = content.replace(/\.png/g, '.webp');

            if (content !== newContent) {
                console.log(`Updated paths in: ${fullPath}`);
                // UTF-8 (BOMなし) で書き出し
                fs.writeFileSync(fullPath, newContent, 'utf8');
            }
        }
    }
}

console.log('Restoring image paths in source code safely...');
processFiles(srcDir);
console.log('Restore complete.');
