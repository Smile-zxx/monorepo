import { Annotation, StateGraph } from "@langchain/langgraph";
import { freeModel } from "../utils/commpn";

const model = freeModel


// 图状态
const StateAnnotation = Annotation.Root({
    topic: Annotation<string>,
    joke: Annotation<string>,
    story: Annotation<string>,
    poem: Annotation<string>,
    combinedOutput: Annotation<string>,
});

// 节点
// 第一次LLM调用生成初始笑话
async function callLlm1(state: typeof StateAnnotation.State) {
    const msg = await model.invoke(`Write a joke about ${state.topic}`);
    return { joke: msg.content };
}

// 第二次LLM调用生成故事
async function callLlm2(state: typeof StateAnnotation.State) {
    const msg = await model.invoke(`Write a story about ${state.topic}`);
    return { story: msg.content };
}

// 第三次LLM调用生成诗歌
async function callLlm3(state: typeof StateAnnotation.State) {
    const msg = await model.invoke(`Write a poem about ${state.topic}`);
    return { poem: msg.content };
}

// 将笑话、故事和诗歌合并为单个输出
async function aggregator(state: typeof StateAnnotation.State) {
    const combined = `Here's a story, joke, and poem about ${state.topic}!\n\n` +
        `STORY:\n${state.story}\n\n` +
        `JOKE:\n${state.joke}\n\n` +
        `POEM:\n${state.poem}`;
    return { combinedOutput: combined };
}

// 构建工作流
const parallelWorkflow = new StateGraph(StateAnnotation)
    .addNode("callLlm1", callLlm1)
    .addNode("callLlm2", callLlm2)
    .addNode("callLlm3", callLlm3)
    .addNode("aggregator", aggregator)
    .addEdge("__start__", "callLlm1")
    .addEdge("__start__", "callLlm2")
    .addEdge("__start__", "callLlm3")
    .addEdge("callLlm1", "aggregator")
    .addEdge("callLlm2", "aggregator")
    .addEdge("callLlm3", "aggregator")
    .addEdge("aggregator", "__end__")
    .compile();

// 调用

export const multillm = async () => {
    // const result = await agent.invoke({
    //     messages: [
    //         {
    //             role: "user",
    //             content: "你好啊",
    //         },
    //     ],
    // });
    // console.log(result);
    const result = await parallelWorkflow.invoke({ topic: "cats" });
    console.log(result.combinedOutput);
}



