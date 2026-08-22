import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { FormField } from '@/components/auth/form-field';
import { PrimaryButton } from '@/components/auth/primary-button';
import { BrandColors } from '@/constants/theme';
import type { FarmerProductInput } from '@/types/farmer';
import type { ListingType, MarketplaceProduct, PricingMode, ProductCategory, ProductUnit } from '@/types/marketplace';

const categories: ProductCategory[] = ['vegetables', 'fruits', 'grains', 'spices', 'herbs', 'coconut', 'other'];
const pricingModes: { label: string; value: PricingMode }[] = [
  { label: 'Fixed Price', value: 'fixedPrice' },
  { label: 'Bidding', value: 'bidding' },
  { label: 'Both', value: 'both' },
];
const units: ProductUnit[] = ['kg', 'piece', 'box'];

export function ProductForm({
  error,
  defaultListingType = 'current',
  initialProduct,
  isSubmitting,
  onSubmit,
  submitLabel,
}: {
  error?: string | null;
  defaultListingType?: ListingType;
  initialProduct?: MarketplaceProduct;
  isSubmitting: boolean;
  onSubmit: (input: FarmerProductInput) => void;
  submitLabel: string;
}) {
  const [name, setName] = useState(initialProduct?.name ?? '');
  const [category, setCategory] = useState<ProductCategory>(initialProduct?.category ?? 'vegetables');
  const [description, setDescription] = useState(initialProduct?.description ?? '');
  const [listingType, setListingType] = useState(initialProduct?.listingType ?? defaultListingType);
  const [quantity, setQuantity] = useState(initialProduct ? String(initialProduct.availableQuantity) : '');
  const [unit, setUnit] = useState<ProductUnit>(initialProduct?.unit ?? 'kg');
  const [minimumOrder, setMinimumOrder] = useState(initialProduct ? String(initialProduct.minimumOrderQuantity) : '1');
  const [qualityGrade, setQualityGrade] = useState(initialProduct?.qualityGrade ?? '');
  const [addressLine, setAddressLine] = useState(initialProduct?.farmLocation.addressLine ?? '');
  const [city, setCity] = useState(initialProduct?.farmLocation.city ?? '');
  const [district, setDistrict] = useState(initialProduct?.farmLocation.district ?? '');
  const [harvestDate, setHarvestDate] = useState(initialProduct?.harvestDate?.slice(0, 10) ?? '');
  const [pricingMode, setPricingMode] = useState<PricingMode>(initialProduct?.pricingMode ?? 'fixedPrice');
  const [fixedPrice, setFixedPrice] = useState(initialProduct?.fixedPrice ? String(initialProduct.fixedPrice) : '');
  const [minimumBidPrice, setMinimumBidPrice] = useState(initialProduct?.minimumBidPrice ? String(initialProduct.minimumBidPrice) : '');
  const [biddingClosesAt, setBiddingClosesAt] = useState(initialProduct?.biddingClosesAt?.slice(0, 10) ?? '');
  const [imageData, setImageData] = useState(initialProduct?.images[0] ?? '');
  const [imageUri, setImageUri] = useState(initialProduct?.images[0] ?? '');
  const [localError, setLocalError] = useState<string | null>(null);

  const chooseImage = async () => {
    setLocalError(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setLocalError('Photo access is required to select a product image.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [4, 3], base64: true, mediaTypes: ['images'], quality: 0.3 });
    if (result.canceled) return;
    const asset = result.assets[0];
    if (!asset.base64) {
      setLocalError('The selected image could not be prepared.');
      return;
    }
    const mimeType = ['image/jpeg', 'image/png', 'image/webp'].includes(asset.mimeType ?? '') ? asset.mimeType : 'image/jpeg';
    const encoded = `data:${mimeType};base64,${asset.base64}`;
    if (encoded.length > 900000) {
      setLocalError('The image is too large. Crop it further or select another image.');
      return;
    }
    setImageData(encoded);
    setImageUri(asset.uri);
  };

  const submit = () => {
    const parsedQuantity = Number(quantity);
    const parsedMinimumOrder = Number(minimumOrder);
    const parsedFixedPrice = Number(fixedPrice);
    const parsedMinimumBid = Number(minimumBidPrice);
    if (!name.trim() || !district.trim() || !Number.isFinite(parsedQuantity) || parsedQuantity < 0 || !Number.isFinite(parsedMinimumOrder) || parsedMinimumOrder <= 0) {
      setLocalError('Name, district, quantity, and a valid minimum order are required.');
      return;
    }
    if (listingType === 'future' && !/^\d{4}-\d{2}-\d{2}$/.test(harvestDate)) {
      setLocalError('Enter the expected harvest date as YYYY-MM-DD.');
      return;
    }
    if (['fixedPrice', 'both'].includes(pricingMode) && (!Number.isFinite(parsedFixedPrice) || parsedFixedPrice <= 0)) {
      setLocalError('Enter a valid fixed price.');
      return;
    }
    if (['bidding', 'both'].includes(pricingMode) && (!Number.isFinite(parsedMinimumBid) || parsedMinimumBid <= 0 || !/^\d{4}-\d{2}-\d{2}$/.test(biddingClosesAt))) {
      setLocalError('Enter a valid minimum bid and bidding close date.');
      return;
    }
    setLocalError(null);
    onSubmit({
      name: name.trim(), category, description: description.trim() || undefined,
      images: imageData ? [imageData] : [], listingType, availableQuantity: parsedQuantity,
      unit, minimumOrderQuantity: parsedMinimumOrder, qualityGrade: qualityGrade.trim() || undefined,
      farmLocation: { addressLine: addressLine.trim() || undefined, city: city.trim() || undefined, district: district.trim() },
      harvestDate: listingType === 'future' ? harvestDate : undefined, pricingMode,
      fixedPrice: ['fixedPrice', 'both'].includes(pricingMode) ? parsedFixedPrice : undefined,
      minimumBidPrice: ['bidding', 'both'].includes(pricingMode) ? parsedMinimumBid : undefined,
      biddingClosesAt: ['bidding', 'both'].includes(pricingMode) ? biddingClosesAt : undefined,
      status: initialProduct?.status ?? 'active',
    });
  };

  return (
    <View style={styles.form}>
      <Pressable onPress={chooseImage} style={styles.imagePicker}>
        {imageUri ? <Image source={{ uri: imageUri }} style={styles.image} /> : <View style={styles.imagePlaceholder}><Text style={styles.imageIcon}>▣</Text><Text style={styles.imageText}>Upload Product Image</Text><Text style={styles.imageHint}>JPG or PNG, compressed before upload</Text></View>}
      </Pressable>
      <FormField autoCapitalize="words" label="Product Name" onChangeText={setName} placeholder="e.g. Keeri Samba Rice" value={name} />
      <ChoiceSection label="Category">{categories.map((item) => <Choice key={item} active={category === item} label={capitalize(item)} onPress={() => setCategory(item)} />)}</ChoiceSection>
      <ChoiceSection label="Listing Type"><Choice active={listingType === 'current'} label="Current Product" onPress={() => setListingType('current')} /><Choice active={listingType === 'future'} label="Future Harvest" onPress={() => setListingType('future')} /></ChoiceSection>
      {listingType === 'future' ? <FormField label="Expected Harvest Date" onChangeText={setHarvestDate} placeholder="YYYY-MM-DD" value={harvestDate} /> : null}
      <View style={styles.row}><View style={styles.flex}><FormField keyboardType="numeric" label="Available Quantity" onChangeText={setQuantity} placeholder="500" value={quantity} /></View><View style={styles.flex}><Text style={styles.label}>Unit</Text><View style={styles.unitRow}>{units.map((item) => <Choice key={item} active={unit === item} label={item} onPress={() => setUnit(item)} />)}</View></View></View>
      <FormField keyboardType="numeric" label="Minimum Order Quantity" onChangeText={setMinimumOrder} placeholder="10" value={minimumOrder} />
      <FormField autoCapitalize="words" label="Quality / Grade" onChangeText={setQualityGrade} placeholder="Grade A, Organic, C5 Extra..." value={qualityGrade} />
      <ChoiceSection label="Selling Option">{pricingModes.map((item) => <Choice key={item.value} active={pricingMode === item.value} label={item.label} onPress={() => setPricingMode(item.value)} />)}</ChoiceSection>
      {['fixedPrice', 'both'].includes(pricingMode) ? <FormField keyboardType="numeric" label="Fixed Price per Unit (LKR)" onChangeText={setFixedPrice} placeholder="225" value={fixedPrice} /> : null}
      {['bidding', 'both'].includes(pricingMode) ? <><FormField keyboardType="numeric" label="Minimum Bid per Unit (LKR)" onChangeText={setMinimumBidPrice} placeholder="195" value={minimumBidPrice} /><FormField label="Bidding Closing Date" onChangeText={setBiddingClosesAt} placeholder="YYYY-MM-DD" value={biddingClosesAt} /></> : null}
      <Text style={styles.sectionTitle}>Farm Location</Text>
      <FormField autoCapitalize="words" label="Address" onChangeText={setAddressLine} placeholder="Farm road or field" value={addressLine} />
      <View style={styles.row}><View style={styles.flex}><FormField autoCapitalize="words" label="City" onChangeText={setCity} placeholder="Kandy" value={city} /></View><View style={styles.flex}><FormField autoCapitalize="words" label="District" onChangeText={setDistrict} placeholder="Kandy" value={district} /></View></View>
      <Text style={styles.label}>Description</Text>
      <TextInput maxLength={1000} multiline onChangeText={setDescription} placeholder="Describe the harvest, quality, and growing method..." placeholderTextColor="#A0A3A1" style={styles.description} textAlignVertical="top" value={description} />
      {localError || error ? <Text style={styles.error}>{localError ?? error}</Text> : null}
      <PrimaryButton label={submitLabel} loading={isSubmitting} onPress={submit} />
    </View>
  );
}

function ChoiceSection({ children, label }: { children: React.ReactNode; label: string }) { return <View><Text style={styles.label}>{label}</Text><View style={styles.choiceRow}>{children}</View></View>; }
function Choice({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) { return <Pressable onPress={onPress} style={[styles.choice, active && styles.activeChoice]}><Text style={[styles.choiceText, active && styles.activeChoiceText]}>{label}</Text></Pressable>; }
function capitalize(value: string) { return value.charAt(0).toUpperCase() + value.slice(1); }

const styles = StyleSheet.create({
  form: { gap: 15 }, imagePicker: { borderColor: BrandColors.primary, borderRadius: 14, borderStyle: 'dashed', borderWidth: 1, height: 155, overflow: 'hidden' },
  image: { height: '100%', width: '100%' }, imagePlaceholder: { alignItems: 'center', backgroundColor: BrandColors.primarySurface, flex: 1, justifyContent: 'center' },
  imageIcon: { color: BrandColors.primary, fontSize: 29 }, imageText: { color: BrandColors.primary, fontSize: 12, fontWeight: '800', marginTop: 6 }, imageHint: { color: '#9A9D9A', fontSize: 9, marginTop: 4 },
  label: { color: '#525552', fontSize: 13, fontWeight: '700', marginBottom: 7 }, sectionTitle: { color: BrandColors.primary, fontSize: 14, fontWeight: '800', marginTop: 4 },
  choiceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 }, choice: { borderColor: BrandColors.border, borderRadius: 16, borderWidth: 1, paddingHorizontal: 11, paddingVertical: 8 }, activeChoice: { backgroundColor: BrandColors.primarySoft, borderColor: BrandColors.primary },
  choiceText: { color: '#666966', fontSize: 9, fontWeight: '700' }, activeChoiceText: { color: BrandColors.primary }, row: { flexDirection: 'row', gap: 10 }, flex: { flex: 1 }, unitRow: { flexDirection: 'row', gap: 4 },
  description: { borderColor: BrandColors.border, borderRadius: 12, borderWidth: 1, color: '#343434', fontSize: 13, minHeight: 100, padding: 12 }, error: { color: BrandColors.danger, fontSize: 11, textAlign: 'center' },
});
