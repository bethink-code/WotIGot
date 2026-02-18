import React, { useRef } from 'react';
import { Text, StyleSheet, Pressable, Animated, Easing, View } from 'react-native';
import { Colors, Radii, Shadows, Typography, Spacing } from '../../constants/DesignTokens';
import { Motion } from '../../constants/MotionContract';
import { Icon, MaterialIconName } from './Icon';

type ButtonVariant = 'dark' | 'green' | 'orange';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  icon?: MaterialIconName;
  iconPosition?: 'left' | 'right';
  disabled?: boolean;
  fullWidth?: boolean;
  style?: object;
}

const getVariantColor = (variant: ButtonVariant) => {
  switch (variant) {
    case 'dark':
      return Colors.textDark;
    case 'green':
      return Colors.green;
    case 'orange':
      return Colors.orange;
  }
};

export function PrimaryButton({
  label,
  onPress,
  variant = 'dark',
  icon,
  iconPosition = 'right',
  disabled = false,
  fullWidth = true,
  style,
}: PrimaryButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const bgColor = getVariantColor(variant);

  const handlePressIn = () => {
    Animated.timing(scaleAnim, {
      toValue: 0.95,
      duration: Motion.duration.fast,
      easing: Easing.bezier(0.2, 0, 0, 1),
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: Motion.duration.fast,
      easing: Easing.bezier(0.2, 0, 0, 1),
      useNativeDriver: true,
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
          { backgroundColor: bgColor },
          Shadows.button,
          disabled && styles.disabled,
        ]}
      >
        {icon && iconPosition === 'left' && (
          <Icon name={icon} size={22} color={Colors.white} style={styles.iconLeft} />
        )}
        <Text style={styles.label}>{label}</Text>
        {icon && iconPosition === 'right' && (
          <Icon name={icon} size={22} color={Colors.white} style={styles.iconRight} />
        )}
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
    paddingVertical: Spacing.lg + 4,
    paddingHorizontal: Spacing.xxxl,
    borderRadius: Radii.lg,
  },
  label: {
    fontSize: Typography.fontSize.subhead,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
  },
  iconLeft: {
    marginRight: Spacing.sm,
  },
  iconRight: {
    marginLeft: Spacing.sm,
  },
  disabled: {
    opacity: 0.5,
  },
});
