#!/usr/bin/env node
/**
 * COCO - Command Orchestrator via Copilot Orchestration
 * 功能：
 * - 解析命令：coco "<任务描述>" [--plan] [--dry-run] [--list-tools] [--timeout <ms>] [--tool <name> --input '<json>']
 * - 调用 LLM 进行任务规划，输出 JSON 计划
 * - 注册/加载工具（内置 shell，自定义 tools/*.js）并按计划执行
 * - 支持 OpenAI 兼容接口（通过环境变量配置）
 */

/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// -----------------------------
// 实用函数
// -----------------------------
function logInfo(msg) { console.log(`[coco] ${msg}`); }
function logWarn(msg) { console.warn(`[coco][warn] ${msg}`); }
function logError(msg) { console.error(`[coco][error] ${msg}`); }

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    if (token.startsWith('--')) {
      const key = token.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) {
        args[key] = next;
        i += 1;
      } else {
        args[key] = true;
      }
    } else {
      args._.push(token);
    }
  }
  return args;
}

function readJSONSafe(text) {
  try {
    return JSON.parse(text);
  } catch (e) {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try { return JSON.parse(match[0]); } catch (_) { /* ignore */ }
    }
  }
  return null;
}

// -----------------------------
// 工具注册与加载
// -----------------------------
function createShellTool() {
  return {
    name: 'shell',
    description: '执行 shell 命令，输入形如 {"command":"echo hello", "timeoutMs":5000}'.
      replace(/\n/g, ' '),
    schema: {
      type: 'object',
      properties: {
        command: { type: 'string', description: '要执行的命令行字符串' },
        timeoutMs: { type: 'number', description: '超时毫秒，默认 300000(5min)' },
        cwd: { type: 'string', description: '工作目录，默认仓库根目录' }
      },
      required: ['command']
    },
    run: ({ command, timeoutMs, cwd }) => new Promise((resolve) => {
      const execTimeout = Number.isFinite(timeoutMs) ? Number(timeoutMs) : 300000;
      const options = { timeout: execTimeout, cwd: cwd || process.cwd(), shell: '/bin/zsh', maxBuffer: 1024 * 1024 * 20 };
      exec(command, options, (error, stdout, stderr) => {
        const result = {
          ok: !error,
          code: error && typeof error.code === 'number' ? error.code : 0,
          stdout: stdout || '',
          stderr: stderr || (error ? String(error) : '')
        };
        resolve(result);
      });
    })
  };
}

function loadCustomTools(toolsDir) {
  const toolList = [];
  try {
    if (!fs.existsSync(toolsDir)) return toolList;
    const files = fs.readdirSync(toolsDir).filter(f => f.endsWith('.js'));
    for (const file of files) {
      const full = path.join(toolsDir, file);
      try {
        // eslint-disable-next-line import/no-dynamic-require, global-require
        const mod = require(full);
        const tool = mod && (mod.default || mod.tool || mod);
        if (tool && tool.name && typeof tool.run === 'function') {
          toolList.push(tool);
        } else {
          logWarn(`忽略无效工具文件: ${file}`);
        }
      } catch (e) {
        logWarn(`加载工具失败 ${file}: ${e.message}`);
      }
    }
  } catch (e) {
    logWarn(`读取工具目录失败: ${e.message}`);
  }
  return toolList;
}

function buildToolRegistry() {
  const registry = new Map();
  const builtin = [createShellTool()];
  const customDir = path.join(process.cwd(), 'repoTools', 'tools');
  const custom = loadCustomTools(customDir);
  for (const t of [...builtin, ...custom]) {
    if (registry.has(t.name)) {
      logWarn(`重复工具名已被覆盖: ${t.name}`);
    }
    registry.set(t.name, t);
  }
  return registry;
}

// -----------------------------
// LLM 调用与规划
// -----------------------------
async function callLLMPlan(task, tools) {
  const apiKey = process.env.COCO_LLM_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('缺少 COCO_LLM_API_KEY 或 OPENAI_API_KEY');
  }
  const baseURL = process.env.COCO_LLM_BASE_URL || 'https://api.openai.com/v1';
  const model = process.env.COCO_LLM_MODEL || 'gpt-4o-mini';

  const toolsDesc = Array.from(tools.values()).map(t => ({
    name: t.name,
    description: t.description || '',
    schema: t.schema || null
  }));

  const system = [
    '你是任务规划与工具编排助手。',
    '根据用户目标与可用工具列表，输出严格 JSON：',
    '{"steps":[{"description":"...","tool":"name","input":{...}}],"stopOnError":true}',
    '仅输出 JSON，不要包含额外文本。'
  ].join('\n');

  const user = JSON.stringify({
    task,
    tools: toolsDesc
  });

  const url = `${baseURL.replace(/\/$/, '')}/chat/completions`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ],
      temperature: 0
    })
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`LLM 接口错误: ${resp.status} ${resp.statusText} - ${text}`);
  }
  const data = await resp.json();
  const content = data?.choices?.[0]?.message?.content || '';
  const plan = readJSONSafe(content);
  if (!plan || !Array.isArray(plan.steps)) {
    throw new Error('无法解析 LLM 返回的计划 JSON');
  }
  return plan;
}

