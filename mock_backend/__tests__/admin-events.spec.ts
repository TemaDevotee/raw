import { describe, it, expect } from 'vitest'
import { subscribe, emit, unsubscribe } from '../utils/eventBus'

describe('event bus', () => {
  it('delivers events to subscribers', () => {
    const events: any[] = []
    const fn = (e: any) => events.push(e)
    subscribe('t1', fn)
    emit('t1', { type: 'message:new', chatId: 'c1', message: { id: 'm1' } })
    emit('t1', { type: 'draft:removed', chatId: 'c1', draftId: 'd1' })
    unsubscribe('t1', fn)
    expect(events.length).toBe(2)
    expect(events[0].type).toBe('message:new')
    expect(events[1].type).toBe('draft:removed')
  })
})
