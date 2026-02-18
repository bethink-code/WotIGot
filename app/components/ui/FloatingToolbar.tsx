import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Radii, Shadows, Spacing } from '../../constants/DesignTokens';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  Easing 
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const EMPHASIZED_EASING = Easing.bezier(0.2, 0.8, 0.2, 1);

interface FloatingToolbarProps {
  onPortfolioPress?: () => void;
  onInventoryPress?: () => void;
  onAddPress?: () => void;
  onReportsPress?: () => void;
  onSettingsPress?: () => void;
  activeTab?: 'portfolio' | 'inventory' | 'reports' | 'settings';
  addMenuOpen?: boolean;
  testID?: string;
}

interface NavIconProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  onPress?: () => void;
  isActive?: boolean;
}

function NavIcon({ icon, onPress, isActive }: NavIconProps) {
  const scale = useSharedValue(1);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withTiming(0.9, { duration: 100, easing: EMPHASIZED_EASING });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 200, easing: EMPHASIZED_EASING });
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.navIcon, animatedStyle]}
    >
      <MaterialCommunityIcons 
        name={icon} 
        size={24} 
        color={isActive ? Colors.white : 'rgba(255,255,255,0.5)'} 
      />
    </AnimatedPressable>
  );
}

function FabButton({ onPress, isOpen }: { onPress?: () => void; isOpen?: boolean }) {
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  
  React.useEffect(() => {
    rotation.value = withTiming(isOpen ? 45 : 0, { duration: 200, easing: EMPHASIZED_EASING });
  }, [isOpen]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  const handlePressIn = () => {
    scale.value = withTiming(0.92, { duration: 100, easing: EMPHASIZED_EASING });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 200, easing: EMPHASIZED_EASING });
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.fabButton, animatedStyle]}
    >
      <MaterialCommunityIcons name="plus" size={28} color={Colors.white} />
    </AnimatedPressable>
  );
}

export function FloatingToolbar({
  onPortfolioPress,
  onInventoryPress,
  onAddPress,
  onReportsPress,
  onSettingsPress,
  activeTab,
  addMenuOpen = false,
  testID,
}: FloatingToolbarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View 
      style={[
        styles.container,
        { paddingBottom: Math.max(insets.bottom, Spacing.md) }
      ]}
      testID={testID}
      pointerEvents="box-none"
    >
      <View style={styles.toolbar}>
        <View style={styles.leftGroup}>
          <NavIcon 
            icon="home-outline" 
            onPress={onPortfolioPress}
            isActive={activeTab === 'portfolio'}
          />
          <NavIcon 
            icon="cube-outline" 
            onPress={onInventoryPress}
            isActive={activeTab === 'inventory'}
          />
        </View>

        <View style={styles.fabContainer}>
          <FabButton onPress={onAddPress} isOpen={addMenuOpen} />
        </View>

        <View style={styles.rightGroup}>
          <NavIcon 
            icon="chart-box-outline" 
            onPress={onReportsPress}
            isActive={activeTab === 'reports'}
          />
          <NavIcon 
            icon="cog-outline" 
            onPress={onSettingsPress}
            isActive={activeTab === 'settings'}
          />
        </View>
      </View>
    </View>
  );
}

const TOOLBAR_HEIGHT = 56;
const FAB_SIZE = 56;
const FAB_OFFSET = 16;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.textDark,
    borderRadius: Radii.pill,
    height: TOOLBAR_HEIGHT,
    paddingHorizontal: Spacing.lg,
    width: '100%',
    maxWidth: 320,
    ...Shadows.toolbar,
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  navIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabContainer: {
    position: 'absolute',
    left: '50%',
    marginLeft: -(FAB_SIZE / 2),
    top: -(FAB_OFFSET),
  },
  fabButton: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: Colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.button,
    borderWidth: 4,
    borderColor: Colors.bgCanvas,
  },
});
