const { chromium } = require('D:/EZAPP/.a5c/node_modules/playwright-core')
;(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true })
  try {
    const ctx = await browser.newContext({ viewport: { width: 460, height: 1100 }, deviceScaleFactor: 2 })
    const page = await ctx.newPage()
    await page.goto('file:///D:/EZAPP/.a5c/drive-test.html', { waitUntil: 'load', timeout: 60000 })
    await page.waitForTimeout(8000)
    await page.screenshot({ path: 'D:/EZAPP/.a5c/drive-before.png', fullPage: true })
    try { await page.mouse.click(230, 150) } catch (e) { console.log('click:', e.message.split('\n')[0]) }
    await page.waitForTimeout(6000)
    await page.screenshot({ path: 'D:/EZAPP/.a5c/drive-after.png', fullPage: true })
    console.log('DONE')
  } catch (e) { console.log('FATAL:', e.message.split('\n')[0]) } finally { await browser.close() }
})()
