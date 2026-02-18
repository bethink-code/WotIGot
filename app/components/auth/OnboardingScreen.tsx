import React, { useState, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Pressable, 
  Animated, 
  Easing, 
  Dimensions,
  Image,
  ActivityIndicator,
} from 'react-native';
import ReAnimated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { OnboardingSlide } from '@/components/ui/OnboardingSlide';
import { OnboardingPagination } from '@/components/ui/OnboardingPagination';
import { Icon } from '@/components/ui/Icon';
import { Colors, Typography, Spacing, Radii, Shadows } from '@/constants/DesignTokens';
import { Motion } from '@/constants/MotionContract';
import { useSharedAxisTransition } from '@/hooks/useSharedAxisTransition';

const splashImage = require('@/assets/images/splash_person.png');

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OnboardingScreenProps {
  onComplete: () => void;
  onLogin: () => void;
}

const SLIDES = [
  {
    icon: 'package-variant' as const,
    level: 'portfolio' as const,
    titleLine1: 'Always',
    titleLine2: 'Accurate.',
    description: 'Keep a living, detailed list of your belongings.',
  },
  {
    icon: 'camera' as const,
    level: 'room' as const,
    titleLine1: 'Smart',
    titleLine2: 'Capture.',
    description: 'Just point and shoot. AI builds your inventory.',
  },
  {
    icon: 'chart-line' as const,
    level: 'property' as const,
    titleLine1: 'Up to',
    titleLine2: 'Value.',
    description: 'Get real-time market estimates automatically.',
  },
];

