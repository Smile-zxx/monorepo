const fs = require('fs');
const path = require('path');
const readline = require('readline');

function ask(question) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    return new Promise(resolve => rl.question(question, ans => {
        rl.close();
        resolve(ans.trim());
    }));
}

async function main() {
    console.log('=== 新建 Monorepo Package ===');
    const packagesDir = path.resolve(__dirname, '../packages');
    if (!fs.existsSync(packagesDir)) {
        console.error('未找到 packages 目录');
        process.exit(1);
    }

    let name = await ask('请输入新包名（如 my-utils）：');
    if (!name) {
        console.log('包名不能为空');
        process.exit(1);
    }
    name = name.replace(/[^a-zA-Z0-9-_]/g, '');
    const pkgPath = path.join(packagesDir, name);

    if (fs.existsSync(pkgPath)) {
        console.log('该包已存在');
        process.exit(1);
    }

    let desc = await ask('请输入包描述（可选）：');
    let author = await ask('请输入作者（可选）：');

    fs.mkdirSync(pkgPath, { recursive: true });
    fs.mkdirSync(path.join(pkgPath, 'src'));

    const pkgJson = {
        name: `@smileznpm/${name}`,
        version: "0.0.1",
        description: desc || "",
        main: "dist/index.js",
        types: "dist/index.d.ts",
        scripts: {
            build: "tsc",
            dev: "tsc --watch",
            test: "echo \"No test specified\" && exit 0"
        },
        author: author || "",
        license: "MIT",
        "devDependencies": {
            "typescript": "^5.3.0"
        }
    };

    fs.writeFileSync(
        path.join(pkgPath, 'package.json'),
        JSON.stringify(pkgJson, null, 2)
    );

    fs.writeFileSync(
        path.join(pkgPath, 'src', 'index.ts'),
        `// ${desc || name} 入口\n`
    );

    fs.writeFileSync(
        path.join(pkgPath, 'README.md'),
        `# @smileznpm/${name}\n\n${desc}\n`
    );

    // 创建 tsconfig.json
    const tsconfig = {
        "compilerOptions": {
            "target": "ES2020",
            "module": "CommonJS",
            "lib": ["ES2020"],
            "outDir": "./dist",
            "rootDir": "./src",
            "strict": true,
            "esModuleInterop": true,
            "skipLibCheck": true,
            "forceConsistentCasingInFileNames": true,
            "declaration": true,
            "declarationMap": true,
            "sourceMap": true
        },
        "include": ["src/**/*"],
        "exclude": ["node_modules", "dist"]
    };

    fs.writeFileSync(
        path.join(pkgPath, 'tsconfig.json'),
        JSON.stringify(tsconfig, null, 2)
    );

    console.log(`包已创建：packages/${name}`);
    console.log('已自动创建 tsconfig.json 文件');
    console.log('请根据需要补充 package.json 和实现代码。');
}

main();
