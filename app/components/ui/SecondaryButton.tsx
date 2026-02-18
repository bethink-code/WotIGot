import React, { useRef } from 'react';
import { Text, StyleSheet, Pressable, Animated, Easing, View, Image, Platform } from 'react-native';
import { Colors, Radii, Typography, Spacing } from '../../constants/DesignTokens';
import { Motion } from '../../constants/MotionContract';
import { Icon, MaterialIconName } from './Icon';
import Svg, { Path } from 'react-native-svg';

interface SecondaryButtonProps {
  label: string;
  onPress: () => void;
  icon?: MaterialIconName;
  iconImage?: string;
  googleIcon?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  compact?: boolean;
  style?: object;
}

function GoogleLogo({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <Path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <Path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <Path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </Svg>
  );
}

export function SecondaryButton({
  label,
  onPress,
  icon,
  iconImage,
  googleIcon = false,
  disabled = false,
  fullWidth = true,
  compact = false,
  style,
}: SecondaryButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.timing(scaleAnim, {
      toValue: 0.98,
      duration: Motion.duration.fast,
      easing: Easing.bezier(0.2, 0, 0, 1),
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: Motion.duration.fast,
      easing: Easing.bezier(0.2, 0, 0, 1),
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  };

  return (
    <Animated.View
      style={[
        { transform: [{ scale: scaleAnim }] },
        fullWidth && styles.fullWidth,
        style,
      ]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={[
          styles.button,
          compact && styles.buttonCompact,
          disabled && styles.disabled,
        ]}
      >
        {googleIcon && (
          <View style={[styles.iconContainer, compact && styles.iconContainerCompact]}>
            <GoogleLogo size={compact ? 16 : 20} />
          </View>
        )}
        {iconImage && !googleIcon && (
          <Image source={{ uri: iconImage }} style={[styles.iconImage, compact && styles.iconImageCompact]} />
        )}
        {icon && !iconImage && !googleIcon && (
          <Icon name={icon} size={compact ? 16 : 20} color={Colors.textDark} style={[styles.icon, compact && styles.iconCompact]} />
        )}
        <Text style={[styles.label, compact && styles.labelCompact]}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fullWidth: {
    width: '100%',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg + 2,
    paddingHorizontal: Spacing.xxxl,
    borderRadius: Radii.lg,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.greyBorder,
  },
  buttonCompact: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radii.md,
  },
  label: {
    fontSize: Typography.fontSize.subhead,
    fontFamily: Typography.fontFamily.bodySemiBold,
    color: Colors.textDark,
  },
  labelCompact: {
    fontSize: Typography.fontSize.body2,
  },
  icon: {
    marginRight: Spacing.sm,
  },
  iconCompact: {
    marginRight: Spacing.xs,
  },
  iconContainer: {
    marginRight: Spacing.sm,
  },
  iconContainerCompact: {
    marginRight: Spacing.xs,
  },
  iconImage: {
    width: 20,
    height: 20,
    marginRight: Spacing.sm,
  },
  iconImageCompact: {
    width: 16,
    height: 16,
    marginRight: Spacing.xs,
  },
  disabled: {
    opacity: 0.5,
  },
});
