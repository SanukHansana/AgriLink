import { useState } from 'react';
import { Button, Text, View } from 'react-native';
import { FormField } from '@/components/auth/form-field';
import { api, getApiErrorMessage } from '@/services/api';

export function OfficerDistrict({ id, district, onChange }: { id: string; district?: string; onChange: () => void }) {
  const [value, setValue] = useState(district ?? ''); const [error, setError] = useState<string | null>(null); const [busy, setBusy] = useState(false);
  return <View style={{ gap: 8, marginTop: 10 }}><FormField label="Service district (admin assigned)" value={value} onChangeText={setValue} maxLength={80} /><Button title="Save district" disabled={busy} onPress={async () => { setBusy(true); setError(null); try { await api.patch(`/admin/officers/${id}/district`, { district: value }); onChange(); } catch (cause) { setError(getApiErrorMessage(cause)); } finally { setBusy(false); } }} />{error && <Text style={{ color: '#a33425' }}>{error}</Text>}</View>;
}
