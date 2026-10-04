export type SelectedPin = { latitude: number; longitude: number };
export function validPin(value: unknown): value is SelectedPin {
  if (!value || typeof value !== 'object') return false;
  const pin = value as SelectedPin;
  return Number.isFinite(pin.latitude) && pin.latitude >= -90 && pin.latitude <= 90 && Number.isFinite(pin.longitude) && pin.longitude >= -180 && pin.longitude <= 180;
}

export function readMapMessage(raw: unknown): { type: 'pin'; pin: SelectedPin } | { type: 'ready' | 'error' } | null {
  try {
    const message = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (message?.channel !== 'agrilink-map') return null;
    if (message.type === 'pin' && validPin(message)) return { type: 'pin', pin: { latitude: message.latitude, longitude: message.longitude } };
    if (['ready', 'error'].includes(message.type)) return { type: message.type };
  } catch { /* Ignore malformed embedded-map messages. */ }
  return null;
}

export function mapPickerHtml(pin: unknown, interactive = true) {
  const initial = validPin(pin) ? pin : null;
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"><link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"><style>html,body,#map{height:100%;margin:0}body{background:#eef5e8;font-family:system-ui}.leaflet-control-zoom a{width:44px;height:44px;line-height:44px}.pin{width:22px;height:22px;background:#006f2b;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px #555}</style></head><body><div id="map"></div><script>
  function send(type,extra){var message=Object.assign({channel:'agrilink-map',type:type},extra||{});if(window.ReactNativeWebView){window.ReactNativeWebView.postMessage(JSON.stringify(message));}else{window.parent.postMessage(message,'*');}}
  function failed(){send('error');document.getElementById('map').textContent='Unable to load the map. Check your internet connection and try again.';}
  </script><script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" onerror="failed()"></script><script>
  if(window.L){
    var initial=${JSON.stringify(initial)};
    var map=L.map('map',{worldCopyJump:true,dragging:${interactive},touchZoom:${interactive},scrollWheelZoom:${interactive},doubleClickZoom:${interactive},boxZoom:${interactive},keyboard:${interactive},zoomControl:${interactive}}).setView(initial?[initial.latitude,initial.longitude]:[7.8731,80.7718],initial?15:7);
    var tiles=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'}).addTo(map);
    tiles.on('tileerror',function(){send('error');});tiles.on('load',function(){send('ready');});
    var marker;
    function choose(lat,lng){lng=((lng+180)%360+360)%360-180;if(lat < -90 || lat > 90)return;var point=[lat,lng];if(marker){marker.setLatLng(point);}else{marker=L.marker(point,{draggable:${interactive},icon:L.divIcon({className:'',html:'<div class="pin"></div>',iconSize:[28,28],iconAnchor:[14,14]})}).addTo(map);marker.on('dragend',function(){var p=marker.getLatLng();choose(p.lat,p.lng);});}send('pin',{latitude:lat,longitude:lng});}
    if(initial)choose(initial.latitude,initial.longitude);
    if(${interactive})map.on('click',function(event){choose(event.latlng.lat,event.latlng.lng);});
    setTimeout(function(){map.invalidateSize();},250);
  }
  </script></body></html>`;
}
