import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { FormField } from '@/components/auth/form-field';
import { PrimaryButton } from '@/components/auth/primary-button';
import { BrandColors } from '@/constants/theme';
import type { ProductCategory, ProductUnit } from '@/types/marketplace';
import type { PurchaseRequest, PurchaseRequestInput } from '@/types/purchase-request';

const categories: ProductCategory[] = ['vegetables', 'fruits', 'grains', 'spices', 'herbs', 'coconut', 'other'];
const units: ProductUnit[] = ['kg', 'piece', 'box'];

export function PurchaseRequestForm({
  error,
  initialValue,
  isSubmitting,
  onSubmit,
  submitLabel,
}: {
  error?: string | null;
  initialValue?: PurchaseRequest;
  isSubmitting: boolean;
  onSubmit: (input: PurchaseRequestInput) => void;
  submitLabel: string;
}) {
  const [productName, setProductName] = useState(initialValue?.productName ?? '');
  const [category, setCategory] = useState<ProductCategory>(initialValue?.category ?? 'vegetables');
  const [quantity, setQuantity] = useState(initialValue ? String(initialValue.quantity) : '');
  const [unit, setUnit] = useState<ProductUnit>(initialValue?.unit ?? 'kg');
  const [maximumUnitPrice, setMaximumUnitPrice] = useState(initialValue ? String(initialValue.maximumUnitPrice) : '');
  const [requiredBy, setRequiredBy] = useState(initialValue?.requiredBy.slice(0, 10) ?? '');
  const [city, setCity] = useState(initialValue?.deliveryLocation.city ?? '');
  const [district, setDistrict] = useState(initialValue?.deliveryLocation.district ?? '');
  const [qualityRequirements, setQualityRequirements] = useState(initialValue?.qualityRequirements ?? '');
  const [status, setStatus] = useState(initialValue?.status ?? 'open');
  const [localError, setLocalError] = useState<string | null>(null);

  const submit = () => {
    const parsedQuantity = Number(quantity);
    const parsedPrice = Number(maximumUnitPrice);
    if (productName.trim().length < 2 || !district.trim()) {
      setLocalError('Product name and delivery district are required.');
      return;
    }
    if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0 || !Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      setLocalError('Quantity and maximum unit price must be greater than zero.');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(requiredBy)) {
      setLocalError('Enter the required date as YYYY-MM-DD.');
      return;
    }
    setLocalError(null);
    onSubmit({
      productName: productName.trim(), category, quantity: parsedQuantity, unit,
      maximumUnitPrice: parsedPrice, requiredBy,
      deliveryLocation: { city: city.trim() || undefined, district: district.trim() },
      qualityRequirements: qualityRequirements.trim() || undefined,
      status,
    });
  };

  return (
    <View style={styles.form}>
      <FormField autoCapitalize="words" label="Product wanted" onChangeText={setProductName} placeholder="e.g. Keeri Samba Rice" value={productName} />
      <ChoiceSection label="Category">{categories.map((item) => <Choice active={category === item} key={item} label={capitalize(item)} onPress={() => setCategory(item)} />)}</ChoiceSection>
      <View style={styles.row}><View style={styles.flex}><FormField keyboardType="numeric" label="Quantity" onChangeText={setQuantity} placeholder="500" value={quantity} /></View><View style={styles.flex}><ChoiceSection label="Unit">{units.map((item) => <Choice active={unit === item} key={item} label={item} onPress={() => setUnit(item)} />)}</ChoiceSection></View></View>
      <FormField keyboardType="numeric" label="Maximum price per unit (LKR)" onChangeText={setMaximumUnitPrice} placeholder="225" value={maximumUnitPrice} />
      <FormField label="Needed by" onChangeText={setRequiredBy} placeholder="YYYY-MM-DD" value={requiredBy} />
      <Text style={styles.sectionTitle}>Delivery location</Text>
      <View style={styles.row}><View style={styles.flex}><FormField autoCapitalize="words" label="City" onChangeText={setCity} placeholder="Kandy" value={city} /></View><View style={styles.flex}><FormField autoCapitalize="words" label="District" onChangeText={setDistrict} placeholder="Kandy" value={district} /></View></View>
      <Text style={styles.label}>Quality requirements</Text>
      <TextInput maxLength={500} multiline onChangeText={setQualityRequirements} placeholder="Grade, size, variety, or packaging requirements" placeholderTextColor="#A0A3A1" style={styles.notes} textAlignVertical="top" value={qualityRequirements} />
      {initialValue ? <ChoiceSection label="Request status"><Choice active={status === 'open'} label="Open" onPress={() => setStatus('open')} /><Choice active={status === 'fulfilled'} label="Fulfilled" onPress={() => setStatus('fulfilled')} /></ChoiceSection> : null}
      {localError || error ? <Text style={styles.error}>{localError ?? error}</Text> : null}
      <PrimaryButton label={submitLabel} loading={isSubmitting} onPress={submit} />
    </View>
  );
}

function ChoiceSection({ children, label }: { children: React.ReactNode; label: string }) { return <View><Text style={styles.label}>{label}</Text><View style={styles.choices}>{children}</View></View>; }
function Choice({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) { return <Pressable onPress={onPress} style={[styles.choice, active && styles.activeChoice]}><Text style={[styles.choiceText, active && styles.activeChoiceText]}>{label}</Text></Pressable>; }
function capitalize(value: string) { return value.charAt(0).toUpperCase() + value.slice(1); }

const styles = StyleSheet.create({
  form: { gap: 15 }, row: { flexDirection: 'row', gap: 10 }, flex: { flex: 1 },
  label: { color: '#525552', fontSize: 13, fontWeight: '700', marginBottom: 7 },
  sectionTitle: { color: BrandColors.primary, fontSize: 14, fontWeight: '800', marginTop: 4 },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  choice: { borderColor: BrandColors.border, borderRadius: 16, borderWidth: 1, paddingHorizontal: 11, paddingVertical: 8 },
  activeChoice: { backgroundColor: BrandColors.primarySoft, borderColor: BrandColors.primary },
  choiceText: { color: '#666966', fontSize: 9, fontWeight: '700' }, activeChoiceText: { color: BrandColors.primary },
  notes: { borderColor: BrandColors.border, borderRadius: 12, borderWidth: 1, color: '#343434', fontSize: 13, minHeight: 100, padding: 12 },
  error: { color: BrandColors.danger, fontSize: 11, textAlign: 'center' },
});
