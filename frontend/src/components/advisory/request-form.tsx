import { useState } from 'react';
import { Text, View } from 'react-native';
import { Button } from '@/components/button';
import { FormField } from '@/components/auth/form-field';
import { api, getApiErrorMessage } from '@/services/api';
import type { AssistanceRequest, AssistanceRequestCategory } from '@/types/advisory';

const categories: AssistanceRequestCategory[] = ['farmerRegistration', 'qualityCertification', 'fertilizerSubsidy', 'cropGuidance', 'marketGuidance', 'other'];
export function RequestForm({ request, onSaved }: { request?: AssistanceRequest; onSaved: (request: AssistanceRequest) => void }) {
  const [title, setTitle] = useState(request?.title ?? ''); const [description, setDescription] = useState(request?.description ?? '');
  const [category, setCategory] = useState<AssistanceRequestCategory>(request?.category ?? 'cropGuidance');
  const [attachments, setAttachments] = useState<{ name: string; url: string }[]>(request?.attachments ?? []);
  const [error, setError] = useState<string | null>(null); const [busy, setBusy] = useState(false);
  const submit = async () => {
    setError(null);
    if (title.trim().length < 3 || description.trim().length < 10) { setError('Enter a title of at least 3 characters and a description of at least 10.'); return; }
    setBusy(true);
    try { const body = { title: title.trim(), description: description.trim(), category, attachments }; const response = request ? await api.patch(`/advisory/requests/${request._id}`, body) : await api.post('/advisory/requests', body); onSaved(response.data.request); }
    catch (cause) { setError(getApiErrorMessage(cause)); } finally { setBusy(false); }
  };
  return <View style={{ gap: 14 }}><Text>Farm district and address come from your farmer profile.</Text><Text style={{ fontWeight: '700' }}>Request category</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{categories.map((item) => <Button key={item} title={`${category === item ? '✓ ' : ''}${item.replace(/([A-Z])/g, ' $1')}`} onPress={() => setCategory(item)} />)}</View><FormField label="Title" value={title} onChangeText={setTitle} maxLength={160} /><FormField label="Describe the assistance you need" value={description} onChangeText={setDescription} multiline maxLength={2000} />
    {attachments.map((item, index) => <View key={index} style={{ gap: 8 }}><FormField label={`Document ${index + 1} name`} value={item.name} onChangeText={(value) => setAttachments((current) => current.map((entry, i) => i === index ? { ...entry, name: value } : entry))} maxLength={120} /><FormField label="Document link (HTTP/HTTPS)" value={item.url} onChangeText={(value) => setAttachments((current) => current.map((entry, i) => i === index ? { ...entry, url: value } : entry))} autoCapitalize="none" maxLength={500} /><Button title="Remove document" onPress={() => setAttachments((current) => current.filter((_, i) => i !== index))} /></View>)}
    <Button title="Add document link" disabled={attachments.length >= 5} onPress={() => setAttachments((current) => [...current, { name: '', url: '' }])} />
    {error && <Text style={{ color: '#a33425' }}>{error}</Text>}<Button title={busy ? 'Saving…' : request ? 'Save & resubmit request' : 'Submit assistance request'} disabled={busy} onPress={submit} />
  </View>;
}
