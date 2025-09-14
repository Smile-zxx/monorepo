export declare const consoleLog: (str: string) => void;
export declare const debugLog: (message: string, data?: any) => void;
export declare const testFunction: (name: string) => string;
export declare const addNumbers: (a: number, b: number) => number;

export interface TestConfig {
  enabled: boolean;
  timeout: number;
  retries: number;
}

export declare const createTestConfig: (config?: Partial<TestConfig>) => TestConfig;
