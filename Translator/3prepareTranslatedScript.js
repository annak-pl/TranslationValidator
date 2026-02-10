// 4prepareTranslatedScript.js
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

if (process.argv.length < 3) {
    console.error(
        "Usage: node 4prepareTranslatedScript.js <russian_master_script> [output_translated.txt]"
    );
    process.exit(1);
}

const inputFile = path.resolve(process.argv[2]);
const outputFile = path.resolve(process.argv[3] || "_translated.txt");

const text = fs.readFileSync(inputFile, "utf8");
const lines = text.split(/\r?\n/);

function normalize(str) {
    return str.normalize("NFKC").replace(/\s+/g, " ").trim();
}

function makeId(scope, speaker, rusText) {
    return crypto.createHash("sha1").update(`${scope}|${speaker}|${normalize(rusText)}`).digest("hex").slice(0, 12);
}

const scope = path.basename(inputFile);
const output = [];
let idCount = 0;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith("//")) {
        output.push(line);
        continue;
    }

    if (line.startsWith("/say")) {
        const speaker = line.replace("/say", "").trim();

        // Look ahead for the Russian text
        let j = i + 1;
        while (j < lines.length && (lines[j].trim() === "" || lines[j].trim().startsWith("//"))) j++;

        if (j < lines.length && lines[j].trim() !== "" && !lines[j].trim().startsWith("/")) {
            const rusText = lines[j].trim();
            const id = makeId(scope, speaker, rusText);

            output.push(line);       // /say Samantha
            output.push(rusText);    // original Russian line
            output.push(`ID: ${id}`);
            output.push(`EN:`); // placeholders for languages
            output.push(`DE:`);
            output.push(`ES:`);
            output.push(`CN:`);
            idCount++;
        }

        i = j;
        continue;
    }

    // Keep all other lines as-is
    output.push(line);
}

fs.writeFileSync(outputFile, output.join("\n"), "utf8");
console.log(`✅ Prepared translated placeholder → ${outputFile}`);
console.log(`ℹ️ Total IDs generated: ${idCount}`);
