import langStore from '@/stores/langStore.js'

export function typingText(names) {
  if (!names || names.length === 0) return ''
  if (names.length === 1) return langStore.t('someoneTyping', { name: names[0] })
  return langStore.t('severalTyping')
}

