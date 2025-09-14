const consoleLog = (str) => {
  console.log(`[TEST] ${str}`);
};

const debugLog = (message, data) => {
  console.log(`[DEBUG] ${message}`, data || '');
};

const testFunction = (name) => {
  return `Hello from test package, ${name}!`;
};

const addNumbers = (a, b) => {
  return a + b;
};

const createTestConfig = (config = {}) => {
  return {
    enabled: true,
    timeout: 5000,
    retries: 3,
    ...config
  };
};

module.exports = {
  consoleLog,
  debugLog,
  testFunction,
  addNumbers,
  createTestConfig
};