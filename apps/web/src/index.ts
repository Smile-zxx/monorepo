import { greet, add, createUser, User } from '@cursor-monorepo/shared';

console.log(greet('World'));
console.log(`2 + 3 = ${add(2, 3)}`);

const user: User = createUser('Alice', 'alice@example.com');
console.log('Created user:', user);
