import { useRouter } from 'expo-router';
import { ScrollView, Text } from 'react-native';
import { Button } from '@/components/button';
import { RequestForm } from '@/components/advisory/request-form';
export default function NewAssistance() {
  const router = useRouter();
  return <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }} keyboardShouldPersistTaps="handled"><Button title="Back" onPress={() => router.back()} /><Text style={{ fontSize: 24, fontWeight: '700' }}>Request agriculture assistance</Text><RequestForm onSaved={(request) => router.replace({ pathname: '/(app)/farmer/assistance/[requestId]', params: { requestId: request._id } })} /></ScrollView>;
}
