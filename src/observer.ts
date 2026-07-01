import type OpenAI from "openai";
import type { ResponseFormatTextConfig, ResponseInput } from "openai/resources/responses/responses.mjs";
import type { ResponseUsage } from 'openai/resources/responses/responses';

type responseObjectType = {
    model: string;
    input: ResponseInput;
    text?: {
        format: ResponseFormatTextConfig
    }
}

let tokenConsumption = {
    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0
}

async function Observer({client, object}: {client: OpenAI, object: responseObjectType}) {
    const res = await client.responses.create(object);
    const tokenUsageResult: ResponseUsage | undefined = res.usage;

    if (tokenUsageResult) {
        tokenConsumption.inputTokens += tokenUsageResult.input_tokens;
        tokenConsumption.outputTokens += tokenUsageResult.output_tokens;
        tokenConsumption.totalTokens += tokenUsageResult.total_tokens;
    }

    return res.output_text;
}

export default Observer;