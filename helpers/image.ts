import * as ImagePicker from 'expo-image-picker'

/**
 * Profile-photo capture helpers (expo-image-picker).
 *
 * Both flows open the system editor with `allowsEditing` so the user can CROP
 * to a square avatar before it's returned. Returns a discriminated result so
 * the caller can react to permission denial vs cancellation without try/catch.
 */
export type ImagePickResult =
  | { status: 'ok'; uri: string }
  | { status: 'canceled' }
  | { status: 'denied' }

const EDIT_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  allowsEditing: true, // square crop UI
  aspect: [1, 1],
  quality: 0.7,
}

/** Take a new photo with the camera (with crop). */
export const takeProfilePhoto = async (): Promise<ImagePickResult> => {
  const perm = await ImagePicker.requestCameraPermissionsAsync()
  if (!perm.granted) return { status: 'denied' }

  const result = await ImagePicker.launchCameraAsync(EDIT_OPTIONS)
  if (result.canceled || !result.assets?.length) return { status: 'canceled' }
  return { status: 'ok', uri: result.assets[0].uri }
}

/** Pick an existing photo from the library (with crop). */
export const pickProfilePhoto = async (): Promise<ImagePickResult> => {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
  if (!perm.granted) return { status: 'denied' }

  const result = await ImagePicker.launchImageLibraryAsync(EDIT_OPTIONS)
  if (result.canceled || !result.assets?.length) return { status: 'canceled' }
  return { status: 'ok', uri: result.assets[0].uri }
}
