import { main } from '../index';

describe('add 函数测试', () => {
  test('main', async () => {
    await main();
  }, 300000); // 设置300秒超时
});
