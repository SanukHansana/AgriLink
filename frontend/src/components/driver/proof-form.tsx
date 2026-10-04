import * as ImagePicker from '@/services/image-picker';
import { Image, View } from 'react-native';
import { Text } from '@/i18n/native';
import { Button } from '@/components/button';
import { useState } from 'react';
import { FormField } from '@/components/auth/form-field';

export type StopProof = { photoData: string; receiverName: string; receiverSignature: string };
export function ProofForm({ value, onChange, label = 'Receiver' }: { value: StopProof; onChange: (proof: StopProof) => void; label?: string }) {
  const [error, setError] = useState<string | null>(null);
  const photo = async () => {
    setError(null);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) throw new Error('Allow photo access to attach evidence');
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, base64: true, quality: 0.3 });
      if (result.canceled) return;
      const asset = result.assets[0];
      if (!asset.base64) throw new Error('Unable to prepare this photo');
      const mime = ['image/jpeg', 'image/png', 'image/webp'].includes(asset.mimeType ?? '') ? asset.mimeType : 'image/jpeg';
      const data = `data:${mime};base64,${asset.base64}`;
      if (data.length > 900000) throw new Error('Crop the photo or choose a smaller image');
      onChange({ ...value, photoData: data });
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to load photo'); }
  };
  return <View style={{ gap: 10 }}><Button title={value.photoData ? 'Change proof photo' : 'Attach proof photo'} onPress={photo} />{value.photoData && <Image source={{ uri: value.photoData }} style={{ height: 120, width: '100%', borderRadius: 8 }} />}<FormField label={`${label} name`} value={value.receiverName} onChangeText={(name) => onChange({ ...value, receiverName: name })} maxLength={80} /><FormField label={`${label} signature confirmation`} value={value.receiverSignature} onChangeText={(signature) => onChange({ ...value, receiverSignature: signature })} maxLength={120} />{error && <Text style={{ color: '#a33425' }}>{error}</Text>}</View>;
}
