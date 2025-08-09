export function sortParticipants(list = []) {
  return [...list].sort((a, b) => {
    if (a.role !== b.role) {
      return a.role === 'operator' ? -1 : 1
    }
    return a.name.localeCompare(b.name)
  })
}

export function initials(name = '') {
  return name
    .split(/\s+/)
    .map((n) => n.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('')
}
