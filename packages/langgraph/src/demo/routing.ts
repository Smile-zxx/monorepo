import { StateGraph, Annotation } from "@langchain/langgraph";
import { z } from "zod";
import { freeModel } from "../utils/commpn";

const llm = freeModel
// 用于路由逻辑的结构化输出模式
const routeSchema = z.object({
    step: z.enum(["poem", "story", "joke"]).describe(
        "路由过程中的下一步"
    ),
});

// 使用结构化输出模式增强LLM
const router = llm.withStructuredOutput(routeSchema);

// 图状态
const StateAnnotation = Annotation.Root({
    input: Annotation<string>,
    decision: Annotation<string>,
    output: Annotation<string>,
});

// 节点
// 写故事
async function llmCall1(state: typeof StateAnnotation.State) {
    const result = await llm.invoke([{
        role: "system",
        content: "You are an expert storyteller.",
    }, {
        role: "user",
        content: state.input
    }]);
    return { output: result.content };
}

// 写笑话
async function llmCall2(state: typeof StateAnnotation.State) {
    const result = await llm.invoke([{
        role: "system",
        content: "You are an expert comedian.",
    }, {
        role: "user",
        content: state.input
    }]);
    return { output: result.content };
}

// 写诗歌
async function llmCall3(state: typeof StateAnnotation.State) {
    const result = await llm.invoke([{
        role: "system",
        content: "You are an expert poet.",
    }, {
        role: "user",
        content: state.input
    }]);
    return { output: result.content };
}

async function llmCallRouter(state: typeof StateAnnotation.State) {
    // 将输入路由到适当的节点
    const decision = await router.invoke([
        {
            role: "system",
            content: "Route the input to story, joke, or poem based on the user's request."
        },
        {
            role: "user",
            content: state.input
        },
    ]);

    return { decision: decision.step };
}

// 条件边函数，用于路由到适当的节点
function routeDecision(state: typeof StateAnnotation.State) {
    // 返回你想要访问的下一个节点名称
    if (state.decision === "story") {
        return "llmCall1";
    } else if (state.decision === "joke") {
        return "llmCall2";
    } else if (state.decision === "poem") {
        return "llmCall3";
    } else {
        return "llmCall1";
    }
}

// 构建工作流
const routerWorkflow = new StateGraph(StateAnnotation)
    .addNode("llmCall1", llmCall1)
    .addNode("llmCall2", llmCall2)
    .addNode("llmCall3", llmCall3)
    .addNode("llmCallRouter", llmCallRouter)
    .addEdge("__start__", "llmCallRouter")
    .addConditionalEdges(
        "llmCallRouter",
        routeDecision,
        ["llmCall1", "llmCall2", "llmCall3"],
    )
    .addEdge("llmCall1", "__end__")
    .addEdge("llmCall2", "__end__")
    .addEdge("llmCall3", "__end__")
    .compile();

// 调用



export const routing = async () => {
    const state = await routerWorkflow.invoke({
        input: "Write me a joke about cats"
    });
    console.log(state.output);
}

