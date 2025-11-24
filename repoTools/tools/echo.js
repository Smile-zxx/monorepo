/* eslint-disable no-console */
module.exports = {
  name: 'echo',
  description: '打印输入文本，输入形如 {"text":"hello"}',
  schema: {
    type: 'object',
    properties: {
      text: { type: 'string', description: '要打印的文本' }
    },
    required: ['text']
  },
  run: async ({ text }) => {
    const content = String(text ?? '');
    console.log(content);
    return { ok: true, echoed: content };
  }
};



