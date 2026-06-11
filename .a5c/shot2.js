const { chromium } = require('D:/EZAPP/.a5c/node_modules/playwright-core')
const URL = 'http://localhost:8090/preview-dashboard'

;(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true })
  try {
    const page = await browser.newPage({ viewport: { width: 440, height: 950 }, deviceScaleFactor: 2 })
    await page.goto(URL, { waitUntil: 'networkidle', timeout: 90000 })
    await page.waitForSelector('text=Featured', { timeout: 45000 }).catch(() => {})
    await page.waitForTimeout(3000)

    const info = await page.evaluate(() => {
      const out = {}
      const root = document.getElementById('root')
      out.root = root ? root.getBoundingClientRect() : 'NO #root'
      out.bodyScrollH = document.body.scrollHeight
      out.docScrollH = document.documentElement.scrollHeight
      // find the "Featured" section title node
      const all = [...document.querySelectorAll('*')]
      const feat = all.find((e) => e.children.length === 0 && e.textContent.trim() === 'Featured')
      if (feat) {
        const r = feat.getBoundingClientRect()
        out.featured = { x: r.x, y: r.y, w: r.width, h: r.height }
        // walk up, collect opacity/transform/overflow/height
        const chain = []
        let n = feat
        for (let i = 0; i < 8 && n; i++) {
          const cs = getComputedStyle(n)
          const rr = n.getBoundingClientRect()
          chain.push({ tag: n.tagName, op: cs.opacity, tf: cs.transform.slice(0, 24), ov: cs.overflow, h: Math.round(rr.height), w: Math.round(rr.width), y: Math.round(rr.y) })
          n = n.parentElement
        }
        out.chain = chain
      } else {
        out.featured = 'NOT FOUND as leaf'
      }
      return out
    })
    console.log(JSON.stringify(info, null, 2))

    await page.screenshot({ path: 'D:/EZAPP/.a5c/preview-full.png', fullPage: true })
    console.log('FULLPAGE_OK')
  } catch (e) {
    console.log('FATAL:', e.message)
  } finally {
    await browser.close()
  }
})()