export function OnboardingScreen({ onComplete, onLogin }: OnboardingScreenProps) {
  const [showSplash, setShowSplash] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const { screenAnimatedStyle, animatedExit } = useSharedAxisTransition();
  
  const splashOpacity = useRef(new Animated.Value(1)).current;
  const splashTranslateX = useRef(new Animated.Value(0)).current;
  const slidesOpacity = useRef(new Animated.Value(0)).current;
  const slideAnims = useRef(SLIDES.map(() => new Animated.Value(SCREEN_WIDTH))).current;
  const paginationOpacity = useRef(new Animated.Value(0)).current;

  const handleLogin = useCallback(() => {
    animatedExit(onLogin);
  }, [onLogin, animatedExit]);

  const handleComplete = useCallback(() => {
    animatedExit(onComplete);
  }, [onComplete, animatedExit]);

  const handleStart = () => {
    Animated.parallel([
      Animated.timing(splashOpacity, {
        toValue: 0,
        duration: Motion.duration.normal,
        easing: Easing.bezier(0.2, 0, 0, 1),
        useNativeDriver: true,
      }),
      Animated.timing(splashTranslateX, {
        toValue: -SCREEN_WIDTH * 0.5,
        duration: Motion.duration.normal,
        easing: Easing.bezier(0.2, 0, 0, 1),
        useNativeDriver: true,
      }),
      Animated.timing(slidesOpacity, {
        toValue: 1,
        duration: Motion.duration.normal,
        easing: Easing.bezier(0.2, 0, 0, 1),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnims[0], {
        toValue: 0,
        duration: Motion.duration.normal,
        easing: Easing.bezier(0.2, 0, 0, 1),
        useNativeDriver: true,
      }),
      Animated.timing(paginationOpacity, {
        toValue: 1,
        duration: Motion.duration.normal,
        delay: 200,
        easing: Easing.bezier(0.2, 0, 0, 1),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowSplash(false);
    });
  };

  const handleNext = () => {
    if (currentSlide < SLIDES.length - 1) {
      const nextSlide = currentSlide + 1;
      
      Animated.parallel([
        Animated.timing(slideAnims[currentSlide], {
          toValue: -SCREEN_WIDTH * 0.5,
          duration: Motion.duration.normal,
          easing: Easing.bezier(0.2, 0, 0, 1),
          useNativeDriver: true,
        }),
        Animated.timing(slideAnims[nextSlide], {
          toValue: 0,
          duration: Motion.duration.normal,
          easing: Easing.bezier(0.2, 0, 0, 1),
          useNativeDriver: true,
        }),
      ]).start();
      
      setCurrentSlide(nextSlide);
    } else {
      handleComplete();
    }
  };

  return (
    <ReAnimated.View style={[styles.animatedContainer, screenAnimatedStyle]}>
      <SafeAreaView style={styles.container}>
        {showSplash && (
        <Animated.View 
          style={[
            styles.splashContainer,
            {
              opacity: splashOpacity,
              transform: [{ translateX: splashTranslateX }],
            },
          ]}
        >
          <View style={styles.splashContent}>
            <Text style={styles.logoText}>
              <Text style={styles.logoMain}>wot</Text>
              <Text style={styles.logoI}>i</Text>
              <Text style={styles.logoMain}>got</Text>
              <Text style={styles.logoDot}>.</Text>
            </Text>

            <View style={styles.imageContainer}>
              {!imageLoaded && (
                <View style={[styles.funkyImage, styles.imageLoader]}>
                  <ActivityIndicator size="large" color={Colors.green} />
                </View>
              )}
              <Image
                source={splashImage}
                style={[
                  styles.funkyImage, 
                  !imageLoaded && { position: 'absolute', left: -9999 }
                ]}
                onLoad={() => setImageLoaded(true)}
              />
            </View>

            <View style={styles.splashActions}>
              <Pressable 
                style={({ pressed }) => [
                  styles.startButton,
                  pressed && styles.startButtonPressed,
                ]}
                onPress={handleStart}
              >
                <Text style={styles.startButtonText}>Let's Go</Text>
                <Icon name="arrow-right" size={20} color={Colors.white} />
              </Pressable>

              <Pressable onPress={handleLogin} style={styles.loginLink}>
                <Text style={styles.loginLinkText}>
                  Already have an account? <Text style={styles.loginLinkBold}>Log In</Text>
                </Text>
              </Pressable>
            </View>
          </View>
        </Animated.View>
      )}

      <Animated.View 
        style={[
          styles.slidesContainer,
          { opacity: slidesOpacity },
        ]}
        pointerEvents={showSplash ? 'none' : 'auto'}
      >
        {SLIDES.map((slide, index) => (
          <Animated.View
            key={index}
            style={[
              styles.slideWrapper,
              {
                transform: [{ translateX: slideAnims[index] }],
                opacity: slideAnims[index].interpolate({
                  inputRange: [-SCREEN_WIDTH * 0.5, 0, SCREEN_WIDTH],
                  outputRange: [0, 1, 0],
                }),
              },
            ]}
          >
            <OnboardingSlide
              icon={slide.icon}
              level={slide.level}
              titleLine1={slide.titleLine1}
              titleLine2={slide.titleLine2}
              description={slide.description}
            />
          </Animated.View>
        ))}
      </Animated.View>

      <Animated.View 
        style={[
          styles.paginationContainer,
          { opacity: paginationOpacity },
        ]}
        pointerEvents={showSplash ? 'none' : 'auto'}
      >
        <OnboardingPagination
          totalSteps={SLIDES.length}
          currentStep={currentSlide}
          onNext={handleNext}
        />
      </Animated.View>
      </SafeAreaView>
    </ReAnimated.View>
  );
}

const styles = StyleSheet.create({
  animatedContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.bgCanvas,
  },
  splashContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
    backgroundColor: Colors.bgCanvas,
  },
  splashContent: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: Spacing.xl,
  },
  logoText: {
    fontSize: 48,
    fontFamily: Typography.fontFamily.bold,
    letterSpacing: -2,
  },
  logoMain: {
    color: Colors.textDark,
  },
  logoI: {
    color: Colors.green,
  },
  logoDot: {
    color: Colors.orange,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  funkyImage: {
    width: 280,
    height: 320,
    borderRadius: 40,
    transform: [{ rotate: '-3deg' }],
    ...Shadows.float,
  },
  imageLoader: {
    position: 'absolute',
    backgroundColor: Colors.greyBg,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  splashActions: {
    alignItems: 'center',
    width: '100%',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.textDark,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xxxl,
    borderRadius: 100,
    gap: Spacing.sm,
    ...Shadows.button,
  },
  startButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  startButtonText: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
  },
  loginLink: {
    marginTop: Spacing.lg,
    padding: Spacing.sm,
  },
  loginLinkText: {
    fontSize: Typography.fontSize.body2,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textGrey,
  },
  loginLinkBold: {
    fontFamily: Typography.fontFamily.bodySemiBold,
    color: Colors.textDark,
    textDecorationLine: 'underline',
  },
  slidesContainer: {
    flex: 1,
  },
  slideWrapper: {
    ...StyleSheet.absoluteFillObject,
  },
  paginationContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
});
