import { View } from 'react-native';

export function BellIcon({ color = '#fff' }: { color?: string }) {
  return <View accessible={false} importantForAccessibility="no-hide-descendants" style={{ width: 28, height: 30 }}>
    <View style={{ position: 'absolute', top: 0, left: 12, width: 4, height: 5, borderRadius: 2, backgroundColor: color }} />
    <View style={{ position: 'absolute', top: 3, left: 4, width: 20, height: 21, borderWidth: 2, borderColor: color, borderTopLeftRadius: 12, borderTopRightRadius: 12, borderBottomLeftRadius: 3, borderBottomRightRadius: 3 }} />
    <View style={{ position: 'absolute', top: 23, left: 1, width: 26, height: 2, borderRadius: 1, backgroundColor: color }} />
    <View style={{ position: 'absolute', top: 27, left: 11, width: 6, height: 3, borderBottomLeftRadius: 4, borderBottomRightRadius: 4, backgroundColor: color }} />
  </View>;
}
