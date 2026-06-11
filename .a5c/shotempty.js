const { chromium } = require('D:/EZAPP/.a5c/node_modules/playwright-core')
;(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true })
  try {
    const ctx = await browser.newContext({ viewport: { width: 420, height: 520 }, deviceScaleFactor: 2 })
    const page = await ctx.newPage()
    await page.goto('http://localhost:8090/preview-empty?cb=' + Math.floor(Math.random()*1e9), { waitUntil: 'networkidle', timeout: 90000 })
    await page.waitForTimeout(3500)
    await page.screenshot({ path: 'D:/EZAPP/.a5c/empty.png', fullPage: false })
    console.log('SHOT_OK')
  } catch (e) { console.log('FATAL:', e.message.split('\n')[0]) } finally { await browser.close() }
})()
