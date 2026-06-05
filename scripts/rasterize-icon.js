// One-off: rasterize App_icon.svg -> a 1024x1024 PNG for the app launcher icon
// (Expo requires PNG for icon / adaptiveIcon — SVG is not supported there).
const path = require('path')
const sharp = require('sharp')

const images = path.join(__dirname, '..', 'assets', 'images')
const src = path.join(images, 'App_icon.svg')
const out = path.join(images, 'app-icon.png')

sharp(src, { density: 512 })
  .resize(1024, 1024, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
  .png()
  .toFile(out)
  .then((info) => console.log('Wrote', out, info.width + 'x' + info.height))
  .catch((err) => {
    console.error('Rasterize failed:', err.message)
    process.exit(1)
  })