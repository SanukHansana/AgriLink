import { Redirect, type Href } from 'expo-router';

import { useAuth } from '@/contexts/auth-context';
import type { UserRole } from '@/types/auth';

const roleHomes: Record<UserRole, Href> = {
  agricultureOfficer: '/(app)/officer' as Href,
  buyer: '/(app)/buyer',
  driver: '/(app)/driver' as Href,
  farmer: '/(app)/farmer' as Href,
};

export default function RoleHomeScreen() {
  const { user } = useAuth();
  if (!user) return null;
  return <Redirect href={roleHomes[user.role]} />;
}
