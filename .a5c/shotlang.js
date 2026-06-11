const { chromium } = require('D:/EZAPP/.a5c/node_modules/playwright-core')
;(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true })
  try {
    const ctx = await browser.newContext({ viewport: { width: 420, height: 360 }, deviceScaleFactor: 3 })
    const page = await ctx.newPage()
    await page.goto('http://localhost:8090/preview-lang?cb=' + Math.floor(Math.random()*1e9), { waitUntil: 'networkidle', timeout: 90000 })
    await page.waitForTimeout(3500)
    await page.screenshot({ path: 'D:/EZAPP/.a5c/lang.png', clip: { x: 0, y: 0, width: 320, height: 200 } })
    console.log('SHOT_OK')
  } catch (e) { console.log('FATAL:', e.message.split('\n')[0]) } finally { await browser.close() }
})()
