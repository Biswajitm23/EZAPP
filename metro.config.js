const { getDefaultConfig } = require('expo/metro-config')
const { withNativeWind } = require('nativewind/metro')

const config = getDefaultConfig(__dirname)

// Import .svg files as React components (react-native-svg-transformer).
// v1.5.x auto-detects Expo's upstream transformer from the default entry.
config.transformer.babelTransformerPath = require.resolve('react-native-svg-transformer')
config.resolver.assetExts = config.resolver.assetExts.filter((ext) => ext !== 'svg')
config.resolver.sourceExts = [...config.resolver.sourceExts, 'svg']

<<<<<<< HEAD
// Keep Metro's file-map crawler/watcher out of the babysitter working dir
// (.a5c). It contains bin symlinks that can't be lstat'd, which crashes the
// watcher with EACCES on startup. Metro's blockList accepts a RegExp or an
// array of RegExp; merge with any default patterns.
const a5cPattern = /[\\/]\.a5c[\\/].*/
const existing = config.resolver.blockList
config.resolver.blockList = existing
  ? [].concat(existing, a5cPattern)
  : [a5cPattern]

module.exports = withNativeWind(config, { input: './global.css' })
=======
module.exports = withNativeWind(config, { input: './global.css' })
>>>>>>> 7bd40f4462d6b8d134c54f2d6eb8b38d2134af43
