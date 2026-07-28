import { StyleSheet, View } from 'react-native';

type BackgroundBubblesProps = {
  light?: boolean;
};

export function BackgroundBubbles({ light = false }: BackgroundBubblesProps) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View
        style={[
          styles.bubble,
          styles.topRight,
          light ? styles.lightBlue : styles.white,
        ]}
      />
      <View
        style={[
          styles.bubble,
          styles.left,
          light ? styles.lavender : styles.white,
        ]}
      />
      <View
        style={[
          styles.bubble,
          styles.bottom,
          light ? styles.blue : styles.white,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    position: 'absolute',
    borderRadius: 999,
  },
  topRight: {
    height: 250,
    right: -56,
    top: -72,
    width: 250,
  },
  left: {
    height: 150,
    left: -76,
    top: 150,
    width: 150,
  },
  bottom: {
    bottom: -92,
    height: 250,
    right: -22,
    width: 250,
  },
  white: {
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  lightBlue: {
    backgroundColor: '#C7D9FA',
  },
  lavender: {
    backgroundColor: '#D8D5F7',
  },
  blue: {
    backgroundColor: '#A8C7FA',
  },
});
