const { chromium } = require('D:/EZAPP/.a5c/node_modules/playwright-core')
const measure = (els) => els.map(e => { const r = e.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height), ratio: +(r.width / r.height).toFixed(2) } })
;(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--autoplay-policy=no-user-gesture-required','--disable-application-cache'] })
  try {
    const ctx = await browser.newContext({ viewport: { width: 460, height: 1200 }, deviceScaleFactor: 2 })
    const page = await ctx.newPage()
    await page.goto('http://localhost:8090/preview-video?cb=' + Math.floor(Math.random()*1e9), { waitUntil: 'networkidle', timeout: 120000 })
    await page.waitForTimeout(6000)
    const before = await page.$$eval('iframe', measure)
    console.log('BEFORE (top-level webview iframes):', JSON.stringify(before))
    await page.screenshot({ path: 'D:/EZAPP/.a5c/v-before.png', fullPage: true })

    // Try to play HTML5 video (2nd webview) and YouTube (1st webview, nested iframe).
    const ifr = await page.$$('iframe')
    if (ifr[1]) { try { const fB = await ifr[1].contentFrame(); await fB.click('video', { timeout: 5000 }) } catch (e) { console.log('B play:', e.message.split('\n')[0]) } }
    if (ifr[0]) {
      try {
        const fA = await ifr[0].contentFrame()
        const yt = await fA.$('iframe')
        const fY = await yt.contentFrame()
        await fY.click('.ytp-large-play-button, button.ytp-large-play-button, .html5-main-video', { timeout: 6000 })
      } catch (e) { console.log('A play:', e.message.split('\n')[0]) }
    }
    await page.waitForTimeout(5000)
    const after = await page.$$eval('iframe', measure)
    console.log('AFTER (top-level webview iframes):', JSON.stringify(after))
    await page.screenshot({ path: 'D:/EZAPP/.a5c/v-after.png', fullPage: true })
    console.log('DONE')
  } catch (e) { console.log('FATAL:', e.message) } finally { await browser.close() }
})()
