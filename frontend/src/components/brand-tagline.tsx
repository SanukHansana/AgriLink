import { Text } from '@/i18n/native';
import { BrandColors } from '@/constants/theme';

export const BRAND_SLOGAN = 'From Farm to Market, Made Simple.';

export function BrandTagline({ compact = false, light = false }: { compact?: boolean; light?: boolean }) {
  return <Text style={{ color: light ? '#F0F5E9' : BrandColors.primaryDark, fontSize: compact ? 14 : 17, lineHeight: compact ? 20 : 25, fontWeight: '600', textAlign: compact ? 'left' : 'center' }}>{BRAND_SLOGAN}</Text>;
}
