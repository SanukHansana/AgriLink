import { type Href, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PurchaseRequestForm } from '@/components/buyer/purchase-request-form';
import { BrandColors } from '@/constants/theme';
import { getApiErrorMessage } from '@/services/api';
import { createPurchaseRequest } from '@/services/purchase-request-service';
import type { PurchaseRequestInput } from '@/types/purchase-request';

export default function NewWantedProductScreen() {
  const router = useRouter(); const [error, setError] = useState<string | null>(null); const [isSubmitting, setIsSubmitting] = useState(false);
  const submit = async (input: PurchaseRequestInput) => { setIsSubmitting(true); setError(null); try { await createPurchaseRequest(input); router.replace('/buyer/wanted' as Href); } catch (requestError) { setError(getApiErrorMessage(requestError)); } finally { setIsSubmitting(false); } };
  return <SafeAreaView edges={['top']} style={styles.safeArea}><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled"><View style={styles.header}><Pressable accessibilityLabel="Go back" onPress={router.back} style={styles.backButton}><Text style={styles.back}>{'<'}</Text></Pressable><View><Text style={styles.brand}>AgriLink</Text><Text style={styles.title}>Post Wanted Product</Text></View></View><PurchaseRequestForm error={error} isSubmitting={isSubmitting} onSubmit={submit} submitLabel="Publish Request" /></ScrollView></SafeAreaView>;
}
const styles = StyleSheet.create({ safeArea: { backgroundColor: BrandColors.white, flex: 1 }, content: { padding: 18, paddingBottom: 35 }, header: { alignItems: 'center', flexDirection: 'row', marginBottom: 18 }, backButton: { alignItems: 'center', height: 44, justifyContent: 'center', marginRight: 8, width: 36 }, back: { color: BrandColors.primary, fontSize: 25, fontWeight: '800' }, brand: { color: BrandColors.primary, fontSize: 25, fontWeight: '800' }, title: { color: '#4A4D4A', fontSize: 15, fontWeight: '800', marginTop: -3 } });
