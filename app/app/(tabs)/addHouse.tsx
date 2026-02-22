import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  runOnJS,
  ReduceMotion,
} from 'react-native-reanimated';
import { router, useFocusEffect } from 'expo-router';
import { ImagePickerAsset } from 'expo-image-picker';
import { PageHeader } from '@/components/ui/PageHeader';
import { TextInput } from '@/components/ui/TextInput';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ImagePicker } from '@/components/ui/ImagePicker';
import { AddressVerification, AddressVerificationStatus } from '@/components/ui/AddressVerification';
import { Colors, Spacing } from '@/constants/DesignTokens';
import { Durations, Easings } from '@/constants/MotionContract';
import { useCreateHouse, useUploadMedia } from '@/lib/mutations';
import { useGeocodeAddress } from '@/hooks/useGeocodeAddress';
import { useNavigation } from '@/contexts/NavigationContext';
import { openMapApp } from '@/utils/openMapApp';

export default function AddPropertyScreen() {
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

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [image, setImage] = useState<ImagePickerAsset | null>(null);

  useEffect(() => {
    setNavigationMode('form');
    return () => setNavigationMode('shell');
  }, []);

  const { mutateAsync: createHouse, isPending } = useCreateHouse();
  const { mutateAsync: uploadMedia, isPending: isUploadingMedia } = useUploadMedia();
  const { status: geocodeStatus, result: geocodeResult, error: geocodeError, geocode, reset: resetGeocode } = useGeocodeAddress();

  const isLoading = isPending || isUploadingMedia;
  
  const getVerificationStatus = (): AddressVerificationStatus => {
    switch (geocodeStatus) {
      case 'loading': return 'verifying';
      case 'success': return 'verified';
      case 'error': return 'error';
      default: return 'unverified';
    }
  };

  const isValid = name.trim().length > 0 && geocodeStatus === 'success' && geocodeResult !== null;

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
    }
  };

  const handleSubmit = async () => {
    if (!isValid || isLoading) return;

    try {
      let mediaResult;
      if (image) {
        mediaResult = await uploadMedia(image);
      }

      await createHouse({
        name: name.trim(),
        address: geocodeResult?.formattedAddress || address.trim(),
        image: mediaResult?.url,
        location_lat: geocodeResult?.coordinates.lat,
        location_long: geocodeResult?.coordinates.lng,
      });

      router.navigate('/');
    } catch (error) {
      console.error('Failed to create property:', error);
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

  return (
    <Animated.View style={[styles.container, screenAnimatedStyle]}>
      <PageHeader
        title="Add Property"
        subtitle="Capture key details"
        level="property"
        onBackPress={handleBack}
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
              status={getVerificationStatus()}
              onVerify={handleVerify}
              verifiedAddress={geocodeResult?.formattedAddress}
              errorMessage={geocodeError || undefined}
              coordinates={geocodeResult?.coordinates}
              onViewMap={handleViewMap}
            />

            <View style={styles.imageSection}>
              <ImagePicker
                value={image}
                onChange={setImage}
                placeholder="Add cover photo"
              />
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <PrimaryButton
            label={isLoading ? 'Creating...' : 'Create Property'}
            onPress={handleSubmit}
            disabled={!isValid || isLoading}
            icon="arrow-right"
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
    padding: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  form: {
    gap: Spacing.lg,
  },
  imageSection: {
    marginTop: Spacing.sm,
  },
  footer: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
    backgroundColor: Colors.bgCanvas,
  },
});
