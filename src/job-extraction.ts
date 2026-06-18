import "dotenv/config";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
    throw new Error(
        "Missing OpenAI API key. Set OPENAI_API_KEY in your .env file or shell environment."
    );
}

const client = new OpenAI({ apiKey });

const JobRequirementSchema = z.object({
    skills: z.array(z.string()).nonempty("Skills array cannot be empty"),
    experience: z.string().nonempty("Experience field cannot be empty"),
    education: z.string().nonempty("Education field cannot be empty"),
    location: z.string().nonempty("Location field cannot be empty"),
    remote: z.boolean().optional().nullable()
});

export async function parseJobDescription(description: string) {
    console.log("\nExtracting job requirements...");
    const response = await client.responses.create({
    model: "gpt-5.2",
    input: [
            {
                role: "system",
                content: "You are a helpful assistant that extract job requirements from a raw job description that user will provide you. You will return the extracted job requirements in a JSON format."
            },
            {
                role: "user",
                content: description.trim()
            }
        ],
        text: {
            format: zodTextFormat(JobRequirementSchema, "jobRequirements"),
        }
    });

    console.log(response.output_text);
}
