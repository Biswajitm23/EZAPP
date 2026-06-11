const { chromium } = require('D:/EZAPP/.a5c/node_modules/playwright-core')
;(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--disable-application-cache','--disk-cache-size=1'] })
  try {
    const ctx = await browser.newContext({ viewport: { width: 460, height: 1000 }, deviceScaleFactor: 2, bypassCSP: true })
    await ctx.route('**/*', (r) => r.continue())
    const page = await ctx.newPage()
    await page.goto('http://localhost:8090/preview-dashboard?cb=' + Math.floor(Math.random()*1e9), { waitUntil: 'networkidle', timeout: 120000 })
    await page.waitForSelector('text=Featured', { timeout: 60000 }).catch(() => {})
    await page.waitForTimeout(5000)
    const info = await page.evaluate(() => {
      const out = { bodyH: document.body.scrollHeight }
      const all = [...document.querySelectorAll('*')]
      const feat = all.find((e)=>e.children.length===0 && e.textContent.trim()==='Featured')
      out.chain = []
      let n = feat
      for (let i=0;i<7&&n;i++){const cs=getComputedStyle(n);const r=n.getBoundingClientRect();out.chain.push({ov:cs.overflow,h:Math.round(r.height),w:Math.round(r.width)});n=n.parentElement}
      return out
    })
    console.log('bodyH', info.bodyH)
    info.chain.forEach((c,i)=>console.log(i, JSON.stringify(c)))
    await page.screenshot({ path: 'D:/EZAPP/.a5c/preview.png', fullPage: true })
    console.log('SHOT_OK')
  } catch (e) { console.log('FATAL:', e.message) } finally { await browser.close() }
})()
