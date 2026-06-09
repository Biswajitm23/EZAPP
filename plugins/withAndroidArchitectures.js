const { withGradleProperties } = require('@expo/config-plugins')

/**
 * Limits the Android build to a single ABI (arm64-v8a) when
 * `EAS_BUILD_ARM64_ONLY=1` is set — roughly halving a directly-installed APK by
 * dropping the unused armeabi-v7a / x86 / x86_64 native libraries.
 *
 * Gated by the env var so it ONLY applies to the `preview` (internal APK)
 * profile. The `production` AAB is left universal so the Play Store can still
 * deliver every device architecture. See eas.json.
 */
module.exports = function withAndroidArchitectures(config) {
  return withGradleProperties(config, (cfg) => {
    if (process.env.EAS_BUILD_ARM64_ONLY !== '1') return cfg

    const props = cfg.modResults.filter(
      (item) => !(item.type === 'property' && item.key === 'reactNativeArchitectures')
    )
    props.push({ type: 'property', key: 'reactNativeArchitectures', value: 'arm64-v8a' })
    cfg.modResults = props
    return cfg
  })
}