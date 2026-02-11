const fs = require("fs");
const path = require("path");

const inputFile = path.resolve(__dirname, process.argv[2]);

if (!inputFile) {
    console.error(
        "Usage: node addSequentialIDs.js <script>"
    );
    process.exit(1);
}

const text = fs.readFileSync(inputFile, "utf8");
const lines = text.split(/\r?\n/);

let output = [];

let idCounter = 1;

function nextId() {
    return String(idCounter++).padStart(7, "0");
}

/* ---------------- PARSER ---------------- */

for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Skip comments entirely
    if (trimmed.startsWith("//")) {
        output.push(rawLine);
        continue;
    }

    /* -------- /say -------- */

    if (trimmed.startsWith("/say")) {
        output.push(rawLine);

        let j = i + 1;
        while (
            j < lines.length &&
            (lines[j].trim() === "" || lines[j].trim().startsWith("//"))
        ) {
            output.push(lines[j]);
            j++;
        }

        if (
            j < lines.length &&
            lines[j].trim() !== "" &&
            !lines[j].trim().startsWith("/")
        ) {
            output.push(lines[j]);
            output.push(`ID: ${nextId()}`);
            output.push(`EN:`);
            output.push(`DE:`);
            output.push(`ES:`);
            output.push(`CN:`);
            i = j;
            continue;
        }

        continue;
    }

    /* -------- /choice -------- */

    if (trimmed.startsWith("/choice")) {
        output.push(rawLine);

        const parts = trimmed.split(/\s+/);
        const inlineText = parts.slice(2).join(" ");

        if (inlineText) {
            output.push(`ID: ${nextId()}`);
            output.push(`EN:`);
            output.push(`DE:`);
            output.push(`ES:`);
            output.push(`CN:`);
        }

        let j = i + 1;
        while (j < lines.length) {
            const optLine = lines[j];
            const optTrim = optLine.trim();

            if (
                optTrim === "" ||
                optTrim.startsWith("//") ||
                optTrim.startsWith("/")
            ) break;

            output.push(optLine);

            const tokens = optTrim.split(" ");
            const optionText = tokens.slice(1).join(" ");

            if (optionText) {
                output.push(`ID: ${nextId()}`);
                output.push(`EN:`);
                output.push(`DE:`);
                output.push(`ES:`);
                output.push(`CN:`);
            }

            j++;
        }

        i = j - 1;
        continue;
    }

    /* -------- default -------- */

    output.push(rawLine);
}

/* ---------------- WRITE ---------------- */

const outFile = inputFile.replace(/\.script$/, "_Translated.script");

fs.writeFileSync(outFile, output.join("\n"), "utf8");

console.log(`📄 Output file: ${outFile}`);
console.log(`🔢 Total IDs: ${idCounter - 1}`);
