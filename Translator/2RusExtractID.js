const fs = require("fs");
const path = require("path");

const inputFile = path.resolve(__dirname, process.argv[2]);

if (!inputFile) {
    console.error("Usage: node extractRusWithIDs.js <*_WithIDs.script>");
    process.exit(1);
}

const text = fs.readFileSync(inputFile, "utf8");
const lines = text.split(/\r?\n/);

let output = [];
let rusCount = 0;

/* ---------------- HELPERS ---------------- */

function pushBlock(arr) {
    if (output.length && output[output.length - 1] !== "") {
        output.push("");
    }
    output.push(...arr);
}

/* ---------------- PARSER ---------------- */

for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const trimmed = raw.trim();

    if (trimmed.startsWith("//")) continue;

    /* ---------- /say ---------- */

    if (trimmed.startsWith("/say")) {
        const sayLine = raw;

        let j = i + 1;

        while (
            j < lines.length &&
            (lines[j].trim() === "" || lines[j].trim().startsWith("//"))
        ) {
            j++;
        }

        if (j + 1 < lines.length && lines[j + 1].trim().startsWith("ID:")) {
            const rusLine = lines[j];
            const idLine = lines[j + 1].trim();

            pushBlock([
                idLine,
                sayLine.trim(),
                `RUS: ${rusLine.trim()}`
            ]);

            rusCount++;
            i = j + 1;
            continue;
        }
    }

    /* -------- /choice -------- */
    if (trimmed.startsWith("/choice")) {
        const parts = trimmed.split(/\s+/);
        const commandOnly = `/choice ${parts[1] || ""}`.trim();
        const inlineRus = parts.slice(2).join(" ");

        let idLine = null;
        if (i + 1 < lines.length && lines[i + 1].trim().startsWith("ID:")) {
            idLine = lines[i + 1].trim();
        }

        // inline russian
        if (inlineRus && idLine) {
            pushBlock([
                idLine,
                commandOnly,
                `RUS: ${inlineRus}`
            ]);
            rusCount++;
        }

        let j = i + 1;
        while (j < lines.length) {
            if (lines[j].trim().startsWith("ID:")) {
                j++;
                continue;
            }

            const opt = lines[j];
            const optTrim = opt.trim();

            if (optTrim === "" || optTrim.startsWith("//") || optTrim.startsWith("/")) break;

            // detect option with parentheses
            let optionCommand, optionRus;
            const parenMatch = optTrim.match(/^\(([^)]+)\)\s*(.+)$/);

            if (parenMatch) {
                // (hearts_Celeste 3) Celeste_choice_faster2 Давай ещё быстрее!
                const afterParen = parenMatch[2].trim().split(/\s+/);
                optionCommand = `(${parenMatch[1]}) ${afterParen[0]}`;
                optionRus = afterParen.slice(1).join(" ");
            } else {
                const tokens = optTrim.split(/\s+/);
                optionCommand = tokens[0];
                optionRus = tokens.slice(1).join(" ");
            }

            if (j + 1 < lines.length && lines[j + 1].trim().startsWith("ID:")) {
                pushBlock([
                    lines[j + 1].trim(),
                    optionCommand,
                    `RUS: ${optionRus}`
                ]);
                rusCount++;
                j += 2;
            } else {
                j++;
            }
        }

        i = j - 1;
        continue;
    }
}

/* ---------------- WRITE ---------------- */

fs.writeFileSync("russian_lines.script", output.join("\n"), "utf8");

console.log("✅ Extracted Russian lines with IDs");
console.log(`🔢 Total Russian lines: ${rusCount}`);

["english", "german", "spanish"].forEach((l) => {
    fs.writeFileSync(`${l}_lines.script`, "", "utf8");
});