// -----------------------------
// 执行计划
// -----------------------------
async function executePlan(plan, tools, options = {}) {
  const { dryRun = false } = options;
  const steps = Array.isArray(plan.steps) ? plan.steps : [];
  for (let i = 0; i < steps.length; i += 1) {
    const step = steps[i];
    const name = step.tool;
    const input = step.input || {};
    logInfo(`步骤 ${i + 1}/${steps.length}: ${step.description || ''} -> ${name}`);
    if (dryRun) continue;
    const tool = tools.get(name);
    if (!tool) {
      const msg = `未找到工具: ${name}`;
      if (plan.stopOnError !== false) throw new Error(msg);
      logWarn(msg);
      // eslint-disable-next-line no-continue
      continue;
    }
    try {
      // 工具执行
      // 工具规范：run(input, context?) => { ok:boolean, ... }
      const result = await tool.run(input, { logInfo, logWarn, logError });
      if (!result || result.ok === false) {
        const msg = `工具执行失败: ${name}`;
        if (plan.stopOnError !== false) throw new Error(msg);
        logWarn(`${msg}，继续后续步骤`);
      }
      // 打印结果的关键信息
      const printable = typeof result === 'object' ? JSON.stringify({ ...result, stdout: result.stdout?.slice(0, 2000), stderr: result.stderr?.slice(0, 2000) }, null, 2) : String(result);
      console.log(printable);
    } catch (e) {
      if (plan.stopOnError !== false) throw e;
      logWarn(`步骤异常已忽略: ${e.message}`);
    }
  }
}

// -----------------------------
// CLI 主逻辑
// -----------------------------
async function main() {
  const args = parseArgs(process.argv);
  const registry = buildToolRegistry();

  if (args.help || args.h) {
    console.log([
      '用法: node repoTools/coco.js "<任务描述>" [选项]',
      '选项:',
      '  --plan           仅打印规划 JSON，不执行',
      '  --dry-run        打印并模拟执行，不真正运行工具',
      '  --list-tools     列出可用工具',
      '  --tool <name>    直接调用某个工具（跳过 LLM）',
      '  --input <json>   与 --tool 搭配，传入 JSON 入参',
      '  --timeout <ms>   当使用 shell 工具时覆盖超时',
      '环境变量:',
      '  COCO_LLM_API_KEY / OPENAI_API_KEY',
      '  COCO_LLM_BASE_URL (默认 https://api.openai.com/v1)',
      '  COCO_LLM_MODEL (默认 gpt-4o-mini)'
    ].join('\n'));
    return;
  }

  if (args['list-tools']) {
    console.log('可用工具:');
    for (const t of registry.values()) {
      console.log(`- ${t.name}: ${t.description || ''}`);
    }
    return;
  }

  // 直接工具调用模式
  if (args.tool) {
    const tool = registry.get(args.tool);
    if (!tool) {
      logError(`未找到工具: ${args.tool}`);
      process.exit(1);
      return;
    }
    let input = {};
    if (args.input) {
      try { input = JSON.parse(args.input); } catch (e) {
        logError(`--input 不是合法 JSON: ${e.message}`);
        process.exit(1);
        return;
      }
    }
    if (tool.name === 'shell' && args.timeout) {
      input.timeoutMs = Number(args.timeout);
    }
    const result = await tool.run(input, { logInfo, logWarn, logError });
    const printable = typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result);
    console.log(printable);
    return;
  }

  const task = args._.join(' ').trim();
  if (!task) {
    logError('请提供任务描述，如: coco "在 apps/admin 下启动 dev 并输出日志"');
    process.exit(1);
    return;
  }

  logInfo(`任务: ${task}`);

  // 生成计划
  const plan = await callLLMPlan(task, registry);
  console.log(JSON.stringify(plan, null, 2));
  if (args.plan) return; // 仅展示计划

  const dryRun = Boolean(args['dry-run']);
  await executePlan(plan, registry, { dryRun });
}

main().catch((err) => {
  logError(err.stack || err.message || String(err));
  process.exit(1);
});


