export async function mockRoutes(page, opts = {}) {
  const workspaces = opts.workspaces === 2
    ? [
        { id: 'ws1', name: 'Default' },
        { id: 'ws2', name: 'Secondary' },
      ]
    : [{ id: 'ws1', name: 'Default' }];

  await page.route('**/api/auth/session', (route) => {
    route.fulfill({
      json: { user: { id: 'u1', name: 'Test User' } },
    });
  });

  await page.route('**/api/chats*', (route) => {
    route.fulfill({
      json: [
        { id: '1', clientName: 'Chat 1', lastMessage: 'Hello', time: '1m ago', status: 'live', channels: ['web'], agentId: 1 },
        {
          id: '2',
          clientName: 'Chat 2',
          lastMessage: 'Hi',
          time: '2m ago',
          status: 'attention',
          channels: ['web'],
          agentId: 1,
        },
        { id: '3', clientName: 'Chat 3', lastMessage: 'Yo', time: '3m ago', status: 'paused', channels: ['web'], agentId: 1 },
      ],
    });
  });

  await page.route('**/api/workspaces*', (route) => {
    route.fulfill({ json: workspaces });
  });

  await page.route('**/presence*', (route) => {
    route.fulfill({ json: [] });
  });

  await page.route('**/api/**', (route) => {
    route.fulfill({ json: {} });
  });
}
