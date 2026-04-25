import { test as base, expect } from '@playwright/test'

const ANALYTICS_HOSTS = /(?:^|\/\/)(?:gc\.zgo\.at|[^/]*\.goatcounter\.com|cloud\.umami\.is|[^/]*\.umami\.is)(?:[/:]|$)/

export const test = base.extend({
  page: async ({ page }, use) => {
    await page.route(ANALYTICS_HOSTS, (route) => route.abort())
    await use(page)
  },
})

export { expect }
