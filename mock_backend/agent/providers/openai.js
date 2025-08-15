const estimateTokens = require('../../utils/tokens')

class OpenAIProvider {
  constructor() {
    this.name = 'openai'
    this.supportsStreaming = true
    this.apiKey = process.env.OPENAI_API_KEY
    this.model = process.env.OPENAI_MODEL || 'gpt-4o-mini'
    this.baseUrl = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '')
  }
  async generate(opts) {
    const url = this.baseUrl + '/chat/completions'
    const body = {
      model: this.model,
      messages: [{ role: 'system', content: opts.systemPrompt }, ...opts.chat.messages],
      temperature: opts.temperature,
      max_tokens: opts.maxTokens,
      stream: true
    }
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + this.apiKey
      },
      body: JSON.stringify(body),
      signal: opts.abort
    })
    if (!res.ok || !res.body) throw new Error('openai_request_failed')
    let text = ''
    const decoder = new TextDecoder()
    for await (const chunk of res.body) {
      const lines = decoder.decode(chunk).split('\n')
      for (const line of lines) {
        if (!line.startsWith('data:')) continue
        const data = line.replace(/^data:\s*/, '')
        if (data === '[DONE]') break
        try {
          const json = JSON.parse(data)
          const delta = json.choices?.[0]?.delta?.content
          if (delta) {
            text += delta
            opts.onToken && opts.onToken(delta)
          }
        } catch (_) {}
      }
    }
    const usage = { prompt: estimateTokens(JSON.stringify(body.messages)), completion: estimateTokens(text) }
    return { text, usage }
  }
}

module.exports = { OpenAIProvider }
