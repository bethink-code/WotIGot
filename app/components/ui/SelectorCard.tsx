import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Animated, Easing } from 'react-native';
import { Colors, Radii, Shadows, Typography, Spacing } from '../../constants/DesignTokens';
import { Motion } from '../../constants/MotionContract';
import { Icon, MaterialIconName } from './Icon';
import { HierarchyLevel, SelectorState, MaterialStateLayer } from './types';

interface SelectorCardProps {
  title: string;
  subtitle?: string;
  icon?: MaterialIconName;
  level?: HierarchyLevel;
  state?: SelectorState;
  onPress?: () => void;
  disabled?: boolean;
  testID?: string;
}

const getLevelColors = (level: HierarchyLevel = 'portfolio') => {
  switch (level) {
    case 'portfolio':
      return { border: Colors.green, bg: Colors.greenSoft, icon: Colors.green };
    case 'property':
      return { border: Colors.yellow, bg: Colors.yellowSoft, icon: Colors.yellow };
    case 'room':
      return { border: Colors.orange, bg: Colors.orangeSoft, icon: Colors.orange };
  }
};

export function SelectorCard({
  title,
  subtitle,
  icon,
  level = 'property',
  state = 'default',
  onPress,
  disabled = false,
  testID,
}: SelectorCardProps) {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const overlayAnim = React.useRef(new Animated.Value(0)).current;
  const colors = getLevelColors(level);

  const handlePressIn = () => {
    if (state === 'unselectable') return;
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

  const isSelected = state === 'selected';
  const isUnselectable = state === 'unselectable';

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || isUnselectable}
        testID={testID || 'selector-card'}
        style={[
          styles.container,
          isSelected && { borderColor: colors.border, borderWidth: 2 },
          isUnselectable && styles.unselectable,
        ]}
      >
        <Animated.View
          style={[
            styles.stateLayer,
            { opacity: overlayAnim },
          ]}
          pointerEvents="none"
        />
        {icon && (
          <View style={[
            styles.iconContainer, 
            { backgroundColor: isUnselectable ? Colors.greyBg : colors.bg }
          ]}>
            <Icon 
              name={icon} 
              size={24} 
              color={isUnselectable ? Colors.greyMid : Colors.textDark} 
            />
          </View>
        )}

        <View style={styles.content}>
          <Text 
            style={[
              styles.title,
              isUnselectable && styles.unselectableText
            ]} 
            numberOfLines={1}
          >
            {title}
          </Text>
          {subtitle && (
            <Text 
              style={[
                styles.subtitle,
                isUnselectable && styles.unselectableText
              ]} 
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          )}
        </View>

        {isSelected && (
          <View style={[styles.checkmark, { backgroundColor: colors.border }]}>
            <Icon name="check" size={16} color={Colors.white} />
          </View>
        )}

        {isUnselectable && (
          <Icon name="lock-outline" size={20} color={Colors.greyMid} />
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.cardBg,
    borderRadius: Radii.xxl,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
    position: 'relative',
  },
  stateLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.textDark,
    borderRadius: Radii.xxl,
  },
  unselectable: {
    opacity: 0.6,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: Radii.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: Typography.fontSize.subhead,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textDark,
  },
  subtitle: {
    fontSize: Typography.fontSize.body2,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textGrey,
    marginTop: 2,
  },
  unselectableText: {
    color: Colors.greyMid,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
