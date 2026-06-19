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

                            4. generateCoverLetter
                            Description:
                            Generate a tailored cover letter for a job application.
                            
                            Arguments:
                            {
                                "resume": string | object,
                                "job": string | object,
                                "applicantName": string (optional),
                                "tone": "professional" | "confident" | "friendly" (optional),
                                "length": "short" | "medium" | "long" (optional),
                                "extraContext": string (optional)
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

    console.log("\nhello\n");
    

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
    const tools = toolRegistry();
    while(true) {
        const response = await ai(messages as ResponseInput);
        if(!response) {
            console.log("No response from AI. Exiting...");
            break;
        }
        // console.log(response);
        const res = JSON.parse(response.trim());
        console.log(res);

        if(res.type === "tool_call") {
            const toolName = res.tool;
            const reason = res.reason;
            const fn = tools[toolName];
            
            if (typeof fn !== "function") throw new Error(`Unknown tool: ${toolName}`);

            const argsObj = res.args ?? {};
            if (argsObj === null || typeof argsObj !== "object" || Array.isArray(argsObj)) {
              throw new Error(`Invalid args for tool ${toolName}`);
            }

            const toolResponse = await fn(argsObj); 

            messages.push({ 
                role: "user",
                content: `Tool ${toolName} called for reason: ${reason}. Tool response: ${JSON.stringify(toolResponse)}`
            });
            console.log(`Tool ${toolName} called for reason: ${reason}`);
            console.log(toolResponse);
        }
        else if(res.type === "final_answer") {
            console.log("Final answer from agent:");
            console.log(res.answer);
            break;
        }
        else {
            console.log("Invalid response type. Exiting...");
            break;
        }

        iteration++;
        if(iteration > max_turn) {
            console.log(iteration);
            console.log("Max turn reached. Exiting...");
            // break;
        }
    }
}