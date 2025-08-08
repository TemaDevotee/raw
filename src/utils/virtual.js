export function computeWindow(length, itemHeight, height, scrollTop, overscan = 6) {
  const visible = Math.ceil(height / itemHeight) + overscan
  const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
  const end = Math.min(length, start + visible)
  return { start, end }
}
