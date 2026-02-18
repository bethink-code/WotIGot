import React, { useCallback, useState, ReactNode } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  withTiming,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useFocusEffect } from 'expo-router';
import { Durations, Easings } from '@/constants/MotionContract';

type TransitionType = 'fade' | 'slideUp' | 'fadeSlide';

interface AnimatedScreenProps {
  children: ReactNode;
  transition?: TransitionType;
  style?: ViewStyle;
  delay?: number;
}

export function AnimatedScreen({
  children,
  transition = 'fadeSlide',
  style,
  delay = 0,
}: AnimatedScreenProps) {
  const [key, setKey] = useState(0);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(16);

  useFocusEffect(
    useCallback(() => {
      setKey((prevKey) => prevKey + 1);
      
      const timer = setTimeout(() => {
        opacity.value = withTiming(1, {
          duration: Durations.normal,
          easing: Easings.emphasizedDecelerate,
        });
        translateY.value = withTiming(0, {
          duration: Durations.normal,
          easing: Easings.emphasized,
        });
      }, delay);

      return () => {
        clearTimeout(timer);
        opacity.value = 0;
        translateY.value = 16;
      };
    }, [delay])
  );

  const animatedStyle = useAnimatedStyle(() => {
    if (transition === 'fade') {
      return {
        opacity: opacity.value,
      };
    }
    return {
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }],
    };
  });

  return (
    <Animated.View
      key={key}
      style={[styles.container, animatedStyle, style]}
    >
      {children}
    </Animated.View>
  );
}

interface AnimatedContentProps {
  children: ReactNode;
  delay?: number;
  style?: ViewStyle;
}

export function AnimatedContent({ children, delay = 0, style }: AnimatedContentProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(12);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      opacity.value = withTiming(1, {
        duration: Durations.normal,
        easing: Easings.emphasizedDecelerate,
      });
      translateY.value = withTiming(0, {
        duration: Durations.normal,
        easing: Easings.emphasized,
      });
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[animatedStyle, style]}>
      {children}
    </Animated.View>
  );
}

interface AnimatedListItemProps {
  children: ReactNode;
  index: number;
  staggerDelay?: number;
  style?: ViewStyle;
}

export function AnimatedListItem({ 
  children, 
  index, 
  staggerDelay = 50,
  style 
}: AnimatedListItemProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(16);

  React.useEffect(() => {
    const delay = index * staggerDelay;
    const timer = setTimeout(() => {
      opacity.value = withTiming(1, {
        duration: Durations.normal,
        easing: Easings.emphasizedDecelerate,
      });
      translateY.value = withTiming(0, {
        duration: Durations.normal,
        easing: Easings.emphasized,
      });
    }, delay);

    return () => clearTimeout(timer);
  }, [index, staggerDelay]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[animatedStyle, style]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
