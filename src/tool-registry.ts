import { generateCoverLetterTool } from "./cover-letter-tool.js";
import { parseJobDescription } from "./job-extractor.js";
import { matchResumeTool } from "./match-resume-tool.js";
import { parseResumeTool } from "./resume-extractor.js";

type ToolHandler = (args: Record<string, unknown>) => Promise<unknown>;

export const toolRegistry = (): Record<string, ToolHandler> => {
  return {
    "analyzeJob": parseJobDescription as ToolHandler,
    "getResume": parseResumeTool as ToolHandler,
    "matchResume": matchResumeTool as ToolHandler,
    "generateCoverLetter": generateCoverLetterTool as ToolHandler
  };
};