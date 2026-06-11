const { chromium } = require('D:/EZAPP/.a5c/node_modules/playwright-core')
;(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--autoplay-policy=no-user-gesture-required'] })
  try {
    const ctx = await browser.newContext({ viewport: { width: 460, height: 900 }, deviceScaleFactor: 2 })
    const page = await ctx.newPage()
    page.on('pageerror', e => console.log('PAGEERROR:', e.message.split('\n')[0]))
    await page.goto('http://localhost:8090/preview-video?cb=' + Math.floor(Math.random()*1e9), { waitUntil: 'networkidle', timeout: 120000 })
    await page.waitForTimeout(5000)
    const vids1 = await page.$$eval('video', vs => vs.map(v => { const r = v.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height), ratio: +(r.width/r.height).toFixed(2) } }))
    console.log('VIDEO els BEFORE:', JSON.stringify(vids1))
    await page.screenshot({ path: 'D:/EZAPP/.a5c/vp-before.png', fullPage: true })
    // play: click the center play button area / the video
    try { await page.locator('video').first().click({ timeout: 4000 }) } catch (e) { console.log('click video:', e.message.split('\n')[0]) }
    await page.evaluate(() => { const v = document.querySelector('video'); if (v) { v.muted = true; v.play && v.play().catch(()=>{}) } })
    await page.waitForTimeout(4000)
    const vids2 = await page.$$eval('video', vs => vs.map(v => { const r = v.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height), ratio: +(r.width/r.height).toFixed(2), t: +v.currentTime.toFixed(1), playing: !v.paused } }))
    console.log('VIDEO els AFTER:', JSON.stringify(vids2))
    await page.screenshot({ path: 'D:/EZAPP/.a5c/vp-after.png', fullPage: true })
    console.log('DONE')
  } catch (e) { console.log('FATAL:', e.message) } finally { await browser.close() }
})()
