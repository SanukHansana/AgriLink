import { useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { Pressable, Text } from '@/i18n/native';
import { BrandColors } from '@/constants/theme';

export function BidDecisionActions({ busy, summary, onAccept, onReject }: { busy: boolean; summary: string; onAccept: () => void; onReject: () => void }) {
  const [decision, setDecision] = useState<'accept' | 'reject' | null>(null);
  return <>
    <View style={styles.actions}>
      <Pressable accessibilityRole="button" accessibilityState={{ disabled: busy }} disabled={busy} onPress={() => setDecision('reject')} style={[styles.button, styles.reject, busy && styles.disabled]}><Text style={styles.rejectText}>Reject</Text></Pressable>
      <Pressable accessibilityRole="button" accessibilityState={{ disabled: busy }} disabled={busy} onPress={() => setDecision('accept')} style={[styles.button, styles.accept, busy && styles.disabled]}><Text style={styles.acceptText}>{busy ? 'Saving…' : 'Accept bid'}</Text></Pressable>
    </View>
    <Modal visible={decision !== null} transparent animationType="fade" onRequestClose={() => setDecision(null)}><View style={styles.backdrop}><View accessibilityViewIsModal style={styles.dialog}>
      <Text style={styles.title}>{decision === 'accept' ? 'Accept this bid?' : 'Reject this bid?'}</Text>
      <Text style={styles.summary}>{summary}</Text>
      <Text style={styles.summary}>{decision === 'accept' ? 'Accepting creates a confirmed order and reserves your stock.' : 'This buyer’s offer will be rejected.'}</Text>
      <Pressable accessibilityRole="button" onPress={() => { const chosen = decision; setDecision(null); if (chosen === 'accept') onAccept(); else if (chosen === 'reject') onReject(); }} style={[styles.button, decision === 'accept' ? styles.accept : styles.reject]}><Text style={decision === 'accept' ? styles.acceptText : styles.rejectText}>{decision === 'accept' ? 'Confirm acceptance' : 'Confirm rejection'}</Text></Pressable>
      <Pressable accessibilityRole="button" onPress={() => setDecision(null)} style={[styles.button, styles.cancel]}><Text style={styles.summary}>Go back</Text></Pressable>
    </View></View></Modal>
  </>;
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', gap: 24, marginTop: 18 },
  button: { flexGrow: 1, minHeight: 54, borderRadius: 12, alignItems: 'center', justifyContent: 'center', padding: 12 },
  reject: { borderColor: '#B42318', borderWidth: 1, backgroundColor: '#FFF4F2' },
  accept: { backgroundColor: BrandColors.primary },
  rejectText: { color: '#B42318', fontSize: 17, fontWeight: '700' },
  acceptText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  disabled: { opacity: 0.5 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  dialog: { backgroundColor: '#fff', borderRadius: 18, padding: 24, width: '100%', maxWidth: 480, gap: 16 },
  title: { fontSize: 22, fontWeight: '700', color: '#253C2D' },
  summary: { fontSize: 16, lineHeight: 24, color: '#46584B' },
  cancel: { backgroundColor: '#EFF4F0' },
});
