import { describe, it, expect, vi } from 'vitest'
import { useStatusMenu } from '../statusMenu.js'

const options = [
  { value: 'live' },
  { value: 'paused' },
  { value: 'ended' },
]

describe('useStatusMenu', () => {
  it('opens and closes on document click', () => {
    const menu = useStatusMenu(options, vi.fn())
    menu.menuRef.value = { contains: () => false }
    menu.triggerRef.value = { contains: () => false, focus: vi.fn() }
    menu.toggle()
    expect(menu.open.value).toBe(true)
    menu.onDocumentClick({ target: {} })
    expect(menu.open.value).toBe(false)
  })

  it('navigates with arrows and selects', () => {
    const cb = vi.fn()
    const menu = useStatusMenu(options, cb)
    menu.toggle()
    menu.onKeydown({ key: 'ArrowDown', preventDefault: () => {} })
    expect(menu.focusIndex.value).toBe(1)
    menu.onKeydown({ key: 'Enter', preventDefault: () => {} })
    expect(cb).toHaveBeenCalledWith('paused')
  })

  it('esc closes and returns focus', () => {
    const cb = vi.fn()
    const menu = useStatusMenu(options, cb)
    const trigger = { focus: vi.fn() }
    menu.triggerRef.value = trigger
    menu.toggle()
    menu.onKeydown({ key: 'Escape', preventDefault: () => {} })
    expect(menu.open.value).toBe(false)
    expect(trigger.focus).toHaveBeenCalled()
  })
})
