import { greet, add, createUser, User } from '@smileznpm/shared-utils';
import { consoleLog, debugLog, testFunction, addNumbers, createTestConfig } from '@cursor-monorepo/test';

console.log(greet('World'));
console.log(`2 + 3 = ${add(2, 3)}`);

const user: User = createUser('Alice', 'alice@example.com');
console.log('Created user:', user);

// 使用 test 包的功能
consoleLog('This is a test message from the test package!');
debugLog('Debug information', { userId: user.id, timestamp: new Date() });
console.log(testFunction('Developer'));
console.log(`Test calculation: 10 + 5 = ${addNumbers(10, 5)}`);

const testConfig = createTestConfig({ timeout: 10000, retries: 5 });
console.log('Test configuration:', testConfig);
