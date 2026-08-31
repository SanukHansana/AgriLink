import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PurchaseRequestForm } from '@/components/buyer/purchase-request-form';
import { BuyerDataState } from '@/components/buyer/buyer-data-state';
import { BrandColors } from '@/constants/theme';
import { getApiErrorMessage } from '@/services/api';
import { deletePurchaseRequest, getPurchaseRequest, updatePurchaseRequest } from '@/services/purchase-request-service';
import type { PurchaseRequest, PurchaseRequestInput } from '@/types/purchase-request';

export default function WantedProductDetailScreen() {
  const { requestId } = useLocalSearchParams<{ requestId: string }>(); const router = useRouter(); const [item, setItem] = useState<PurchaseRequest | null>(null); const [error, setError] = useState<string | null>(null); const [isLoading, setIsLoading] = useState(true); const [isSubmitting, setIsSubmitting] = useState(false);
  useEffect(() => { if (!requestId) return; getPurchaseRequest(requestId).then(setItem).catch((value) => setError(getApiErrorMessage(value))).finally(() => setIsLoading(false)); }, [requestId]);
  const submit = async (input: PurchaseRequestInput) => { if (!requestId) return; setIsSubmitting(true); setError(null); try { await updatePurchaseRequest(requestId, input); router.replace('/buyer/wanted' as Href); } catch (requestError) { setError(getApiErrorMessage(requestError)); } finally { setIsSubmitting(false); } };
  const remove = () => Alert.alert('Delete wanted product?', 'This listing will be permanently removed.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: async () => { if (!requestId) return; try { await deletePurchaseRequest(requestId); router.replace('/buyer/wanted' as Href); } catch (requestError) { setError(getApiErrorMessage(requestError)); } } }]);
  if (isLoading) return <BuyerDataState isLoading />; if (!item) return <BuyerDataState error={error ?? 'Wanted product not found.'} onRetry={() => router.back()} />;
  return <SafeAreaView edges={['top']} style={styles.safeArea}><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled"><View style={styles.header}><Pressable accessibilityLabel="Go back" onPress={router.back} style={styles.backButton}><Text style={styles.back}>{'<'}</Text></Pressable><View style={styles.heading}><Text style={styles.brand}>AgriLink</Text><Text style={styles.title}>Edit Wanted Product</Text></View><Pressable onPress={remove} style={styles.deleteButton}><Text style={styles.deleteText}>Delete</Text></Pressable></View><PurchaseRequestForm error={error} initialValue={item} isSubmitting={isSubmitting} onSubmit={submit} submitLabel="Save Changes" /></ScrollView></SafeAreaView>;
}
const styles = StyleSheet.create({ safeArea: { backgroundColor: BrandColors.white, flex: 1 }, content: { padding: 18, paddingBottom: 35 }, header: { alignItems: 'center', flexDirection: 'row', marginBottom: 18 }, backButton: { alignItems: 'center', height: 44, justifyContent: 'center', marginRight: 8, width: 36 }, back: { color: BrandColors.primary, fontSize: 25, fontWeight: '800' }, heading: { flex: 1 }, brand: { color: BrandColors.primary, fontSize: 25, fontWeight: '800' }, title: { color: '#4A4D4A', fontSize: 15, fontWeight: '800', marginTop: -3 }, deleteButton: { paddingHorizontal: 8, paddingVertical: 10 }, deleteText: { color: BrandColors.danger, fontSize: 12, fontWeight: '800' } });
