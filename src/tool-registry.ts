import { parseJobDescription } from "./job-extractor.js";

export const toolRegistry = () : Record<string, any> => {
  return {
    "analyzeJob": parseJobDescription
  };
};