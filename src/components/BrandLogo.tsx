import { Image, StyleSheet, View } from 'react-native';

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
      <Image
        accessibilityIgnoresInvertColors
        resizeMode="contain"
        source={require('../../assets/logo.png')}
        style={[
          styles.logo,
          compact ? styles.compactLogo : styles.fullLogo,
          { tintColor: color },
        ]}
      />
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
  logo: { display: 'flex' },
  fullLogo: { height: 285, width: 285 },
  compactLogo: { height: 76, width: 76 },
});
