import { useMemo } from 'react';
import { WebView } from 'react-native-webview';
import { Linking } from 'react-native';
import { mapPickerHtml, readMapMessage, type SelectedPin } from '@/services/map-picker';

export type MapCanvasProps = { pin: { latitude?: number; longitude?: number }; interactive?: boolean; onSelect: (pin: SelectedPin) => void; onReady: () => void; onError: () => void };
export function MapCanvas({ pin, onSelect, onReady, onError, interactive = true }: MapCanvasProps) {
  const html = useMemo(() => mapPickerHtml(pin, interactive), [pin, interactive]);
  return <WebView source={{ html, baseUrl: 'https://agrilink.local/' }} originWhitelist={['*']} userAgent="AgriLink/1.0 (https://github.com/SanukHansana/AgriLink)" style={{ flex: 1 }} javaScriptEnabled onError={onError} onShouldStartLoadWithRequest={(request) => {
    if (request.url.startsWith('https://www.openstreetmap.org/copyright')) { void Linking.openURL(request.url).catch(() => {}); return false; }
    return request.url === 'about:blank' || request.url.startsWith('https://agrilink.local/');
  }} onMessage={({ nativeEvent }) => {
    const message = readMapMessage(nativeEvent.data);
    if (message?.type === 'pin' && interactive) onSelect(message.pin);
    else if (message?.type === 'ready') onReady();
    else if (message?.type === 'error') onError();
  }} />;
}
