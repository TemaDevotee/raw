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
      model: opts.model || this.model,
      messages: [{ role: 'system', content: opts.systemPrompt }, ...opts.chat.messages],
      temperature: opts.temperature,
      max_tokens: opts.maxTokens,
      stream: true,
      stream_options: { include_usage: true }
    }
    let text = ''
    let usage
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + this.apiKey
        },
        body: JSON.stringify(body),
        signal: opts.abort
      })
      if (!res.ok || !res.body) {
        await this.handleError(res)
      }
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
            if (json.usage) {
              usage = {
                prompt: json.usage.prompt_tokens,
                completion: json.usage.completion_tokens
              }
            }
          } catch (_) {}
        }
      }
      if (!usage) {
        usage = {
          prompt: estimateTokens(JSON.stringify(body.messages)),
          completion: estimateTokens(text),
          estimated: true
        }
      }
      return { text, usage }
    } catch (err) {
      if (err.name === 'AbortError') {
        const est = usage || {
          prompt: estimateTokens(JSON.stringify(body.messages)),
          completion: estimateTokens(text),
          estimated: true
        }
        err.code = 'aborted'
        err.usage = est
        throw err
      }
      if (!err.code) err.code = 'network_error'
      throw err
    }
  }

  async handleError(res) {
    let code = 'unknown'
    let message = `OpenAI error ${res.status}`
    try {
      const data = await res.json()
      message = data.error?.message || message
      const type = data.error?.type
      if (res.status === 401 || type === 'invalid_api_key') code = 'invalid_api_key'
      else if (res.status === 429) code = 'rate_limited'
      else if (res.status === 400 && type === 'context_length_exceeded') code = 'context_length_exceeded'
      else if (res.status >= 500) code = 'server_unavailable'
    } catch (_) {}
    const err = new Error(message)
    err.code = code
    throw err
  }
}

module.exports = { OpenAIProvider }
