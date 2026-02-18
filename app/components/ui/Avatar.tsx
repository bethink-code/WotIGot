import React from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { Animated, Easing } from 'react-native';
import { Colors, Radii, Shadows, Typography, Spacing } from '../../constants/DesignTokens';
import { Motion } from '../../constants/MotionContract';
import { Icon, MaterialIconName } from './Icon';
import { MaterialStateLayer } from './types';

type AvatarSize = 'sm' | 'md' | 'lg';

interface AvatarProps {
  source?: string | null;
  name?: string;
  size?: AvatarSize;
  onPress?: () => void;
  showBorder?: boolean;
  borderColor?: string;
  backgroundColor?: string;
  testID?: string;
}

const sizeMap: Record<AvatarSize, { container: number; text: number; icon: number }> = {
  sm: { container: 32, text: 12, icon: 16 },
  md: { container: 44, text: 16, icon: 22 },
  lg: { container: 64, text: 22, icon: 32 },
};

function getInitials(name?: string): string {
  if (!name) return '';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export function Avatar({
  source,
  name,
  size = 'md',
  onPress,
  showBorder = false,
  borderColor = Colors.white,
  backgroundColor = Colors.greyBg,
  testID,
}: AvatarProps) {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const overlayAnim = React.useRef(new Animated.Value(0)).current;
  const dimensions = sizeMap[size];
  const initials = getInitials(name);

  const handlePressIn = () => {
    if (!onPress) return;
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

  const containerStyle = [
    styles.container,
    {
      width: dimensions.container,
      height: dimensions.container,
      borderRadius: dimensions.container / 2,
      backgroundColor,
    },
    showBorder && {
      borderWidth: 2,
      borderColor,
    },
  ];

  const content = source ? (
    <Image
      source={{ uri: source }}
      style={[
        styles.image,
        {
          width: dimensions.container,
          height: dimensions.container,
          borderRadius: dimensions.container / 2,
        },
      ]}
    />
  ) : initials ? (
    <Text style={[styles.initials, { fontSize: dimensions.text }]}>
      {initials}
    </Text>
  ) : (
    <Icon name="account-outline" size={dimensions.icon} color={Colors.greyMid} />
  );

  if (onPress) {
    return (
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Pressable
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          testID={testID}
          style={containerStyle}
        >
          <Animated.View
            style={[
              styles.stateLayer,
              {
                borderRadius: dimensions.container / 2,
                opacity: overlayAnim,
              },
            ]}
            pointerEvents="none"
          />
          {content}
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <View style={containerStyle} testID={testID}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  stateLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.textDark,
  },
  image: {
    resizeMode: 'cover',
  },
  initials: {
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textGrey,
  },
});
