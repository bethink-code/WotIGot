import React, { useEffect, useCallback } from 'react';
import { View, StyleSheet, Image, Text, Modal } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  withSpring,
  Easing,
  interpolate,
  interpolateColor,
  ReduceMotion,
  runOnJS,
} from 'react-native-reanimated';
import { Icon } from '@/components/ui/Icon';
import { Colors, Spacing, Typography, Radii } from '@/constants/DesignTokens';

interface AnalyzingOverlayProps {
  visible: boolean;
  imageUri?: string;
  title?: string;
  subtitle?: string;
  steps?: Array<{
    label: string;
    status: 'complete' | 'active' | 'pending';
  }>;
}

function AnimatedEllipsis() {
  const dot1 = useSharedValue(0);
  const dot2 = useSharedValue(0);
  const dot3 = useSharedValue(0);

  useEffect(() => {
    dot1.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 300, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: 300, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false,
      () => {},
      ReduceMotion.Never
    );
    dot2.value = withDelay(200,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 300, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.3, { duration: 300, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false,
        () => {},
        ReduceMotion.Never
      )
    );
    dot3.value = withDelay(400,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 300, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.3, { duration: 300, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false,
        () => {},
        ReduceMotion.Never
      )
    );
  }, []);

  const dot1Style = useAnimatedStyle(() => ({
    opacity: dot1.value,
    transform: [{ scale: interpolate(dot1.value, [0.3, 1], [0.8, 1.2]) }],
  }));

  const dot2Style = useAnimatedStyle(() => ({
    opacity: dot2.value,
    transform: [{ scale: interpolate(dot2.value, [0.3, 1], [0.8, 1.2]) }],
  }));

  const dot3Style = useAnimatedStyle(() => ({
    opacity: dot3.value,
    transform: [{ scale: interpolate(dot3.value, [0.3, 1], [0.8, 1.2]) }],
  }));

  return (
    <View style={ellipsisStyles.container}>
      <Animated.Text style={[ellipsisStyles.dot, dot1Style]}>.</Animated.Text>
      <Animated.Text style={[ellipsisStyles.dot, dot2Style]}>.</Animated.Text>
      <Animated.Text style={[ellipsisStyles.dot, dot3Style]}>.</Animated.Text>
    </View>
  );
}

const ellipsisStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginLeft: 2,
  },
  dot: {
    fontSize: Typography.fontSize.title,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textDark,
  },
});

interface StepItemProps {
  step: { label: string; status: 'complete' | 'active' | 'pending' };
  index: number;
  isVisible: boolean;
}

