module.exports = function estimateTokens(text = '') {
  return Math.ceil((text || '').length / 4)
}
