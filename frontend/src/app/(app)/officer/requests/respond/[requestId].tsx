import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AdvisoryState } from '@/components/advisory/advisory-state';
import { BrandColors } from '@/constants/theme';
import { useAssistanceRequest } from '@/hooks/use-assistance-request';
import { getApiErrorMessage } from '@/services/api';
import { respondToAssistanceRequest } from '@/services/advisory-service';
import type { OfficialResponseType } from '@/types/advisory';

const responseOptions: { label: string; value: OfficialResponseType }[] = [
  { label: 'Approved & Scheduled', value: 'approvedAndScheduled' },
  { label: 'Approved', value: 'approved' },
  { label: 'Revision Required', value: 'revisionRequired' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Information', value: 'information' },
];

export default function OfficerResponseScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ requestId: string; type?: OfficialResponseType }>();
  const requestId = Array.isArray(params.requestId) ? params.requestId[0] : params.requestId;
  const requestedType = Array.isArray(params.type) ? params.type[0] : params.type;
  const state = useAssistanceRequest(requestId);
  const [type, setType] = useState<OfficialResponseType>(requestedType ?? 'approvedAndScheduled');
  const [message, setMessage] = useState('');
  const [scheduledVisitAt, setScheduledVisitAt] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!state.request || message) return;
    setMessage(templateFor(type, state.request.farmer.name, state.request.title));
  }, [message, state.request, type]);

  if (state.isLoading || state.error || !state.request) {
    return <SafeAreaView style={styles.safeArea}><AdvisoryState error={state.error} isLoading={state.isLoading} onRetry={state.refresh} /></SafeAreaView>;
  }

  const assistanceRequest = state.request;

  const selectType = (value: OfficialResponseType) => {
    setType(value);
    setMessage(templateFor(value, assistanceRequest.farmer.name, assistanceRequest.title));
    setError(null);
  };

  const submit = async () => {
    if (message.trim().length < 10) {
      setError('Official response must contain at least 10 characters.');
      return;
    }
    if (type === 'approvedAndScheduled' && !scheduledVisitAt.trim()) {
      setError('Enter the farm visit date and time.');
      return;
    }
    const visitDate = scheduledVisitAt.trim() ? new Date(scheduledVisitAt.trim()) : null;
    if (visitDate && Number.isNaN(visitDate.getTime())) {
      setError('Use a valid date and time, for example 2026-10-18 09:30.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await respondToAssistanceRequest(assistanceRequest._id, {
        message: message.trim(),
        scheduledVisitAt: visitDate?.toISOString(),
        type,
      });
      router.back();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable accessibilityLabel="Go back" onPress={router.back}><Text style={styles.back}>‹</Text></Pressable>
          <View><Text style={styles.title}>Send Official Response</Text><Text style={styles.subtitle}>Respond to a farmer assistance request</Text></View>
        </View>

        <View style={styles.respondingCard}>
          <Text style={styles.smallLabel}>RESPONDING TO</Text>
          <Text style={styles.respondingText}>{assistanceRequest.farmer.name} · {assistanceRequest.title}</Text>
        </View>

        <Text style={styles.label}>Response Type</Text>
        <View style={styles.options}>
          {responseOptions.map((option) => <Pressable key={option.value} onPress={() => selectType(option.value)} style={[styles.option, type === option.value && styles.selectedOption]}><Text style={[styles.optionText, type === option.value && styles.selectedOptionText]}>{option.label}</Text></Pressable>)}
        </View>

        <View style={styles.labelRow}><Text style={styles.label}>Official Message Body</Text><Pressable onPress={() => setMessage(templateFor(type, assistanceRequest.farmer.name, assistanceRequest.title))}><Text style={styles.templateLink}>Use Template</Text></Pressable></View>
        <TextInput multiline onChangeText={setMessage} placeholder="Write the official response..." placeholderTextColor="#A1A4A1" style={styles.messageInput} textAlignVertical="top" value={message} />

        {type === 'approvedAndScheduled' ? (
          <View style={styles.visitCard}>
            <Text style={styles.visitTitle}>Schedule Farm Visit</Text>
            <TextInput autoCapitalize="none" onChangeText={setScheduledVisitAt} placeholder="2026-10-18 09:30" placeholderTextColor="#999C99" style={styles.dateInput} value={scheduledVisitAt} />
            <Text style={styles.visitHint}>Enter the local visit date and time.</Text>
          </View>
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable accessibilityRole="button" disabled={isSubmitting} onPress={submit} style={[styles.submit, isSubmitting && styles.disabled]}>
          <Text style={styles.submitText}>{isSubmitting ? 'Sending...' : 'Send Official Response'}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function templateFor(type: OfficialResponseType, farmerName: string, title: string) {
  const greeting = `Dear ${farmerName}, your request regarding “${title}”`;
  const endings: Record<OfficialResponseType, string> = {
    approvedAndScheduled: ' has been approved for an initial field inspection. An agriculture officer will visit at the scheduled time. Please keep the relevant documents available for verification.',
    approved: ' has been approved. Please follow the guidance provided by your assigned agriculture officer.',
    revisionRequired: ' requires additional information before it can be approved. Please review the requested changes and update your application.',
    rejected: ' cannot be approved at this time. Please review the eligibility requirements before submitting a new request.',
    information: ' is currently under review. We will contact you when the evaluation is complete.',
  };
  return greeting + endings[type];
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: '#FAFCFA', flex: 1 },
  content: { padding: 16, paddingBottom: 34 },
  header: { alignItems: 'center', flexDirection: 'row', minHeight: 66 },
  back: { color: BrandColors.primary, fontSize: 36, lineHeight: 38, marginRight: 11 },
  title: { color: BrandColors.primary, fontSize: 19, fontWeight: '800' },
  subtitle: { color: '#999C99', fontSize: 9, marginTop: 3 },
  respondingCard: { backgroundColor: BrandColors.white, borderColor: BrandColors.border, borderRadius: 12, borderWidth: 1, marginTop: 7, padding: 13 },
  smallLabel: { color: '#999C99', fontSize: 8 },
  respondingText: { color: '#454845', fontSize: 11, fontWeight: '800', marginTop: 6 },
  label: { color: '#555855', fontSize: 11, fontWeight: '800', marginTop: 17 },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 8 },
  option: { borderColor: BrandColors.border, borderRadius: 9, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 8 },
  selectedOption: { backgroundColor: BrandColors.primarySurface, borderColor: BrandColors.primary },
  optionText: { color: '#686B68', fontSize: 9, fontWeight: '700' },
  selectedOptionText: { color: BrandColors.primary },
  labelRow: { alignItems: 'baseline', flexDirection: 'row', justifyContent: 'space-between' },
  templateLink: { color: BrandColors.primary, fontSize: 9, fontWeight: '800' },
  messageInput: { backgroundColor: BrandColors.white, borderColor: BrandColors.border, borderRadius: 11, borderWidth: 1, color: '#454845', fontSize: 11, lineHeight: 17, marginTop: 8, minHeight: 150, padding: 11 },
  visitCard: { backgroundColor: BrandColors.primarySoft, borderRadius: 12, marginTop: 15, padding: 12 },
  visitTitle: { color: BrandColors.primary, fontSize: 11, fontWeight: '800' },
  dateInput: { backgroundColor: BrandColors.white, borderRadius: 8, color: '#454845', fontSize: 11, marginTop: 9, minHeight: 42, paddingHorizontal: 11 },
  visitHint: { color: '#778877', fontSize: 8, marginTop: 5 },
  error: { color: BrandColors.danger, fontSize: 10, marginTop: 12, textAlign: 'center' },
  submit: { alignItems: 'center', backgroundColor: BrandColors.primary, borderRadius: 12, marginTop: 16, paddingVertical: 15 },
  disabled: { opacity: 0.5 },
  submitText: { color: BrandColors.white, fontSize: 12, fontWeight: '800' },
});
