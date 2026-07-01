import "dotenv/config";
import fs from "fs/promises";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import path from "path";
import { z } from "zod";
import Observer from "./observer.js";
import type { ResponseFormatTextConfig, ResponseInput } from "openai/resources/responses/responses.mjs";

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
    throw new Error(
        "Missing OpenAI API key. Set OPENAI_API_KEY in your .env file or shell environment."
    );
}

const client = new OpenAI({ apiKey });
const COVER_LETTER_FILE_PATH = "resume/cover-letter.md";

const GenerateCoverLetterArgsSchema = z.object({
    resume: z.unknown(),
    job: z.unknown(),
    applicantName: z.string().optional(),
    tone: z.enum(["professional", "confident", "friendly"]).optional(),
    length: z.enum(["short", "medium", "long"]).optional(),
    extraContext: z.string().optional(),
});

const CoverLetterResultSchema = z.object({
    coverLetter: z.string(),
    subjectLine: z.string(),
    openingHook: z.string(),
    keyPoints: z.array(z.string()),
});

function serializeInput(value: unknown): string {
    if (typeof value === "string") {
        return value;
    }

    try {
        return JSON.stringify(value, null, 2);
    } catch {
        return String(value);
    }
}

type responseObjectType = {
    model: string;
    input: ResponseInput;
    text?: {
        format: ResponseFormatTextConfig
    }
}

export const generateCoverLetterTool = async (args: Record<string, unknown>) => {
    const {
        resume,
        job,
        applicantName,
        tone = "professional",
        length = "medium",
        extraContext,
    } = GenerateCoverLetterArgsSchema.parse(args);

    const systemContent = `You are an expert career writing assistant.
    Write a tailored, truthful cover letter using only the provided resume and job details.
    Rules:
    - Do not invent skills, certifications, achievements, dates, or job titles.
    - Keep claims grounded in resume evidence.
    - Prioritize relevance to the job requirements.
    - Tone must be ${tone}.
    - Length target is ${length}.
    - Return concise, polished writing suitable for direct use.`;

    const userContent = [
        `Applicant Name: ${applicantName ?? "Not provided"}`,
        `Resume Input:\n${serializeInput(resume)}`,
        `Job Input:\n${serializeInput(job)}`,
        extraContext ? `Extra Context:\n${extraContext}` : "",
    ]
        .filter(Boolean)
        .join("\n\n");

    const object: responseObjectType = {
        model: "gpt-5.2",
        input: [
            {
                role: "system",
                content: systemContent,
            },
            {
                role: "user",
                content: userContent,
            },
        ],
        text: {
            format: zodTextFormat(CoverLetterResultSchema, "coverLetterResult"),
        }
    }

    const output = await Observer({client, object});

    // const response = await client.responses.create({
    //     model: "gpt-5.2",
    //     input: [
    //         {
    //             role: "system",
    //             content: systemContent,
    //         },
    //         {
    //             role: "user",
    //             content: userContent,
    //         },
    //     ],
    //     text: {
    //         format: zodTextFormat(CoverLetterResultSchema, "coverLetterResult"),
    //     },
    // });

    // const output = response.output_text?.trim();
    if (!output) {
        throw new Error("No response returned by AI for cover letter generation.");
    }

    const parsed = CoverLetterResultSchema.parse(JSON.parse(output));
    const fileContent = [
        `Subject: ${parsed.subjectLine}`,
        "",
        parsed.coverLetter,
        "",
        "---",
        "Opening Hook:",
        parsed.openingHook,
        "",
        "Key Points:",
        ...parsed.keyPoints.map((point) => `- ${point}`),
    ].join("\n");

    await fs.mkdir(path.dirname(COVER_LETTER_FILE_PATH), { recursive: true });
    await fs.writeFile(COVER_LETTER_FILE_PATH, fileContent, "utf8");

    return {
        ...parsed,
        savedTo: COVER_LETTER_FILE_PATH,
    };
};
