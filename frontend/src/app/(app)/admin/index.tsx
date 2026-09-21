import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useAuth } from '@/contexts/auth-context';
import { api, getApiErrorMessage } from '@/services/api';

type Section = 'overview' | 'users' | 'products' | 'orders';
type Overview = { users: number; activeUsers: number; listings: number; activeListings: number; orders: number; pendingOrders: number; deliveredValue: number };
type Person = { name: string; email: string };
type Row = { _id: string; name?: string; email?: string; role?: string; isActive?: boolean; isVerified?: boolean; status?: string; category?: string; farmer?: Person; buyer?: Person; seller?: Person; orderCode?: string; totalAmount?: number; createdAt: string };
type Collection = { items: Row[]; total: number; pages: number };
const sections: { key: Section; label: string }[] = [{ key: 'overview', label: 'Overview' }, { key: 'users', label: 'Users' }, { key: 'products', label: 'Listings' }, { key: 'orders', label: 'Orders' }];
const money = (value: number) => `LKR ${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
const roleLabel = (role?: string) => role === 'agricultureOfficer' ? 'Agriculture officer' : role;

function Button({ label, onPress, disabled = false }: { label: string; onPress: () => void; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={[styles.button, disabled && { opacity: 0.45 }]}><Text style={styles.buttonText}>{label}</Text></Pressable>;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { width } = useWindowDimensions();
  const desktop = width >= 900;
  const [section, setSection] = useState<Section>('overview');
  const [page, setPage] = useState(1);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [collection, setCollection] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [verificationAction, setVerificationAction] = useState(false);
  const [confirmation, setConfirmation] = useState<Row | null>(null);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => {
      if (cancelled) return;
      setLoading(true);
      setError(null);
      setCollection(null);
      return api.get(section === 'overview' ? '/admin/overview' : `/admin/${section}`, { params: { page } });
    })
      .then((response) => { if (!cancelled && response) { if (section === 'overview') setOverview(response.data); else setCollection(response.data); } })
      .catch((cause) => { if (!cancelled) setError(getApiErrorMessage(cause)); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [section, page, revision]);

  const update = useCallback(async (row: Row) => {
    setBusy(row._id);
    setError(null);
    setNotice(null);
    try {
      await api.patch(`/admin/${section}/${row._id}${verificationAction ? "/verification" : ""}`, verificationAction ? { isVerified: !row.isVerified } : section === 'users' ? { isActive: !row.isActive } : { status: row.status === 'active' ? 'inactive' : 'active' });
      setNotice('Changes saved successfully.');
      setRevision((value) => value + 1);
    } catch (cause) { setError(getApiErrorMessage(cause)); }
    finally { setBusy(null); setConfirmation(null); }
  }, [section, verificationAction]);

  return (
    <View style={[styles.shell, { flexDirection: desktop ? 'row' : 'column' }]}>
      <View style={[styles.sidebar, desktop && { width: 240 }]}>
        <Text style={styles.brand}>AgriLink</Text><Text style={styles.sidebarCaption}>ADMINISTRATION</Text>
        <View style={[styles.navigation, !desktop && { flexDirection: 'row', flexWrap: 'wrap' }]}>
          {sections.map((item) => <Pressable key={item.key} accessibilityRole="button" accessibilityState={{ selected: section === item.key }} disabled={Boolean(busy)} onPress={() => { setSection(item.key); setPage(1); setConfirmation(null); setNotice(null); }} style={[styles.navItem, section === item.key && styles.navSelected]}><Text style={styles.navText}>{item.label}</Text></Pressable>)}
        </View>
        <Button label="Driver operations" onPress={() => router.push("/(app)/admin/driver-operations")} /><Text style={styles.sidebarCaption}>{user?.name}</Text><Button label="Sign out" onPress={logout} disabled={Boolean(busy)} />
      </View>
      <ScrollView style={styles.main} contentContainerStyle={[styles.content, !desktop && { padding: 20 }]}>
        <View style={styles.header}><View><Text style={styles.eyebrow}>PLATFORM MANAGEMENT</Text><Text style={styles.title}>{sections.find((item) => item.key === section)?.label}</Text><Text style={styles.subtitle}>Manage your AgriLink community and marketplace.</Text></View><Button label="Refresh" disabled={loading || Boolean(busy)} onPress={() => setRevision((value) => value + 1)} /></View>
        {error && <View style={styles.error}><Text accessibilityRole="alert" style={styles.errorText}>{error}</Text><Button label="Try again" disabled={Boolean(busy)} onPress={() => setRevision((value) => value + 1)} /></View>}
        {notice && <Text accessibilityLiveRegion="polite" style={styles.notice}>{notice}</Text>}
        {confirmation && <View style={styles.panel}><Text style={styles.panelTitle}>{verificationAction ? `${confirmation.isVerified ? 'Revoke verification for' : 'Verify'} ${confirmation.name}?` : section === 'users' ? `${confirmation.isActive ? 'Deactivate' : 'Activate'} ${confirmation.name}?` : `${confirmation.status === 'active' ? 'Hide' : 'Activate'} ${confirmation.name}?`}</Text><Text style={styles.subtitle}>{verificationAction ? 'Only verified agriculture officers can access officer features.' : section === 'users' ? 'Inactive users cannot log in or access the API.' : 'Inactive listings are hidden from the marketplace.'}</Text><View style={styles.actions}><Button label={busy ? 'Saving…' : 'Confirm change'} disabled={Boolean(busy)} onPress={() => void update(confirmation)} /><Button label="Cancel" disabled={Boolean(busy)} onPress={() => setConfirmation(null)} /></View></View>}
        {loading ? <ActivityIndicator size="large" color="#216b43" style={{ margin: 40 }} /> : section === 'overview' && overview ? <>
          <View style={styles.cards}>
            {[['Registered users', overview.users, `${overview.activeUsers} active accounts`], ['Marketplace listings', overview.listings, `${overview.activeListings} active listings`], ['Total orders', overview.orders, `${overview.pendingOrders} awaiting confirmation`], ['Delivered order value', money(overview.deliveredValue), 'Completed orders only']].map(([label, value, detail]) => <View key={label} style={styles.card}><Text style={styles.subtitle}>{label}</Text><Text style={styles.metric}>{value}</Text><Text style={styles.detail}>{detail}</Text></View>)}
          </View>
          <View style={styles.panel}><Text style={styles.panelTitle}>Welcome, {user?.name}</Text><Text style={styles.subtitle}>Review accounts, moderate marketplace listings, and monitor orders from one dashboard.</Text><View style={styles.actions}>{sections.slice(1).map((item) => <Button key={item.key} label={`View ${item.label.toLowerCase()}`} onPress={() => { setSection(item.key); setPage(1); }} />)}</View></View>
        </> : collection ? <View style={styles.panel}>
          <Text style={styles.panelTitle}>{collection.total} {section === 'products' ? 'listings' : section}</Text>
          <ScrollView horizontal><View style={{ minWidth: desktop ? Math.max(650, width - 352) : 700 }}>
            <View style={[styles.row, styles.tableHeader]}>{(section === 'users' ? ['Name / email', 'Role', 'Status', 'Action'] : section === 'products' ? ['Listing / farmer', 'Category', 'Status', 'Action'] : ['Order / buyer', 'Seller', 'Status', 'Amount']).map((label) => <Text key={label} style={[styles.cell, styles.columnHeading]}>{label}</Text>)}</View>
            {collection.items.map((row) => <View key={row._id} style={styles.row}>
              <View style={styles.cell}><Text style={styles.rowTitle}>{row.name ?? row.orderCode}</Text><Text style={styles.detail}>{row.email ?? row.farmer?.name ?? row.buyer?.name ?? 'Unavailable'}</Text></View>
              <Text style={styles.cell}>{roleLabel(row.role) ?? row.category ?? row.seller?.name ?? 'Unavailable'}{row.role === 'agricultureOfficer' ? ` · ${row.isVerified ? 'Verified' : 'Unverified'}` : ''}</Text>
              <Text style={[styles.cell, styles.status]}>{section === 'users' ? row.isActive ? 'Active' : 'Inactive' : row.status}</Text>
              <View style={styles.cell}>{section === 'orders' ? <Text>{money(row.totalAmount ?? 0)}</Text> : row.role === 'admin' ? <Text style={styles.detail}>Protected admin</Text> : row.status === 'sold' ? <Text style={styles.detail}>Sold</Text> : <Button disabled={Boolean(busy) || Boolean(confirmation)} label={section === 'users' ? row.isActive ? 'Deactivate' : 'Activate' : row.status === 'active' ? 'Hide listing' : 'Activate'} onPress={() => { setVerificationAction(false); setConfirmation(row); }} />}{row.role === 'agricultureOfficer' && <Button disabled={Boolean(busy) || Boolean(confirmation)} label={row.isVerified ? 'Revoke verification' : 'Verify officer'} onPress={() => { setVerificationAction(true); setConfirmation(row); }} />}</View>
            </View>)}
            {!collection.items.length && <Text style={styles.empty}>No {section === 'products' ? 'listings' : section} yet.</Text>}
          </View></ScrollView>
          <View style={styles.pagination}><Button label="Previous" disabled={page <= 1 || Boolean(busy) || Boolean(confirmation)} onPress={() => setPage((value) => value - 1)} /><Text style={styles.detail}>Page {page} of {collection.pages}</Text><Button label="Next" disabled={page >= collection.pages || Boolean(busy) || Boolean(confirmation)} onPress={() => setPage((value) => value + 1)} /></View>
        </View> : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: '#f3f6f3' }, sidebar: { backgroundColor: '#153d2b', padding: 24, gap: 16 }, brand: { color: '#fff', fontSize: 28, fontWeight: '800' }, sidebarCaption: { color: '#b5cebf', fontSize: 12 }, navigation: { gap: 8, marginVertical: 20 }, navItem: { padding: 14, borderRadius: 8 }, navSelected: { backgroundColor: '#2e6147' }, navText: { color: '#fff', fontWeight: '600' }, main: { flex: 1 }, content: { padding: 40, gap: 24, maxWidth: 1600, width: '100%' }, header: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16 }, eyebrow: { color: '#216b43', fontSize: 11, fontWeight: '700', letterSpacing: 2 }, title: { color: '#183d2c', fontSize: 32, fontWeight: '800', marginVertical: 8 }, subtitle: { color: '#64736b', fontSize: 14, lineHeight: 22 }, cards: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 }, card: { backgroundColor: '#fff', padding: 24, borderRadius: 12, borderWidth: 1, borderColor: '#e0e8e1', flexGrow: 1, flexBasis: 210 }, metric: { color: '#183d2c', fontSize: 30, fontWeight: '800', marginVertical: 16 }, detail: { color: '#64736b', fontSize: 12, lineHeight: 20 }, panel: { backgroundColor: '#fff', padding: 24, borderRadius: 12, gap: 16, borderWidth: 1, borderColor: '#e0e8e1' }, panelTitle: { color: '#183d2c', fontSize: 18, fontWeight: '700' }, actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, button: { backgroundColor: '#e9f2ec', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 7, alignSelf: 'flex-start' }, buttonText: { color: '#216b43', fontWeight: '700', fontSize: 13 }, row: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderColor: '#edf0ed', paddingVertical: 16 }, tableHeader: { backgroundColor: '#f5f8f5' }, cell: { flex: 1, paddingHorizontal: 12, color: '#354b3f', fontSize: 13 }, columnHeading: { fontWeight: '700', color: '#64736b' }, rowTitle: { color: '#183d2c', fontWeight: '600', marginBottom: 4 }, status: { color: '#216b43', textTransform: 'capitalize' }, empty: { padding: 32, color: '#64736b' }, pagination: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 }, error: { backgroundColor: '#fff0ed', padding: 16, borderRadius: 8, gap: 12 }, errorText: { color: '#a33425' }, notice: { color: '#216b43', padding: 12, backgroundColor: '#e9f2ec', borderRadius: 8 },
});
