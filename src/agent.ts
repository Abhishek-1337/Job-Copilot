import "dotenv/config";
import OpenAI from "openai";
import { toolRegistry } from "./tool-registry.js";
import type { MessageType } from "./types.js";
import type { ResponseInput } from "openai/resources/responses/responses.mjs";

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
    throw new Error(
        "Missing OpenAI API key. Set OPENAI_API_KEY in your .env file or shell environment."
    );
}

const client = new OpenAI({ apiKey });

function setInitialMessage(userPrompt: string) {
    return  [
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
    ];
}


const ai = async (message: ResponseInput) => { 
    

    try{
          const response = await client.responses.create({
            model: "gpt-5.2",
            input: message
            });
        
            return response.output_text;
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
    let messages: MessageType[] = setInitialMessage(prompt);
    while(true) {
        const response = await ai(messages as ResponseInput);
        if(!response) {
            console.log("No response from AI. Exiting...");
            break;
        }
        const res = JSON.parse(response);

        if(res.type === "tool_call") {
            const toolName = res.tool;
            const toolArgs = res.args;
            const reason = res.reason;

            const tools = toolRegistry();
            if(tools[toolName]) {
                const toolResponse = await tools[toolName](...Object.values(toolArgs));
                messages.push({ 
                    role: "user",
                    content: `Tool ${toolName} called for reason: ${reason}. Tool response: ${JSON.stringify(toolResponse)}`
                });
                console.log(`Tool ${toolName} called for reason: ${reason}`);
                console.log(`Tool response: ${JSON.stringify(toolResponse)}`);

            } else {
                console.log(`Tool ${toolName} not found.`);
            }
        }

        iteration++;
        if(iteration > max_turn) {
            console.log("Max turn reached. Exiting...");
            break;
        }
    }
}