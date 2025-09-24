import { ChatOpenAI } from "@langchain/openai";
import { config } from "dotenv";
import path from "path";
// 利用dotenv读取.env文件中的环境变量
config({ path: path.join(__dirname, "../../.env") });
const apiKey = process.env.API_KEY as string;
console.log({ apiKey })
if (!apiKey) {
    console.log("OPENAI_API_KEY is not set");
    process.exit(1);
}
export const freeModel = new ChatOpenAI({
    model: "glm-4-flash",
    configuration: {
        baseURL: "https://www.dmxapi.com/v1",
        apiKey: apiKey,
    },
});


export const doubaoModel = new ChatOpenAI({
    model: "Doubao-1.5-pro-32k",
    configuration: {
        baseURL: "https://www.dmxapi.com/v1",
        apiKey: apiKey,
    },
});
