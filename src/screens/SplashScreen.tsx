import { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { BackgroundBubbles } from '../components/BackgroundBubbles';
import { BrandLogo } from '../components/BrandLogo';

export function SplashScreen() {
  const entrance = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(entrance, {
        friction: 7,
        tension: 45,
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.timing(progress, {
        duration: 1900,
        easing: Easing.out(Easing.cubic),
        toValue: 1,
        useNativeDriver: false,
      }),
    ]).start();
  }, [entrance, progress]);

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['8%', '100%'],
  });

  return (
    <LinearGradient
      colors={['#78A5F8', '#4D82EE', '#366FDF']}
      end={{ x: 1, y: 1 }}
      start={{ x: 0, y: 0 }}
      style={styles.screen}
    >
      <BackgroundBubbles />

      <Animated.View
        style={[
          styles.brandContainer,
          {
            opacity: entrance,
            transform: [
              {
                scale: entrance.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.86, 1],
                }),
              },
            ],
          },
        ]}
      >
        <BrandLogo light />
      </Animated.View>

      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Preparando tu experiencia</Text>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    overflow: 'hidden',
    paddingHorizontal: 28,
  },
  brandContainer: {
    marginBottom: 32,
  },
  loadingContainer: {
    alignItems: 'center',
    bottom: 64,
    position: 'absolute',
    width: '70%',
  },
  loadingText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
    marginBottom: 12,
  },
  progressTrack: {
    backgroundColor: 'rgba(255,255,255,0.28)',
    borderRadius: 999,
    height: 5,
    overflow: 'hidden',
    width: '100%',
  },
  progressFill: {
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    height: '100%',
  },
});
