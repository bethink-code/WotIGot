import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  runOnJS,
  ReduceMotion,
} from 'react-native-reanimated';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ImagePickerAsset } from 'expo-image-picker';
import { PageHeader } from '@/components/ui/PageHeader';
import { TextInput } from '@/components/ui/TextInput';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ImagePicker } from '@/components/ui/ImagePicker';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { AddressVerification, AddressVerificationStatus } from '@/components/ui/AddressVerification';
import { Colors, Spacing } from '@/constants/DesignTokens';
import { Durations, Easings } from '@/constants/MotionContract';
import { useUpdateHouse, useDeleteHouse, useUploadMedia } from '@/lib/mutations';
import { useGeocodeAddress } from '@/hooks/useGeocodeAddress';
import { useNavigation } from '@/contexts/NavigationContext';
import { openMapApp } from '@/utils/openMapApp';
import { House } from '@/types/house';

export default function EditPropertyScreen() {
  const { house_id } = useLocalSearchParams();
  const id = Number(house_id);
  const { setNavigationMode } = useNavigation();

  const screenTranslateX = useSharedValue(300);
  const screenOpacity = useSharedValue(0);

  const screenAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: screenTranslateX.value }],
    opacity: screenOpacity.value,
  }));

  useFocusEffect(
    useCallback(() => {
      screenTranslateX.value = 300;
      screenOpacity.value = 0;
      screenTranslateX.value = withTiming(0, {
        duration: Durations.normal,
        easing: Easings.emphasized,
        reduceMotion: ReduceMotion.Never,
      });
      screenOpacity.value = withTiming(1, {
        duration: Durations.normal,
        easing: Easings.emphasized,
        reduceMotion: ReduceMotion.Never,
      });
    }, [])
  );
  
  const { data: house, isLoading: isLoadingHouse } = useQuery<House>({
    queryKey: [`/houses/${id}`],
  });

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [image, setImage] = useState<ImagePickerAsset | null>(null);
  const [existingImage, setExistingImage] = useState<string | undefined>();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [originalAddress, setOriginalAddress] = useState('');
  const [hasExistingCoordinates, setHasExistingCoordinates] = useState(false);

  const { status: geocodeStatus, result: geocodeResult, error: geocodeError, geocode, reset: resetGeocode } = useGeocodeAddress();

  useEffect(() => {
    setNavigationMode('form');
    return () => setNavigationMode('shell');
  }, []);

  useEffect(() => {
    if (house) {
      setName(house.name || '');
      setAddress(house.address || '');
      setOriginalAddress(house.address || '');
      setExistingImage(house.image);
      setHasExistingCoordinates(!!house.location_lat && !!house.location_long);
    }
  }, [house]);

  const { mutateAsync: updateHouse, isPending } = useUpdateHouse();
  const { mutateAsync: deleteHouse, isPending: isDeleting } = useDeleteHouse();
  const { mutateAsync: uploadMedia, isPending: isUploadingMedia } = useUploadMedia();

  const isLoading = isPending || isUploadingMedia || isDeleting;
  
  const getVerificationStatus = (): AddressVerificationStatus => {
    if (geocodeStatus === 'loading') return 'verifying';
    if (geocodeStatus === 'success') return 'verified';
    if (geocodeStatus === 'error') return 'error';
    if (hasExistingCoordinates && address === originalAddress) return 'verified';
    return 'unverified';
  };

  const verificationStatus = getVerificationStatus();
  const addressIsVerified = verificationStatus === 'verified';
  const isValid = name.trim().length > 0 && address.trim().length > 0 && addressIsVerified;

  const handleAddressChange = (newAddress: string) => {
    setAddress(newAddress);
    if (geocodeStatus !== 'idle') {
      resetGeocode();
    }
  };

  const handleVerify = () => {
    geocode(address);
  };

  const handleViewMap = () => {
    if (geocodeResult?.coordinates) {
      openMapApp(geocodeResult.coordinates.lat, geocodeResult.coordinates.lng);
    } else if (hasExistingCoordinates && house?.location_lat && house?.location_long) {
      openMapApp(house.location_lat, house.location_long);
    }
  };

  const handleSubmit = async () => {
    if (!isValid || isLoading) return;

    try {
      let mediaUrl = existingImage;
      if (image) {
        mediaUrl = await uploadMedia(image);
      }

      const locationLat = geocodeResult?.coordinates.lat ?? house?.location_lat;
      const locationLong = geocodeResult?.coordinates.lng ?? house?.location_long;

      await updateHouse({
        id,
        name: name.trim(),
        address: geocodeResult?.formattedAddress || address.trim(),
        image: mediaUrl,
        location_lat: locationLat,
        location_long: locationLong,
      });

      router.navigate('/');
    } catch (error) {
      console.error('Failed to update property:', error);
    }
  };

  const handleDelete = async () => {
    if (house) {
      setShowDeleteModal(false);
      await deleteHouse(house.id);
      router.navigate('/');
    }
  };

  const navigateBack = useCallback(() => {
    router.back();
  }, []);

  const handleBack = useCallback(() => {
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
      runOnJS(navigateBack)();
    });
  }, [navigateBack]);

  if (isLoadingHouse) {
    return (
      <Animated.View style={[styles.container, screenAnimatedStyle]}>
        <PageHeader
          title="Loading..."
          level="property"
          onBackPress={handleBack}
        />
      </Animated.View>
    );
  }

  const getVerifiedAddress = () => {
    if (geocodeResult?.formattedAddress) {
      return geocodeResult.formattedAddress;
    }
    if (hasExistingCoordinates && address === originalAddress) {
      return address;
    }
    return undefined;
  };

  const getCoordinates = () => {
    if (geocodeResult?.coordinates) {
      return geocodeResult.coordinates;
    }
    if (hasExistingCoordinates && address === originalAddress && house?.location_lat && house?.location_long) {
      return { lat: house.location_lat, lng: house.location_long };
    }
    return undefined;
  };

  return (
    <Animated.View style={[styles.container, screenAnimatedStyle]}>
      <PageHeader
        title="Edit Property"
        subtitle={house?.name}
        level="property"
        onBackPress={handleBack}
        actionIcon="trash-can-outline"
        onActionPress={() => setShowDeleteModal(true)}
      />

      <ConfirmationModal
        visible={showDeleteModal}
        title="Delete Property"
        message={`Are you sure you want to delete "${house?.name}"? This will permanently delete all rooms and items inside.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        confirmIcon="trash-can-outline"
        variant="destructive"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.form}>
            <TextInput
              placeholder="Property name"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              returnKeyType="next"
            />

            <AddressVerification
              address={address}
              onAddressChange={handleAddressChange}
              status={verificationStatus}
              onVerify={handleVerify}
              verifiedAddress={getVerifiedAddress()}
              errorMessage={geocodeError || undefined}
              coordinates={getCoordinates()}
              onViewMap={handleViewMap}
            />

            <View style={styles.imageSection}>
              <ImagePicker
                value={image}
                onChange={setImage}
                placeholder="Change cover photo"
                existingImageUrl={existingImage}
              />
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <PrimaryButton
            label={isLoading ? 'Saving...' : 'Save Changes'}
            onPress={handleSubmit}
            disabled={!isValid || isLoading}
            icon="check"
          />
        </View>
      </KeyboardAvoidingView>
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
  content: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  form: {
    gap: Spacing.lg,
  },
  imageSection: {
    marginTop: Spacing.sm,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    paddingBottom: Spacing.xxl,
    backgroundColor: Colors.bgCanvas,
  },
});
