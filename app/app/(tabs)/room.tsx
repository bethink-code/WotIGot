import React, { useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  runOnJS,
  ReduceMotion,
} from 'react-native-reanimated';
import { useQuery } from '@tanstack/react-query';
import { Redirect, router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Room } from '@/types/room';
import { Item } from '@/types/item';
import { House } from '@/types/house';
import { PageHeader } from '@/components/ui/PageHeader';
import { DenseCard } from '@/components/ui/DenseCard';
import { AnimatedListItem } from '@/components/ui/AnimatedScreen';
import { Colors, Spacing } from '@/constants/DesignTokens';
import { Durations, Easings } from '@/constants/MotionContract';
import { useNavigation } from '@/contexts/NavigationContext';
import { openMapApp } from '@/utils/openMapApp';
import EmptyState from '@/components/common/emptyState';
import ListLoadingState from '@/components/listLoadingState';

export default function RoomScreen() {
  const { room_id } = useLocalSearchParams();
  const id = room_id;
  
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
  
  const {
    data: room,
    isLoading: isLoadingRoom,
    isError: isRoomError,
  } = useQuery<Room>({
    throwOnError: false,
    queryKey: [`/rooms/${id}`],
  });
  
  const { data: items, isLoading } = useQuery<Item[]>({
    queryKey: [`/rooms/${id}/items`],
  });

  const { data: house } = useQuery<House>({
    queryKey: [`/houses/${room?.house_id}`],
    enabled: !!room?.house_id,
  });

  const { 
    setActiveTab, 
    setCurrentLevel, 
    setCurrentContext,
  } = useNavigation();

  useEffect(() => {
    setActiveTab('portfolio');
    setCurrentLevel('room');
    if (room && house) {
      setCurrentContext({
        propertyId: house.id.toString(),
        propertyName: house.name,
        propertyAddress: house.address,
        roomId: room.id.toString(),
        roomName: room.name,
        roomItemCount: items?.length || 0,
      });
    }
  }, [room, house, items]);

  const handleEdit = () => {
    router.push({
      pathname: '/(tabs)/editRoom',
      params: { room_id: id },
    });
  };

  const handleItemPress = (item: Item) => {
    router.push({
      pathname: '/(tabs)/item',
      params: { item_id: item.id },
    });
  };

  const handleMapPress = () => {
    if (room?.location_lat) {
      openMapApp(room.location_lat, room.location_long);
    }
  };

  const navigateToHouse = useCallback(() => {
    if (room?.house_id) {
      router.navigate({ pathname: '/(tabs)/house', params: { house_id: room.house_id } });
    } else {
      router.navigate('/');
    }
  }, [room?.house_id]);

  const handleAnimatedBack = useCallback(() => {
    screenOpacity.value = withTiming(0, {
      duration: Durations.normal,
      easing: Easings.emphasized,
      reduceMotion: ReduceMotion.Never,
    });
    screenTranslateX.value = withTiming(300, {
      duration: Durations.normal,
      easing: Easings.emphasized,
      reduceMotion: ReduceMotion.Never,
    }, () => {
      runOnJS(navigateToHouse)();
    });
  }, [navigateToHouse]);

  if ((!room || isRoomError) && !isLoadingRoom) {
    return room ? (
      <Redirect href={{ pathname: '/(tabs)/house', params: { house_id: room.house_id } }} />
    ) : (
      <Redirect href="/" />
    );
  }

  const getItemThumbnail = (item: Item): { url: string | undefined; thumbnailUrl: string | undefined } => {
    const primaryImage = item.images?.find(img => img.is_primary);
    const image = primaryImage || item.images?.[0];
    return {
      url: image?.url || item.image || undefined,
      thumbnailUrl: image?.thumbnail_url || undefined,
    };
  };

  const renderItem = ({ item, index }: { item: Item; index: number }) => {
    const thumbnail = getItemThumbnail(item);
    return (
      <AnimatedListItem index={index}>
        <DenseCard
          title={item.description || item.brand || 'Unknown Item'}
          subtitle={item.model || item.category || 'No details'}
          valueBadge={item.price ? { 
            text: `R${Number(item.price).toLocaleString()}`, 
            level: 'room' 
          } : undefined}
          thumbnail={thumbnail.url}
          thumbnailSmall={thumbnail.thumbnailUrl}
          thumbnailIcon="cube-outline"
          onPress={() => handleItemPress(item)}
        />
      </AnimatedListItem>
    );
  };

  return (
    <Animated.View style={[styles.container, screenAnimatedStyle]}>
      <PageHeader
        title={room?.name || 'Loading...'}
        subtitle={house?.name || 'Loading property...'}
        level="room"
        onBackPress={handleAnimatedBack}
        actionIcon="pencil-outline"
        onActionPress={handleEdit}
        secondaryActionIcon={room?.location_lat ? 'map-marker-outline' : undefined}
        onSecondaryActionPress={room?.location_lat ? handleMapPress : undefined}
      />

      <View style={styles.content}>
        {isLoading ? (
          <ListLoadingState />
        ) : items && items.length > 0 ? (
          <FlatList
            data={items}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <EmptyState title="No items yet" />
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
