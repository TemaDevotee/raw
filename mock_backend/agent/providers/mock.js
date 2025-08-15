const estimateTokens = require('../../utils/tokens')

class MockProvider {
  constructor() {
    this.name = 'mock'
    this.supportsStreaming = true
  }
  async generate(opts) {
    if (opts.systemPrompt && opts.systemPrompt.includes('[[FAIL]]')) {
      const err = new Error('Mock provider simulated failure')
      err.code = 'mock_failure'
      throw err
    }
    const reply = `Mock reply: ${opts.chat.messages[opts.chat.messages.length - 1]?.content || ''}`
    const tokensPrompt = estimateTokens(JSON.stringify(opts.chat.messages))
    const tokensCompletion = estimateTokens(reply)
    if (opts.onToken) {
      const chunkCount = 3 + Math.floor(Math.random() * 4)
      const size = Math.ceil(reply.length / chunkCount)
      for (let i = 0; i < chunkCount; i++) {
        const part = reply.slice(i * size, (i + 1) * size)
        if (!part) continue
        if (opts.abort?.aborted) throw new Error('aborted')
        await new Promise(r => setTimeout(r, 150 + Math.random() * 100))
        opts.onToken(part)
      }
    }
    return { text: reply, usage: { prompt: tokensPrompt, completion: tokensCompletion } }
  }
}

module.exports = { MockProvider }
