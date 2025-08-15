const estimateTokens = require('../../utils/tokens')

class MockProvider {
  constructor() {
    this.name = 'mock'
    this.supportsStreaming = true
  }
  async generate(opts) {
    const reply = `Echo: ${opts.chat.messages[opts.chat.messages.length - 1]?.content || ''}`
    const text = reply
    const tokensPrompt = estimateTokens(JSON.stringify(opts.chat.messages))
    const tokensCompletion = estimateTokens(text)
    if (opts.onToken) {
      for (const ch of text.split('')) {
        if (opts.abort?.aborted) throw new Error('aborted')
        await new Promise(r => setTimeout(r, 20))
        opts.onToken(ch)
      }
    }
    return { text, usage: { prompt: tokensPrompt, completion: tokensCompletion } }
  }
}

module.exports = { MockProvider }
