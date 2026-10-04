import { StyleSheet, View } from 'react-native';

// Decorative only: keep controls and text fully interactive and accessible.
export function BotanicalAccent({ full = false }: { full?: boolean }) {
  return <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={StyleSheet.absoluteFill}>
    {[{ top: -20, right: -18, rotate: '-35deg', size: full ? 150 : 96 }, { top: 8, right: full ? 90 : 42, rotate: '35deg', size: full ? 96 : 68 }, { top: -22, left: -18, rotate: '30deg', size: full ? 150 : 90 }, { top: full ? 60 : 22, left: 26, rotate: '-35deg', size: full ? 90 : 56 }].map((leaf, index) => <View key={index} style={{ position: 'absolute', top: leaf.top, left: leaf.left, right: leaf.right, opacity: full ? 0.32 : 0.16, transform: [{ rotate: leaf.rotate }] }}><Leaf size={leaf.size} pale={index % 2 === 1} /></View>)}
    {full && <>
      <View style={{ position: 'absolute', bottom: -10, left: -34, opacity: 0.26, transform: [{ rotate: '-25deg' }] }}><Leaf size={150} /></View>
      <View style={{ position: 'absolute', bottom: 50, right: -35, opacity: 0.22, transform: [{ rotate: '30deg' }] }}><Leaf size={115} pale /></View>
      <View style={{ position: 'absolute', top: '40%', right: -12, opacity: 0.12, transform: [{ rotate: '-50deg' }] }}><Leaf size={55} /></View>
    </>}
  </View>;
}

function Leaf({ size, pale = false }: { size: number; pale?: boolean }) {
  return <View style={{ width: size, height: size / 2, borderTopLeftRadius: size, borderBottomRightRadius: size, backgroundColor: pale ? '#97B665' : '#5E8C43', overflow: 'hidden' }}>
    <View style={{ position: 'absolute', width: size, height: 2, top: size / 4, backgroundColor: '#DDECCB', transform: [{ rotate: '-12deg' }] }} />
    {[0.25, 0.45, 0.65].map((position) => <View key={position} style={{ position: 'absolute', left: size * position, top: size * 0.11, width: size * 0.28, height: 1, backgroundColor: '#DDECCB', transform: [{ rotate: '35deg' }] }} />)}
  </View>;
}
