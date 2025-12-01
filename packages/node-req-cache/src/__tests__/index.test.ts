
import { nodeReqCache } from '../index';

describe('nodeReqCache', () => {
  it('should merge duplicate requests', async () => {
    let callCount = 0;
    const slowFn = async (id: number) => {
      callCount++;
      await new Promise(resolve => setTimeout(resolve, 100));
      return id * 2;
    };

    const cachedFn = nodeReqCache(slowFn);

    const p1 = cachedFn(1);
    const p2 = cachedFn(1);
    const p3 = cachedFn(1);

    const results = await Promise.all([p1, p2, p3]);

    expect(results).toEqual([2, 2, 2]);
    expect(callCount).toBe(1); // Should be called once due to merging
  });

  it('should cache results in L1', async () => {
      let callCount = 0;
      const fn = async (id: number) => {
          callCount++;
          return id * 2;
      }
      const cachedFn = nodeReqCache(fn);
      
      await cachedFn(1);
      expect(callCount).toBe(1);
      
      await cachedFn(1);
      expect(callCount).toBe(1); // Should be cached
  });

  it('should use L2 if L1 is empty (simulated)', async () => {
      let callCount = 0;
      const fn = async (str: string) => {
          callCount++;
          return str.toUpperCase();
      };
      
      // L1 size 1.
      const cachedFn = nodeReqCache(fn, { l1CacheSize: 1 });
      
      // 1. Call with 'a'
      await cachedFn('a'); 
      expect(callCount).toBe(1);
      // L1: {a}, L2: {a}
      
      // 2. Call with 'b'
      await cachedFn('b'); 
      expect(callCount).toBe(2);
      // L1: {b} (a evicted), L2: {a, b}
      
      // 3. Call with 'a' again
      // Should be found in L2, so callCount shouldn't increase
      const res = await cachedFn('a');
      expect(res).toBe('A');
      expect(callCount).toBe(2); 
  });
});

