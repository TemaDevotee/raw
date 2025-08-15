const { MockProvider } = require('./providers/mock')
const { OpenAIProvider } = require('./providers/openai')

function getProvider(kind) {
  if (kind === 'openai' && process.env.OPENAI_API_KEY) {
    return new OpenAIProvider()
  }
  return new MockProvider()
}

module.exports = { getProvider }
