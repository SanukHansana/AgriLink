import { useFarmerProfile } from '@/hooks/use-farmer-profile';
import { useState } from 'react';
import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { Pressable, Text } from '@/i18n/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProductForm } from '@/components/farmer/product-form';
import { BrandColors } from '@/constants/theme';
import { getApiErrorMessage } from '@/services/api';
import { createFarmerProduct } from '@/services/farmer-service';
import type { FarmerProductInput } from '@/types/farmer';

export default function FarmerAddProductScreen() {
  const router = useRouter();
  const profileState = useFarmerProfile();
  const params = useLocalSearchParams<{ listingType?: string }>();
  const defaultListingType = params.listingType === 'future' ? 'future' : 'current';
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submit = async (input: FarmerProductInput) => {
    setIsSubmitting(true); setError(null);
    try { await createFarmerProduct(input); router.replace('/(app)/farmer/products' as Href); }
    catch (requestError) { setError(getApiErrorMessage(requestError)); }
    finally { setIsSubmitting(false); }
  };
  return <SafeAreaView edges={['top']} style={styles.safeArea}><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled"><View style={styles.header}><Pressable onPress={router.back}><Text style={styles.back}>‹</Text></Pressable><View><Text style={styles.brand}>Farm</Text><Text style={styles.title}>List Product</Text></View></View>{profileState.isLoading ? <ActivityIndicator color={BrandColors.primary} accessibilityLabel="Loading farm location" /> : <ProductForm defaultLocation={profileState.profile?.farmLocation} defaultListingType={defaultListingType} error={error} isSubmitting={isSubmitting} onSubmit={submit} submitLabel="List Product" />}</ScrollView></SafeAreaView>;
}

const styles = StyleSheet.create({ safeArea: { backgroundColor: BrandColors.background, flex: 1 }, content: { padding: 18, paddingBottom: 35 }, header: { alignItems: 'center', flexDirection: 'row', marginBottom: 18 }, back: { color: BrandColors.primary, fontSize: 36, marginRight: 10 }, brand: { color: BrandColors.primary, fontSize: 25, fontWeight: '800' }, title: { color: BrandColors.primary, fontSize: 15, fontWeight: '800', marginTop: -4 } });
