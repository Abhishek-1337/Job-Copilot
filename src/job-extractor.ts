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

export const jobExtractorTool = {
    name: "function",
    prompt: "You are a helpful assistant that extracts job requirements from a raw job description that the user will provide. You will return the extracted job requirements in a JSON format."

}

const ai = async ({
    content, 
    systemContent,
    schema,
    callType,
}: {
    content: string,
    systemContent: string,
    schema: z.ZodTypeAny,
    callType: string
}) => { 
    try{
          const response = await client.responses.create({
            model: "gpt-5.2",
            input: [
                    {
                        role: "system",
                        content: systemContent
                    },
                    {
                        role: "user",
                        content: content.trim()
                    }
                ],
                text: {
                    format: zodTextFormat(schema, callType),
                }
            });
        
            return response.output_text;
    }
    catch(ex) {

    }
}

export const parseJobDescription = async (jobDescription: string) => {
    const systemContent = `You are a helpful assistant that extracts job requirements from a raw job description that the user will provide. You will return the extracted job requirements in a JSON format.`
    return await ai({
        content: jobDescription,
        systemContent,
        schema: JobRequirementSchema,
        callType: "parseJobDescription"
    });
}