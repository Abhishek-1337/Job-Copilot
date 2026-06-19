import { parseJobDescription } from "./job-extractor.js";
import { parseResumeTool } from "./resume-extractor.js";

type ToolHandler = (args: Record<string, unknown>) => Promise<unknown>;

export const toolRegistry = (): Record<string, ToolHandler> => {
  return {
    "analyzeJob": parseJobDescription as ToolHandler,
    "getResume": parseResumeTool as ToolHandler
  };
};