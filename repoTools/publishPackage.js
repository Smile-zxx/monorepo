const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync } = require('child_process');

/**
 * 读取 NPM token
 */
function getNpmToken() {
    const tokenPath = path.resolve(__dirname, '../configs/npmtoken');
    if (!fs.existsSync(tokenPath)) {
        console.error('未找到 NPM token 文件: configs/npmtoken');
        process.exit(1);
    }
    return fs.readFileSync(tokenPath, 'utf8').trim();
}

/**
 * 获取 packages 目录下所有包名
 */
function getAllPackages() {
    const packagesDir = path.resolve(__dirname, '../packages');
    if (!fs.existsSync(packagesDir)) {
        console.error('未找到 packages 目录');
        process.exit(1);
    }
    const dirs = fs.readdirSync(packagesDir).filter(d => {
        const full = path.join(packagesDir, d);
        return fs.statSync(full).isDirectory() && fs.existsSync(path.join(full, 'package.json'));
    });
    return dirs.map(d => {
        const pkgJson = require(path.join(packagesDir, d, 'package.json'));
        return {
            dir: d,
            name: pkgJson.name,
            version: pkgJson.version,
            description: pkgJson.description || ''
        };
    });
}

/**
 * 命令行多选
 */
function askSelect(packages) {
    return new Promise(resolve => {
        console.log('请选择要发布的包（用逗号分隔序号，多选如 1,3）：');
        packages.forEach((pkg, idx) => {
            console.log(`${idx + 1}) ${pkg.name} (${pkg.version}) - ${pkg.description}`);
        });
        console.log(`${packages.length + 1}) 全部`);
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        rl.question('输入序号: ', ans => {
            rl.close();
            let indexes = ans.split(',').map(s => s.trim()).filter(Boolean);
            if (indexes.includes(String(packages.length + 1))) {
                resolve(packages);
            } else {
                const selected = [];
                for (let i of indexes) {
                    const idx = parseInt(i, 10) - 1;
                    if (idx >= 0 && idx < packages.length) {
                        selected.push(packages[idx]);
                    }
                }
                resolve(selected);
            }
        });
    });
}

/**
 * 发布单个包
 */
function publishPackage(pkg) {
    const pkgPath = path.resolve(__dirname, '../packages', pkg.dir);
    const pkgJsonPath = path.join(pkgPath, 'package.json');
    const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));

    // 计算下一个 patch 版本
    const [major, minor, patch] = String(pkgJson.version || '0.0.0').split('.').map(n => parseInt(n, 10) || 0);
    const nextVersion = `${major}.${minor}.${patch + 1}`;
    pkgJson.version = nextVersion;
    fs.writeFileSync(pkgJsonPath, JSON.stringify(pkgJson, null, 2));

    console.log(`\n正在发布: ${pkg.name} (${pkg.version} -> ${nextVersion})`);
    try {
        execSync('pnpm build', { cwd: pkgPath, stdio: 'inherit' });
    } catch (e) {
        console.error(`构建失败: ${pkg.name}`);
        return;
    }
    try {
        const npmToken = getNpmToken();
        execSync(`NPM_TOKEN=${npmToken} npm publish --access public`, { cwd: pkgPath, stdio: 'inherit' });
        console.log(`✅ 发布成功: ${pkg.name}@${nextVersion}`);
    } catch (e) {
        console.error(`❌ 发布失败: ${pkg.name}`);
    }
}

/**
 * 主流程
 */
async function main() {
    console.log('=== Monorepo 包发布工具 ===');
    const pkgs = getAllPackages();
    if (pkgs.length === 0) {
        console.log('没有可发布的包');
        return;
    }
    const selected = await askSelect(pkgs);
    if (!selected.length) {
        console.log('未选择任何包，已退出。');
        return;
    }
    for (const pkg of selected) {
        publishPackage(pkg);
    }
}

main();
