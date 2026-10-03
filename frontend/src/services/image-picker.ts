import * as Picker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
export const requestMediaLibraryPermissionsAsync = Picker.requestMediaLibraryPermissionsAsync;

export async function launchImageLibraryAsync(options: Picker.ImagePickerOptions) {
    // Read the original by URI; create base64 only after resizing to avoid huge JS strings.
    const result = await Picker.launchImageLibraryAsync({ ...options, base64: false, allowsMultipleSelection: false });
    if (result.canceled) return result;
    const asset = result.assets[0];
    const context = ImageManipulator.manipulate(asset.uri);
    let image: Awaited<ReturnType<typeof context.renderAsync>> | undefined;
    try {
      if (Math.max(asset.width, asset.height) > 1280) {
        context.resize(asset.width >= asset.height ? { width: 1280, height: null } : { height: 1280, width: null });
      }
      image = await context.renderAsync();
      let prepared = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.65, base64: true });
      if ((prepared.base64?.length ?? 0) > 850000) prepared = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.3, base64: true });
      if (!prepared.base64) throw new Error('Unable to prepare this photo. Choose another image.');
      if (prepared.base64.length > 850000) throw new Error('This photo is still too large. Crop it further or choose a smaller image.');
      return { ...result, assets: [{ ...asset, uri: prepared.uri, width: prepared.width, height: prepared.height, mimeType: 'image/jpeg', base64: prepared.base64 }] };
    } finally { image?.release(); context.release(); }
}
