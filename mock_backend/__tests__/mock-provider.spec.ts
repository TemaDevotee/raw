import { describe, it, expect } from 'vitest'
const { MockProvider } = require('../agent/providers/mock')

function baseOpts() {
  return {
    chat: { messages: [{ content: 'hello' }] },
    systemPrompt: 'test',
    temperature: 0,
    maxTokens: 10
  }
}

describe('MockProvider', () => {
  it('streams chunks', async () => {
    const chunks: string[] = []
    const provider = new MockProvider()
    await provider.generate({ ...baseOpts(), onToken: (d: string) => chunks.push(d) })
    expect(chunks.length).toBeGreaterThan(0)
  })
  it('fails when [[FAIL]] present', async () => {
    const provider = new MockProvider()
    await expect(provider.generate({ ...baseOpts(), systemPrompt: '[[FAIL]]' })).rejects.toHaveProperty('code', 'mock_failure')
  })
})
