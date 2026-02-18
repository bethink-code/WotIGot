import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Platform } from 'react-native';
import { Colors, Shadows } from '../../constants/DesignTokens';
import { Icon, MaterialIconName } from './Icon';
import { HierarchyLevel } from './types';

interface IconCircleProps {
  icon: MaterialIconName;
  level?: HierarchyLevel;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  style?: object;
}

const sizeConfig = {
  sm: { circle: 80, icon: 36 },
  md: { circle: 120, icon: 50 },
  lg: { circle: 160, icon: 70 },
};

const getLevelColors = (level: HierarchyLevel) => {
  switch (level) {
    case 'portfolio':
      return { bg: Colors.greenSoft, icon: Colors.green };
    case 'property':
      return { bg: Colors.yellowSoft, icon: Colors.yellow };
    case 'room':
      return { bg: Colors.orangeSoft, icon: Colors.orange };
  }
};

export function IconCircle({
  icon,
  level = 'portfolio',
  size = 'lg',
  animated = true,
  style,
}: IconCircleProps) {
  const floatAnim = useRef(new Animated.Value(0)).current;
  const config = sizeConfig[size];
  const colors = getLevelColors(level);

  useEffect(() => {
    if (animated) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(floatAnim, {
            toValue: -10,
            duration: 2500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(floatAnim, {
            toValue: 0,
            duration: 2500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: Platform.OS !== 'web',
          }),
        ])
      ).start();
    }
  }, [animated, floatAnim]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          width: config.circle,
          height: config.circle,
          borderRadius: config.circle / 2,
          backgroundColor: colors.bg,
          transform: animated ? [{ translateY: floatAnim }] : [],
        },
        Shadows.float,
        style,
      ]}
    >
      <Icon name={icon} size={config.icon} color={colors.icon} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
