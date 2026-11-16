const fs = require('fs');
const path = require('path');

const terserOptions = { format: { ascii_only: true } };

function toOutput(result) {
    return {
        code: result.code,
        map: null,
    };
}

function saveUnminified(code, outputOptions) {
    if (!outputOptions || !outputOptions.file) {
        return;
    }
    let root = process.cwd();
    while (
        root !== path.dirname(root) &&
        !fs.existsSync(path.join(root, 'kits', 'matrix.json'))
    ) {
        root = path.dirname(root);
    }
    if (!fs.existsSync(path.join(root, 'kits', 'matrix.json'))) {
        return;
    }
    const rel = path.relative(root, path.resolve(outputOptions.file));
    const out = path.join(root, 'cdn-minifier-input', `${rel}.unminified`);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, code);
}

export const saveUnminifiedPlugin = {
    name: 'save-unminified',
    renderChunk(code, _chunk, outputOptions) {
        saveUnminified(code, outputOptions);
        return null;
    },
};

export const terserPlugin = {
    name: 'terser',
    renderChunk(code, _chunk, outputOptions) {
        saveUnminified(code, outputOptions);
        const paths = [process.cwd(), __dirname];
        const terserPath = require.resolve('terser', { paths });
        const { minify } = require(terserPath);
        return minify(code, terserOptions).then(toOutput);
    },
};

export default terserPlugin;
