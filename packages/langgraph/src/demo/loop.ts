import { z } from "zod";
import { Annotation, StateGraph } from "@langchain/langgraph";
import { doubaoModel, freeModel } from "../utils/commpn";

// 图状态
const StateAnnotation = Annotation.Root({
    joke: Annotation<string>,
    topic: Annotation<string>,
    feedback: Annotation<string>,
    funnyOrNot: Annotation<string>,
});
// 用于评估的结构化输出模式
const feedbackSchema = z.object({
    grade: z.enum(["funny", "not funny"]).describe(
        "判断笑话是否有趣"
    ),
    feedback: z.string().describe(
        "如果笑话不有趣，提供如何改进的反馈"
    ),
});

// 使用结构化输出模式增强LLM
const evaluator = doubaoModel.withStructuredOutput(feedbackSchema);

// 节点
async function llmCallGenerator(state: typeof StateAnnotation.State) {
    // LLM生成笑话
    let msg;
    if (state.feedback) {
        msg = await freeModel.invoke(
            `写一个关于 ${state.topic} 的笑话，同时考虑以下反馈内容: ${state.feedback}`
        );
    } else {
        msg = await freeModel.invoke(`写一个关于 ${state.topic} 的笑话`);
    }
    console.log("笑话:", msg.content);
    return { joke: msg.content };
}

async function llmCallEvaluator(state: typeof StateAnnotation.State) {
    // LLM评估笑话
    const grade = await evaluator.invoke(`Grade the joke ${state.joke}`);
    console.log("评估:", grade);
    return { funnyOrNot: grade.grade, feedback: grade.feedback };
}

// 条件边函数，根据评估者的反馈路由回笑话生成器或结束
function routeJoke(state: typeof StateAnnotation.State) {
    // 根据评估者的反馈路由回笑话生成器或结束
    if (state.funnyOrNot === "funny") {
        return "Accepted";
    } else if (state.funnyOrNot === "not funny") {
        return "Rejected + Feedback";
    } else {
        return "Accepted"
    }
}

// 构建工作流
const optimizerWorkflow = new StateGraph(StateAnnotation)
    .addNode("llmCallGenerator", llmCallGenerator)
    .addNode("llmCallEvaluator", llmCallEvaluator)
    .addEdge("__start__", "llmCallGenerator")
    .addEdge("llmCallGenerator", "llmCallEvaluator")
    .addConditionalEdges(
        "llmCallEvaluator",
        routeJoke,
        {
            // routeJoke返回的名称 : 要访问的下一个节点名称
            "Accepted": "__end__",
            "Rejected + Feedback": "llmCallGenerator",
        }
    )
    .compile();

// 调用

export const loop = async () => {
    const state = await optimizerWorkflow.invoke({ topic: "傻子" });
    console.log(state.joke);
}