import type OpenAI from "openai";
import type { ResponseFormatTextConfig, ResponseInput } from "openai/resources/responses/responses.mjs";

type responseObjectType = {
    model: string;
    input: ResponseInput;
    text?: {
        format: ResponseFormatTextConfig
    }
}

async function Observer({client, object}: {client: OpenAI, object: responseObjectType}) {
    const res = await client.responses.create(object);
    console.log(res.usage);
}

export default Observer;