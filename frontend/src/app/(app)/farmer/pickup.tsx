import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { Button, Linking, Pressable, RefreshControl, ScrollView, Text, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FormField } from '@/components/auth/form-field';
import { PrimaryButton } from '@/components/auth/primary-button';
import { LocationFields, mapUrl, type MapPin } from '@/components/location-fields';
import { BrandColors } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useFarmerDeliveries } from '@/hooks/use-farmer-deliveries';
import { useFarmerOrders } from '@/hooks/use-farmer-orders';
import { useFarmerProfile } from '@/hooks/use-farmer-profile';
import { api, getApiErrorMessage } from '@/services/api';
import { formatLkr } from '@/utils/formatters';

export default function FarmerPickupScreen() {
  const router = useRouter(); const { user } = useAuth();
  const ordersState = useFarmerOrders(); const profileState = useFarmerProfile(); const deliveries = useFarmerDeliveries();
  useFocusEffect(useCallback(() => { const timer = setInterval(deliveries.refresh, 15000); return () => clearInterval(timer); }, [deliveries.refresh]));
  const eligible = useMemo(() => ordersState.orders.filter((order) => ['preparing', 'dispatched'].includes(order.status) && !order.deliveryJob && !deliveries.jobs.some((job) => job.status !== 'cancelled' && job.orders.some((item) => (typeof item === 'string' ? item : item._id) === order._id))), [ordersState.orders, deliveries.jobs]);
  const [selected, setSelected] = useState<string[]>([]);
  const [cargo, setCargo] = useState(''); const [weight, setWeight] = useState(''); const [payout, setPayout] = useState(''); const [pickupAt, setPickupAt] = useState('');
  const [custom, setCustom] = useState(false); const [address, setAddress] = useState(''); const [city, setCity] = useState(''); const [district, setDistrict] = useState('');
  const [pin, setPin] = useState<MapPin>({});
  const [error, setError] = useState<string | null>(null); const [saving, setSaving] = useState(false);
  const refresh = () => { ordersState.refresh(); profileState.refresh(); deliveries.refresh(); };
  const submit = async () => {
    const profile = profileState.profile;
    const orders = eligible.filter((order) => selected.includes(order._id));
    if (!profile || !orders.length || !cargo.trim() || !(Number(weight) >= 1) || !payout.trim() || !(Number(payout) >= 0) || !Number.isFinite(new Date(pickupAt).getTime())) { setError('Select ready orders and complete cargo, weight, payout and pickup time.'); return; }
    const pickup = { contactName: user?.name ?? profile.farmName, phone: profile.phone, addressLine: custom ? address : profile.farmLocation.addressLine, city: custom ? city : profile.farmLocation.city, district: custom ? district : profile.farmLocation.district, ...pin };
    if (!pickup.addressLine?.trim() || !pickup.city?.trim() || !pickup.district?.trim()) { setError('Enter the full pickup address or complete your farm profile.'); return; }
    setSaving(true); setError(null);
    try {
      await api.post('/logistics/jobs', { orders: orders.map((order) => order._id), pickupPoints: [pickup], cargoDescription: cargo.trim(), totalWeightKg: Number(weight), payoutAmount: Number(payout), scheduledPickupAt: new Date(pickupAt).toISOString() });
      setSelected([]); setCargo(''); setWeight(''); setPayout(''); setPickupAt(''); refresh();
    } catch (cause) { setError(getApiErrorMessage(cause)); } finally { setSaving(false); }
  };
  return <SafeAreaView edges={['top']} style={styles.safeArea}><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" refreshControl={<RefreshControl onRefresh={refresh} refreshing={ordersState.isLoading || deliveries.isLoading} />}>
    <Button title="Back" onPress={() => router.back()} /><Text style={styles.brand}>Farm Pickup & Shared Delivery</Text>
    <Text style={styles.routeText}>Select one or more ready orders. Each buyer address becomes a separate drop-off. Mark future harvests ready first.</Text>
    <View style={styles.formCard}>
      <Text style={styles.sectionTitle}>Select orders</Text>
      {!eligible.length && <Text>No ready, unassigned orders. Start preparing an order first.</Text>}
      {eligible.map((order) => <Pressable key={order._id} accessibilityRole="checkbox" accessibilityState={{ checked: selected.includes(order._id) }} onPress={() => setSelected((current) => current.includes(order._id) ? current.filter((id) => id !== order._id) : [...current, order._id])} style={[styles.orderChoice, selected.includes(order._id) && styles.activeOrder]}><Text>{selected.includes(order._id) ? '☑' : '☐'} {order.orderCode} · {order.quantity} {order.unit}</Text><Text>{order.deliveryAddress.addressLine}, {order.deliveryAddress.city}, {order.deliveryAddress.district}</Text></Pressable>)}
      <Button title={custom ? 'Use farm profile pickup address' : 'Use a different pickup address'} onPress={() => { setCustom(!custom); setPin({}); }} />
      {custom ? <><FormField label="Pickup street address" value={address} onChangeText={setAddress} /><FormField label="Pickup city" value={city} onChangeText={setCity} /><FormField label="Pickup district" value={district} onChangeText={setDistrict} /></> : <Text>Pickup: {profileState.profile?.farmLocation.addressLine ?? 'Set a full address in your farm profile'}, {profileState.profile?.farmLocation.city}</Text>}
      <LocationFields key={String(custom)} value={pin} onChange={setPin} />
      <FormField label="Cargo description" value={cargo} onChangeText={setCargo} />
      <FormField label="Total weight (kg)" keyboardType="decimal-pad" value={weight} onChangeText={setWeight} />
      <FormField label="Driver payout (LKR)" keyboardType="decimal-pad" value={payout} onChangeText={setPayout} />
      <FormField label="Pickup date and time" placeholder="2026-10-20T08:00:00+05:30" value={pickupAt} onChangeText={setPickupAt} />
      <Text>Pickup must be in the future, after harvest, and no later than the requested delivery date.</Text>
      {error && <Text style={styles.error}>{error}</Text>}<PrimaryButton label={selected.length > 1 ? 'Request shared pickup' : 'Request pickup'} loading={saving} onPress={submit} />
    </View>
    <Text style={styles.sectionTitle}>Delivery jobs</Text>
    {deliveries.error && <Text style={styles.error}>{deliveries.error}</Text>}
    {deliveries.jobs.map((job) => <View key={job._id} style={styles.jobCard}><Text style={styles.jobCode}>{job.jobCode} · {job.status}</Text><Text>{new Date(job.scheduledPickupAt).toLocaleString()} · {formatLkr(job.payoutAmount)}</Text>{job.pickupPoints.map((point) => <Text key={point._id}>Pickup: {point.addressLine}, {point.city}</Text>)}{(job.dropoffPoints?.length ? job.dropoffPoints : [job.destination]).map((point, index) => <Text key={index}>Drop-off {index + 1}: {point.addressLine}, {point.city}</Text>)}{job.driverLocation && <Button title="View driver map location" onPress={() => void Linking.openURL(mapUrl(job.driverLocation!))} />}{job.status === 'available' && <Button title="Cancel unassigned pickup" disabled={saving} onPress={async () => { setSaving(true); try { await api.delete(`/logistics/jobs/${job._id}`); refresh(); } catch (cause) { setError(getApiErrorMessage(cause)); } finally { setSaving(false); } }} />}</View>)}
  </ScrollView></SafeAreaView>;
}
const styles = StyleSheet.create({ safeArea: { backgroundColor: '#FAFCFA', flex: 1 }, content: { padding: 16, paddingBottom: 35 }, header: { alignItems: 'center', flexDirection: 'row', marginTop: 7 }, back: { color: BrandColors.primary, fontSize: 36, marginRight: 10 }, brand: { color: BrandColors.primary, fontSize: 25, fontWeight: '800' }, title: { color: BrandColors.primary, fontSize: 15, fontWeight: '800', marginTop: -4 }, routeHero: { alignItems: 'center', backgroundColor: BrandColors.primarySoft, borderRadius: 14, marginTop: 15, padding: 22 }, routeIcon: { color: BrandColors.primary, fontSize: 32 }, routeTitle: { color: BrandColors.primary, fontSize: 13, fontWeight: '800', marginTop: 7 }, routeText: { color: '#858885', fontSize: 9, marginTop: 5, textAlign: 'center' }, warning: { backgroundColor: '#FFF3CD', borderRadius: 10, marginTop: 12, padding: 11 }, warningText: { color: '#8A6500', fontSize: 10 }, formCard: { backgroundColor: BrandColors.white, borderColor: BrandColors.border, borderRadius: 13, borderWidth: 1, gap: 13, marginTop: 14, padding: 14 }, sectionTitle: { color: '#4A4D4A', fontSize: 13, fontWeight: '800', marginTop: 18 }, orderChoice: { borderColor: BrandColors.border, borderRadius: 10, borderWidth: 1, marginRight: 7, minWidth: 115, padding: 10 }, activeOrder: { backgroundColor: BrandColors.primarySoft, borderColor: BrandColors.primary }, orderCode: { color: '#4D504D', fontSize: 9, fontWeight: '800' }, activeOrderText: { color: BrandColors.primary }, orderProduct: { color: '#737673', fontSize: 9, marginTop: 4 }, orderQuantity: { color: BrandColors.primary, fontSize: 9, fontWeight: '700', marginTop: 4 }, row: { flexDirection: 'row', gap: 9 }, flex: { flex: 1 }, error: { color: BrandColors.danger, fontSize: 10, textAlign: 'center' }, jobCard: { backgroundColor: BrandColors.white, borderColor: BrandColors.border, borderRadius: 13, borderWidth: 1, marginTop: 10, padding: 14 }, jobHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }, jobCode: { color: '#474A47', fontSize: 11, fontWeight: '800' }, status: { backgroundColor: BrandColors.primarySoft, borderRadius: 7, paddingHorizontal: 8, paddingVertical: 5 }, statusText: { color: BrandColors.primary, fontSize: 8, fontWeight: '800' }, jobRoute: { color: BrandColors.primary, fontSize: 12, fontWeight: '800', marginTop: 10 }, jobCargo: { color: '#8D908D', fontSize: 9, marginTop: 5 }, jobFooter: { borderTopColor: BrandColors.border, borderTopWidth: 1, flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingTop: 9 }, jobDate: { color: '#999C99', fontSize: 8 }, jobPayout: { color: BrandColors.primary, fontSize: 10, fontWeight: '800' } });
