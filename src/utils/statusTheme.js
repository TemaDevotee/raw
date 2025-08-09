export const STATUS_THEME = {
  attention: {
    color: '#EF4444',
    gradient: 'linear-gradient(to right, #FB923C, #EF4444)'
  },
  live: {
    color: '#22C55E',
    gradient: 'linear-gradient(to right, #34D399, #22C55E)'
  },
  paused: {
    color: '#F59E0B',
    gradient: 'linear-gradient(to right, #FBBF24, #F59E0B)'
  },
  resolved: {
    color: '#84CC16',
    gradient: 'linear-gradient(to right, #A3E635, #84CC16)'
  },
  ended: {
    color: '#9CA3AF',
    gradient: 'linear-gradient(to right, #F87171, #EF4444)'
  },
  idle: {
    color: '#9CA3AF',
    gradient: 'linear-gradient(to right, #e5e7eb, #d1d5db)'
  }
}

export function statusColor(status) {
  return STATUS_THEME[status]?.color || STATUS_THEME.idle.color
}

export function statusGradient(status) {
  return STATUS_THEME[status]?.gradient || STATUS_THEME.idle.gradient
}

export function badgeColor(status) {
  return `${statusColor(status)}33`
}
