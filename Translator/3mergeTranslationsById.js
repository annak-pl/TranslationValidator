const fs = require("fs");
const path = require("path");

if (process.argv.length < 4) {
    console.error(
        "Usage: node mergeTranslationsById.js <translation.txt> <langFile.txt>"
    );
    process.exit(1);
}

const [, , translationPath, langPath] = process.argv;

// ---------------- HELPERS ----------------

function parseBlocks(text) {
    const rawBlocks = text.split(/\n\s*\n/).map(b => b.trim()).filter(Boolean);
    return rawBlocks.map(block => {
        const lines = block.split("\n");
        const idLine = lines.find(l => l.startsWith("ID:"));
        const id = idLine ? idLine.replace("ID:", "").trim() : null;

        const sayLine = lines.find(l => l.startsWith("/say") || l.startsWith("/choice"));
        const langs = {};
        lines.forEach(l => {
            const m = l.match(/^([A-Z]{2}):\s*(.*)$/);
            if (m) langs[m[1]] = m[2];
        });

        return { id, sayLine, langs, rawLines: lines };
    });
}

function buildBlock(block) {
    const { id, sayLine, langs } = block;
    const langOrder = ["RUS", "EN", "DE", "ES", "CN"]; // keep RUS first
    const out = [];
    if (id) out.push(`ID: ${id}`);
    if (sayLine) out.push(sayLine);
    for (const lang of langOrder) {
        if (lang in langs) out.push(`${lang}: ${langs[lang]}`);
    }
    return out.join("\n");
}

// ---------------- LOAD FILES ----------------

const translationText = fs.existsSync(translationPath)
    ? fs.readFileSync(translationPath, "utf8")
    : fs.readFileSync("russian_lines.txt", "utf8");

const langText = fs.readFileSync(langPath, "utf8");

// ---------------- PARSE ----------------

const translationBlocks = parseBlocks(translationText);

const langLines = langText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

let pendingLangEntries = [];
let currentId = null;

const unknownIds = new Set();
const duplicates = new Set();
const mergedCount = {};

// ---------------- PARSE LANG FILE ----------------

for (let i = 0; i < langLines.length; i++) {
    const line = langLines[i];

    if (line.startsWith("ID:")) {
        // flush previous pending lines
        pendingLangEntries.forEach(entry => {
            const block = translationBlocks.find(b => b.id === currentId);
            if (!block) {
                unknownIds.add(currentId);
                return;
            }

            if (!block.langs[entry.lang]) {
                block.langs[entry.lang] = entry.text;
                mergedCount[entry.lang] = (mergedCount[entry.lang] || 0) + 1;
            } else {
                // Already exists, do not overwrite
            }
        });

        currentId = line.replace("ID:", "").trim();
        pendingLangEntries = [];
    } else {
        const m = line.match(/^([A-Z]{2}):\s*(.*)$/);
        if (m) {
            const lang = m[1];
            const text = m[2];
            const key = `${currentId}-${lang}`;

            if (pendingLangEntries.some(e => e.key === key)) {
                duplicates.add(key);
            } else {
                pendingLangEntries.push({ key, lang, text });
            }
        }
    }
}

// flush last pending
pendingLangEntries.forEach(entry => {
    const block = translationBlocks.find(b => b.id === currentId);
    if (!block) {
        unknownIds.add(currentId);
        return;
    }
    if (!block.langs[entry.lang]) {
        block.langs[entry.lang] = entry.text;
        mergedCount[entry.lang] = (mergedCount[entry.lang] || 0) + 1;
    }
});

// ---------------- WRITE BACK ----------------

const finalText = translationBlocks.map(buildBlock).join("\n\n");
fs.writeFileSync(translationPath, finalText, "utf8");

// ---------------- LOG ----------------

console.log(`✅ Merge complete into ${translationPath}`);
console.log("ℹ️ Merged lines per language:", mergedCount);

if (unknownIds.size > 0) {
    console.warn("⚠️ Unknown IDs (not in translation file):", Array.from(unknownIds));
}

if (duplicates.size > 0) {
    console.warn("⚠️ Duplicate ID+Lang entries in language file:", Array.from(duplicates));
}

