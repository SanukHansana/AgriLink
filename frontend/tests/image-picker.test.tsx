import { beforeEach, expect, jest, test } from '@jest/globals';
import * as Picker from 'expo-image-picker';
import { ImageManipulator } from 'expo-image-manipulator';
import { launchImageLibraryAsync } from '../src/services/image-picker';

jest.mock('expo-image-picker', () => ({ launchImageLibraryAsync: jest.fn(), requestMediaLibraryPermissionsAsync: jest.fn() }));
jest.mock('expo-image-manipulator', () => ({ ImageManipulator: { manipulate: jest.fn() }, SaveFormat: { JPEG: 'jpeg' } }));
const save = jest.fn<() => Promise<{ uri: string; width: number; height: number; base64: string }>>();
const resize = jest.fn();
const release = jest.fn();
const manipulate = jest.mocked(ImageManipulator.manipulate);
beforeEach(() => {
  jest.mocked(Picker.launchImageLibraryAsync).mockResolvedValue({ canceled: false, assets: [{ uri: 'file:///large.png', width: 6000, height: 4000 }] });
  save.mockReset().mockResolvedValue({ uri: 'file:///small.jpg', width: 1280, height: 853, base64: 'compressed-photo' });
  manipulate.mockReturnValue({ resize, renderAsync: async () => ({ saveAsync: save, release }), release } as unknown as ReturnType<typeof ImageManipulator.manipulate>);
});

test('resizes before creating base64 and returns a compressed JPEG', async () => {
  const result = await launchImageLibraryAsync({ base64: true, mediaTypes: ['images'] });
  expect(Picker.launchImageLibraryAsync).toHaveBeenCalledWith(expect.objectContaining({ base64: false }));
  expect(resize).toHaveBeenCalledWith({ width: 1280, height: null });
  expect(result.assets?.[0]).toEqual(expect.objectContaining({ mimeType: 'image/jpeg', base64: 'compressed-photo', uri: 'file:///small.jpg' }));
  expect(release).toHaveBeenCalledTimes(2);
});

test('recompresses a large result before accepting the image', async () => {
  save.mockResolvedValueOnce({ uri: 'large', width: 1280, height: 853, base64: 'x'.repeat(900000) });
  await launchImageLibraryAsync({});
  expect(save).toHaveBeenCalledTimes(2);
  expect(save).toHaveBeenLastCalledWith({ format: 'jpeg', compress: 0.3, base64: true });
});

test('reports an oversized image instead of returning an upload payload', async () => {
  save.mockResolvedValue({ uri: 'large', width: 1280, height: 853, base64: 'x'.repeat(900000) });
  await expect(launchImageLibraryAsync({})).rejects.toThrow('still too large');
  expect(release).toHaveBeenCalledTimes(2);
});

test('cancelling the picker does not attempt image processing', async () => {
  jest.mocked(Picker.launchImageLibraryAsync).mockResolvedValue({ canceled: true, assets: null });
  expect((await launchImageLibraryAsync({})).canceled).toBe(true);
  expect(manipulate).not.toHaveBeenCalled();
});
