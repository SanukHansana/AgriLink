import { Button as NativeButton, type ButtonProps } from 'react-native';
import { BrandColors } from '@/constants/theme';

export function Button(props: ButtonProps) {
  return <NativeButton {...props} color={BrandColors.primary} />;
}
