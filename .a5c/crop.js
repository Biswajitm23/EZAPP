const { chromium } = require('D:/EZAPP/.a5c/node_modules/playwright-core')
;(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--disable-application-cache'] })
  try {
    const ctx = await browser.newContext({ viewport: { width: 460, height: 1000 }, deviceScaleFactor: 3 })
    const page = await ctx.newPage()
    await page.goto('http://localhost:8090/preview-dashboard?cb=' + Math.floor(Math.random()*1e9), { waitUntil: 'networkidle', timeout: 120000 })
    await page.waitForSelector('text=Featured', { timeout: 60000 }).catch(() => {})
    await page.waitForTimeout(4500)
    const box = await page.evaluate(() => {
      const all=[...document.querySelectorAll('*')]
      const t=all.find(e=>e.children.length===0 && e.textContent.trim()==='Company Town Hall')
      let n=t; for(let i=0;i<6&&n;i++){const r=n.getBoundingClientRect(); if(r.height>180&&r.width>250) return {x:r.x,y:r.y,w:r.width,h:r.height}; n=n.parentElement}
      return null
    })
    console.log('CARD BOX', JSON.stringify(box))
    if (box) await page.screenshot({ path: 'D:/EZAPP/.a5c/crop.png', clip: { x: Math.max(0,box.x-6), y: box.y-6, width: box.w+12, height: box.h+12 } })
    else await page.screenshot({ path: 'D:/EZAPP/.a5c/crop.png', clip: { x: 8, y: 135, width: 360, height: 300 } })
    console.log('CROP_OK')
  } catch (e) { console.log('FATAL:', e.message) } finally { await browser.close() }
})()