function StepItem({ step, index, isVisible }: StepItemProps) {
  const entranceOpacity = useSharedValue(0);
  const entranceTranslate = useSharedValue(20);
  const checkScale = useSharedValue(0);
  const activeGlow = useSharedValue(0.5);
  const activeScale = useSharedValue(1);
  const spinRotation = useSharedValue(0);
  const connectorProgress = useSharedValue(0);

  useEffect(() => {
    if (isVisible) {
      entranceOpacity.value = withDelay(
        index * 150,
        withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) })
      );
      entranceTranslate.value = withDelay(
        index * 150,
        withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) })
      );
    }
  }, [isVisible, index]);

  useEffect(() => {
    if (step.status === 'complete') {
      checkScale.value = withSequence(
        withTiming(0, { duration: 0 }),
        withSpring(1.3, { damping: 8, stiffness: 200 }),
        withSpring(1, { damping: 12, stiffness: 150 })
      );
      connectorProgress.value = withTiming(1, { duration: 300 });
    } else if (step.status === 'active') {
      activeGlow.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.5, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true,
        () => {},
        ReduceMotion.Never
      );
      activeScale.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 600, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true,
        () => {},
        ReduceMotion.Never
      );
      spinRotation.value = withRepeat(
        withTiming(360, { duration: 1500, easing: Easing.linear }),
        -1,
        false,
        () => {},
        ReduceMotion.Never
      );
    }
  }, [step.status]);

  const entranceStyle = useAnimatedStyle(() => ({
    opacity: entranceOpacity.value,
    transform: [{ translateY: entranceTranslate.value }],
  }));

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));

  const activeGlowStyle = useAnimatedStyle(() => ({
    opacity: activeGlow.value,
    transform: [{ scale: activeScale.value }],
  }));

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spinRotation.value}deg` }],
  }));

  const textStyle = useAnimatedStyle(() => {
    const color = step.status === 'pending' 
      ? Colors.textMuted 
      : step.status === 'active'
        ? Colors.orange
        : Colors.textDark;
    return { color };
  });

  return (
    <Animated.View style={[stepStyles.stepRow, entranceStyle]}>
      <View style={stepStyles.iconWrapper}>
        {step.status === 'complete' && (
          <Animated.View style={[stepStyles.checkContainer, checkStyle]}>
            <View style={stepStyles.checkCircle}>
              <Icon name="check" size={14} color={Colors.white} />
            </View>
          </Animated.View>
        )}
        {step.status === 'active' && (
          <View style={stepStyles.activeContainer}>
            <Animated.View style={[stepStyles.activeGlow, activeGlowStyle]} />
            <Animated.View style={[stepStyles.activeSpinner, spinStyle]}>
              <View style={stepStyles.spinnerArc} />
            </Animated.View>
            <View style={stepStyles.activeDot} />
          </View>
        )}
        {step.status === 'pending' && (
          <View style={stepStyles.pendingDot} />
        )}
      </View>
      <Animated.Text style={[stepStyles.stepText, textStyle]}>
        {step.label}
      </Animated.Text>
    </Animated.View>
  );
}

const stepStyles = StyleSheet.create({
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  iconWrapper: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.green,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeGlow: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.orangeSoft,
  },
  activeSpinner: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: 'transparent',
    borderTopColor: Colors.orange,
  },
  spinnerArc: {},
  activeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.orange,
  },
  pendingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.greyLight,
    backgroundColor: 'transparent',
  },
  stepText: {
    fontSize: Typography.fontSize.body1,
    fontFamily: Typography.fontFamily.bodyMedium,
  },
});

export function AnalyzingOverlay({
  visible,
  imageUri,
  title = 'Analyzing',
  subtitle = 'AI is processing your request',
  steps = [
    { label: 'Photo captured', status: 'complete' },
    { label: 'Recognizing item', status: 'active' },
    { label: 'Estimating value', status: 'pending' },
  ],
}: AnalyzingOverlayProps) {
  const outerRingRotation = useSharedValue(0);
  const middleRingRotation = useSharedValue(0);
  const innerRingRotation = useSharedValue(0);
  const iconPulse = useSharedValue(1);
  const iconGlow = useSharedValue(0.3);
  const scanLinePosition = useSharedValue(0);
  const waveScale1 = useSharedValue(0.5);
  const waveOpacity1 = useSharedValue(0.6);
  const waveScale2 = useSharedValue(0.5);
  const waveOpacity2 = useSharedValue(0.6);
  const waveScale3 = useSharedValue(0.5);
  const waveOpacity3 = useSharedValue(0.6);
  const contentOpacity = useSharedValue(0);
  const contentScale = useSharedValue(0.9);
  const shimmerPosition = useSharedValue(-1);

  useEffect(() => {
    if (visible) {
      contentOpacity.value = withTiming(1, { duration: 300 });
      contentScale.value = withSpring(1, { damping: 15, stiffness: 150 });

      outerRingRotation.value = withRepeat(
        withTiming(360, { duration: 4000, easing: Easing.linear }),
        -1,
        false,
        () => {},
        ReduceMotion.Never
      );

      middleRingRotation.value = withRepeat(
        withTiming(-360, { duration: 3000, easing: Easing.linear }),
        -1,
        false,
        () => {},
        ReduceMotion.Never
      );

      innerRingRotation.value = withRepeat(
        withTiming(360, { duration: 2000, easing: Easing.linear }),
        -1,
        false,
        () => {},
        ReduceMotion.Never
      );

      iconPulse.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true,
        () => {},
        ReduceMotion.Never
      );

      iconGlow.value = withRepeat(
        withSequence(
          withTiming(0.8, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.3, { duration: 1000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true,
        () => {},
        ReduceMotion.Never
      );

      scanLinePosition.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.quad) }),
          withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        false,
        () => {},
        ReduceMotion.Never
      );

      const startWave = (scaleVal: Animated.SharedValue<number>, opacityVal: Animated.SharedValue<number>, delay: number) => {
        scaleVal.value = withDelay(delay,
          withRepeat(
            withSequence(
              withTiming(0.5, { duration: 0 }),
              withTiming(1.3, { duration: 1500, easing: Easing.out(Easing.cubic) })
            ),
            -1,
            false,
            () => {},
            ReduceMotion.Never
          )
        );
        opacityVal.value = withDelay(delay,
          withRepeat(
            withSequence(
              withTiming(0.5, { duration: 0 }),
              withTiming(0, { duration: 1500, easing: Easing.out(Easing.cubic) })
            ),
            -1,
            false,
            () => {},
            ReduceMotion.Never
          )
        );
      };

      startWave(waveScale1, waveOpacity1, 0);
      startWave(waveScale2, waveOpacity2, 500);
      startWave(waveScale3, waveOpacity3, 1000);

      shimmerPosition.value = withRepeat(
        withSequence(
          withTiming(-1, { duration: 0 }),
          withTiming(2, { duration: 2000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false,
        () => {},
        ReduceMotion.Never
      );
    } else {
      contentOpacity.value = 0;
      contentScale.value = 0.9;
    }
  }, [visible]);

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ scale: contentScale.value }],
  }));

  const outerRingStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${outerRingRotation.value}deg` }],
  }));

  const middleRingStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${middleRingRotation.value}deg` }],
  }));

  const innerRingStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${innerRingRotation.value}deg` }],
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconPulse.value }],
  }));

  const iconGlowStyle = useAnimatedStyle(() => ({
    opacity: iconGlow.value,
    transform: [{ scale: interpolate(iconGlow.value, [0.3, 0.8], [1, 1.4]) }],
  }));

  const scanLineStyle = useAnimatedStyle(() => ({
    top: interpolate(scanLinePosition.value, [0, 1], [0, 180]),
    opacity: interpolate(scanLinePosition.value, [0, 0.1, 0.9, 1], [0.3, 1, 1, 0.3]),
  }));

  const wave1Style = useAnimatedStyle(() => ({
    transform: [{ scale: waveScale1.value }],
    opacity: waveOpacity1.value,
  }));

  const wave2Style = useAnimatedStyle(() => ({
    transform: [{ scale: waveScale2.value }],
    opacity: waveOpacity2.value,
  }));

  const wave3Style = useAnimatedStyle(() => ({
    transform: [{ scale: waveScale3.value }],
    opacity: waveOpacity3.value,
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
    >
      <View style={styles.container}>
        <Animated.View style={[styles.content, contentStyle]}>
          <View style={styles.imageContainer}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Icon name="image-outline" size={48} color={Colors.greyLight} />
              </View>
            )}
            <View style={styles.overlay} />
            
            <View style={styles.scannerContainer}>
              <Animated.View style={[styles.waveRing, wave1Style]} />
              <Animated.View style={[styles.waveRing, wave2Style]} />
              <Animated.View style={[styles.waveRing, wave3Style]} />
              
              <Animated.View style={[styles.outerRing, outerRingStyle]}>
                <View style={styles.outerRingSegment1} />
                <View style={styles.outerRingSegment2} />
              </Animated.View>
              
              <Animated.View style={[styles.middleRing, middleRingStyle]}>
                <View style={styles.middleRingDot1} />
                <View style={styles.middleRingDot2} />
                <View style={styles.middleRingDot3} />
                <View style={styles.middleRingDot4} />
              </Animated.View>
              
              <Animated.View style={[styles.innerRing, innerRingStyle]} />
              
              <Animated.View style={[styles.iconGlow, iconGlowStyle]} />
              <Animated.View style={[styles.iconContainer, iconStyle]}>
                <Icon name="magnify" size={28} color={Colors.white} />
              </Animated.View>
            </View>

            <Animated.View style={[styles.scanLine, scanLineStyle]} />
          </View>

          <View style={styles.titleRow}>
            <Text style={styles.title}>{title}</Text>
            <AnimatedEllipsis />
          </View>
          <Text style={styles.subtitle}>{subtitle}</Text>

          <View style={styles.stepsContainer}>
            <View style={styles.connectorLine} />
            {steps.map((step, index) => (
              <StepItem
                key={index}
                step={step}
                index={index}
                isVisible={visible}
              />
            ))}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgCanvas,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: Spacing.xl,
    alignItems: 'center',
    maxWidth: 320,
  },
  imageContainer: {
    width: 200,
    height: 200,
    borderRadius: Radii.xxl,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: Spacing.xl,
    backgroundColor: Colors.greyBg,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.greyBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  scannerContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  waveRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: Colors.orange,
  },
  outerRing: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    justifyContent: 'center',
    alignItems: 'center',
  },
  outerRingSegment1: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: 'transparent',
    borderTopColor: Colors.orange,
    borderRightColor: Colors.orange,
  },
  outerRingSegment2: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: 'transparent',
    borderBottomColor: 'rgba(255,255,255,0.3)',
  },
  middleRing: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  middleRingDot1: {
    position: 'absolute',
    top: -3,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.orange,
  },
  middleRingDot2: {
    position: 'absolute',
    right: -3,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  middleRingDot3: {
    position: 'absolute',
    bottom: -3,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.orange,
  },
  middleRingDot4: {
    position: 'absolute',
    left: -3,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  innerRing: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: 'transparent',
    borderTopColor: 'rgba(255,255,255,0.4)',
    borderLeftColor: 'rgba(255,255,255,0.4)',
  },
  iconGlow: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.orange,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.orange,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.orange,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  scanLine: {
    position: 'absolute',
    left: 10,
    right: 10,
    height: 2,
    backgroundColor: Colors.orange,
    shadowColor: Colors.orange,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  title: {
    fontSize: Typography.fontSize.title,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textDark,
  },
  subtitle: {
    fontSize: Typography.fontSize.body2,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textGrey,
    marginBottom: Spacing.xl,
    textAlign: 'center',
  },
  stepsContainer: {
    alignItems: 'flex-start',
    position: 'relative',
  },
  connectorLine: {
    position: 'absolute',
    left: 11,
    top: 24,
    bottom: 24,
    width: 2,
    backgroundColor: Colors.greyLight,
    borderRadius: 1,
  },
});
