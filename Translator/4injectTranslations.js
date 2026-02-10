// injectTranslations.js
const fs = require("fs");
const path = require("path");

if (process.argv.length < 4) {
    console.error(
        "Usage: node 5injectTranslations.js <translated_placeholder.txt> <translations_map.json> [final_output.txt]"
    );
    process.exit(1);
}

const placeholderFile = path.resolve(process.argv[2]);
const mapFile = path.resolve(process.argv[3]);
const outputFile = path.resolve(process.argv[4] || "translation_final.script");

const placeholderLines = fs.readFileSync(placeholderFile, "utf8").split(/\r?\n/);
const translationsMap = JSON.parse(fs.readFileSync(mapFile, "utf8"));

const output = [];
let stats = { total: 0, filled: {}, missing: {} };
const langOrder = ["EN", "DE", "ES", "CN"];

for (let i = 0; i < placeholderLines.length; i++) {
    const line = placeholderLines[i];

    if (line.startsWith("ID:")) {
        const id = line.replace("ID:", "").trim();
        const trans = translationsMap[id] || {};

        langOrder.forEach(lang => {
            const placeholderIndex = i + 1 + langOrder.indexOf(lang); // assumes placeholder lines after ID
            const currentLine = placeholderLines[placeholderIndex];
            const value = trans[lang] || (currentLine.includes("MISSING") ? "MISSING TRANSLATION" : "");
            placeholderLines[placeholderIndex] = `${lang}: ${value}`;

            stats.total++;
            if (!stats.filled[lang]) stats.filled[lang] = 0;
            if (!stats.missing[lang]) stats.missing[lang] = 0;

            if (value && value !== "MISSING TRANSLATION") stats.filled[lang]++;
            else stats.missing[lang]++;
        });
    }

    output.push(placeholderLines[i]);
}

fs.writeFileSync(outputFile, output.join("\n"), "utf8");

console.log(`✅ Final Unity-ready script generated → ${outputFile}`);
console.log(`ℹ️ Stats:`);
langOrder.forEach(lang => {
    console.log(
        `${lang}: filled ${stats.filled[lang] || 0}, missing ${stats.missing[lang] || 0}`
    );
});
