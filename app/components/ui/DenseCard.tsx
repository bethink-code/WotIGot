import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Animated, Easing } from 'react-native';
import { Colors, Radii, Shadows, Typography, Spacing } from '../../constants/DesignTokens';
import { Motion } from '../../constants/MotionContract';
import { Icon, MaterialIconName } from './Icon';
import { HierarchyLevel, MaterialStateLayer } from './types';
import { ImageWithLoader } from './ImageWithLoader';

interface DenseCardProps {
  title: string;
  subtitle?: string;
  badge?: {
    text: string;
    level?: HierarchyLevel;
  };
  valueBadge?: {
    text: string;
    level?: HierarchyLevel;
  };
  thumbnail?: string | null;
  thumbnailSmall?: string | null;
  thumbnailIcon?: MaterialIconName;
  onPress?: () => void;
  onActionPress?: () => void;
  actionIcon?: MaterialIconName;
  disabled?: boolean;
  testID?: string;
}

const getBadgeColors = (level: HierarchyLevel = 'portfolio') => {
  switch (level) {
    case 'portfolio':
      return { bg: Colors.greenSoft, text: Colors.green };
    case 'property':
      return { bg: Colors.yellowSoft, text: Colors.yellow };
    case 'room':
      return { bg: Colors.orangeSoft, text: Colors.orange };
  }
};

export function DenseCard({
  title,
  subtitle,
  badge,
  valueBadge,
  thumbnail,
  thumbnailSmall,
  thumbnailIcon,
  onPress,
  onActionPress,
  actionIcon = 'dots-vertical',
  disabled = false,
  testID,
}: DenseCardProps) {
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

  const badgeColors = badge ? getBadgeColors(badge.level) : null;
  const valueColors = valueBadge ? getBadgeColors(valueBadge.level) : null;

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
          Shadows.card,
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
        <View style={styles.thumbnailContainer}>
          {thumbnail ? (
            <ImageWithLoader 
              source={thumbnail}
              thumbnailSource={thumbnailSmall}
              style={styles.thumbnail}
            />
          ) : (
            <View style={styles.thumbnailPlaceholder}>
              {thumbnailIcon && (
                <Icon name={thumbnailIcon} size={28} color={Colors.greyMid} />
              )}
            </View>
          )}
          {badge && (
            <View style={[styles.badge, { backgroundColor: badgeColors?.bg }]}>
              <Text style={[styles.badgeText, { color: badgeColors?.text }]}>
                {badge.text}
              </Text>
            </View>
          )}
        </View>

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

        {valueBadge && (
          <View style={[
            styles.valueBadge, 
            { 
              backgroundColor: valueColors?.bg,
              borderWidth: 1.5,
              borderColor: valueColors?.text,
            }
          ]}>
            <Text style={[styles.valueBadgeText, { color: valueColors?.text }]}>
              {valueBadge.text}
            </Text>
          </View>
        )}

        {onActionPress && (
          <Pressable onPress={onActionPress} style={styles.actionButton}>
            <Icon name={actionIcon} size={24} color={Colors.textGrey} />
          </Pressable>
        )}

        {!onActionPress && onPress && (
          <Icon name="chevron-right" size={24} color={Colors.greyMid} />
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
    overflow: 'hidden',
    position: 'relative',
  },
  stateLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.textDark,
    borderRadius: Radii.xxl,
  },
  disabled: {
    opacity: 0.5,
  },
  thumbnailContainer: {
    width: 72,
    height: 72,
    borderRadius: Radii.xl,
    overflow: 'hidden',
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  thumbnailPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.greyBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.sm,
  },
  badgeText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold,
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
  valueBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radii.lg,
  },
  valueBadgeText: {
    fontSize: Typography.fontSize.body2,
    fontFamily: Typography.fontFamily.bold,
  },
  actionButton: {
    padding: Spacing.xs,
    marginLeft: Spacing.xs,
  },
});
