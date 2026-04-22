import React from 'react';
import { View, Text, Image, StyleSheet, useWindowDimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Matches `expo.splash.backgroundColor` in app.json */
const SPLASH_BG = '#1f7a5f';

export const CREDITS_SPLASH_DURATION_MS = 5800;

export function CreditsSplash() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const imageMaxW = width * 0.88;
  const imageMaxH = height * 0.36;

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: SPLASH_BG,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <StatusBar style="light" />
      <View style={styles.middle}>
        <Image
          source={require('../../assets/splash-screen.png')}
          style={{ width: imageMaxW, height: imageMaxH }}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
        />
        <View style={styles.creditsBlock}>
          <Text style={styles.creditsLabel}>Built by</Text>
          <Text style={styles.creditsName}>Abhimanyu Kaushik</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  middle: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  creditsBlock: {
    alignItems: 'center',
    marginTop: 28,
  },
  creditsLabel: {
    fontSize: 22,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.88)',
    letterSpacing: 0.5,
  },
  creditsName: {
    marginTop: 10,
    fontSize: 34,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
});
