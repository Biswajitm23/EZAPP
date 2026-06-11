const { chromium } = require('D:/EZAPP/.a5c/node_modules/playwright-core')
;(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true })
  try {
    const ctx = await browser.newContext({ viewport: { width: 460, height: 700 }, deviceScaleFactor: 2 })
    const page = await ctx.newPage()
    page.on('console', m => { const t=m.text(); if(/THUMB|fail|error/i.test(t)) console.log('CONSOLE:', t.slice(0,120)) })
    await page.goto('http://localhost:8090/preview-video?cb=' + Math.floor(Math.random()*1e9), { waitUntil: 'networkidle', timeout: 120000 })
    await page.waitForTimeout(5000)
    await page.screenshot({ path: 'D:/EZAPP/.a5c/pv.png', fullPage: false })
    console.log('SHOT_OK')
  } catch (e) { console.log('FATAL:', e.message) } finally { await browser.close() }
})()
