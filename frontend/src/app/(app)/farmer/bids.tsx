import { BidDecisionActions } from '@/components/farmer/bid-decision-actions';
import { OptionalDetails } from '@/components/optional-details';
import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Pressable, Text } from '@/i18n/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CounterBid } from '@/components/farmer/counter-bid';
import { AuctionSettings } from '@/components/farmer/auction-settings';
import { FarmerState } from '@/components/farmer/farmer-state';
import { BrandColors } from '@/constants/theme';
import { useFarmerBids } from '@/hooks/use-farmer-bids';
import { getApiErrorMessage } from '@/services/api';
import { updateFarmerBidStatus } from '@/services/farmer-service';
import type { BidStatus, BuyerBid } from '@/types/transactions';
import { formatLkr } from '@/utils/formatters';

type BidFilter = 'all' | BidStatus;

export default function FarmerReceivedBidsScreen() {
  const router = useRouter();
  const state = useFarmerBids();
  const [filter, setFilter] = useState<BidFilter>('all');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const visible = useMemo(() => filter === 'all' ? state.bids : state.bids.filter((bid) => bid.status === filter), [filter, state.bids]);
  if (state.isLoading && state.bids.length === 0) return <FarmerState isLoading />;
  if (state.error && state.bids.length === 0) return <FarmerState error={state.error} onRetry={state.refresh} />;
  const changeStatus = async (bid: BuyerBid, status: 'accepted' | 'rejected') => { setBusyId(bid._id); setActionError(null); try { const updated = await updateFarmerBidStatus(bid._id, status); state.setBids((current) => current.map((item) => item._id === updated._id ? updated : item)); } catch (error) { setActionError(getApiErrorMessage(error)); } finally { setBusyId(null); } };
  return <SafeAreaView edges={['top']} style={styles.safeArea}><ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl onRefresh={state.refresh} refreshing={state.isLoading} />}><View style={styles.header}><Pressable onPress={router.back}><Text style={styles.back}>‹</Text></Pressable><View><Text style={styles.brand}>Farm</Text><Text style={styles.title}>Received Bids</Text></View></View><OptionalDetails title="Automatic auction settings (optional)"><AuctionSettings /></OptionalDetails><View style={styles.filters}>{(['all', 'active', 'countered', 'accepted', 'rejected', 'expired', 'withdrawn'] as BidFilter[]).map((item) => <Pressable key={item} onPress={() => setFilter(item)} style={[styles.filter, filter === item && styles.activeFilter]}><Text style={[styles.filterText, filter === item && styles.activeFilterText]}>{capitalize(item)}</Text></Pressable>)}</View>{actionError ? <Text style={styles.error}>{actionError}</Text> : null}{visible.length > 0 ? visible.map((bid) => <BidCard onChange={state.refresh} bid={bid} busy={busyId === bid._id} key={bid._id} onAccept={() => changeStatus(bid, 'accepted')} onReject={() => changeStatus(bid, 'rejected')} />) : <FarmerState emptyMessage="No bids match this filter." />}</ScrollView></SafeAreaView>;
}

function BidCard({ bid, busy, onAccept, onReject, onChange }: { onChange: () => void; bid: BuyerBid; busy: boolean; onAccept: () => void; onReject: () => void }) { const product = typeof bid.product === 'string' ? null : bid.product; const buyer = typeof bid.buyer === 'string' ? 'Registered buyer' : bid.buyer.name; return <View style={styles.card}><View style={styles.cardHeader}><View><Text style={styles.product}>{product?.name ?? 'Product Bid'}</Text><Text style={styles.buyer}>{buyer}</Text></View><View style={[styles.status, bid.status !== 'active' && styles.closedStatus]}><Text style={styles.statusText}>{bid.status}</Text></View></View><View style={styles.divider} /><View style={styles.bidRow}><View><Text style={styles.label}>BID AMOUNT</Text><Text style={styles.amount}>{formatLkr(bid.bidAmount)}/{bid.unit}</Text></View><View style={styles.right}><Text style={styles.label}>QUANTITY / TOTAL</Text><Text style={styles.total}>{bid.quantity.toLocaleString('en-LK')} {bid.unit} ({formatLkr(bid.totalAmount)})</Text></View></View>{bid.status === 'active' ? <BidDecisionActions busy={busy} summary={`${buyer} · ${bid.quantity} ${bid.unit} · ${formatLkr(bid.totalAmount)}`} onAccept={onAccept} onReject={onReject} /> : null}{['active', 'countered'].includes(bid.status) && <View style={{ marginTop: 16 }}><OptionalDetails title="Offer a different price (optional)"><CounterBid bid={bid} onChange={onChange} /></OptionalDetails></View>}</View>; }
function capitalize(value: string) { return value.charAt(0).toUpperCase() + value.slice(1); }
const styles = StyleSheet.create({ safeArea: { backgroundColor: BrandColors.background, flex: 1 }, content: { padding: 16, paddingBottom: 35 }, header: { alignItems: 'center', flexDirection: 'row', marginTop: 7 }, back: { color: BrandColors.primary, fontSize: 36, marginRight: 10 }, brand: { color: BrandColors.primary, fontSize: 25, fontWeight: '800' }, title: { color: BrandColors.primary, fontSize: 15, fontWeight: '800', marginTop: -4 }, filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginVertical: 15 }, filter: { backgroundColor: BrandColors.primarySoft, borderRadius: 17, paddingHorizontal: 12, paddingVertical: 8 }, activeFilter: { backgroundColor: BrandColors.primary }, filterText: { color: BrandColors.primary, fontSize: 14, fontWeight: '800' }, activeFilterText: { color: BrandColors.white }, error: { color: BrandColors.danger, fontSize: 16, marginBottom: 8, textAlign: 'center' }, card: { backgroundColor: '#fff', borderColor: BrandColors.border, borderRadius: 14, borderWidth: 1, marginBottom: 12, padding: 15 }, cardHeader: { flexDirection: 'row', justifyContent: 'space-between' }, product: { color: '#4A4D4A', fontSize: 18, fontWeight: '800' }, buyer: { color: '#536559', fontSize: 16, marginTop: 4 }, status: { backgroundColor: '#FFF3CD', borderRadius: 7, paddingHorizontal: 8, paddingVertical: 5 }, closedStatus: { backgroundColor: BrandColors.primarySoft }, statusText: { color: BrandColors.primary, fontSize: 14, fontWeight: '800', textTransform: 'capitalize' }, divider: { backgroundColor: BrandColors.border, height: 1, marginVertical: 12 }, bidRow: { flexDirection: 'row', justifyContent: 'space-between' }, label: { color: '#536559', fontSize: 14 }, amount: { color: BrandColors.primary, fontSize: 20, fontWeight: '800', marginTop: 5 }, right: { alignItems: 'flex-end', flex: 1 }, total: { color: '#565956', fontSize: 16, fontWeight: '700', marginTop: 5 }, actions: { flexDirection: 'row', gap: 9, marginTop: 14 }, accept: { alignItems: 'center', backgroundColor: BrandColors.primary, borderRadius: 10, flex: 1, paddingVertical: 11 }, acceptText: { color: BrandColors.white, fontSize: 16, fontWeight: '800' }, reject: { alignItems: 'center', backgroundColor: '#FEE2E2', borderRadius: 10, flex: 1, paddingVertical: 11 }, rejectText: { color: BrandColors.danger, fontSize: 16, fontWeight: '800' } });
