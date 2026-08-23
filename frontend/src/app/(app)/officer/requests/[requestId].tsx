import { useEffect, useState } from 'react';
import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AdvisoryState } from '@/components/advisory/advisory-state';
import { BrandColors } from '@/constants/theme';
import { useAssistanceRequest } from '@/hooks/use-assistance-request';
import { getApiErrorMessage } from '@/services/api';
import { reviewAssistanceRequest } from '@/services/advisory-service';
import type { AssistanceRequestStatus, OfficialResponseType } from '@/types/advisory';

export default function OfficerRequestDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ requestId: string }>();
  const requestId = Array.isArray(params.requestId) ? params.requestId[0] : params.requestId;
  const state = useAssistanceRequest(requestId);
  const [internalNotes, setInternalNotes] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (state.request) setInternalNotes(state.request.internalNotes ?? '');
  }, [state.request]);

  if (state.isLoading || state.error || !state.request) {
    return <SafeAreaView style={styles.safeArea}><AdvisoryState error={state.error} isLoading={state.isLoading} onRetry={state.refresh} /></SafeAreaView>;
  }

  const request = state.request;
  const updateReview = async (status: AssistanceRequestStatus, includeNotes = true) => {
    setIsSubmitting(true);
    setActionError(null);
    try {
      const updated = await reviewAssistanceRequest(request._id, {
        internalNotes: includeNotes ? internalNotes : undefined,
        status,
      });
      state.setRequest(updated);
    } catch (error) {
      setActionError(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const openResponse = (type: OfficialResponseType) => {
    router.push(`/(app)/officer/requests/respond/${request._id}?type=${type}` as Href);
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable accessibilityLabel="Go back" onPress={router.back}><Text style={styles.back}>‹</Text></Pressable>
          <Text style={styles.headerTitle}>Request Details</Text>
        </View>

        <View style={styles.farmerCard}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{request.farmer.name.charAt(0).toUpperCase()}</Text></View>
          <View style={styles.farmerCopy}>
            <Text style={styles.farmerName}>{request.farmer.name}</Text>
            <Text style={styles.farmerMeta}>{request.farmer.email}</Text>
          </View>
          <View style={styles.priorityBadge}><Text style={styles.priorityText}>{request.priority.toUpperCase()}</Text></View>
          <View style={styles.farmDivider} />
          <View style={styles.farmRow}>
            <View><Text style={styles.smallLabel}>FARM LOCATION</Text><Text style={styles.farmValue}>{request.farmLocation.district}</Text></View>
            <View><Text style={styles.smallLabel}>FARM SIZE</Text><Text style={styles.farmValue}>{request.farmSizeAcres ? `${request.farmSizeAcres} acres` : 'Not provided'}</Text></View>
          </View>
        </View>

        <View style={styles.requestCard}>
          <View style={styles.requestHeader}>
            <View style={styles.categoryBadge}><Text style={styles.categoryText}>{categoryLabel(request.category)}</Text></View>
            <View style={styles.statusBadge}><Text style={styles.statusText}>{statusLabel(request.status)}</Text></View>
          </View>
          <Text style={styles.smallLabel}>REQUEST TITLE</Text>
          <Text style={styles.requestTitle}>{request.title}</Text>
          <Text style={[styles.smallLabel, styles.descriptionLabel]}>FARMER&apos;S DESCRIPTION</Text>
          <Text style={styles.description}>{request.description}</Text>
          <Text style={styles.submitted}>Submitted {new Date(request.createdAt).toLocaleDateString('en-LK')}</Text>
        </View>

        <Text style={styles.sectionTitle}>Attached Documents ({request.attachments.length})</Text>
        {request.attachments.length > 0 ? (
          <View style={styles.attachments}>
            {request.attachments.map((attachment) => <View key={attachment._id} style={styles.attachment}><Text style={styles.attachmentIcon}>▧</Text><Text numberOfLines={1} style={styles.attachmentName}>{attachment.name}</Text></View>)}
          </View>
        ) : <Text style={styles.noAttachments}>No documents were attached.</Text>}

        {request.responses.length > 0 ? (
          <View>
            <Text style={styles.sectionTitle}>Official Responses</Text>
            {request.responses.map((item) => <View key={item._id} style={styles.responseCard}><Text style={styles.responseType}>{responseLabel(item.type)}</Text><Text style={styles.responseMessage}>{item.message}</Text>{item.scheduledVisitAt ? <Text style={styles.visitDate}>Visit: {new Date(item.scheduledVisitAt).toLocaleString('en-LK')}</Text> : null}</View>)}
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>Officer Internal Notes</Text>
        <TextInput
          multiline
          onChangeText={setInternalNotes}
          placeholder="Add comments for evaluation or follow up..."
          placeholderTextColor="#A1A4A1"
          style={styles.notes}
          textAlignVertical="top"
          value={internalNotes}
        />
        <Pressable disabled={isSubmitting} onPress={() => updateReview('inReview')} style={styles.saveNotes}>
          <Text style={styles.saveNotesText}>{isSubmitting ? 'Saving...' : 'Save Notes & Mark In Review'}</Text>
        </Pressable>

        {actionError ? <Text style={styles.error}>{actionError}</Text> : null}
        <View style={styles.actions}>
          <Pressable disabled={isSubmitting} onPress={() => openResponse('rejected')} style={[styles.action, styles.reject]}><Text style={styles.rejectText}>Reject & Reply</Text></Pressable>
          <Pressable disabled={isSubmitting} onPress={() => openResponse('revisionRequired')} style={[styles.action, styles.revision]}><Text style={styles.revisionText}>Revision</Text></Pressable>
          <Pressable disabled={isSubmitting} onPress={() => openResponse('approvedAndScheduled')} style={[styles.action, styles.approve]}><Text style={styles.approveText}>Approve & Reply</Text></Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function categoryLabel(value: string) {
  const labels: Record<string, string> = { farmerRegistration: 'Farmer Registration', qualityCertification: 'Quality Certificate', fertilizerSubsidy: 'Fertilizer Subsidy', cropGuidance: 'Crop Guidance', marketGuidance: 'Market Guidance', other: 'Other Request' };
  return labels[value] ?? value;
}
function statusLabel(value: string) { return value.replace(/([A-Z])/g, ' $1').replace(/^./, (letter) => letter.toUpperCase()); }
function responseLabel(value: string) { return statusLabel(value); }

const styles = StyleSheet.create({
  safeArea: { backgroundColor: '#FAFCFA', flex: 1 },
  content: { padding: 16, paddingBottom: 34 },
  header: { alignItems: 'center', flexDirection: 'row', minHeight: 58 },
  back: { color: BrandColors.primary, fontSize: 36, lineHeight: 38 },
  headerTitle: { color: BrandColors.primary, fontSize: 20, fontWeight: '800', marginLeft: 10 },
  farmerCard: { backgroundColor: BrandColors.primarySoft, borderRadius: 15, flexDirection: 'row', flexWrap: 'wrap', marginTop: 7, padding: 15 },
  avatar: { alignItems: 'center', backgroundColor: BrandColors.white, borderRadius: 23, height: 46, justifyContent: 'center', width: 46 },
  avatarText: { color: BrandColors.primary, fontSize: 17, fontWeight: '800' },
  farmerCopy: { flex: 1, justifyContent: 'center', marginLeft: 11 },
  farmerName: { color: BrandColors.primary, fontSize: 15, fontWeight: '800' },
  farmerMeta: { color: '#687968', fontSize: 9, marginTop: 4 },
  priorityBadge: { alignSelf: 'flex-start', backgroundColor: '#FFE4E4', borderRadius: 7, paddingHorizontal: 8, paddingVertical: 5 },
  priorityText: { color: BrandColors.danger, fontSize: 8, fontWeight: '800' },
  farmDivider: { backgroundColor: '#BFDEC9', height: 1, marginVertical: 13, width: '100%' },
  farmRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  smallLabel: { color: '#999C99', fontSize: 8 },
  farmValue: { color: '#454845', fontSize: 11, fontWeight: '800', marginTop: 4 },
  requestCard: { backgroundColor: BrandColors.white, borderColor: BrandColors.border, borderRadius: 15, borderWidth: 1, marginTop: 14, padding: 15 },
  requestHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  categoryBadge: { backgroundColor: '#FFE4E4', borderRadius: 7, paddingHorizontal: 9, paddingVertical: 6 },
  categoryText: { color: BrandColors.danger, fontSize: 8, fontWeight: '800' },
  statusBadge: { backgroundColor: '#FFF0C9', borderRadius: 7, paddingHorizontal: 9, paddingVertical: 6 },
  statusText: { color: BrandColors.warning, fontSize: 8, fontWeight: '800' },
  requestTitle: { color: '#414441', fontSize: 15, fontWeight: '800', marginTop: 6 },
  descriptionLabel: { marginTop: 15 },
  description: { color: '#555855', fontSize: 12, lineHeight: 18, marginTop: 7 },
  submitted: { color: '#999C99', fontSize: 9, marginTop: 12 },
  sectionTitle: { color: '#555855', fontSize: 12, fontWeight: '800', marginBottom: 9, marginTop: 17 },
  attachments: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  attachment: { alignItems: 'center', backgroundColor: BrandColors.white, borderColor: BrandColors.border, borderRadius: 9, borderWidth: 1, flexDirection: 'row', padding: 10, width: '48%' },
  attachmentIcon: { color: BrandColors.primary, fontSize: 15 },
  attachmentName: { color: '#565956', flex: 1, fontSize: 10, marginLeft: 7 },
  noAttachments: { color: '#999C99', fontSize: 10 },
  responseCard: { backgroundColor: BrandColors.primarySurface, borderRadius: 11, marginBottom: 8, padding: 12 },
  responseType: { color: BrandColors.primary, fontSize: 10, fontWeight: '800' },
  responseMessage: { color: '#555855', fontSize: 10, lineHeight: 15, marginTop: 5 },
  visitDate: { color: BrandColors.primary, fontSize: 9, fontWeight: '700', marginTop: 7 },
  notes: { backgroundColor: BrandColors.white, borderColor: BrandColors.border, borderRadius: 11, borderWidth: 1, color: '#454845', fontSize: 11, minHeight: 74, padding: 11 },
  saveNotes: { alignItems: 'center', borderColor: BrandColors.primary, borderRadius: 10, borderWidth: 1, marginTop: 9, paddingVertical: 10 },
  saveNotesText: { color: BrandColors.primary, fontSize: 10, fontWeight: '800' },
  error: { color: BrandColors.danger, fontSize: 10, marginTop: 10, textAlign: 'center' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 14 },
  action: { alignItems: 'center', borderRadius: 11, flex: 1, justifyContent: 'center', minHeight: 44, paddingHorizontal: 5 },
  reject: { backgroundColor: BrandColors.danger },
  revision: { backgroundColor: BrandColors.warning },
  approve: { backgroundColor: BrandColors.primary, flex: 1.35 },
  rejectText: { color: BrandColors.white, fontSize: 9, fontWeight: '800' },
  revisionText: { color: BrandColors.white, fontSize: 9, fontWeight: '800' },
  approveText: { color: BrandColors.white, fontSize: 9, fontWeight: '800' },
});
