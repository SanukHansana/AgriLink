import { useState } from 'react';
import { View } from 'react-native';
import { Text } from '@/i18n/native';
import { Button } from '@/components/button';
import { FormField } from '@/components/auth/form-field';
import { api, getApiErrorMessage } from '@/services/api';
import type { DriverVehicle } from '@/types/logistics';

export function VehicleControls({ vehicle, onChange }: { vehicle: DriverVehicle; onChange: () => void }) {
  const [editing, setEditing] = useState(false); const [capacity, setCapacity] = useState(String(vehicle.capacityKg));
  const [make, setMake] = useState(vehicle.make ?? ''); const [model, setModel] = useState(vehicle.model ?? '');
  const [busy, setBusy] = useState(false); const [error, setError] = useState<string | null>(null);
  const save = async (toggle: boolean) => { setBusy(true); setError(null); try { await api.patch(`/drivers/vehicles/${vehicle._id}`, toggle ? { isActive: !vehicle.isActive } : { capacityKg: Number(capacity), make, model }); setEditing(false); onChange(); } catch (cause) { setError(getApiErrorMessage(cause)); } finally { setBusy(false); } };
  return <View style={{ padding: 12, gap: 10 }}><Text>{vehicle.isActive ? 'Active' : 'Inactive'}</Text><Button title={editing ? 'Cancel edit' : 'Edit vehicle'} disabled={busy} onPress={() => setEditing(!editing)} />{editing && <><FormField label="Make" value={make} onChangeText={setMake} /><FormField label="Model" value={model} onChangeText={setModel} /><FormField label="Capacity (kg)" value={capacity} onChangeText={setCapacity} keyboardType="decimal-pad" /><Button title="Save vehicle" disabled={busy} onPress={() => void save(false)} /></>}<Button title={vehicle.isActive ? 'Deactivate vehicle' : 'Reactivate vehicle'} disabled={busy} onPress={() => void save(true)} />{error && <Text style={{ color: '#a33425' }}>{error}</Text>}</View>;
}
