import { useEffect, useMemo, useRef } from 'react';
import { mapPickerHtml, readMapMessage, type SelectedPin } from '@/services/map-picker';

type MapCanvasProps = { pin: { latitude?: number; longitude?: number }; interactive?: boolean; onSelect: (pin: SelectedPin) => void; onReady: () => void; onError: () => void };
export function MapCanvas({ pin, onSelect, onReady, onError, interactive = true }: MapCanvasProps) {
  const frame = useRef<HTMLIFrameElement>(null);
  const html = useMemo(() => mapPickerHtml(pin, interactive), [pin, interactive]);
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (event.source !== frame.current?.contentWindow) return;
      const message = readMapMessage(event.data);
      if (message?.type === 'pin' && interactive) onSelect(message.pin);
      else if (message?.type === 'ready') onReady();
      else if (message?.type === 'error') onError();
    };
    window.addEventListener('message', receive);
    return () => window.removeEventListener('message', receive);
  }, [onSelect, onReady, onError, interactive]);
  return <iframe ref={frame} title="Choose a location on the map" srcDoc={html} sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox" style={{ width: '100%', height: '100%', border: 0, minHeight: interactive ? 250 : 160 }} />;
}
