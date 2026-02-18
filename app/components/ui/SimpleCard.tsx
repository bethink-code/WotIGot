import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Animated, Easing } from 'react-native';
import { Colors, Radii, Shadows, Typography, Spacing } from '../../constants/DesignTokens';
import { Motion } from '../../constants/MotionContract';
import { Icon, MaterialIconName } from './Icon';
import { HierarchyLevel, MaterialStateLayer } from './types';

interface SimpleCardProps {
  title: string;
  subtitle?: string;
  icon?: MaterialIconName;
  iconBgColor?: string;
  iconColor?: string;
  level?: HierarchyLevel;
  valueBadge?: {
    text: string;
    level?: HierarchyLevel;
  };
  onPress?: () => void;
  actionLabel?: string;
  onActionPress?: () => void;
  disabled?: boolean;
  useSolidIconBg?: boolean;
  testID?: string;
}

const getLevelColors = (level: HierarchyLevel = 'portfolio', useSolid: boolean = false) => {
  switch (level) {
    case 'portfolio':
      return { 
        bg: useSolid ? Colors.green : Colors.greenSoft, 
        icon: useSolid ? Colors.white : Colors.textDark,
        badgeBg: Colors.greenSoft,
        badgeText: Colors.green,
      };
    case 'property':
      return { 
        bg: useSolid ? Colors.yellow : Colors.yellowSoft, 
        icon: useSolid ? Colors.white : Colors.textDark,
        badgeBg: Colors.yellowSoft,
        badgeText: Colors.yellow,
      };
    case 'room':
      return { 
        bg: useSolid ? Colors.orange : Colors.orangeSoft, 
        icon: useSolid ? Colors.white : Colors.textDark,
        badgeBg: Colors.orangeSoft,
        badgeText: Colors.orange,
      };
  }
};

export function SimpleCard({
  title,
  subtitle,
  icon,
  iconBgColor,
  iconColor,
  level = 'portfolio',
  valueBadge,
  onPress,
  actionLabel,
  onActionPress,
  disabled = false,
  useSolidIconBg = false,
  testID,
}: SimpleCardProps) {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const overlayAnim = React.useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
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

  const levelColors = getLevelColors(level, useSolidIconBg);
  const bgColor = iconBgColor || levelColors.bg;
  const iconColorFinal = iconColor || levelColors.icon;
  const valueBadgeLevel = valueBadge?.level || level;
  const valueBadgeColors = valueBadge ? getLevelColors(valueBadgeLevel, false) : null;

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        testID={testID}
        style={[
          styles.container,
          Shadows.cardSoft,
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
        {icon && (
          <View style={[styles.iconContainer, { backgroundColor: bgColor }]}>
            <Icon name={icon} size={24} color={iconColorFinal} />
          </View>
        )}

        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>

        {valueBadge && valueBadgeColors && (
          <View style={[
            styles.valueBadge, 
            { 
              backgroundColor: valueBadgeColors.badgeBg,
              borderWidth: 1.5,
              borderColor: valueBadgeColors.badgeText,
            }
          ]}>
            <Text style={[styles.valueBadgeText, { color: valueBadgeColors.badgeText }]}>
              {valueBadge.text}
            </Text>
          </View>
        )}

        {actionLabel && onActionPress && (
          <Pressable onPress={onActionPress} hitSlop={8}>
            <Text style={styles.actionLabel}>{actionLabel}</Text>
          </Pressable>
        )}

        {!actionLabel && !valueBadge && onPress && (
          <Icon name="chevron-right" size={24} color={Colors.greyMid} />
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.cardBg,
    borderRadius: Radii.xl,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
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
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textGrey,
    marginTop: 2,
  },
  actionLabel: {
    fontSize: Typography.fontSize.body2,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.green,
  },
  valueBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radii.lg,
  },
  valueBadgeText: {
    fontSize: Typography.fontSize.body2,
    fontFamily: Typography.fontFamily.bold,
  },
});
