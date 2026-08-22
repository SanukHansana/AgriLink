import { useEffect, useState } from 'react';
import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProductForm } from '@/components/farmer/product-form';
import { FarmerState } from '@/components/farmer/farmer-state';
import { BrandColors } from '@/constants/theme';
import { getApiErrorMessage } from '@/services/api';
import { deactivateFarmerProduct, getFarmerProduct, updateFarmerProduct } from '@/services/farmer-service';
import type { FarmerProductInput } from '@/types/farmer';
import type { MarketplaceProduct } from '@/types/marketplace';

export default function FarmerEditProductScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ productId: string }>();
  const productId = Array.isArray(params.productId) ? params.productId[0] : params.productId;
  const [product, setProduct] = useState<MarketplaceProduct | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!productId) { setError('Product ID is missing.'); setIsLoading(false); return; }
    getFarmerProduct(productId).then(setProduct).catch((requestError) => setError(getApiErrorMessage(requestError))).finally(() => setIsLoading(false));
  }, [productId]);

  if (isLoading || !product) return <FarmerState error={error} isLoading={isLoading} />;

  const submit = async (input: FarmerProductInput) => {
    setIsSubmitting(true); setError(null);
    try { const updated = await updateFarmerProduct(product._id, input); setProduct(updated); router.replace('/(app)/farmer/products' as Href); }
    catch (requestError) { setError(getApiErrorMessage(requestError)); }
    finally { setIsSubmitting(false); }
  };
  const deactivate = async () => {
    setIsSubmitting(true); setError(null);
    try { await deactivateFarmerProduct(product._id); router.replace('/(app)/farmer/products' as Href); }
    catch (requestError) { setError(getApiErrorMessage(requestError)); setIsSubmitting(false); }
  };

  return <SafeAreaView edges={['top']} style={styles.safeArea}><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled"><View style={styles.header}><Pressable onPress={router.back}><Text style={styles.back}>‹</Text></Pressable><View><Text style={styles.title}>Edit Product</Text><Text style={styles.subtitle}>{product.name}</Text></View></View><ProductForm error={error} initialProduct={product} isSubmitting={isSubmitting} onSubmit={submit} submitLabel="Save Product" />{product.status !== 'inactive' ? <Pressable disabled={isSubmitting} onPress={deactivate} style={styles.deactivate}><Text style={styles.deactivateText}>Deactivate Product</Text></Pressable> : null}</ScrollView></SafeAreaView>;
}

const styles = StyleSheet.create({ safeArea: { backgroundColor: BrandColors.white, flex: 1 }, content: { padding: 18, paddingBottom: 35 }, header: { alignItems: 'center', flexDirection: 'row', marginBottom: 18 }, back: { color: BrandColors.primary, fontSize: 36, marginRight: 10 }, title: { color: BrandColors.primary, fontSize: 20, fontWeight: '800' }, subtitle: { color: '#929592', fontSize: 10, marginTop: 2 }, deactivate: { alignItems: 'center', borderColor: BrandColors.danger, borderRadius: 24, borderWidth: 1, marginTop: 12, paddingVertical: 13 }, deactivateText: { color: BrandColors.danger, fontSize: 12, fontWeight: '800' } });
