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
        { id: '1', title: 'Chat 1', status: 'live' },
        { id: '2', title: 'Chat 2', status: 'attention' },
        { id: '3', title: 'Chat 3', status: 'paused' },
      ],
    });
  });

  await page.route('**/api/workspaces*', (route) => {
    route.fulfill({ json: workspaces });
  });

  await page.route('**/presence*', (route) => {
    route.fulfill({ json: {} });
  });

  await page.route('**/api/**', (route) => {
    route.fulfill({ json: {} });
  });
}
