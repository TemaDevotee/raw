export function estimateTokensForText(text) {
  if (!text) return 0
  // eslint-disable-next-line no-control-regex
  const ascii = text.replace(/[^\x00-\x7F]/g, '  ')
  const chars = ascii.length
  return Math.ceil(chars / 4)
}

export function estimateForMessage({ system = '', prompt = '', tools = '' }) {
  const total =
    estimateTokensForText(system) +
    estimateTokensForText(prompt) +
    estimateTokensForText(tools || '')
  return total
}
