import { greet, add, createUser, User } from '../index';

describe('Shared Package Tests', () => {
  describe('greet function', () => {
    it('should return a greeting message with the provided name', () => {
      const result = greet('World');
      expect(result).toBe('Hello, World!');
    });

    it('should handle empty string', () => {
      const result = greet('');
      expect(result).toBe('Hello, !');
    });

    it('should handle special characters', () => {
      const result = greet('测试用户');
      expect(result).toBe('Hello, 测试用户!');
    });
  });

  describe('add function', () => {
    it('should add two positive numbers correctly', () => {
      expect(add(2, 3)).toBe(5);
      expect(add(10, 20)).toBe(30);
      expect(add(0, 5)).toBe(5);
    });

    it('should add negative numbers correctly', () => {
      expect(add(-2, -3)).toBe(-5);
      expect(add(-10, 5)).toBe(-5);
    });

    it('should handle decimal numbers', () => {
      expect(add(1.5, 2.5)).toBe(4);
      expect(add(0.1, 0.2)).toBeCloseTo(0.3);
    });

    it('should handle zero', () => {
      expect(add(0, 0)).toBe(0);
      expect(add(5, 0)).toBe(5);
      expect(add(0, 5)).toBe(5);
    });
  });

  describe('createUser function', () => {
    it('should create a user with valid properties', () => {
      const user = createUser('John Doe', 'john@example.com');
      
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('name');
      expect(user).toHaveProperty('email');
      expect(user.name).toBe('John Doe');
      expect(user.email).toBe('john@example.com');
    });

    it('should generate unique IDs for different users', () => {
      const user1 = createUser('User 1', 'user1@example.com');
      const user2 = createUser('User 2', 'user2@example.com');
      
      expect(user1.id).not.toBe(user2.id);
    });

    it('should handle empty strings', () => {
      const user = createUser('', '');
      expect(user.name).toBe('');
      expect(user.email).toBe('');
      expect(user.id).toBeTruthy();
    });

    it('should return correct User interface type', () => {
      const user = createUser('Test User', 'test@example.com');
      
      // TypeScript interface validation
      const userInterface: User = user;
      expect(userInterface.id).toBeDefined();
      expect(userInterface.name).toBeDefined();
      expect(userInterface.email).toBeDefined();
    });
  });

  describe('Integration tests', () => {
    it('should work together in a real scenario', () => {
      const user = createUser('Alice', 'alice@example.com');
      const greeting = greet(user.name);
      const total = add(user.name.length, user.email.length);
      
      expect(greeting).toBe('Hello, Alice!');
      expect(total).toBe(16); // "Alice" (5) + "alice@example.com" (17)
    });
  });

  describe('Edge cases', () => {
    it('should handle very long strings', () => {
      const longName = 'A'.repeat(1000);
      const result = greet(longName);
      expect(result).toBe(`Hello, ${longName}!`);
    });

    it('should handle numbers at the limit', () => {
      expect(add(Number.MAX_SAFE_INTEGER, 0)).toBe(Number.MAX_SAFE_INTEGER);
      expect(add(Number.MIN_SAFE_INTEGER, 0)).toBe(Number.MIN_SAFE_INTEGER);
    });
  });
});
