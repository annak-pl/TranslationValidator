const fs = require("fs");

if (process.argv.length < 4) {
    console.error(
        "Usage: node mergeTranslations.js <placeholder> <translation> <langFile1> [langFile2 ...]"
    );
    process.exit(1); 3
}

const [, , placeholderPath, translationPath, ...langPaths] = process.argv;

/* ------------------ helpers ------------------ */

function parseBlocks(text) {
    return text
        .split(/(?=^\/say )/m)
        .map((b) => b.trim())
        .filter(Boolean);
}

function parseBlock(blockText) {
    const lines = blockText.split("\n");

    const say = lines[0];
    const original = lines[1];

    const langs = {};

    for (let i = 2; i < lines.length; i++) {
        const m = lines[i].match(/^([A-Z]{2}):\s*(.*)$/);
        if (m) langs[m[1]] = m[2];
    }

    return { say, original, langs };
}

function buildBlock(block) {
    const order = ["EN", "DE", "ES", "CN"];

    const out = [block.say, block.original];

    for (const lang of order) {
        out.push(`${lang}: ${block.langs[lang] || "MISSING TRANSLATION"}`);
    }

    return out.join("\n");
}

function parseLangFile(path) {
    const text = fs.readFileSync(path, "utf8");

    const matches = [...text.matchAll(/^([A-Z]{2}):\s*(.*)$/gm)];

    const result = {};

    for (const m of matches) {
        const lang = m[1];
        const line = m[2];

        if (!result[lang]) result[lang] = [];
        result[lang].push(line);
    }

    return result;
}

/* ------------------ load base ------------------ */

let blocks;

if (fs.existsSync(translationPath)) {
    const existing = fs.readFileSync(translationPath, "utf8");
    blocks = parseBlocks(existing).map(parseBlock);
} else {
    const placeholder = fs.readFileSync(placeholderPath, "utf8");
    blocks = parseBlocks(placeholder).map(parseBlock);
}

/* ------------------ load langs ------------------ */

const langMap = {};

for (const path of langPaths) {
    const parsed = parseLangFile(path);

    for (const [lang, lines] of Object.entries(parsed)) {
        if (!langMap[lang]) langMap[lang] = [];
        langMap[lang].push(...lines);
    }
}

/* ------------------ merge ------------------ */

for (const [lang, lines] of Object.entries(langMap)) {
    lines.forEach((text, idx) => {
        const block = blocks[idx];

        if (!block) {
            console.warn(
                `[WARN] ${lang} extra line #${idx + 1}: "${text}"`
            );
            return;
        }

        if (!block.langs[lang] || block.langs[lang] === "MISSING TRANSLATION") {
            block.langs[lang] = text;
        }
    });

    if (lines.length > blocks.length) {
        console.warn(
            `[WARN] ${lang} file has ${lines.length - blocks.length} extra lines`
        );
    }
}

/* ------------------ write ------------------ */

const finalText = blocks.map(buildBlock).join("\n\n");

fs.writeFileSync(translationPath, finalText, "utf8");

console.log("Merge complete →", translationPath);
