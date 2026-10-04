import { Image } from 'react-native';

export function BrandLogo({ width = 180 }: { width?: number }) {
  return <Image source={require('../../assets/images/logo.png')} accessibilityLabel="AgriLink" resizeMode="contain" style={{ width, height: width / 3, maxWidth: '100%' }} />;
}
