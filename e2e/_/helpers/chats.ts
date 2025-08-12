import { Page } from '@playwright/test'
import { gotoHash } from '../../support/nav'
import { waitForAppReady } from '../../utils/session'

export async function gotoChats(page: Page) {
  await gotoHash(page, 'chats')
  await waitForAppReady(page)
}
