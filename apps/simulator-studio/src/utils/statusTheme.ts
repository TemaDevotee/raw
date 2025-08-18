export type ChatStatus = 'attention' | 'live' | 'paused' | 'resolved' | 'ended' | string;

export function statusTheme(status?: ChatStatus) {
  const map: Record<string, { from: string; to: string }> = {
    attention: { from: '24 94% 62%', to: '0 72% 60%' },
    live: { from: '174 63% 40%', to: '142 69% 45%' },
    paused: { from: '38 92% 55%', to: '24 90% 50%' },
    resolved: { from: '90 70% 55%', to: '72 65% 45%' },
    ended: { from: '0 0% 70%', to: '0 0% 60%' },
  };
  const pair = map[status || ''] || map.ended;
  return {
    '--st-from': pair.from,
    '--st-to': pair.to,
    background:
      'linear-gradient(90deg, hsl(var(--st-from)) 0%, hsl(var(--st-to)) 100%)',
  } as Record<string, string>;
}
