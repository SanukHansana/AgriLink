import { type ButtonProps } from 'react-native';
import { Button as NativeButton } from '@/i18n/native';
import { BrandColors } from '@/constants/theme';

export function Button(props: ButtonProps) {
  return <NativeButton {...props} color={BrandColors.primary} />;
}
