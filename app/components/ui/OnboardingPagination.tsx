import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Pressable, Animated, Easing } from 'react-native';
import { Colors, Radii, Shadows, Spacing } from '../../constants/DesignTokens';
import { Icon } from './Icon';
import { Motion } from '../../constants/MotionContract';

interface OnboardingPaginationProps {
  totalSteps: number;
  currentStep: number;
  onNext: () => void;
  style?: object;
}

function AnimatedDot({ active }: { active: boolean }) {
  const widthAnim = useRef(new Animated.Value(active ? 24 : 8)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: active ? 24 : 8,
      duration: Motion.duration.normal,
      easing: Easing.bezier(0.2, 0, 0, 1),
      useNativeDriver: false,
    }).start();
  }, [active, widthAnim]);

  return (
    <Animated.View
      style={[
        styles.dot,
        {
          width: widthAnim,
          backgroundColor: active ? Colors.textDark : Colors.greyBorder,
        },
      ]}
    />
  );
}

export function OnboardingPagination({
  totalSteps,
  currentStep,
  onNext,
  style,
}: OnboardingPaginationProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.timing(scaleAnim, {
      toValue: 0.9,
      duration: Motion.duration.fast,
      easing: Easing.bezier(0.2, 0, 0, 1),
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: Motion.duration.fast,
      easing: Easing.bezier(0.2, 0, 0, 1),
      useNativeDriver: true,
    }).start();
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.dotsContainer}>
        {Array.from({ length: totalSteps }).map((_, index) => (
          <AnimatedDot key={index} active={index === currentStep} />
        ))}
      </View>

      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Pressable
          onPress={onNext}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={[styles.nextButton, Shadows.button]}
        >
          <Icon name="arrow-right" size={24} color={Colors.white} />
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xxxl,
    paddingBottom: Spacing.xxxl + Spacing.lg,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 10,
  },
  nextButton: {
    width: 60,
    height: 60,
    borderRadius: Radii.xl,
    backgroundColor: Colors.textDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
