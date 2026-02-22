import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Text, Image, Pressable, Alert, ActivityIndicator, Modal, Dimensions } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  runOnJS,
  ReduceMotion,
} from 'react-native-reanimated';
import { useQuery } from '@tanstack/react-query';
import { Redirect, router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import ImageModal from 'react-native-image-modal';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Item, ItemImage } from '@/types/item';
import { House } from '@/types/house';
import { Room } from '@/types/room';
import { PageHeader } from '@/components/ui/PageHeader';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Icon, MaterialIconName } from '@/components/ui/Icon';
import { Colors, Spacing, Typography, Radii } from '@/constants/DesignTokens';
import { Durations, Easings } from '@/constants/MotionContract';
import { useNavigation } from '@/contexts/NavigationContext';
import { openMapApp } from '@/utils/openMapApp';
import { useUploadMedia, useAddItemImage, useDeleteItemImage } from '@/lib/mutations';

type PriceType = 'AI' | 'user' | 'invoice';

const priceTypeBadgeConfig: Record<PriceType, { label: string; icon: MaterialIconName; color: string; bgColor: string }> = {
  'AI': { label: 'AI estimate', icon: 'star-four-points-outline', color: Colors.orange, bgColor: Colors.orangeSoft },
  'user': { label: 'User entered', icon: 'pencil-outline', color: Colors.green, bgColor: Colors.greenSoft },
  'invoice': { label: 'Invoice price', icon: 'text-box-check-outline', color: Colors.textMuted, bgColor: Colors.greyBg },
};

