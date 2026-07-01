import "dotenv/config";
import fs from "fs/promises";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const pdf = require("pdf-parse/lib/pdf-parse.js") as (
    dataBuffer: Buffer
) => Promise<{ text: string }>;

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
    throw new Error(
        "Missing OpenAI API key. Set OPENAI_API_KEY in your .env file or shell environment."
    );
}

export const resumeExtractorTool = {
    name: "function",
    prompt: "You are a helpful assistant that extracts job requirements from a raw job description that the user will provide. You will return the extracted job requirements in a JSON format."

}

export const parseResumeTool = async (_args: Record<string, never> = {}) => {
    const pathToResume = "resume/Resume.pdf";
    const dataBuffer = await fs.readFile(pathToResume);
    const pdfData = await pdf(dataBuffer);
    const resumeText = pdfData.text;
    const systemContent = `You are a helpful assistant that extracts resume data from a raw resume that the user will provide. You will return the extracted resume data in a JSON format.`

    return resumeText;

    // return await ai({
    //     content: resumeText,
    //     systemContent,
    //     schema: ResumeDataSchema,
    //     callType: "parsedResume"
    // });
}