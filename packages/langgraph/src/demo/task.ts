import { z } from "zod";
import { Annotation, StateGraph } from "@langchain/langgraph";
import { doubaoModel, freeModel } from "../utils/commpn";

// 图状态

const TaskState = Annotation.Root({
    initialTask: Annotation<string>, // 初始任务描述
    finishedTasks: Annotation<string[]>, // 所有的任务，可能包含子任务
    penddingTasks: Annotation<string[]>, // 所有的任务，可能包含子任务
    result: Annotation<string>
});

const MAXTASKCOUNT = 10;

async function taskInit(state: typeof TaskState.State) {
    // LLM生成笑话
    const { initialTask } = state;
    // 生成任务列表
    // 使用结构化输出模式增强LLM
    const taskGenerator = doubaoModel.withStructuredOutput(z.array(z.string()).describe(
        "任务列表"
    ))
    const tasks = await taskGenerator.invoke(
        `请根据以下任务描述${initialTask}，分解为不超过5个可执行的子任务`
    )
    console.log("taskInit:", tasks);
    return {
        ...state,
        penddingTasks: tasks,

    };

}
async function taskUpdate(state: typeof TaskState.State) {
    const { initialTask,
        finishedTasks,
        penddingTasks,
    } = state;


    if ((finishedTasks && finishedTasks.length >= MAXTASKCOUNT) || (penddingTasks && penddingTasks.length === 0)) {
        return {
            ...state,
            penddingTasks: [], // 清空 penddingTasks
        };
    }

    // 1. 任务进行中，需要调用大模型对当前的结果和剩余的任务进行评估是否需要调整任务
    if (finishedTasks && finishedTasks.length > 0 && penddingTasks && penddingTasks.length > 0) {
        // 使用withStructuredOutput定义结构化输出模式
        const evalSchema = z.object({
            newTasks: z.array(z.string()).describe("新的任务列表"),
            reason: z.string().describe("调整理由")
        });
        const evalModel = doubaoModel.withStructuredOutput(evalSchema);
        const evalRes = await evalModel.invoke(
            `初始目标任务为${initialTask}，当前已完成的任务有：${finishedTasks.join("")}。\n剩余待完成的任务有：${penddingTasks.join("，")}。\n请判断是否需要调整剩余任务列表（如果缺乏使用注意事项，需要增加相关任务,如有需要请返回新的任务列表，否则返回原任务列表），并简要说明理由。请以如下JSON格式返回：{"newTasks": [...], "reason": "xxx"}`
        );

        console.log("taskUpdate:", evalRes.newTasks);
        console.log("taskUpdate:", evalRes.reason);

        return {
            ...state,
            penddingTasks: evalRes.newTasks || [],
            finishedTasks,
        };
    }

    return state
}

async function taskExecute(state: typeof TaskState.State) {
    const { penddingTasks, finishedTasks, initialTask } = state;
    // 从待办任务中取出一个任务
    if (!penddingTasks || penddingTasks.length === 0) {
        return state;
    }
    const curTask = penddingTasks[0];

    // 调用大模型执行当前任务
    const taskResult = await freeModel.invoke(`初始目标任务为${initialTask}，当前已完成的任务有：${finishedTasks.join("，")}。\n剩余待完成的任务有：${penddingTasks.join("，")}。\n请完成如下任务: ${curTask}`);

    // 更新已完成任务，将任务和结果一起存入finishedTasks
    const finishedTaskItem = `<${curTask}> ${taskResult.content || ""}</${curTask}>\n`
    const newFinishedTasks = Array.isArray(finishedTasks) ? [...finishedTasks, finishedTaskItem] : [finishedTaskItem];

    // 更新待办任务，移除已完成的任务
    const newPenddingTasks = penddingTasks.slice(1);
    console.log("taskExecute:", finishedTaskItem);

    return {
        ...state,
        penddingTasks: newPenddingTasks,
        finishedTasks: newFinishedTasks,
    };
}

async function generateResult(state: typeof TaskState.State) {
    const { finishedTasks, initialTask } = state;
    const msgRes = await freeModel.invoke(`初始目标任务为${initialTask}\n当前已完成的任务有：${finishedTasks.join("\n")}。\n请生成最终结果。`);
    console.log("generateResult");
    return {
        ...state,
        result: msgRes.content,
    };
}

function routeNode(state: typeof TaskState.State) {
    let res = "taskExecute"
    if (state.penddingTasks && state.penddingTasks.length === 0) {
        res = "generateResult";
    }
    console.log("routeNode:", res);
    return res;
}


// 构建工作流
const optimizerWorkflow = new StateGraph(TaskState)
    .addNode("taskInit", taskInit)
    .addNode("taskExecute", taskExecute)
    .addNode("taskUpdate", taskUpdate)
    .addNode("generateResult", generateResult)
    .addEdge("__start__", "taskInit")
    .addEdge("taskInit", "taskExecute")
    .addEdge("taskExecute", "taskUpdate")
    .addConditionalEdges(
        "taskUpdate",
        routeNode,
        ["generateResult", "taskExecute"]
    )
    .addEdge("generateResult", "__end__")
    .compile();

// 调用

export const task = async () => {
    const state = await optimizerWorkflow.invoke({
        initialTask: "调研一下langgraph的用法", // 初始任务描述
        finishedTasks: [], // 所有的任务，可能包含子任务
        penddingTasks: [], // 所有的任务，可能包含子任务
    });
    console.log(state.result);
}