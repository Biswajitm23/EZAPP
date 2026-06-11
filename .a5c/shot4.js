const { chromium } = require('D:/EZAPP/.a5c/node_modules/playwright-core')
;(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true })
  try {
    const page = await browser.newPage({ viewport: { width: 460, height: 1000 }, deviceScaleFactor: 2 })
    await page.goto('http://localhost:8090/preview-dashboard', { waitUntil: 'networkidle', timeout: 90000 })
    await page.waitForSelector('text=Featured', { timeout: 45000 }).catch(() => {})
    await page.waitForTimeout(4500)
    const dims = await page.evaluate(() => ({ bodyH: document.body.scrollHeight, docH: document.documentElement.scrollHeight }))
    console.log('DIMS:', JSON.stringify(dims))
    await page.screenshot({ path: 'D:/EZAPP/.a5c/preview.png', fullPage: true })
    console.log('SHOT_OK')
  } catch (e) { console.log('FATAL:', e.message) } finally { await browser.close() }
})()
