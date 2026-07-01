import "dotenv/config";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import type { ResponseFormatTextConfig, ResponseInput } from "openai/resources/responses/responses.mjs";
import { z } from "zod";
import Observer from "./observer.js";

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
    throw new Error(
        "Missing OpenAI API key. Set OPENAI_API_KEY in your .env file or shell environment."
    );
}

const client = new OpenAI({ apiKey });

const MatchResumeArgsSchema = z.object({
    resume: z.unknown(),
    job: z.unknown(),
});

const MatchResultSchema = z.object({
    score: z.number().min(0).max(100),
    recommendation: z.enum(["apply", "maybe", "no"]),
    matchedSkills: z.array(z.string()),
    missingSkills: z.array(z.string()),
    strengths: z.array(z.string()),
    risks: z.array(z.string()),
    summary: z.string(),
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

export const matchResumeTool = async (args: Record<string, unknown>) => {
    const { resume, job } = MatchResumeArgsSchema.parse(args);

    const systemContent = `You are a strict resume matcher for job applications.
    Compare the resume input against the job input and return an objective match report.
    Scoring guide:
    - 80-100: strong fit, ready to apply
    - 60-79: partial fit, apply with targeted improvements
    - 0-59: weak fit, likely not worth applying now
    Rules:
    - Use evidence from provided inputs only.
    - Do not hallucinate missing resume experience.
    - Keep skills in matchedSkills/missingSkills short and normalized.
    - summary should be concise (2-4 sentences).`;

    const userContent = `Resume Input:\n${serializeInput(resume)}\n\nJob Input:\n${serializeInput(job)}`;

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
    //         format: zodTextFormat(MatchResultSchema, "matchResumeResult"),
    //     },
    // });

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
            format: zodTextFormat(MatchResultSchema, "matchResumeResult"),
        }
    }

    const output = await Observer({client, object});

    // const output = response.output_text?.trim();
    if (!output) {
        throw new Error("No response returned by AI for resume matching.");
    }

    return JSON.parse(output);
};