import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { ONBOARDING_SLIDES, APP_NAME, colors, spacing, borderRadius } from '@uritech/shared';

const { width } = Dimensions.get('window');

export default function OnboardingScreen() {
  const [current, setCurrent] = useState(0);
  const slide = ONBOARDING_SLIDES[current];
  const isLast = current === ONBOARDING_SLIDES.length - 1;

  const handleNext = () => {
    if (isLast) {
      router.replace('/(auth)/signin');
    } else {
      setCurrent(current + 1);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.skipBtn} onPress={() => router.replace('/(auth)/signin')}>
        <Text style={styles.skipText}>Saltar</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={styles.logoArea}>
          <View style={styles.logoIcon}>
            <Text style={styles.logoLetter}>U</Text>
          </View>
          <Text style={styles.appName}>{APP_NAME}</Text>
        </View>

        <View style={styles.illustration}>
          <Text style={styles.illustrationEmoji}>
            {current === 0 ? '🚕' : current === 1 ? '🛒' : '💳'}
          </Text>
        </View>

        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.subtitle}>{slide.subtitle}</Text>

        <View style={styles.dots}>
          {ONBOARDING_SLIDES.map((_, i) => (
            <View key={i} style={[styles.dot, i === current && styles.dotActive]} />
          ))}
        </View>
      </View>

      <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
        <Text style={styles.nextBtnText}>{isLast ? 'Começar agora' : 'Próximo'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white, padding: spacing.xl },
  skipBtn: { alignSelf: 'flex-end', paddingTop: 50, padding: spacing.md },
  skipText: { color: colors.gray500, fontSize: 14, fontWeight: '600' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
  logoArea: { alignItems: 'center', marginBottom: spacing['4xl'] },
  logoIcon: { width: 64, height: 64, backgroundColor: colors.primary, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  logoLetter: { color: colors.white, fontSize: 32, fontWeight: '700' },
  appName: { fontSize: 28, fontWeight: '700', color: colors.black },
  illustration: { width: width * 0.6, height: width * 0.5, backgroundColor: colors.primaryLight, borderRadius: borderRadius['2xl'], alignItems: 'center', justifyContent: 'center', marginBottom: spacing['3xl'] },
  illustrationEmoji: { fontSize: 80 },
  title: { fontSize: 24, fontWeight: '700', textAlign: 'center', marginBottom: spacing.md, color: colors.black },
  subtitle: { fontSize: 15, color: colors.gray500, textAlign: 'center', lineHeight: 22, paddingHorizontal: spacing.xl },
  dots: { flexDirection: 'row', gap: 8, marginTop: spacing['3xl'] },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.gray100 },
  dotActive: { backgroundColor: colors.primary, width: 24 },
  nextBtn: { backgroundColor: colors.primary, padding: spacing.lg, borderRadius: borderRadius.lg, alignItems: 'center', marginBottom: spacing['3xl'] },
  nextBtnText: { color: colors.white, fontSize: 16, fontWeight: '700' },
});
