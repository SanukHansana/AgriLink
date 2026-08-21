import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FormField } from '@/components/auth/form-field';
import { DriverDataState } from '@/components/driver/driver-data-state';
import { BrandColors } from '@/constants/theme';
import { useDriverJob } from '@/hooks/use-driver-job';
import { getApiErrorMessage } from '@/services/api';
import { updateDriverJobStatus } from '@/services/driver-service';
import type { DeliveryStatusInput } from '@/types/logistics';

type ProgressStatus = DeliveryStatusInput['status'];

const nextStatusByCurrent = {
  accepted: 'collecting',
  collecting: 'inTransit',
  inTransit: 'delivered',
} as const;

const statusLabels: Record<ProgressStatus, { action: string; description: string; label: string }> = {
  collecting: {
    action: 'Confirm Arrival at Pickup',
    description: 'You have reached the pickup location and can begin loading.',
    label: 'Arrived at Pickup',
  },
  inTransit: {
    action: 'Confirm Cargo in Transit',
    description: 'Collection is complete and the cargo is leaving for its destination.',
    label: 'In Transit',
  },
  delivered: {
    action: 'Complete Delivery',
    description: 'The receiver has accepted the cargo at the destination.',
    label: 'Delivered',
  },
};

export default function DriverUpdateStatusScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ jobId: string }>();
  const jobId = Array.isArray(params.jobId) ? params.jobId[0] : params.jobId;
  const { error, isLoading, job, refresh, setJob } = useDriverJob(jobId);
  const [note, setNote] = useState('');
  const [photoData, setPhotoData] = useState('');
  const [photoUri, setPhotoUri] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [receiverSignature, setReceiverSignature] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isLoading || error || !job) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <DriverDataState error={error} isLoading={isLoading} onRetry={refresh} />
      </SafeAreaView>
    );
  }

  if (job.status === 'delivered') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.completeContent}>
          <View style={styles.completeIcon}><Text style={styles.completeIconText}>✓</Text></View>
          <Text style={styles.completeTitle}>Delivery Completed</Text>
          <Text style={styles.completeText}>Trip {job.jobCode} has been recorded successfully.</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.replace('/(app)/driver' as Href)}
            style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Return to Dashboard</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const nextStatus = nextStatusByCurrent[job.status as keyof typeof nextStatusByCurrent];
  if (!nextStatus) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <DriverDataState emptyMessage="This delivery is not currently available for a status update." />
      </SafeAreaView>
    );
  }
  const statusConfig = statusLabels[nextStatus];

  const chooseProofPhoto = async () => {
    setSubmitError(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setSubmitError('Photo access is required to attach proof of delivery.');
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
      setSubmitError('The selected photo could not be prepared. Choose another photo.');
      return;
    }
    const mimeType = ['image/jpeg', 'image/png', 'image/webp'].includes(asset.mimeType ?? '')
      ? asset.mimeType
      : 'image/jpeg';
    const encodedPhoto = `data:${mimeType};base64,${asset.base64}`;
    if (encodedPhoto.length > 900000) {
      setSubmitError('The selected photo is too large. Crop it further or choose another photo.');
      return;
    }
    setPhotoData(encodedPhoto);
    setPhotoUri(asset.uri);
  };

  const submitStatus = async () => {
    if (nextStatus === 'delivered' && (!photoData || !receiverName.trim() || !receiverSignature.trim())) {
      setSubmitError('Add a proof photo, receiver name, and receiver signature.');
      return;
    }
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const result = await updateDriverJobStatus(job._id, {
        status: nextStatus,
        note: note.trim() || undefined,
        proof:
          nextStatus === 'delivered'
            ? {
                photoData,
                receiverName: receiverName.trim(),
                receiverSignature: receiverSignature.trim(),
              }
            : undefined,
      });
      setJob(result.job);
      setNote('');
    } catch (requestError) {
      setSubmitError(getApiErrorMessage(requestError));
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
            <Text style={styles.title}>Update Status</Text>
            <Text style={styles.subtitle}>{job.jobCode} · {job.pickupPoints[0]?.city} → {job.destination.city}</Text>
          </View>
        </View>

        <View style={styles.successBanner}>
          <Text style={styles.successText}>Current status: {formatStatus(job.status)}</Text>
        </View>

        <View style={styles.deliveryCard}>
          <Text style={styles.cardLabel}>ACTIVE DELIVERY DETAIL</Text>
          <Text style={styles.deliveryText}>{job.totalWeightKg.toLocaleString('en-LK')} kg {job.cargoDescription}</Text>
        </View>

        <Text style={styles.sectionTitle}>Next Required Step</Text>
        <View style={styles.nextStepCard}>
          <View style={styles.stepNumber}><Text style={styles.stepNumberText}>✓</Text></View>
          <View style={styles.stepCopy}>
            <Text style={styles.stepTitle}>{statusConfig.label}</Text>
            <Text style={styles.stepDescription}>{statusConfig.description}</Text>
          </View>
        </View>

        {nextStatus === 'delivered' ? (
          <View style={styles.proofSection}>
            <Text style={styles.sectionTitle}>Proof of Delivery</Text>
            <Pressable accessibilityRole="button" onPress={chooseProofPhoto} style={styles.photoPicker}>
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={styles.proofImage} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Text style={styles.cameraIcon}>▣</Text>
                  <Text style={styles.photoText}>Choose Delivery Photo</Text>
                  <Text style={styles.photoHint}>The image is compressed before upload</Text>
                </View>
              )}
            </Pressable>
            <FormField
              autoCapitalize="words"
              label="Receiver's name"
              onChangeText={setReceiverName}
              placeholder="Name of person receiving the cargo"
              value={receiverName}
            />
            <FormField
              autoCapitalize="words"
              label="Receiver's signature"
              onChangeText={setReceiverSignature}
              placeholder="Receiver types their full name"
              value={receiverSignature}
            />
          </View>
        ) : null}

        <View style={styles.notesSection}>
          <Text style={styles.sectionTitle}>Notes / Comments</Text>
          <TextInput
            maxLength={500}
            multiline
            onChangeText={setNote}
            placeholder="Add cargo, collection, or route notes..."
            placeholderTextColor="#A0A3A0"
            style={styles.notesInput}
            textAlignVertical="top"
            value={note}
          />
          <Text style={styles.counter}>{note.length}/500</Text>
        </View>

        {submitError ? <Text style={styles.error}>{submitError}</Text> : null}
        <Pressable
          accessibilityRole="button"
          disabled={isSubmitting}
          onPress={submitStatus}
          style={[styles.primaryButton, isSubmitting && styles.disabledButton]}>
          <Text style={styles.primaryButtonText}>
            {isSubmitting ? 'Updating...' : statusConfig.action}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function formatStatus(status: string) {
  return status.replace(/([A-Z])/g, ' $1').replace(/^./, (letter) => letter.toUpperCase());
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: '#FAFCFA', flex: 1 },
  content: { paddingBottom: 35 },
  header: { alignItems: 'center', borderBottomColor: BrandColors.border, borderBottomWidth: 1, flexDirection: 'row', minHeight: 76, paddingHorizontal: 20 },
  back: { color: BrandColors.primary, fontSize: 36, lineHeight: 38, marginRight: 12 },
  title: { color: BrandColors.primary, fontSize: 20, fontWeight: '800' },
  subtitle: { color: '#949794', fontSize: 10, marginTop: 3 },
  successBanner: { backgroundColor: BrandColors.primarySoft, borderColor: '#A7D8B9', borderRadius: 10, borderWidth: 1, marginHorizontal: 16, marginTop: 16, padding: 12 },
  successText: { color: BrandColors.primary, fontSize: 11, fontWeight: '800' },
  deliveryCard: { backgroundColor: BrandColors.white, borderColor: BrandColors.border, borderRadius: 12, borderWidth: 1, marginHorizontal: 16, marginTop: 16, padding: 14 },
  cardLabel: { color: '#969996', fontSize: 9, fontWeight: '800' },
  deliveryText: { color: '#414441', fontSize: 14, fontWeight: '800', marginTop: 7 },
  sectionTitle: { color: '#5B5E5B', fontSize: 12, fontWeight: '800', marginBottom: 8 },
  nextStepCard: { alignItems: 'center', backgroundColor: BrandColors.primarySurface, borderColor: BrandColors.primary, borderRadius: 12, borderWidth: 1, flexDirection: 'row', marginHorizontal: 16, padding: 13 },
  stepNumber: { alignItems: 'center', backgroundColor: BrandColors.primary, borderRadius: 15, height: 30, justifyContent: 'center', width: 30 },
  stepNumberText: { color: BrandColors.white, fontWeight: '800' },
  stepCopy: { flex: 1, marginLeft: 11 },
  stepTitle: { color: BrandColors.primary, fontSize: 13, fontWeight: '800' },
  stepDescription: { color: '#777A77', fontSize: 10, lineHeight: 15, marginTop: 3 },
  proofSection: { gap: 12, marginHorizontal: 16, marginTop: 18 },
  photoPicker: { borderColor: BrandColors.border, borderRadius: 12, borderStyle: 'dashed', borderWidth: 1, height: 170, overflow: 'hidden' },
  photoPlaceholder: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  cameraIcon: { color: BrandColors.primary, fontSize: 28 },
  photoText: { color: BrandColors.primary, fontSize: 12, fontWeight: '800', marginTop: 7 },
  photoHint: { color: '#9A9D9A', fontSize: 9, marginTop: 4 },
  proofImage: { height: '100%', width: '100%' },
  notesSection: { marginHorizontal: 16, marginTop: 18 },
  notesInput: { borderColor: BrandColors.border, borderRadius: 10, borderWidth: 1, color: '#454845', fontSize: 12, minHeight: 100, padding: 12 },
  counter: { color: '#A0A3A0', fontSize: 9, marginTop: 4, textAlign: 'right' },
  error: { color: BrandColors.danger, fontSize: 11, marginHorizontal: 20, marginTop: 12, textAlign: 'center' },
  primaryButton: { alignItems: 'center', backgroundColor: BrandColors.primary, borderRadius: 24, marginHorizontal: 16, marginTop: 18, paddingVertical: 14 },
  primaryButtonText: { color: BrandColors.white, fontSize: 13, fontWeight: '800' },
  disabledButton: { opacity: 0.55 },
  completeContent: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: 20 },
  completeIcon: { alignItems: 'center', backgroundColor: BrandColors.primarySoft, borderRadius: 42, height: 84, justifyContent: 'center', width: 84 },
  completeIconText: { color: BrandColors.primary, fontSize: 39, fontWeight: '800' },
  completeTitle: { color: BrandColors.primary, fontSize: 22, fontWeight: '800', marginTop: 17 },
  completeText: { color: '#858885', fontSize: 11, marginTop: 6, textAlign: 'center' },
});
