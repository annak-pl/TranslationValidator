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

if (process.argv.length !== 7) {
    console.error(
        "Usage: node mergeTranslations.js <placeholder> <english> <german> <spanish> <output>"
    );
    process.exit(1);
}

const [, , placeholderPath, englishPath, germanPath, spanishPath, outputPath] =
    process.argv;

function readLines(path) {
    return fs.readFileSync(path, "utf8").split(/\r?\n/);
}

// Extract only EN: or DE: text in order
function extractLang(lines, lang) {
    const prefix = lang + ":";
    return lines
        .filter((l) => l.trim().startsWith(prefix))
        .map((l) => l.slice(l.indexOf(prefix) + prefix.length).trim());
}

const placeholderLines = readLines(placeholderPath);
const englishLines = extractLang(readLines(englishPath), "EN");
const germanLines = extractLang(readLines(germanPath), "DE");
const spanishLines = extractLang(readLines(spanishPath), "ES");

let enIndex = 0;
let deIndex = 0;
let esIndex = 0;

const output = placeholderLines.map((line) => {
    const trimmed = line.trim();

    if (trimmed.startsWith("EN:")) {
        const val =
            englishLines[enIndex] !== undefined
                ? englishLines[enIndex++]
                : "MISSING TRANSLATION";
        return "EN: " + val;
    }

    if (trimmed.startsWith("DE:")) {
        const val =
            germanLines[deIndex] !== undefined
                ? germanLines[deIndex++]
                : "MISSING TRANSLATION";
        return "DE: " + val;
    }

    if (trimmed.startsWith("ES:")) {
        const val =
            spanishLines[esIndex] !== undefined
                ? spanishLines[esIndex++]
                : "MISSING TRANSLATION";
        return "ES: " + val;
    }
    return line;
});

fs.writeFileSync(outputPath, output.join("\n"), "utf8");

console.log("Translation file written to:", outputPath);

