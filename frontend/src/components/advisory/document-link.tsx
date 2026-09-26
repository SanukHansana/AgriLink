import { useState } from 'react';
import { Button, Linking, Text, View } from 'react-native';

export function DocumentLink({ name, url }: { name: string; url: string }) {
  const [error, setError] = useState<string | null>(null);
  return <View><Button title={`Open ${name}`} onPress={async () => { try { const parsed = new URL(url); if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password) throw new Error('This document link is not supported'); await Linking.openURL(url); setError(null); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to open document'); } }} />{error && <Text style={{ color: '#a33425' }}>{error}</Text>}</View>;
}
