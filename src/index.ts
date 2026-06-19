import { agent } from "./agent.js";
import { parseJobDescription } from "./job-extractor.js";

process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.setEncoding("utf8");

process.stdout.write("\x1b[?2004h");

let buffer = "";
let jobDescription: string = "";
let isPasting = false;

console.log("Please paste the job description (Press Ctrl+C to exit):");
process.stdin.on("data", (chunk: string) => {

  for (let i = 0; i < chunk.length; i++) {

    if (chunk.startsWith("\x1b[200~", i)) {
      isPasting = true;
      i += "\x1b[200~".length - 1;
      continue;
    }

    if (chunk.startsWith("\x1b[201~", i)) {
      isPasting = false;
      i += "\x1b[201~".length - 1;
      continue;
    }

    const char = chunk[i];
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
        agent({prompt: jobDescription, max_turn: 5});
        buffer = "";
      }
      continue;
    }

    buffer += char;
    process.stdout.write(chunk[i] as string);
  }
});

function cleanup() {
  process.stdout.write("\x1b[?2004l");
}

