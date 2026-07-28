import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { StyleSheet, Text, View } from 'react-native';

type BrandLogoProps = {
  compact?: boolean;
  light?: boolean;
};

export function BrandLogo({ compact = false, light = false }: BrandLogoProps) {
  const color = light ? '#FFFFFF' : '#123A70';

  return (
    <View
      accessibilityLabel="DocGuide"
      style={[styles.container, compact && styles.compactContainer]}
    >
      <MaterialCommunityIcons
        color={color}
        name="hand-heart-outline"
        size={compact ? 46 : 92}
      />
      {!compact && (
        <>
          <Text style={[styles.brand, { color }]}>DocGuide</Text>
          <Text style={[styles.tagline, { color }]}>
            Tu salud es nuestra prioridad
          </Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  compactContainer: {
    alignItems: 'flex-start',
  },
  brand: {
    fontSize: 44,
    fontWeight: '800',
    letterSpacing: -1.5,
    marginTop: 8,
  },
  tagline: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.2,
    marginTop: 1,
    opacity: 0.9,
  },
});
