const fs = require("fs");
const path = require("path");

if (process.argv.length < 4) {
    console.error(
        "Usage: node 3buildTranslationsMap.js translations_map.json english_lines.script german_lines.script"
    );
    process.exit(1);
}

const [, , outputJson, ...langFiles] = process.argv;

// Define the full set of expected languages
const allLangs = ["EN", "DE", "ES", "CN"];

const translationsById = {}; // id -> { EN: ..., DE: ..., ES: ..., CN: ... }

for (const file of langFiles) {
    const content = fs.readFileSync(file, "utf8");
    const lines = content.split(/\r?\n/);

    let currentId = null;
    let currentLang = null;

    for (let line of lines) {
        line = line.trim();
        if (line.startsWith("ID:")) {
            currentId = line.replace("ID:", "").trim();
            if (!translationsById[currentId]) {
                // Initialize all languages as MISSING by default
                translationsById[currentId] = {};
                allLangs.forEach(lang => {
                    translationsById[currentId][lang] = "MISSING TRANSLATION";
                });
            }
        } else if (/^[A-Z]{2}:/.test(line)) {
            const [lang, ...rest] = line.split(":");
            currentLang = lang.trim();
            translationsById[currentId][currentLang] = rest.join(":").trim();
        }
    }
}

// Ensure every ID has all languages (in case some languages files are missing)
Object.values(translationsById).forEach(entry => {
    allLangs.forEach(lang => {
        if (!(lang in entry)) entry[lang] = "MISSING TRANSLATION";
    });
});

fs.writeFileSync(outputJson, JSON.stringify(translationsById, null, 2), "utf8");
console.log(`✅ Translations map saved → ${outputJson}`);
console.log(`ℹ️ Total IDs: ${Object.keys(translationsById).length}`);
console.log(`ℹ️ Languages included: ${allLangs.join(", ")}`);
