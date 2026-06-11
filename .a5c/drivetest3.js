const { chromium } = require('D:/EZAPP/.a5c/node_modules/playwright-core')
;(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true })
  try {
    const ctx = await browser.newContext({ viewport: { width: 460, height: 1100 }, deviceScaleFactor: 2 })
    const page = await ctx.newPage()
    await page.goto('file:///D:/EZAPP/.a5c/drive-test.html', { waitUntil: 'load', timeout: 60000 })
    await page.waitForTimeout(8000)
    const b = await page.evaluate(() => { const r = document.querySelectorAll('.box')[1].getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height } })
    await page.mouse.click(b.x + b.w/2, b.y + b.h/2)
    await page.waitForTimeout(6000)
    await page.screenshot({ path: 'D:/EZAPP/.a5c/drive-43.png', clip: { x: b.x - 4, y: b.y - 4, width: b.w + 8, height: b.h + 8 } })
    console.log('DONE box B', JSON.stringify(b))
  } catch (e) { console.log('FATAL:', e.message.split('\n')[0]) } finally { await browser.close() }
})()
