import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Animated, Easing } from 'react-native';
import { Colors, Radii, Shadows, Typography, Spacing } from '../../constants/DesignTokens';
import { Motion } from '../../constants/MotionContract';
import { Icon, MaterialIconName } from './Icon';
import { HierarchyLevel, MaterialStateLayer } from './types';

interface NoticeBannerProps {
  text: string;
  icon?: MaterialIconName;
  level?: HierarchyLevel;
  onPress?: () => void;
  showArrow?: boolean;
  disabled?: boolean;
  testID?: string;
}

const getLevelColors = (level: HierarchyLevel = 'portfolio') => {
  switch (level) {
    case 'portfolio':
      return { bg: Colors.greenSoft, text: Colors.green, icon: Colors.green };
    case 'property':
      return { bg: Colors.yellowSoft, text: Colors.yellow, icon: Colors.yellow };
    case 'room':
      return { bg: Colors.orangeSoft, text: Colors.orange, icon: Colors.orange };
  }
};

export function NoticeBanner({
  text,
  icon = 'auto-fix',
  level = 'portfolio',
  onPress,
  showArrow = true,
  disabled = false,
  testID,
}: NoticeBannerProps) {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const overlayAnim = React.useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    if (!onPress) return;
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.98,
        duration: Motion.duration.fast,
        easing: Easing.bezier(0.2, 0, 0, 1),
        useNativeDriver: true,
      }),
      Animated.timing(overlayAnim, {
        toValue: MaterialStateLayer.pressedOpacity,
        duration: Motion.duration.fast,
        easing: Easing.bezier(0.2, 0, 0, 1),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: Motion.duration.fast,
        easing: Easing.bezier(0.2, 0, 0, 1),
        useNativeDriver: true,
      }),
      Animated.timing(overlayAnim, {
        toValue: 0,
        duration: Motion.duration.fast,
        easing: Easing.bezier(0.2, 0, 0, 1),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const colors = getLevelColors(level);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || !onPress}
        testID={testID}
        style={[
          styles.container,
          { backgroundColor: colors.bg },
          disabled && styles.disabled,
        ]}
      >
        <Animated.View
          style={[
            styles.stateLayer,
            { opacity: overlayAnim },
          ]}
          pointerEvents="none"
        />
        
        <View style={styles.iconContainer}>
          <Icon name={icon} size={20} color={colors.icon} />
        </View>

        <Text style={[styles.text, { color: colors.text }]}>
          {text}
        </Text>

        {showArrow && onPress && (
          <Icon name="arrow-right" size={20} color={colors.icon} />
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radii.xl,
    gap: Spacing.sm,
    overflow: 'hidden',
    position: 'relative',
  },
  stateLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.textDark,
    borderRadius: Radii.xl,
  },
  disabled: {
    opacity: 0.5,
  },
  iconContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    flex: 1,
    fontSize: Typography.fontSize.body2,
    fontFamily: Typography.fontFamily.bodyMedium,
  },
});
