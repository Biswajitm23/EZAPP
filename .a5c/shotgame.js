const { chromium } = require('D:/EZAPP/.a5c/node_modules/playwright-core')
;(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true })
  try {
    const ctx = await browser.newContext({ viewport: { width: 420, height: 820 }, deviceScaleFactor: 2 })
    const page = await ctx.newPage()
    await page.goto('http://localhost:8090/preview-game?cb=' + Math.floor(Math.random()*1e9), { waitUntil: 'networkidle', timeout: 90000 })
    await page.waitForTimeout(5000)
    const ar = await page.$eval('img', img => ({ nw: img.naturalWidth, nh: img.naturalHeight })).catch(()=>null)
    console.log('image natural size:', JSON.stringify(ar))
    await page.screenshot({ path: 'D:/EZAPP/.a5c/game.png', fullPage: false })
    console.log('SHOT_OK')
  } catch (e) { console.log('FATAL:', e.message.split('\n')[0]) } finally { await browser.close() }
})()
