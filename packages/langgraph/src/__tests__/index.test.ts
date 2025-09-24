import { add } from '../index';

describe('add 函数测试', () => {
  test('应该正确计算两个正数的和', () => {
    expect(add(2, 3)).toBe(5);
    expect(add(10, 20)).toBe(30);
    expect(add(0, 5)).toBe(5);
  });

  test('应该正确处理负数', () => {
    expect(add(-2, 3)).toBe(1);
    expect(add(-5, -3)).toBe(-8);
    expect(add(10, -7)).toBe(3);
  });

  test('应该正确处理零值', () => {
    expect(add(0, 0)).toBe(0);
    expect(add(5, 0)).toBe(5);
    expect(add(0, -3)).toBe(-3);
  });

  test('应该正确处理小数', () => {
    expect(add(1.5, 2.5)).toBe(4);
    expect(add(0.1, 0.2)).toBeCloseTo(0.3);
    expect(add(-1.5, 3.2)).toBeCloseTo(1.7);
  });

  test('应该正确处理大数', () => {
    expect(add(1000000, 2000000)).toBe(3000000);
    expect(add(999999, 1)).toBe(1000000);
  });

  test('应该返回 number 类型', () => {
    const result = add(1, 2);
    expect(typeof result).toBe('number');
  });

  test('边界情况测试', () => {
    // 最大安全整数测试
    expect(add(Number.MAX_SAFE_INTEGER, 0)).toBe(Number.MAX_SAFE_INTEGER);
    expect(add(Number.MAX_SAFE_INTEGER - 1, 1)).toBe(Number.MAX_SAFE_INTEGER);
    
    // 最小安全整数测试
    expect(add(Number.MIN_SAFE_INTEGER, 0)).toBe(Number.MIN_SAFE_INTEGER);
    expect(add(Number.MIN_SAFE_INTEGER + 1, -1)).toBe(Number.MIN_SAFE_INTEGER);
  });
});
