import { useCallback, useEffect, useRef } from 'react';
import { router, useFocusEffect } from 'expo-router';
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  ReduceMotion,
  SharedValue,
} from 'react-native-reanimated';
import { Durations, Easings } from '@/constants/MotionContract';

const HORIZONTAL_OFFSET = 300;

interface SharedAxisTransitionCore {
  screenOpacity: SharedValue<number>;
  screenTranslateX: SharedValue<number>;
  screenAnimatedStyle: { opacity: number; transform: { translateX: number }[] };
  animateIn: () => void;
  animatedBack: () => void;
  animatedExit: (callback: () => void) => void;
}

interface UseSharedAxisTransitionOptions {
  /** Skip auto-animating (manual control via animateIn) */
  manual?: boolean;
}

/**
 * Core shared-axis transition logic used by both route and mount variants.
 * This is not meant to be used directly - use useSharedAxisTransitionRoute or useSharedAxisTransition instead.
 */
function useSharedAxisTransitionCore(options: UseSharedAxisTransitionOptions = {}): SharedAxisTransitionCore {
  const { manual = false } = options;
  
  const screenOpacity = useSharedValue(0);
  const screenTranslateX = useSharedValue(HORIZONTAL_OFFSET);
  const hasAnimatedIn = useRef(false);

  const animateIn = useCallback(() => {
    screenOpacity.value = 0;
    screenTranslateX.value = HORIZONTAL_OFFSET;

    screenOpacity.value = withTiming(1, {
      duration: Durations.normal,
      easing: Easings.emphasized,
      reduceMotion: ReduceMotion.Never,
    });
    screenTranslateX.value = withTiming(0, {
      duration: Durations.normal,
      easing: Easings.emphasized,
      reduceMotion: ReduceMotion.Never,
    });
    hasAnimatedIn.current = true;
  }, []);

  const screenAnimatedStyle = useAnimatedStyle(() => ({
    opacity: screenOpacity.value,
    transform: [{ translateX: screenTranslateX.value }],
  }));

  const navigateBack = useCallback(() => {
    router.back();
  }, []);

  const animatedBack = useCallback(() => {
    screenOpacity.value = withTiming(0, {
      duration: Durations.normal,
      easing: Easings.emphasized,
      reduceMotion: ReduceMotion.Never,
    });
    screenTranslateX.value = withTiming(HORIZONTAL_OFFSET, {
      duration: Durations.normal,
      easing: Easings.emphasized,
      reduceMotion: ReduceMotion.Never,
    }, () => {
      runOnJS(navigateBack)();
    });
  }, [navigateBack]);

  const animatedExit = useCallback((callback: () => void) => {
    screenOpacity.value = withTiming(0, {
      duration: Durations.normal,
      easing: Easings.emphasized,
      reduceMotion: ReduceMotion.Never,
    });
    screenTranslateX.value = withTiming(HORIZONTAL_OFFSET, {
      duration: Durations.normal,
      easing: Easings.emphasized,
      reduceMotion: ReduceMotion.Never,
    }, () => {
      runOnJS(callback)();
    });
  }, []);

  return {
    screenOpacity,
    screenTranslateX,
    screenAnimatedStyle,
    animateIn,
    animatedBack,
    animatedExit,
  };
}

/**
 * Hook for Material Design horizontal shared-axis page transitions for ROUTE/TAB screens.
 * Uses useFocusEffect to animate on screen focus, which requires navigation context.
 * 
 * Use this for tab screens and route-based pages.
 * 
 * @example
 * const { screenAnimatedStyle, animatedBack } = useSharedAxisTransitionRoute();
 * return (
 *   <Animated.View style={[styles.animatedContainer, screenAnimatedStyle]}>
 *     <PageHeader onBackPress={animatedBack} />
 *   </Animated.View>
 * );
 */
export function useSharedAxisTransitionRoute(options: UseSharedAxisTransitionOptions = {}) {
  const { manual = false } = options;
  const core = useSharedAxisTransitionCore({ manual });

  useFocusEffect(
    useCallback(() => {
      if (!manual) {
        core.animateIn();
      }
      return () => {};
    }, [manual, core.animateIn])
  );

  return core;
}

/**
 * Hook for Material Design horizontal shared-axis page transitions for NON-ROUTE components.
 * Uses useEffect to animate on mount. Safe to use outside navigation context.
 * 
 * Use this for overlays, modals, and components that aren't direct route screens.
 * 
 * @example
 * const { screenAnimatedStyle, animatedExit } = useSharedAxisTransition();
 * const handleClose = () => animatedExit(onClose);
 */
export function useSharedAxisTransition(options: UseSharedAxisTransitionOptions = {}) {
  const { manual = false } = options;
  const core = useSharedAxisTransitionCore({ manual });

  useEffect(() => {
    if (!manual) {
      core.animateIn();
    }
  }, [manual, core.animateIn]);

  return core;
}
