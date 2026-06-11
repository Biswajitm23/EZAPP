const { chromium } = require('D:/EZAPP/.a5c/node_modules/playwright-core')
;(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true })
  try {
    const ctx = await browser.newContext({ viewport: { width: 460, height: 1100 }, deviceScaleFactor: 2 })
    const page = await ctx.newPage()
    await page.goto('file:///D:/EZAPP/.a5c/drive-test.html', { waitUntil: 'load', timeout: 60000 })
    await page.waitForTimeout(8000)
    // box B (4:3) center — compute from its bounding rect
    const rect = await page.evaluate(() => { const b = document.querySelectorAll('.box')[1].getBoundingClientRect(); return { x: b.x + b.width/2, y: b.y + b.height/2 } })
    console.log('box B center', JSON.stringify(rect))
    await page.mouse.click(rect.x, rect.y)
    await page.waitForTimeout(6000)
    await page.screenshot({ path: 'D:/EZAPP/.a5c/drive-43.png', fullPage: true })
    console.log('DONE')
  } catch (e) { console.log('FATAL:', e.message.split('\n')[0]) } finally { await browser.close() }
})()
