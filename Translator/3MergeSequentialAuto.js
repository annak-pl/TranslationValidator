// mergeSequentialAuto.js
// -------------------------------------------------------------
// PURPOSE:
//   Merge translated text line-by-line by order of appearance.
//   Automatically detects language from input translation file name.
//   Replaces only the correct language placeholders in the base file.
//
// USAGE:
//   node mergeSequentialAuto.js BasePlaceholder.script english_lines.txt MergedOutput.script

//node 3MergeSequentialAuto.js ../Translator/TestRun1/Start_2_Fiona_Celeste_Placeholder.script german_lines.txt ../Translator/TestRun1/Start_2_Fiona_Celeste_Translated.script
// -------------------------------------------------------------

const fs = require("fs");
const path = require("path");

const [, , baseFile, translationFile, outFile] = process.argv;
if (!baseFile || !translationFile || !outFile) {
    console.error("Usage: node mergeSequentialAuto.js BasePlaceholder.script <translation_file> MergedOutput.script");
    process.exit(1);
}

// --- Detect language from translation file name ---
const langMap = { en: "EN", english: "EN", de: "DE", german: "DE", es: "ES", spanish: "ES", cn: "CN", chinese: "CN" };
const fileNameLower = path.basename(translationFile).toLowerCase();
let langKey = null;

for (const key in langMap) {
    if (fileNameLower.includes(key)) {
        langKey = langMap[key];
        break;
    }
}

if (!langKey) {
    console.error(`❌ Cannot detect language from file name: ${translationFile}`);
    process.exit(1);
}

// --- Load and split both files ---
const baseLines = fs.readFileSync(baseFile, "utf8").split(/\r?\n/);
const transLines = fs.readFileSync(translationFile, "utf8").split(/\r?\n/);

// --- Collect all translations for the detected language ---
const translations = [];
for (const line of transLines) {
    const trimmed = line.trim();
    if (trimmed.startsWith(`${langKey}:`)) {
        translations.push(trimmed.replace(new RegExp(`^${langKey}:\\s*`), ""));
    }
}

// --- Merge into base ---
let merged = [];
let transIndex = 0;

for (const line of baseLines) {
    const trimmed = line.trim();

    // If the line is a placeholder for the current language
    if (trimmed.startsWith(`${langKey}:`)) {
        const currentText = line.replace(new RegExp(`^${langKey}:\\s*`), "");
        if (!currentText) {
            // Only fill if empty
            const nextTranslation = translations[transIndex] || "";
            merged.push(`${langKey}: ${nextTranslation}`);
            transIndex++;
        } else {
            // Keep existing translation
            merged.push(line);
        }
    } else {
        // Keep all other lines (RUS, other languages, commands)
        merged.push(line);
    }
}

// --- Write output ---
// Create file if it doesn't exist, or overwrite safely (you could also append, but overwriting ensures alignment)
fs.writeFileSync(outFile, merged.join("\n"), "utf8");

console.log(`✅ Merged ${transIndex} lines into ${langKey}: placeholders in ${outFile}`);
console.log(`Replaced ${transIndex} ${langKey}: lines with translated text.`);
