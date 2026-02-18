import { Easing } from 'react-native-reanimated';

export const Durations = {
  instant: 100,
  fast: 150,
  normal: 300,
  medium: 400,
  slow: 500,
  loader: 2000,
  float: 5000,
} as const;

export const Easings = {
  emphasized: Easing.bezier(0.2, 0, 0, 1),
  emphasizedAccelerate: Easing.bezier(0.3, 0, 0.8, 0.15),
  emphasizedDecelerate: Easing.bezier(0.05, 0.7, 0.1, 1),
  
  standard: Easing.bezier(0.2, 0, 0, 1),
  standardAccelerate: Easing.bezier(0.3, 0, 1, 1),
  standardDecelerate: Easing.bezier(0, 0, 0, 1),
  
  smooth: Easing.bezier(0.2, 0.8, 0.2, 1),
  
  default: Easing.ease,
  
  easeOut: Easing.out(Easing.ease),
  easeIn: Easing.in(Easing.ease),
  easeInOut: Easing.inOut(Easing.ease),
  
  linear: Easing.linear,
} as const;

export const StaggerConfig = {
  listItems: 50,
  cards: 60,
  gridItems: 40,
} as const;

export const Animations = {
  onboardingSlide: {
    duration: Durations.slow,
    easing: Easings.smooth,
    description: 'Slide transition between onboarding screens',
    properties: {
      enter: { translateX: '100%', opacity: 0 },
      active: { translateX: 0, opacity: 1 },
      exit: { translateX: '-50%', opacity: 0 },
    },
  },
  
  floatingIcon: {
    duration: Durations.float,
    easing: Easings.easeInOut,
    loop: true,
    description: 'Gentle float up/down for onboarding icons',
    properties: {
      start: { translateY: 0 },
      peak: { translateY: -10 },
      end: { translateY: 0 },
    },
  },
  
  authScreenSlide: {
    duration: Durations.slow,
    easing: Easings.smooth,
    description: 'Auth screen slides up from bottom',
    properties: {
      hidden: { translateY: '100%' },
      visible: { translateY: 0 },
    },
  },
  
  modalSheet: {
    duration: Durations.normal,
    easing: Easings.smooth,
    description: 'Bottom sheet modal with backdrop',
    properties: {
      backdrop: {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
      },
      sheet: {
        hidden: { translateY: '100%' },
        visible: { translateY: 0 },
      },
    },
  },
  
  loaderBar: {
    duration: Durations.loader,
    easing: Easings.linear,
    description: 'Progress bar fill during AI analysis',
    properties: {
      start: { width: '0%' },
      end: { width: '100%' },
    },
  },
  
  screenTransition: {
    duration: Durations.normal,
    easing: Easings.default,
    description: 'Screen push/pop navigation (transition: 0.3s)',
    properties: {
      enter: { translateX: '100%' },
      active: { translateX: 0 },
      exit: { translateX: '-30%' },
    },
  },
  
  dotIndicator: {
    duration: Durations.normal,
    easing: Easings.default,
    description: 'Dot width change for pagination (transition: 0.3s)',
    properties: {
      inactive: { width: 8 },
      active: { width: 24 },
    },
  },
  
  buttonPress: {
    duration: Durations.fast,
    easing: Easings.easeOut,
    description: 'Scale down on press',
    properties: {
      default: { scale: 1 },
      pressed: { scale: 0.95 },
    },
  },
  
  fadeIn: {
    duration: Durations.normal,
    easing: Easings.easeOut,
    description: 'Simple fade in',
    properties: {
      hidden: { opacity: 0 },
      visible: { opacity: 1 },
    },
  },
  
  cardHover: {
    duration: Durations.fast,
    easing: Easings.easeOut,
    description: 'Card lift on touch',
    properties: {
      default: { translateY: 0 },
      hover: { translateY: -2 },
    },
  },
} as const;

export const SpringConfigs = {
  gentle: {
    damping: 15,
    stiffness: 100,
    mass: 1,
  },
  bouncy: {
    damping: 10,
    stiffness: 150,
    mass: 0.5,
  },
  stiff: {
    damping: 20,
    stiffness: 200,
    mass: 1,
  },
} as const;

export type AnimationName = keyof typeof Animations;
export type SpringConfigName = keyof typeof SpringConfigs;

export const Motion = {
  duration: Durations,
  easing: Easings,
  animations: Animations,
  spring: SpringConfigs,
  stagger: StaggerConfig,
} as const;
