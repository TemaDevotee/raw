import { test as base } from '@playwright/test';
import { mockRoutes } from './mocks/routes';

base.beforeEach(async ({ page }) => {
  await mockRoutes(page);
});
