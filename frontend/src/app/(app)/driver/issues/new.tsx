import { useEffect, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DriverDataState } from '@/components/driver/driver-data-state';
import { BrandColors } from '@/constants/theme';
import { useDriverJobs } from '@/hooks/use-driver-jobs';
import { getApiErrorMessage } from '@/services/api';
import { createDriverIssue } from '@/services/driver-service';
import type { DeliveryIssue, DeliveryIssueType } from '@/types/logistics';

const issueTypes: { label: string; value: DeliveryIssueType }[] = [
  { label: 'Delay', value: 'delay' },
  { label: 'Vehicle', value: 'vehicle' },
  { label: 'Cargo', value: 'cargo' },
  { label: 'Route', value: 'route' },
  { label: 'Customer', value: 'customer' },
  { label: 'Payment', value: 'payment' },
  { label: 'Other', value: 'other' },
];

export default function DriverReportIssueScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ jobId?: string }>();
  const requestedJobId = Array.isArray(params.jobId) ? params.jobId[0] : params.jobId;
  const jobsState = useDriverJobs('mine');
  const eligibleJobs = jobsState.jobs.filter((job) => job.status !== 'available');
  const [selectedJobId, setSelectedJobId] = useState(requestedJobId ?? '');
  const [issueType, setIssueType] = useState<DeliveryIssueType>('delay');
  const [description, setDescription] = useState('');
  const [photoData, setPhotoData] = useState('');
  const [photoUri, setPhotoUri] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedIssue, setSubmittedIssue] = useState<DeliveryIssue | null>(null);

  useEffect(() => {
    if (!selectedJobId && eligibleJobs[0]) setSelectedJobId(eligibleJobs[0]._id);
  }, [eligibleJobs, selectedJobId]);

  if (jobsState.isLoading && eligibleJobs.length === 0) return <DriverDataState isLoading />;
  if (jobsState.error && eligibleJobs.length === 0) {
    return <DriverDataState error={jobsState.error} onRetry={jobsState.refresh} />;
  }
  if (eligibleJobs.length === 0) {
    return <DriverDataState emptyMessage="You need an assigned delivery before reporting an issue." />;
  }

  if (submittedIssue) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.successContent}>
          <View style={styles.successIcon}><Text style={styles.successIconText}>✓</Text></View>
          <Text style={styles.successTitle}>Issue Reported</Text>
          <Text style={styles.successText}>Your report is open and can be followed from Delivery History.</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.replace('/(app)/driver/history' as Href)}
            style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>View Delivery History</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const choosePhoto = async () => {
    setError(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Photo access is required to attach issue evidence.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [4, 3],
      base64: true,
      mediaTypes: ['images'],
      quality: 0.3,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    if (!asset.base64) {
      setError('The selected photo could not be prepared.');
      return;
    }
    const mimeType = ['image/jpeg', 'image/png', 'image/webp'].includes(asset.mimeType ?? '')
      ? asset.mimeType
      : 'image/jpeg';
    const encodedPhoto = `data:${mimeType};base64,${asset.base64}`;
    if (encodedPhoto.length > 900000) {
      setError('The selected photo is too large. Crop it further or choose another photo.');
      return;
    }
    setPhotoData(encodedPhoto);
    setPhotoUri(asset.uri);
  };

  const submitIssue = async () => {
    if (!selectedJobId || description.trim().length < 10) {
      setError('Select a delivery and enter at least 10 characters describing the issue.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await createDriverIssue({
        description: description.trim(),
        issueType,
        jobId: selectedJobId,
        photoData: photoData || undefined,
      });
      setSubmittedIssue(result.issue);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Pressable accessibilityLabel="Go back" accessibilityRole="button" onPress={router.back}>
            <Text style={styles.back}>‹</Text>
          </Pressable>
          <View>
            <Text style={styles.title}>Report Delivery Issue</Text>
            <Text style={styles.subtitle}>Send trip problems to AgriLink support</Text>
          </View>
        </View>

        <Text style={styles.fieldLabel}>Delivery job</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.jobScroller}>
          {eligibleJobs.map((job) => (
            <Pressable
              key={job._id}
              onPress={() => setSelectedJobId(job._id)}
              style={[styles.jobChoice, selectedJobId === job._id && styles.selectedChoice]}>
              <Text style={[styles.jobChoiceText, selectedJobId === job._id && styles.selectedChoiceText]}>{job.jobCode}</Text>
              <Text numberOfLines={1} style={styles.jobChoiceRoute}>{job.destination.city}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <Text style={styles.fieldLabel}>Issue type</Text>
        <View style={styles.typeGrid}>
          {issueTypes.map((item) => (
            <Pressable
              key={item.value}
              onPress={() => setIssueType(item.value)}
              style={[styles.typeChoice, issueType === item.value && styles.selectedChoice]}>
              <Text style={[styles.typeText, issueType === item.value && styles.selectedChoiceText]}>{item.label}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.fieldLabel}>What happened?</Text>
        <TextInput
          maxLength={1000}
          multiline
          onChangeText={setDescription}
          placeholder="Describe the issue, where it happened, and any help you need..."
          placeholderTextColor="#A0A3A0"
          style={styles.descriptionInput}
          textAlignVertical="top"
          value={description}
        />
        <Text style={styles.counter}>{description.length}/1000</Text>

        <Text style={styles.fieldLabel}>Photo evidence (optional)</Text>
        <Pressable accessibilityRole="button" onPress={choosePhoto} style={styles.photoPicker}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.photo} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Text style={styles.photoIcon}>▣</Text>
              <Text style={styles.photoText}>Choose Photo</Text>
            </View>
          )}
        </Pressable>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable
          accessibilityRole="button"
          disabled={isSubmitting}
          onPress={submitIssue}
          style={[styles.primaryButton, isSubmitting && styles.disabled]}>
          <Text style={styles.primaryButtonText}>{isSubmitting ? 'Submitting...' : 'Submit Issue Report'}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: '#FAFCFA', flex: 1 },
  content: { padding: 16, paddingBottom: 35 },
  header: { alignItems: 'center', flexDirection: 'row', marginBottom: 20, marginTop: 7 },
  back: { color: BrandColors.primary, fontSize: 36, lineHeight: 38, marginRight: 10 },
  title: { color: BrandColors.primary, fontSize: 20, fontWeight: '800' },
  subtitle: { color: '#969996', fontSize: 10, marginTop: 3 },
  fieldLabel: { color: '#555855', fontSize: 12, fontWeight: '800', marginBottom: 8, marginTop: 15 },
  jobScroller: { marginHorizontal: -2 },
  jobChoice: { backgroundColor: BrandColors.white, borderColor: BrandColors.border, borderRadius: 11, borderWidth: 1, marginHorizontal: 2, minWidth: 108, padding: 11 },
  selectedChoice: { backgroundColor: BrandColors.primarySoft, borderColor: BrandColors.primary },
  jobChoiceText: { color: '#484B48', fontSize: 11, fontWeight: '800' },
  selectedChoiceText: { color: BrandColors.primary },
  jobChoiceRoute: { color: '#989B98', fontSize: 9, marginTop: 3 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  typeChoice: { backgroundColor: BrandColors.white, borderColor: BrandColors.border, borderRadius: 16, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8 },
  typeText: { color: '#666966', fontSize: 10, fontWeight: '700' },
  descriptionInput: { backgroundColor: BrandColors.white, borderColor: BrandColors.border, borderRadius: 11, borderWidth: 1, color: '#454845', fontSize: 12, minHeight: 130, padding: 12 },
  counter: { color: '#A0A3A0', fontSize: 9, marginTop: 4, textAlign: 'right' },
  photoPicker: { borderColor: BrandColors.border, borderRadius: 11, borderStyle: 'dashed', borderWidth: 1, height: 150, overflow: 'hidden' },
  photoPlaceholder: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  photoIcon: { color: BrandColors.primary, fontSize: 27 },
  photoText: { color: BrandColors.primary, fontSize: 11, fontWeight: '800', marginTop: 6 },
  photo: { height: '100%', width: '100%' },
  error: { color: BrandColors.danger, fontSize: 11, marginTop: 12, textAlign: 'center' },
  primaryButton: { alignItems: 'center', backgroundColor: BrandColors.primary, borderRadius: 24, marginTop: 18, paddingVertical: 14 },
  primaryButtonText: { color: BrandColors.white, fontSize: 13, fontWeight: '800' },
  disabled: { opacity: 0.55 },
  successContent: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: 20 },
  successIcon: { alignItems: 'center', backgroundColor: BrandColors.primarySoft, borderRadius: 40, height: 80, justifyContent: 'center', width: 80 },
  successIconText: { color: BrandColors.primary, fontSize: 37, fontWeight: '800' },
  successTitle: { color: BrandColors.primary, fontSize: 22, fontWeight: '800', marginTop: 17 },
  successText: { color: '#858885', fontSize: 11, marginTop: 6, textAlign: 'center' },
});
