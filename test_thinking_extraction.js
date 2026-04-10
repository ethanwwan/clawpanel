/**
 * 思考过程提取逻辑测试
 */

// 复制chat.js中的相关函数
function stripAnsi(text) {
  if (!text) return ''
  return text.replace(/\u001b\[[0-9;]*[A-Za-z]/g, '')
}

function extractThinking(text) {
  if (!text) return ''
  const safe = stripAnsi(text)
  const matches = []
  const regex = /<\s*think(?:ing)?\s*>[\s\S]*?<\s*\/\s*think(?:ing)?\s*>/gi
  let match
  while ((match = regex.exec(safe)) !== null) {
    const content = match[0]
      .replace(/<\s*think(?:ing)?\s*>/gi, '')
      .replace(/<\s*\/\s*think(?:ing)?\s*>/gi, '')
      .trim()
    if (content) matches.push(content)
  }
  return matches.join('\n\n')
}

function stripThinkingTags(text) {
  const safe = stripAnsi(text)
  return safe
    .replace(/<\s*think(?:ing)?\s*>[\s\S]*?<\s*\/\s*think(?:ing)?\s*>/gi, '')
    .replace(/Conversation info \(untrusted metadata\):\s*```json[\s\S]*?```\s*/gi, '')
    .replace(/\[Queued messages while agent was busy\]\s*---\s*Queued #\d+\s*/gi, '')
    .trim()
}

// 测试用例
const testCases = [
  {
    name: '基本思考标签',
    input: '<thinking>这是思考内容</thinking>最终回答',
    expectedThinking: '这是思考内容',
    expectedText: '最终回答'
  },
  {
    name: 'think标签',
    input: '<think>这是思考内容</think>最终回答',
    expectedThinking: '这是思考内容',
    expectedText: '最终回答'
  },
  {
    name: '带空格的标签',
    input: '< thinking >这是思考内容< / thinking >最终回答',
    expectedThinking: '这是思考内容',
    expectedText: '最终回答'
  },
  {
    name: '多行思考',
    input: '<thinking>思考第一行\n思考第二行</thinking>最终回答',
    expectedThinking: '思考第一行\n思考第二行',
    expectedText: '最终回答'
  },
  {
    name: '多个思考块',
    input: '<thinking>思考1</thinking>中间内容<thinking>思考2</thinking>最终回答',
    expectedThinking: '思考1\n\n思考2',
    expectedText: '中间内容最终回答'
  },
  {
    name: '无思考内容',
    input: '这是普通回答',
    expectedThinking: '',
    expectedText: '这是普通回答'
  },
  {
    name: '空思考标签',
    input: '<thinking></thinking>最终回答',
    expectedThinking: '',
    expectedText: '最终回答'
  }
]

// 运行测试
console.log('开始测试思考过程提取逻辑...')
let passed = 0
let failed = 0

testCases.forEach((testCase, index) => {
  const thinking = extractThinking(testCase.input)
  const text = stripThinkingTags(testCase.input)
  
  const thinkingPass = thinking === testCase.expectedThinking
  const textPass = text === testCase.expectedText
  
  if (thinkingPass && textPass) {
    console.log(`✅ 测试 ${index + 1}: ${testCase.name} - 通过`)
    passed++
  } else {
    console.log(`❌ 测试 ${index + 1}: ${testCase.name} - 失败`)
    if (!thinkingPass) {
      console.log(`   思考提取: 期望 "${testCase.expectedThinking}", 实际 "${thinking}"`)
    }
    if (!textPass) {
      console.log(`   文本提取: 期望 "${testCase.expectedText}", 实际 "${text}"`)
    }
    failed++
  }
})

console.log(`\n测试结果: ${passed} 通过, ${failed} 失败`)

// 检查是否有其他格式的思考内容
const additionalFormats = [
  {
    name: 'JSON格式思考',
    input: '{"type": "thinking", "content": "这是JSON格式的思考"}'
  },
  {
    name: 'Markdown代码块思考',
    input: '```thinking\n这是代码块格式的思考\n```'
  },
  {
    name: '注释格式思考',
    input: '// 这是注释格式的思考\n最终回答'
  },
  {
    name: 'HTML注释思考',
    input: '<!-- 这是HTML注释思考 -->最终回答'
  }
]

console.log('\n检查其他可能的思考格式...')
additionalFormats.forEach(format => {
  const thinking = extractThinking(format.input)
  console.log(`${format.name}: 提取结果 = "${thinking}"`)
})