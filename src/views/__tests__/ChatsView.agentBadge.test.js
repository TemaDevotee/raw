import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Agent badge markup', () => {
  it('ChatsView includes AgentBadge component', () => {
    const src = fs.readFileSync(path.resolve('src/views/ChatsView.vue'), 'utf8')
    expect(src).toMatch('<AgentBadge')
  })
  it('AgentBadge exposes title and mobile size', () => {
    const src = fs.readFileSync(path.resolve('src/components/AgentBadge.vue'), 'utf8')
    expect(src).toMatch('title="')
    expect(src).toMatch('@media (max-width: 640px)')
  })
})
