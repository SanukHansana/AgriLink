import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandColors } from '@/constants/theme';

type PlaceholderScreenProps = {
  description: string;
  title: string;
};

export function PlaceholderScreen({ description, title }: PlaceholderScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.symbolCircle}>
          <Text style={styles.symbol}>🌱</Text>
        </View>
        <Text style={styles.message}>{description}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: BrandColors.white,
    flex: 1,
  },
  header: {
    borderBottomColor: BrandColors.border,
    borderBottomWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  title: {
    color: '#414341',
    fontSize: 22,
    fontWeight: '800',
  },
  content: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 28,
  },
  symbolCircle: {
    alignItems: 'center',
    backgroundColor: BrandColors.primarySoft,
    borderRadius: 36,
    height: 72,
    justifyContent: 'center',
    width: 72,
  },
  symbol: {
    fontSize: 32,
  },
  message: {
    color: '#8E918F',
    fontSize: 15,
    lineHeight: 23,
    marginTop: 16,
    maxWidth: 310,
    textAlign: 'center',
  },
});
