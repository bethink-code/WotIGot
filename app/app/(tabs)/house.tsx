import React, { useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, Platform, Alert } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  runOnJS,
  ReduceMotion,
} from 'react-native-reanimated';
import { useQuery } from '@tanstack/react-query';
import { Redirect, router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import { shareAsync } from 'expo-sharing';
import { format } from 'date-fns';
import { House } from '@/types/house';
import { Room } from '@/types/room';
import { PageHeader } from '@/components/ui/PageHeader';
import { DenseCard } from '@/components/ui/DenseCard';
import { AnimatedListItem } from '@/components/ui/AnimatedScreen';
import { Colors, Spacing } from '@/constants/DesignTokens';
import { Durations, Easings } from '@/constants/MotionContract';
import { useNavigation } from '@/contexts/NavigationContext';
import { getAccessToken } from '@/lib/api';
import { openMapApp } from '@/utils/openMapApp';
import EmptyState from '@/components/common/emptyState';
import ListLoadingState from '@/components/listLoadingState';

export default function HouseScreen() {
  const { house_id } = useLocalSearchParams();
  const id = house_id;
  
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
    data: house,
    isLoading: isLoadingHouse,
    isError: isHouseError,
  } = useQuery<House>({
    throwOnError: false,
    queryKey: [`/houses/${id}`],
  });
  
  const { data: rooms, isLoading } = useQuery<Room[]>({
    queryKey: [`/houses/${id}/rooms`],
  });

  const { 
    setActiveTab, 
    setCurrentLevel, 
    setCurrentContext,
    setRooms: setContextRooms,
  } = useNavigation();

  useEffect(() => {
    setActiveTab('portfolio');
    setCurrentLevel('property');
    if (house) {
      setCurrentContext({
        propertyId: house.id.toString(),
        propertyName: house.name,
        propertyAddress: house.address,
      });
    }
  }, [house]);

  useEffect(() => {
    if (rooms && house) {
      setContextRooms(rooms.map(r => ({
        id: r.id.toString(),
        name: r.name,
        itemCount: r.total_items || 0,
        propertyId: house.id.toString(),
        icon: 'sofa-outline',
      })));
    }
  }, [rooms, house]);

  const handleEdit = () => {
    router.push({
      pathname: '/(tabs)/editHouse',
      params: { house_id: id },
    });
  };

  const confirmExport = () => {
    if (Platform.OS === 'web') {
      if (confirm(`Export "${house?.name}" data to xlsx?`) && house) {
        window.open(
          `${process.env.EXPO_PUBLIC_API_URL}/houses/${house.id}/xlsx?access_token=${getAccessToken()}`,
          '_blank',
        );
      }
    } else {
      Alert.alert(
        `Export "${house?.name}" data to xlsx?`,
        '',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Export', style: 'default', onPress: handleExport },
        ],
        { cancelable: true },
      );
    }
  };

  const handleExport = async () => {
    if (!house) return;

    const filename = `house_${house.id}_${format(new Date(), 'yyyyMMdd')}.xlsx`;
    const { uri, mimeType } = await FileSystem.downloadAsync(
      `${process.env.EXPO_PUBLIC_API_URL}/houses/${house.id}/xlsx?access_token=${getAccessToken()}`,
      FileSystem.documentDirectory + 'tmp.xlsx',
    );
    const permissions =
      await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();

    if (permissions.granted) {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      await FileSystem.StorageAccessFramework.createFileAsync(
        permissions.directoryUri,
        filename,
        mimeType ?? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ).then((uri) =>
        FileSystem.writeAsStringAsync(uri, base64, {
          encoding: FileSystem.EncodingType.Base64,
        }),
      );

      Alert.alert('Export to xlsx', `The file "${filename}" has been downloaded successfully`);
    } else {
      shareAsync(uri);
    }
  };

  const handleRoomPress = (room: Room) => {
    router.push({
      pathname: '/(tabs)/room',
      params: { room_id: room.id },
    });
  };

  const handleMapPress = () => {
    if (house?.location_lat) {
      openMapApp(house.location_lat, house.location_long);
    }
  };

  const navigateToPortfolio = useCallback(() => {
    router.navigate('/');
  }, []);

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
      runOnJS(navigateToPortfolio)();
    });
  }, [navigateToPortfolio]);

  if ((!house || isHouseError) && !isLoadingHouse) {
    return <Redirect href="/" />;
  }

  const renderRoom = ({ item, index }: { item: Room; index: number }) => (
    <AnimatedListItem index={index}>
      <DenseCard
        title={item.name}
        subtitle={item.total_items ? `${item.total_items} items` : 'No items'}
        valueBadge={{ 
          text: `R${(item.total_value || 0).toLocaleString()}`, 
          level: 'room' 
        }}
        thumbnail={item.image}
        thumbnailIcon="sofa-outline"
        onPress={() => handleRoomPress(item)}
      />
    </AnimatedListItem>
  );

  return (
    <Animated.View style={[styles.container, screenAnimatedStyle]}>
      <PageHeader
        title={house?.name || 'Loading...'}
        subtitle={house?.address || 'No address'}
        level="property"
        onBackPress={handleAnimatedBack}
        actionIcon="pencil-outline"
        onActionPress={handleEdit}
        secondaryActionIcon={house?.location_lat ? 'map-marker-outline' : undefined}
        onSecondaryActionPress={house?.location_lat ? handleMapPress : undefined}
      />

      <View style={styles.content}>
        {isLoading ? (
          <ListLoadingState />
        ) : rooms && rooms.length > 0 ? (
          <FlatList
            data={rooms}
            renderItem={renderRoom}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <EmptyState title="No rooms yet" />
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
