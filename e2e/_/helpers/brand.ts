import { expect, Page } from '@playwright/test'

export async function expectBrandColor(page: Page) {
  const brand = page.locator('[data-test="sidebar-brand-mark"]')
  await expect(brand).toBeVisible()
  const sidebar = page
    .locator('aside[role="navigation"], aside[aria-label="Sidebar"], .sidebar')
    .first()
  await expect(sidebar).toBeVisible()
  const [brandColor, sidebarColor] = await Promise.all([
    brand.evaluate((el) => getComputedStyle(el as HTMLElement).color),
    sidebar.evaluate((el) => getComputedStyle(el as HTMLElement).color),
  ])
  expect(brandColor).toBe(sidebarColor)
}
