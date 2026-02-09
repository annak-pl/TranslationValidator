// PURPOSE:
//   Create a copy of the input script where every Russian text line
//   (non-comment) is followed by empty translation placeholders.
//
//   The original file remains unchanged.
// USAGE:
//   node 2AddPlaceholders.js ../Translator/TestRun1/Start_2_Fiona_Celeste.script
// -------------------------------------------------------------

const fs = require("fs");

const inputFile = process.argv[2];
if (!inputFile) {
    console.error("Usage: node 2AddPlaceholders.js ../Translator/TestRun1/Start_2_Fiona_Celeste.script");
    process.exit(1);
}

const text = fs.readFileSync(inputFile, "utf8");
const lines = text.split(/\r?\n/);

// Output file (copy)
const outputFile = inputFile.replace(/(\.\w+)?$/, "_Placeholder$1");
const output = [];

const RUSSIAN_REGEX = /[А-Яа-яЁё]/; // detect Cyrillic

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    output.push(line); // always keep the original line as-is

    // Skip comments
    if (trimmed.startsWith("//")) continue;

    // --- Detect Russian dialogue lines (including signs-only ones) ---
    if (RUSSIAN_REGEX.test(trimmed) || /^[.!?…—-]+$/.test(trimmed)) {
        // Insert placeholder structure
        output.push("EN: ");
        output.push("DE: ");
        output.push("ES: MISSING TRANSLATION");
        output.push("CN: MISSING TRANSLATION");
        continue;
    }

    // --- Handle /choice lines that contain Russian text ---
    if (trimmed.startsWith("/choice")) {
        const parts = trimmed.split(/\s+/);
        const textPart = parts.slice(2).join(" ");
        if (RUSSIAN_REGEX.test(textPart)) {
            output.push("EN: ");
            output.push("DE: ");
            output.push("ES: MISSING TRANSLATION");
            output.push("CN: MISSING TRANSLATION");
        }
        continue;
    }

    // --- Handle subsequent choice options like Ada_choice_exit ---
    if (/^[A-Za-z0-9_]+ /.test(trimmed)) {
        const [, textPart] = trimmed.split(/ (.+)/);
        if (textPart && RUSSIAN_REGEX.test(textPart)) {
            output.push("EN: ");
            output.push("DE: ");
            output.push("ES: MISSING TRANSLATION");
            output.push("CN: MISSING TRANSLATION");
        }
        continue;
    }
}

// Write augmented version
fs.writeFileSync(outputFile, output.join("\n"), "utf8");
console.log(`✅ Created copy with translation placeholders: ${outputFile}`);
