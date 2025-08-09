export async function mockRoutes(page) {
  await page.route('**/api/**', route => {
    route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });
}