export default function ItemScreen() {
  const { item_id } = useLocalSearchParams();
  const id = item_id;

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
    data: item,
    isLoading: isLoadingItem,
    isError: isItemError,
  } = useQuery<Item>({
    queryKey: [`/items/${id}`],
  });

  const { data: images } = useQuery<ItemImage[]>({
    queryKey: [`/items/${id}/images`],
    enabled: Boolean(id),
  });

  const { data: room } = useQuery<Room>({
    queryKey: [`/rooms/${item?.room_id}`],
    enabled: Boolean(item?.room_id),
  });

  const { data: house } = useQuery<House>({
    queryKey: [`/houses/${item?.house_id}`],
    enabled: Boolean(item?.house_id),
  });

  const { 
    setActiveTab, 
    setCurrentLevel, 
    setCurrentContext,
  } = useNavigation();

  useEffect(() => {
    setActiveTab('portfolio');
    setCurrentLevel('room');
    if (item && room && house) {
      setCurrentContext({
        propertyId: house.id.toString(),
        propertyName: house.name,
        propertyAddress: house.address,
        roomId: room.id.toString(),
        roomName: room.name,
      });
    }
  }, [item, room, house]);

  const handleEdit = () => {
    router.push({
      pathname: '/(tabs)/editItem',
      params: { id: item?.id },
    });
  };

  const handleMapPress = () => {
    if (item?.location_lat) {
      openMapApp(item.location_lat, item.location_long);
    }
  };

  const handleNewEstimate = () => {
    router.push({
      pathname: '/(tabs)/editItem',
      params: { id: item?.id },
    });
  };

  const { mutateAsync: uploadMedia, isPending: isUploading } = useUploadMedia();
  const { mutateAsync: addItemImage, isPending: isAddingImage } = useAddItemImage();
  const { mutateAsync: deleteItemImage, isPending: isDeleting } = useDeleteItemImage();
  const isPhotoUploading = isUploading || isAddingImage;
  
  const [selectedPhoto, setSelectedPhoto] = useState<ItemImage | null>(null);

  const handleAddPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Camera permission is required to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images',
        allowsEditing: false,
        quality: 0.8,
        exif: true,
      });

      if (result.canceled || !result.assets[0]) {
        return;
      }

      const pickedImage = result.assets[0];

      let locationLat: number | undefined;
      let locationLong: number | undefined;
      
      try {
        const { status: locStatus } = await Location.requestForegroundPermissionsAsync();
        if (locStatus === 'granted') {
          const loc = await Location.getCurrentPositionAsync({});
          locationLat = loc.coords.latitude;
          locationLong = loc.coords.longitude;
        }
      } catch (e) {
        console.log('Could not get location:', e);
      }

      const mediaResult = await uploadMedia(pickedImage);

      if (item?.id) {
        await addItemImage({
          itemId: item.id,
          url: mediaResult.url,
          is_primary: false,
          location_lat: locationLat,
          location_long: locationLong,
        });
      }
    } catch (error) {
      console.error('Error adding photo:', error);
      Alert.alert('Error', 'Failed to add photo. Please try again.');
    }
  };

  const handleDeletePhoto = async (photo: ItemImage) => {
    const confirmed = window.confirm('Are you sure you want to delete this photo?');
    if (!confirmed) return;
    
    try {
      if (item?.id) {
        await deleteItemImage({ itemId: item.id, imageId: photo.id });
        setSelectedPhoto(null);
      }
    } catch (error) {
      console.error('Error deleting photo:', error);
      window.alert('Failed to delete photo. Please try again.');
    }
  };

  const navigateToRoom = useCallback(() => {
    if (item?.room_id) {
      router.navigate({ pathname: '/(tabs)/room', params: { room_id: item.room_id } });
    } else {
      router.navigate('/');
    }
  }, [item?.room_id]);

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
      runOnJS(navigateToRoom)();
    });
  }, [navigateToRoom]);

  if ((!item || isItemError) && !isLoadingItem) {
    return item ? (
      <Redirect href={{ pathname: '/(tabs)/room', params: { room_id: item.room_id } }} />
    ) : (
      <Redirect href="/" />
    );
  }

  const itemTitle = item?.description || `${item?.brand || ''} ${item?.model || ''}`.trim() || 'Unknown Item';
  const subtitle = room?.name ? `In ${room.name}` : house?.name || 'Loading...';
  
  const legacyImage = item?.image;
  const hasLegacyImage = legacyImage && legacyImage.trim().length > 0 && legacyImage.startsWith('http');
  
  const primaryImageFromTable = images?.find(img => img.is_primary) || (!hasLegacyImage ? images?.[0] : undefined);
  const imageUrl = hasLegacyImage ? legacyImage : primaryImageFromTable?.url;
  const hasValidImage = imageUrl && imageUrl.trim().length > 0 && imageUrl.startsWith('http');
  
  const additionalImages = hasLegacyImage 
    ? (images || [])
    : (images?.filter(img => img.id !== primaryImageFromTable?.id) || []);
  
  const currentBadge = priceTypeBadgeConfig[item?.price_type || 'user'];
  const totalValue = (item?.price || 0) * (item?.amount || 1);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '--';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <Animated.View style={[styles.container, screenAnimatedStyle]}>
      <PageHeader
        title={itemTitle}
        subtitle={subtitle}
        level="room"
        onBackPress={handleAnimatedBack}
        actionIcon="pencil-outline"
        onActionPress={handleEdit}
        secondaryActionIcon={item?.location_lat ? 'map-marker-outline' : undefined}
        onSecondaryActionPress={item?.location_lat ? handleMapPress : undefined}
      />

      <ScrollView 
        style={styles.flex}
        contentContainerStyle={styles.itemDetailContent}
        showsVerticalScrollIndicator={false}
      >
        {/* VALUE CARD - 3 column layout: Photo | Price+Badge | Action */}
        <View style={styles.cardSection}>
          <Text style={styles.cardTitle}>Value</Text>
          <View style={styles.valueCardRow}>
            {/* Column 1: Primary Photo Thumbnail */}
            <Pressable style={styles.primaryPhotoThumb}>
              {hasValidImage ? (
                <ImageModal
                  resizeMode="cover"
                  modalImageResizeMode="contain"
                  imageBackgroundColor="#ffffff"
                  style={styles.primaryPhotoImage}
                  source={{ uri: imageUrl }}
                />
              ) : (
                <Icon name="image-outline" size={36} color={Colors.orange} />
              )}
              <View style={styles.primaryPhotoBadge}>
                <Icon name="star-outline" size={10} color="#fff" />
              </View>
            </Pressable>
            
            {/* Column 2: Price + Source Badge */}
            <View style={styles.valuePriceColumn}>
              <View style={styles.priceRow}>
                <Text style={styles.valueAmount}>R {totalValue.toLocaleString()}</Text>
                <View style={[styles.priceSourceBadge, { backgroundColor: currentBadge.bgColor }]}>
                  <Icon name={currentBadge.icon} size={12} color={currentBadge.color} />
                  <Text style={[styles.priceSourceText, { color: currentBadge.color }]}>{currentBadge.label}</Text>
                </View>
              </View>
              {item?.amount && item.amount > 1 && (
                <Text style={styles.valueNote}>{item.amount} x R{item.price?.toLocaleString()}</Text>
              )}
              {item?.price_type === 'AI' && (
                <Text style={styles.valueNote}>Based on SA market prices</Text>
              )}
            </View>
            
            {/* Column 3: New Estimate Button */}
            <View style={styles.valueActionColumn}>
              <SecondaryButton
                label="New estimate"
                icon="star-four-points-outline"
                onPress={handleNewEstimate}
                fullWidth={false}
                compact
              />
            </View>
          </View>
        </View>

        {/* DETAILS CARD */}
        <View style={styles.cardSection}>
          <Text style={styles.cardTitle}>Details</Text>
          
          <View style={styles.detailsGrid}>
            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>BRAND</Text>
                <Text style={styles.detailValue}>{item?.brand || '--'}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>MODEL</Text>
                <Text style={styles.detailValue}>{item?.model || '--'}</Text>
              </View>
            </View>
            
            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>CATEGORY</Text>
                <Text style={styles.detailValue}>{item?.category || '--'}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>QUANTITY</Text>
                <Text style={styles.detailValue}>{item?.amount || 1}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>SERIAL NUMBER</Text>
                <Text style={styles.detailValue}>{item?.serial_number || '--'}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>DATE CAPTURED</Text>
                <Text style={styles.detailValue}>{formatDate(item?.created_at)}</Text>
              </View>
            </View>

          </View>
        </View>

        {/* PICTURES GALLERY - Only shows additional photos (primary is in Value card) */}
        <View style={styles.cardSection}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Pictures</Text>
            <Text style={styles.photoCount}>
              {additionalImages.length} photo{additionalImages.length !== 1 ? 's' : ''}
            </Text>
          </View>
          <Text style={styles.picturesDescription}>
            Add photos of different angles, serial numbers, or invoices. These are not used for value estimation.
          </Text>
          <View style={styles.photoGrid}>
            {/* Additional images only (primary shown in Value card) */}
            {additionalImages.map((photo) => (
              <Pressable 
                key={photo.id} 
                style={styles.photoThumb}
                onPress={() => setSelectedPhoto(photo)}
              >
                <Image source={{ uri: photo.url }} style={styles.photoThumbImage} />
                {photo.location_lat && (
                  <View style={styles.photoGeoBadge}>
                    <Icon name="map-marker-outline" size={10} color="#fff" />
                  </View>
                )}
              </Pressable>
            ))}
            
            {/* Add photo button */}
            <Pressable 
              style={styles.photoThumb}
              onPress={handleAddPhoto}
              disabled={isPhotoUploading}
            >
              {isPhotoUploading ? (
                <ActivityIndicator size="small" color={Colors.orange} />
              ) : (
                <Icon name="plus" size={24} color={Colors.orange} />
              )}
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* Photo Detail Modal */}
      <Modal
        visible={selectedPhoto !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedPhoto(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Pressable 
                style={styles.modalCloseButton}
                onPress={() => setSelectedPhoto(null)}
              >
                <Icon name="close" size={24} color={Colors.textDark} />
              </Pressable>
            </View>
            {selectedPhoto && (
              <>
                <Image 
                  source={{ uri: selectedPhoto.url }} 
                  style={styles.modalImage}
                  resizeMode="contain"
                />
                {selectedPhoto.location_lat && (
                  <View style={styles.modalLocationRow}>
                    <Icon name="map-marker-outline" size={16} color={Colors.green} />
                    <Text style={styles.modalLocationText}>GPS location captured</Text>
                  </View>
                )}
                <View style={styles.modalActions}>
                  <Pressable 
                    style={styles.deleteButton}
                    onPress={() => handleDeletePhoto(selectedPhoto)}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <ActivityIndicator size="small" color={Colors.white} />
                    ) : (
                      <>
                        <Icon name="trash-can-outline" size={20} color={Colors.white} />
                        <Text style={styles.deleteButtonText}>Delete Photo</Text>
                      </>
                    )}
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgCanvas,
  },
  flex: {
    flex: 1,
  },
  itemDetailContent: {
    padding: Spacing.lg,
    paddingTop: Spacing.md,
    gap: Spacing.md,
    paddingBottom: 100,
  },
  primaryPhotoThumb: {
    width: 72,
    height: 72,
    borderRadius: Radii.md,
    backgroundColor: Colors.orangeSoft,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  primaryPhotoImage: {
    width: 72,
    height: 72,
    borderRadius: Radii.md,
  },
  primaryPhotoBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.orange,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardSection: {
    backgroundColor: Colors.white,
    borderRadius: Radii.xl,
    padding: Spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  cardTitle: {
    fontSize: Typography.fontSize.subhead,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textDark,
    marginBottom: Spacing.sm,
  },
  valueCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
    backgroundColor: Colors.greyBg,
    borderRadius: Radii.lg,
    padding: Spacing.md,
  },
  valuePriceColumn: {
    flex: 1,
    gap: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  valueAmount: {
    fontSize: 24,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textDark,
  },
  priceSourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.pill,
  },
  priceSourceText: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.bodySemiBold,
  },
  valueNote: {
    fontSize: Typography.fontSize.caption,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textMuted,
    marginTop: 2,
  },
  valueActionColumn: {
    justifyContent: 'center',
  },
  detailsGrid: {
  },
  detailItem: {
    flex: 1,
    marginBottom: Spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  detailLabel: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.bodySemiBold,
    color: Colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: Typography.fontSize.body2,
    fontFamily: Typography.fontFamily.bodyMedium,
    color: Colors.textDark,
  },
  photoCount: {
    fontSize: Typography.fontSize.caption,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textMuted,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  photoThumb: {
    width: 64,
    height: 64,
    borderRadius: Radii.md,
    backgroundColor: Colors.greyBg,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  photoThumbImage: {
    width: '100%',
    height: '100%',
    borderRadius: Radii.md,
  },
  photoGeoBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.green,
    justifyContent: 'center',
    alignItems: 'center',
  },
  picturesDescription: {
    fontSize: Typography.fontSize.caption,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textMuted,
    marginBottom: Spacing.md,
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: Radii.xl,
    width: '100%',
    maxWidth: 400,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: Spacing.md,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.greyBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: '100%',
    height: 300,
    backgroundColor: Colors.greyBg,
  },
  modalLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  modalLocationText: {
    fontSize: Typography.fontSize.caption,
    fontFamily: Typography.fontFamily.bodyMedium,
    color: Colors.green,
  },
  modalActions: {
    padding: Spacing.lg,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: '#DC2626',
    paddingVertical: Spacing.md,
    borderRadius: Radii.lg,
  },
  deleteButtonText: {
    fontSize: Typography.fontSize.body2,
    fontFamily: Typography.fontFamily.bodySemiBold,
    color: Colors.white,
  },
});
