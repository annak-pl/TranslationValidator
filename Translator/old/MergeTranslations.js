// mergeSequential.js
// -------------------------------------------------------------
// PURPOSE:
//   Merge translated text (EN) line-by-line by order of appearance,
//   not by command keys, since /say etc. can repeat.
//   Keeps structure identical and replaces only EN: placeholders.
//
// USAGE:
//   node mergeSequential.js TeamReconciliationRusShort_Placeholder.script english_lines.txt TeamReconciliationRusShort_Translated.script
// -------------------------------------------------------------

const fs = require("fs");

const [, , baseFile, translationFile, outFile] = process.argv;
if (!baseFile || !translationFile || !outFile) {
    console.error("Usage: node mergeSequential.js TeamReconciliationRusShort_Placeholder.script english_lines.txt TeamReconciliationRusShort_Translated.script");
    process.exit(1);
}

// --- Load and split both files ---
const baseLines = fs.readFileSync(baseFile, "utf8").split(/\r?\n/);
const transLines = fs.readFileSync(translationFile, "utf8").split(/\r?\n/);

// --- Collect all translation texts in order ---
const translatedTexts = [];
for (let line of transLines) {
    line = line.trim();
    if (line.startsWith("EN:")) {
        const text = line.replace(/^EN:\s*/, "");
        translatedTexts.push(text);
    }
}

// --- Merge by sequential order ---
let merged = [];
let index = 0;

for (const line of baseLines) {
    if (line.trim().startsWith("EN:")) {
        const nextTranslation = translatedTexts[index] || "";
        merged.push(`EN: ${nextTranslation}`);
        index++;
    } else {
        merged.push(line);
    }
}

// --- Write merged script ---
fs.writeFileSync(outFile, merged.join("\n"), "utf8");
console.log(`✅ Sequentially merged script written to ${outFile}`);
console.log(`Replaced ${index} EN: lines with translated text.`);
