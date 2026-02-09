// -------------------------------------------------------------
// PURPOSE:
//   Extract Russian dialogue + generate stable hash IDs.
//   Keeps /say <Character> lines.
//   Ignores comments.
//   Supports /choice blocks.
//   Outputs:
//
//     ID: a13f9c42d1
//     /say Samantha
//     RUS: ...
//
// -------------------------------------------------------------

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const inputFile = path.resolve(__dirname, process.argv[2]);

if (!inputFile) {
    console.error(
        "Usage: node 1RusExtractor.js ../Translator/TestRun1/Start_2_Fiona_Celeste.script"
    );
    process.exit(1);
}

const text = fs.readFileSync(inputFile, "utf8");
const lines = text.split(/\r?\n/);

let output = [];

/* ---------------- NORMALIZATION ---------------- */

function normalize(str) {
    return str
        .normalize("NFKC")
        .replace(/\s+/g, " ")
        .trim();
}

function makeId(scope, speaker, rusText) {
    return crypto
        .createHash("sha1")
        .update(`${scope}|${speaker}|${normalize(rusText)}`)
        .digest("hex")
        .slice(0, 12);
}

/* ---------------- HELPERS ---------------- */

function pushWithBlankLine(line) {
    if (output.length && output[output.length - 1] !== "") {
        output.push("");
    }
    output.push(line);
}

/* ---------------- PARSER ---------------- */

const scope = path.basename(inputFile);

let rusCount = 0;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith("//")) continue;

    /* -------- /say -------- */

    if (line.startsWith("/say")) {
        const speaker = line.replace("/say", "").trim();

        // Look ahead to next real text
        let j = i + 1;
        while (
            j < lines.length &&
            (lines[j].trim() === "" || lines[j].trim().startsWith("//"))
        ) {
            j++;
        }

        if (
            j < lines.length &&
            lines[j].trim() !== "" &&
            !lines[j].trim().startsWith("/")
        ) {
            const rus = lines[j].trim();
            const id = makeId(scope, speaker, rus);

            pushWithBlankLine(`ID: ${id}`);
            output.push(`/say ${speaker}`);
            output.push(`RUS: ${rus}`);

            rusCount++;
        }

        i = j;
        continue;
    }

    /* -------- /choice -------- */

    if (line.startsWith("/choice")) {
        const parts = line.split(/\s+/);
        const speaker = parts[1] || "";
        const textPart = parts.slice(2).join(" ");

        pushWithBlankLine(`/choice ${speaker}`);

        if (textPart) {
            const id = makeId(scope, speaker, textPart);
            output.push(`ID: ${id}`);
            output.push(`RUS: ${textPart}`);
            rusCount++;
        }

        let j = i + 1;
        while (j < lines.length) {
            const next = lines[j].trim();
            if (next === "" || next.startsWith("//") || next.startsWith("/")) break;

            const [choiceName, ...rest] = next.split(" ");
            const choiceText = rest.join(" ");

            output.push(choiceName);

            if (choiceText) {
                const id = makeId(scope, choiceName, choiceText);
                output.push(`ID: ${id}`);
                output.push(`RUS: ${choiceText}`);
                rusCount++;
            }

            j++;
        }

        i = j - 1;
        continue;
    }

    /* -------- /waypoint -------- */

    if (line.startsWith("/waypoint")) {
        pushWithBlankLine(line);
        continue;
    }
}

/* ---------------- WRITE FILES ---------------- */

fs.writeFileSync("russian_lines.txt", output.join("\n"), "utf8");

console.log("✅ Extracted Russian lines with hash IDs.");
console.log(`ℹ️ Total extracted Russian lines: ${rusCount}`);

fs.writeFileSync("english_lines.txt", "", "utf8");
console.log("✅ Created empty english_lines.txt");

fs.writeFileSync("german_lines.txt", "", "utf8");
console.log("✅ Created empty german_lines.txt");
