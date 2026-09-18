import { useState } from 'react';
import { Button, Text, View } from 'react-native';
import { useFarmerProducts } from '@/hooks/use-farmer-products';
import { api, getApiErrorMessage } from '@/services/api';

export function AuctionSettings() {
  const { products, refresh } = useFarmerProducts();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const open = products.filter((product) => product.status === 'active' && product.pricingMode !== 'fixedPrice' && product.biddingClosesAt && new Date(product.biddingClosesAt) > new Date());
  return <View style={{ paddingVertical: 16, gap: 12 }}><Text style={{ fontWeight: '700' }}>Automatic highest-bid acceptance</Text><Text>Optional: at closing, accept the highest valid price per unit for one bid that fits the remaining stock. Ties go to the earliest bid. Unanswered counter-offers are excluded.</Text>{open.map((product) => <View key={product._id}><Text>{product.name} · {product.autoAcceptHighestBid ? 'Enabled' : 'Manual review'}</Text><Button disabled={busy} title={product.autoAcceptHighestBid ? 'Disable automatic acceptance' : 'Enable automatic acceptance'} onPress={async () => { setBusy(true); setError(null); try { await api.patch(`/farmers/products/${product._id}/auction`, { enabled: !product.autoAcceptHighestBid }); refresh(); } catch (cause) { setError(getApiErrorMessage(cause)); } finally { setBusy(false); } }} /></View>)}{error && <Text style={{ color: '#a33425' }}>{error}</Text>}</View>;
}
