const { chromium } = require('D:/EZAPP/.a5c/node_modules/playwright-core')

const URL = process.argv[2] || 'http://localhost:8090/preview-dashboard'
const OUT = process.argv[3] || 'D:/EZAPP/.a5c/preview.png'

;(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true })
  try {
    const page = await browser.newPage({
      viewport: { width: 440, height: 950 },
      deviceScaleFactor: 2,
    })
    page.on('pageerror', (e) => console.log('PAGEERROR:', e.message))
    page.on('console', (m) => {
      const t = m.text()
      if (/error|fail|unable|cannot/i.test(t)) console.log('CONSOLE:', t.slice(0, 200))
    })
    await page.goto(URL, { waitUntil: 'networkidle', timeout: 90000 })
    // Wait for our real content to appear in the DOM.
    await page.waitForSelector('text=Featured', { timeout: 45000 }).catch(() => console.log('WARN: "Featured" selector not found'))
    // Let reanimated transforms + remote images settle.
    await page.waitForTimeout(3500)
    const txt = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').slice(0, 300))
    console.log('BODY_TEXT:', txt)
    await page.screenshot({ path: OUT, fullPage: false })
    console.log('SHOT_OK:', OUT)
  } catch (e) {
    console.log('FATAL:', e.message)
  } finally {
    await browser.close()
  }
})()
