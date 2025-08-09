import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

const chatsViewSrc = fs.readFileSync(path.resolve(__dirname, '../ChatsView.vue'), 'utf8')
const chatWindowSrc = fs.readFileSync(path.resolve(__dirname, '../ChatWindow.vue'), 'utf8')

describe('SLA chip markup', () => {
  it('ChatsView includes SLA chip', () => {
    expect(chatsViewSrc).toMatch('sla-chip')
  })
  it('ChatWindow includes SLA chip', () => {
    expect(chatWindowSrc).toMatch('sla-chip')
  })
})
