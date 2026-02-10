// extractRussianLines.js
// -------------------------------------------------------------
// PURPOSE:
//   Extract only Russian dialogue lines from a game script.
//   Keeps the preceding /say <Character> line above each text.
//   Ignores Russian inside comments (//).
//
// USAGE:
//   node 1RusExtractor.js ../Translator/TestRun1/Start_2_Fiona_Celeste.script
//
// OUTPUT:
//   russian_lines.txt with lines like:
//     /say Samantha
//     RUS: ...Ты можешь хотя бы раз прийти на тренировку...
// -------------------------------------------------------------

const fs = require("fs");

const path = require("path");
const inputFile = path.resolve(__dirname, process.argv[2]);
if (!inputFile) {
    console.error("Usage: node 1RusExtractor.js ../Translator/TestRun1/Start_2_Fiona_Celeste.script");
    process.exit(1);
}

const text = fs.readFileSync(inputFile, "utf8");
const lines = text.split(/\r?\n/);

let output = [];

function pushWithBlankLine(line) {
    if (output.length && output[output.length - 1] !== "") {
        output.push(""); // insert blank line before new block
    }
    output.push(line);
}

for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip comment lines
    if (line.startsWith("//")) continue;

    // If it's a speaker command, keep it
    if (line.startsWith("/say")) {
        output.push(line);

        // Look ahead to the next non-empty, non-comment line
        let j = i + 1;
        while (j < lines.length && (lines[j].trim() === "" || lines[j].trim().startsWith("//"))) {
            j++;
        }

        // If found a valid dialogue line (even if it's just signs)
        if (j < lines.length && lines[j].trim() !== "" && !lines[j].trim().startsWith("/")) {
            output.push(`RUS: ${lines[j].trim()}`);
        }

        // Skip ahead
        i = j;
    }

    // --- Handle CHOICE blocks ---
    if (line.startsWith("/choice")) {
        pushWithBlankLine(`/choice ${line.split(/\s+/)[1] || ""}`);

        const parts = line.split(/\s+/);
        const speaker = parts[1] || "";
        const text = parts.slice(2).join(" ");

        if (text) output.push(`RUS: ${text}`);

        // Process subsequent choice lines (until a command or empty line)
        let j = i + 1;
        while (j < lines.length) {
            const next = lines[j].trim();
            if (next === "" || next.startsWith("//") || next.startsWith("/")) break;

            // Split at first space (choiceName + text)
            const [choiceName, ...rest] = next.split(" ");
            const choiceText = rest.join(" ");
            output.push(choiceName);
            if (choiceText) output.push(`RUS: ${choiceText}`);
            j++;
        }

        i = j - 1; // advance to last processed
        continue;
    }
    // --- Handle WAYPOINT commands ---
    if (line.startsWith("/waypoint")) {
        pushWithBlankLine(line); // copy the line as-is
        continue; // skip to next line
    }
}

fs.writeFileSync("russian_lines.txt", output.join("\n"), "utf8");
console.log("✅ Extracted Russian lines (including symbolic ones).");
console.log(`ℹ️ Total extracted Russian lines: ${output.filter(line => line.startsWith("RUS:")).length}`);

// Create (or clear) an empty English lines file for future translation work
fs.writeFileSync("english_lines.txt", "", "utf8");
console.log("✅ Created empty english_lines.txt file.");
fs.writeFileSync("german_lines.txt", "", "utf8");
console.log("✅ Created empty german_lines.txt file.");