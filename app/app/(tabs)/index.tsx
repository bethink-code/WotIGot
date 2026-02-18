import React, { useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  ReduceMotion,
} from 'react-native-reanimated';
import { useQuery } from '@tanstack/react-query';
import { router, useFocusEffect } from 'expo-router';
import { House } from '@/types/house';
import { User } from '@/types/user';
import { PortfolioHeader } from '@/components/ui/PortfolioHeader';
import { DenseCard } from '@/components/ui/DenseCard';
import { AnimatedListItem } from '@/components/ui/AnimatedScreen';
import { Colors, Spacing } from '@/constants/DesignTokens';
import { Durations, Easings } from '@/constants/MotionContract';
import { useNavigation } from '@/contexts/NavigationContext';
import EmptyState from '@/components/common/emptyState';
import ListLoadingState from '@/components/listLoadingState';

export default function PortfolioScreen() {
  const screenOpacity = useSharedValue(0);
  const screenTranslateX = useSharedValue(300);

  useFocusEffect(
    useCallback(() => {
      screenOpacity.value = 0;
      screenTranslateX.value = 300;

      screenOpacity.value = withTiming(1, {
        duration: Durations.normal,
        easing: Easings.emphasized,
        reduceMotion: ReduceMotion.Never,
      });
      screenTranslateX.value = withTiming(0, {
        duration: Durations.normal,
        easing: Easings.emphasized,
        reduceMotion: ReduceMotion.Never,
      });

      return () => {};
    }, [])
  );

  const screenAnimatedStyle = useAnimatedStyle(() => ({
    opacity: screenOpacity.value,
    transform: [{ translateX: screenTranslateX.value }],
  }));

  const { data: houses, isLoading } = useQuery<House[]>({
    queryKey: ['/houses'],
  });

  const { data: me } = useQuery<User>({
    queryKey: ['/auth/me'],
    retry: 0,
  });

  const { setActiveTab, setCurrentLevel, setCurrentContext, setNavigationMode, setProperties } = useNavigation();

  useEffect(() => {
    setActiveTab('portfolio');
    setCurrentLevel('portfolio');
    setCurrentContext({});
    setNavigationMode('shell');
  }, []);

  useEffect(() => {
    if (houses) {
      setProperties(houses.map(h => ({
        id: h.id.toString(),
        name: h.name,
        address: h.address,
        icon: 'home-city-outline',
      })));
    }
  }, [houses]);

  const calculateTotalValue = () => {
    if (!houses) return 'R0';
    const total = houses.reduce((sum, house) => sum + (house.total_value || 0), 0);
    return `R${total.toLocaleString()}`;
  };

  const handleHousePress = (house: House) => {
    router.push({
      pathname: '/(tabs)/house',
      params: { house_id: house.id },
    });
  };

  const handleAvatarPress = () => {
    router.push('/(tabs)/settings');
  };

  const renderHouse = ({ item, index }: { item: House; index: number }) => (
    <AnimatedListItem index={index}>
      <DenseCard
        title={item.name}
        subtitle={item.address || 'No address'}
        valueBadge={{ 
          text: `R${(item.total_value || 0).toLocaleString()}`, 
          level: 'property' 
        }}
        thumbnail={item.image}
        thumbnailIcon="home-city-outline"
        onPress={() => handleHousePress(item)}
      />
    </AnimatedListItem>
  );

  return (
    <Animated.View style={[styles.container, screenAnimatedStyle]}>
      <PortfolioHeader
        portfolioValue={calculateTotalValue()}
        userName={me?.name}
        userImage={null}
        onAvatarPress={handleAvatarPress}
      />

      <View style={styles.content}>
        {isLoading ? (
          <ListLoadingState />
        ) : houses && houses.length > 0 ? (
          <FlatList
            data={houses}
            renderItem={renderHouse}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <EmptyState title="No properties yet" />
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgCanvas,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  list: {
    gap: Spacing.sm,
    paddingBottom: 100,
  },
});
