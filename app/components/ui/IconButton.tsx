import React from 'react';
import { StyleSheet, Pressable } from 'react-native';
import { Animated, Easing } from 'react-native';
import { Colors, Radii, Spacing } from '../../constants/DesignTokens';
import { Motion } from '../../constants/MotionContract';
import { Icon, MaterialIconName } from './Icon';
import { MaterialStateLayer } from './types';

interface IconButtonProps {
  icon: MaterialIconName;
  onPress?: () => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'filled' | 'transparent';
  iconColor?: string;
  disabled?: boolean;
  testID?: string;
}

const sizeMap = {
  sm: { button: 36, icon: 20 },
  md: { button: 44, icon: 24 },
  lg: { button: 52, icon: 28 },
};

export function IconButton({
  icon,
  onPress,
  size = 'md',
  variant = 'filled',
  iconColor,
  disabled = false,
  testID,
}: IconButtonProps) {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const overlayAnim = React.useRef(new Animated.Value(0)).current;

  const dimensions = sizeMap[size];
  const finalIconColor = iconColor || Colors.textDark;

  const handlePressIn = () => {
    if (disabled) return;
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.92,
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

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        testID={testID}
        style={[
          styles.button,
          {
            width: dimensions.button,
            height: dimensions.button,
          },
          variant === 'filled' && styles.filledBackground,
          disabled && styles.disabled,
        ]}
      >
        <Animated.View 
          style={[
            styles.overlay, 
            { opacity: overlayAnim }
          ]} 
          pointerEvents="none"
        />
        <Icon 
          name={icon} 
          size={dimensions.icon} 
          color={disabled ? Colors.textMuted : finalIconColor} 
        />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: Radii.lg,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  filledBackground: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.black,
    borderRadius: Radii.lg,
  },
  disabled: {
    opacity: 0.5,
  },
});
