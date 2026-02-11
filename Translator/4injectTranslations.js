// injectTranslations.js
const fs = require("fs");
const path = require("path");

if (process.argv.length < 4) {
    console.error(
        "Usage: node 4injectTranslations.js TeamReconciliationSh_Translated.script translations_map.json"
    );
    process.exit(1);
}

const scriptFile = path.resolve(process.argv[2]);
const mapFile = path.resolve(process.argv[3]);

const lines = fs.readFileSync(scriptFile, "utf8").split(/\r?\n/);
const translationsMap = JSON.parse(fs.readFileSync(mapFile, "utf8"));

const langOrder = ["EN", "DE", "ES", "CN"];
let stats = { total: 0, filled: {}, missing: {} };

// Initialize stats
langOrder.forEach(lang => {
    stats.filled[lang] = 0;
    stats.missing[lang] = 0;
});

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("ID:")) {
        const id = line.replace("ID:", "").trim();
        const trans = translationsMap[id] || {};

        // Scan next lines for language placeholders
        for (let j = i + 1; j < i + 6 && j < lines.length; j++) {
            const match = lines[j].match(/^([A-Z]{2}):/);
            if (!match) continue;

            const lang = match[1];
            const value = trans[lang] || "MISSING TRANSLATION";

            lines[j] = `${lang}: ${value}`;

            stats.total++;
            if (value !== "MISSING TRANSLATION") stats.filled[lang]++;
            else stats.missing[lang]++;
        }
    }
}

// Write back to the same file
fs.writeFileSync(scriptFile, lines.join("\n"), "utf8");

console.log(`✅ Translations injected in place → ${scriptFile}`);
console.log("ℹ️ Stats:");
langOrder.forEach(lang => {
    console.log(`${lang}: filled ${stats.filled[lang]}, missing ${stats.missing[lang]}`);
});