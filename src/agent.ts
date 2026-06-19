import "dotenv/config";
import OpenAI from "openai";
import {z} from "zod";

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
    throw new Error(
        "Missing OpenAI API key. Set OPENAI_API_KEY in your .env file or shell environment."
    );
}

const client = new OpenAI({ apiKey });


const ai = async (userPrompt: string) => { 
    try{
          const response = await client.responses.create({
            model: "gpt-5.2",
            input: [
                    {
                        role: "system",
                        content: `You are a Job Application Copilot.

                            Available Tools:

                            1. analyzeJob
                            Description:
                            Extract structured information from a job description.

                            Arguments:
                            {
                              "jobDescription": string
                            }

                            2. getResume
                            Description:
                            Get the user's resume.

                            Arguments:
                            {}

                            3. matchResume
                            Description:
                            Compare a resume against a job.

                            Arguments:
                            {
                              "resume": object,
                              "job": object
                            }

                            Return ONLY valid JSON.

                            If you need a tool:

                            {
                              "type": "tool_call",
                              "tool": "<tool name>",
                              "args": {...},
                              "reason": "<why>"
                            }

                            If you have enough information:

                            {
                              "type": "final_answer",
                              "answer": "<answer>"
                            }

                            User Request:

                            Analyze this job and tell me if I should apply.
                        `
                    },
                    {
                        role: "user",
                        content: `Job description: ${userPrompt.trim()}`
                    }
                ]
            });
        
            console.log(response.output_text);
    }
    catch(ex) {

    }
}

export async function agent({
    prompt,
    max_turn
}: {
    prompt: string,
    max_turn: number
}) {
    let iteration = 0;
    while(true) {
        await ai(prompt);
        break;
        iteration++;
        if(iteration > max_turn) {
            console.log("Max turn reached. Exiting...");
            break;
        }
    }
}