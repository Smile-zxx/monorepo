export const greet = (name: string): string => {
  return `Hello, ${name}!`;
};

export const add = (a: number, b: number): number => {
  return a + b;
};

export interface User {
  id: string;
  name: string;
  email: string;
}

export const createUser = (name: string, email: string): User => {
  return {
    id: Math.random().toString(36).substr(2, 9),
    name,
    email
  };
};
