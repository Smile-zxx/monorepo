#!/usr/bin/env node

/**
 * Jest Demo 测试运行脚本
 * 用于演示和运行package包的测试
 */

const { execSync } = require('child_process');
const path = require('path');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(command, description) {
  log(`\n${colors.cyan}🚀 ${description}${colors.reset}`);
  log(`${colors.yellow}执行命令: ${command}${colors.reset}`);
  
  try {
    const output = execSync(command, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    log(`${colors.green}✅ ${description} 完成${colors.reset}`);
    return true;
  } catch (error) {
    log(`${colors.red}❌ ${description} 失败${colors.reset}`);
    log(`${colors.red}错误: ${error.message}${colors.reset}`);
    return false;
  }
}

function main() {
  log(`${colors.bright}${colors.magenta}
╔══════════════════════════════════════════════════════════════╗
║                    Jest Demo 测试演示                        ║
║                                                              ║
║  这个脚本演示如何运行monorepo中各个package的Jest测试         ║
╚══════════════════════════════════════════════════════════════╝
${colors.reset}`);

  const args = process.argv.slice(2);
  const command = args[0] || 'all';

  switch (command) {
    case 'all':
      runAllTests();
      break;
    case 'shared':
      runPackageTests('shared');
      break;
    case 'mylru':
      runPackageTests('mylru');
      break;
    case 'cachereq':
      runPackageTests('cachereq');
      break;
    case 'addtest':
      runPackageTests('addtest');
      break;
    case 'coverage':
      runCoverageTests();
      break;
    case 'watch':
      runWatchMode();
      break;
    case 'help':
      showHelp();
      break;
    default:
      log(`${colors.red}未知命令: ${command}${colors.reset}`);
      showHelp();
  }
}

function runAllTests() {
  log(`${colors.bright}${colors.blue}运行所有包的测试${colors.reset}`);
  
  const packages = ['shared', 'mylru', 'cachereq', 'addtest'];
  let successCount = 0;
  
  packages.forEach(pkg => {
    if (runPackageTests(pkg, false)) {
      successCount++;
    }
  });
  
  log(`\n${colors.bright}${colors.cyan}测试总结:${colors.reset}`);
  log(`${colors.green}成功: ${successCount}/${packages.length} 个包${colors.reset}`);
  
  if (successCount === packages.length) {
    log(`${colors.green}🎉 所有测试通过！${colors.reset}`);
  } else {
    log(`${colors.red}⚠️  有 ${packages.length - successCount} 个包的测试失败${colors.reset}`);
  }
}

function runPackageTests(packageName, showHeader = true) {
  if (showHeader) {
    log(`${colors.bright}${colors.blue}运行 ${packageName} 包的测试${colors.reset}`);
  }
  
  const packagePath = path.join('packages', packageName);
  return runCommand(
    `pnpm --filter @smileznpm/${packageName} test`,
    `${packageName} 包测试`
  );
}

function runCoverageTests() {
  log(`${colors.bright}${colors.blue}运行覆盖率测试${colors.reset}`);
  
  runCommand(
    'pnpm test:coverage',
    '生成测试覆盖率报告'
  );
  
  log(`${colors.cyan}覆盖率报告已生成在 coverage/ 目录中${colors.reset}`);
}

function runWatchMode() {
  log(`${colors.bright}${colors.blue}启动测试监听模式${colors.reset}`);
  log(`${colors.yellow}按 Ctrl+C 退出监听模式${colors.reset}`);
  
  runCommand(
    'pnpm test:watch',
    '测试监听模式'
  );
}

function showHelp() {
  log(`${colors.bright}${colors.cyan}
使用方法:
  node scripts/test-demo.js [command]

可用命令:
  ${colors.green}all${colors.reset}      - 运行所有包的测试 (默认)
  ${colors.green}shared${colors.reset}   - 运行 shared 包的测试
  ${colors.green}mylru${colors.reset}    - 运行 mylru 包的测试
  ${colors.green}cachereq${colors.reset} - 运行 cachereq 包的测试
  ${colors.green}addtest${colors.reset}  - 运行 addtest 包的测试
  ${colors.green}coverage${colors.reset} - 生成测试覆盖率报告
  ${colors.green}watch${colors.reset}    - 启动测试监听模式
  ${colors.green}help${colors.reset}     - 显示此帮助信息

示例:
  node scripts/test-demo.js all
  node scripts/test-demo.js shared
  node scripts/test-demo.js coverage
${colors.reset}`);
}

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
  log(`${colors.red}未捕获的异常: ${error.message}${colors.reset}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  log(`${colors.red}未处理的Promise拒绝: ${reason}${colors.reset}`);
  process.exit(1);
});

// 运行主函数
main();
