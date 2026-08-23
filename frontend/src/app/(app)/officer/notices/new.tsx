import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandColors } from '@/constants/theme';
import { getApiErrorMessage } from '@/services/api';
import { createNotice, publishNotice } from '@/services/advisory-service';
import type { AdvisoryNotice } from '@/types/advisory';

const noticeTypes: { label: string; value: AdvisoryNotice['type'] }[] = [
  { label: 'General', value: 'general' }, { label: 'Subsidy', value: 'subsidy' },
  { label: 'Training', value: 'training' }, { label: 'Emergency', value: 'emergency' },
  { label: 'Market Surplus', value: 'marketSurplus' },
];

export default function PublishNoticeScreen() {
  const router = useRouter();
  const [type, setType] = useState<AdvisoryNotice['type']>('general');
  const [targetAudience, setTargetAudience] = useState<AdvisoryNotice['targetAudience']>('allFarmers');
  const [targetDistrict, setTargetDistrict] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [languages, setLanguages] = useState<AdvisoryNotice['languages']>(['en']);
  const [isEmergency, setIsEmergency] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleLanguage = (language: AdvisoryNotice['languages'][number]) => {
    setLanguages((current) => current.includes(language) ? current.filter((item) => item !== language) : [...current, language]);
  };
  const submit = async () => {
    if (title.trim().length < 3 || description.trim().length < 10) { setError('Enter a title and a detailed description.'); return; }
    if (languages.length === 0) { setError('Select at least one publishing language.'); return; }
    if (targetAudience === 'district' && !targetDistrict.trim()) { setError('Enter the target district.'); return; }
    setIsSubmitting(true); setError(null);
    try {
      const draft = await createNotice({ type, title: title.trim(), description: description.trim(), targetAudience, targetDistrict: targetAudience === 'district' ? targetDistrict.trim() : undefined, languages, isEmergency });
      await publishNotice(draft._id);
      router.back();
    } catch (requestError) { setError(getApiErrorMessage(requestError)); }
    finally { setIsSubmitting(false); }
  };

  return <SafeAreaView edges={['top']} style={styles.safeArea}><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled"><View style={styles.header}><Pressable onPress={router.back}><Text style={styles.back}>‹</Text></Pressable><View><Text style={styles.title}>Publish New Notice</Text><Text style={styles.subtitle}>Broadcast updates to farmers</Text></View></View><FieldLabel text="Notice Type" /><View style={styles.choices}>{noticeTypes.map((item) => <Choice active={type === item.value} key={item.value} label={item.label} onPress={() => setType(item.value)} />)}</View><FieldLabel text="Target Audience" /><View style={styles.choices}><Choice active={targetAudience === 'allFarmers'} label="All Farmers" onPress={() => setTargetAudience('allFarmers')} /><Choice active={targetAudience === 'district'} label="District Only" onPress={() => setTargetAudience('district')} /></View>{targetAudience === 'district' ? <TextInput onChangeText={setTargetDistrict} placeholder="Target district" placeholderTextColor="#A1A4A1" style={styles.input} value={targetDistrict} /> : null}<FieldLabel text="Notice Title" /><TextInput onChangeText={setTitle} placeholder="e.g. Organic Fertilizer Distribution" placeholderTextColor="#A1A4A1" style={styles.input} value={title} /><FieldLabel text="Publishing Languages" /><View style={styles.choices}>{(['en', 'si', 'ta'] as const).map((language) => <Choice active={languages.includes(language)} key={language} label={language.toUpperCase()} onPress={() => toggleLanguage(language)} />)}</View><FieldLabel text="Detailed Description" /><TextInput multiline onChangeText={setDescription} placeholder="Write detailed advisory information or eligibility criteria here..." placeholderTextColor="#A1A4A1" style={styles.descriptionInput} textAlignVertical="top" value={description} /><View style={styles.switchRow}><Text style={styles.switchLabel}>Mark as Emergency Alert</Text><Switch onValueChange={setIsEmergency} thumbColor={BrandColors.white} trackColor={{ false: '#E5E7E5', true: BrandColors.primary }} value={isEmergency} /></View>{error ? <Text style={styles.error}>{error}</Text> : null}<Pressable disabled={isSubmitting} onPress={submit} style={[styles.submit, isSubmitting && styles.disabled]}><Text style={styles.submitText}>{isSubmitting ? 'Publishing...' : 'Publish & Broadcast Notice'}</Text></Pressable></ScrollView></SafeAreaView>;
}

function FieldLabel({ text }: { text: string }) { return <Text style={styles.label}>{text}</Text>; }
function Choice({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) { return <Pressable onPress={onPress} style={[styles.choice, active && styles.activeChoice]}><Text style={[styles.choiceText, active && styles.activeChoiceText]}>{label}</Text></Pressable>; }
const styles = StyleSheet.create({ safeArea: { backgroundColor: '#FAFCFA', flex: 1 }, content: { padding: 16, paddingBottom: 35 }, header: { alignItems: 'center', flexDirection: 'row', minHeight: 65 }, back: { color: BrandColors.primary, fontSize: 36, marginRight: 11 }, title: { color: BrandColors.primary, fontSize: 19, fontWeight: '800' }, subtitle: { color: '#999C99', fontSize: 9, marginTop: 3 }, label: { color: '#555855', fontSize: 11, fontWeight: '800', marginBottom: 8, marginTop: 15 }, choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 }, choice: { borderColor: BrandColors.border, borderRadius: 8, borderWidth: 1, paddingHorizontal: 11, paddingVertical: 9 }, activeChoice: { backgroundColor: BrandColors.primarySurface, borderColor: BrandColors.primary }, choiceText: { color: '#666966', fontSize: 9, fontWeight: '700' }, activeChoiceText: { color: BrandColors.primary }, input: { backgroundColor: BrandColors.white, borderColor: BrandColors.border, borderRadius: 10, borderWidth: 1, color: '#454845', fontSize: 11, minHeight: 44, paddingHorizontal: 11 }, descriptionInput: { backgroundColor: BrandColors.white, borderColor: BrandColors.border, borderRadius: 10, borderWidth: 1, color: '#454845', fontSize: 11, minHeight: 118, padding: 11 }, switchRow: { alignItems: 'center', backgroundColor: BrandColors.white, borderColor: BrandColors.border, borderRadius: 10, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, paddingHorizontal: 12, paddingVertical: 8 }, switchLabel: { color: '#555855', fontSize: 11, fontWeight: '800' }, error: { color: BrandColors.danger, fontSize: 10, marginTop: 11, textAlign: 'center' }, submit: { alignItems: 'center', backgroundColor: BrandColors.primary, borderRadius: 11, marginTop: 16, paddingVertical: 15 }, disabled: { opacity: 0.5 }, submitText: { color: BrandColors.white, fontSize: 12, fontWeight: '800' } });
