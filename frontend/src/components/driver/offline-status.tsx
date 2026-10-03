import { useCallback, useEffect, useState } from 'react';
import { AppState, Text, View } from 'react-native';
import { Button } from '@/components/button';
import { pendingUpdates, reviewPending, syncDriverUpdates, usedOfflineCache, type PendingUpdate } from '@/services/offline-driver';
import { backgroundSharingJob, stopBackgroundSharing } from '@/services/background-location';
import { useAuth } from '@/contexts/auth-context';

export function OfflineStatus() {
  const { user } = useAuth();
  const [items, setItems] = useState<PendingUpdate[]>([]); const [cached, setCached] = useState(false); const [background, setBackground] = useState<string | null>(null); const [show, setShow] = useState(false); const [error, setError] = useState<string | null>(null);
  const refresh = useCallback(async () => { setItems(await pendingUpdates()); setCached(usedOfflineCache()); setBackground(await backgroundSharingJob()); }, []);
  useEffect(() => {
    let mounted = true;
    const sync = async () => { if (AppState.currentState !== 'active') return; try { await syncDriverUpdates(); if (mounted) await refresh(); } catch { if (mounted) setError('Unable to sync delivery updates. Try again.'); } };
    void sync(); const timer = setInterval(sync, 10000);
    return () => { mounted = false; clearInterval(timer); };
  }, [refresh, user?.id]);
  if (user?.role !== 'driver' || (!items.length && !cached && !background && !error)) return null;
  return <View style={{ padding: 12, backgroundColor: '#fff3df', gap: 8 }}><Text>{cached ? 'Showing saved driver data. ' : ''}{items.length} delivery updates waiting to sync.{background ? ' Background GPS sharing is enabled.' : ''}</Text><Button title={show ? 'Hide pending updates' : 'Review & sync updates'} onPress={() => { setShow(!show); void refresh(); }} />{background && <Button title="Stop background GPS sharing" onPress={async () => { await stopBackgroundSharing(); await refresh(); }} />}{show && <><Button title="Sync now" onPress={async () => { await syncDriverUpdates(); await refresh(); }} />{items.map((item) => <View key={item.id}><Text>{item.path} · {new Date(item.createdAt).toLocaleString()}</Text>{item.conflict && <><Text>{item.conflict}</Text><Button title="Retry after checking this trip" onPress={async () => { await reviewPending(item.id, false); await refresh(); }} /><Button title="Discard rejected update" onPress={async () => { await reviewPending(item.id, true); await refresh(); }} /></>}</View>)}</>}{error && <Text>{error}</Text>}</View>;
}
