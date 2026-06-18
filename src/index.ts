import { parseJobDescription } from "./job-extraction.js";

process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.setEncoding("utf8");

process.stdout.write("\x1b[?2004h");

let buffer = "";
let jobDescription: string = "";
let isPasting = false;

console.log("Please paste the job description (Press Ctrl+C to exit):");
process.stdin.on("data", (chunk: string) => {
  if (chunk.includes("\x1b[200~")) {
    isPasting = true;
    chunk = chunk.replace("\x1b[200~", "");
  }

  if (chunk.includes("\x1b[201~")) {
    isPasting = false;
    chunk = chunk.replace("\x1b[201~", "");
  }

  for (const char of chunk) {
    if (char === "\u0003") {
      cleanup();
      process.exit();
    }

    if (char === "\r" || char === "\n") {
      if (isPasting) {
        buffer += "\n";
        process.stdout.write("\n");
      } else {
        process.stdout.write("\n");
        jobDescription += buffer;
        buffer = "";
        parseJobDescription(jobDescription);
      }
      continue;
    }

    buffer += char;
    process.stdout.write(char);
  }
});

function cleanup() {
  process.stdout.write("\x1b[?2004l");
}

