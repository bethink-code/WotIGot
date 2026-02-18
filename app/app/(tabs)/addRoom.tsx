import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Text, Pressable } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  runOnJS,
  ReduceMotion,
} from 'react-native-reanimated';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { ImagePickerAsset } from 'expo-image-picker';
import { PageHeader } from '@/components/ui/PageHeader';
import { TextInput } from '@/components/ui/TextInput';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ImagePicker } from '@/components/ui/ImagePicker';
import { Icon } from '@/components/ui/Icon';
import { Colors, Spacing, Typography, Radii } from '@/constants/DesignTokens';
import { Durations, Easings } from '@/constants/MotionContract';
import { useCreateRoom, useUploadMedia } from '@/lib/mutations';
import { useHouses } from '@/lib/queries';
import { getLocation } from '@/utils/getLocation';
import { useNavigation } from '@/contexts/NavigationContext';

export default function AddRoomScreen() {
  const { setNavigationMode } = useNavigation();
  const { house_id } = useLocalSearchParams();

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
  const [selectedHouseId, setSelectedHouseId] = useState<number | undefined>(
    house_id ? Number(house_id) : undefined
  );
  const [image, setImage] = useState<ImagePickerAsset | null>(null);
  const [showPropertyPicker, setShowPropertyPicker] = useState(false);

  const { data: houses = [] } = useHouses();
  const { mutateAsync: createRoom, isPending } = useCreateRoom();
  const { mutateAsync: uploadMedia, isPending: isUploadingMedia } = useUploadMedia();

  const selectedHouse = houses.find((h: any) => h.id === selectedHouseId);
  const isLoading = isPending || isUploadingMedia;
  const isValid = name.trim().length > 0 && selectedHouseId !== undefined;

  useEffect(() => {
    setNavigationMode('form');
    return () => setNavigationMode('shell');
  }, []);

  useEffect(() => {
    if (house_id) {
      setSelectedHouseId(Number(house_id));
    }
  }, [house_id]);

  const handleSubmit = async () => {
    if (!isValid || isLoading || !selectedHouseId) return;

    try {
      const location = await getLocation();

      let mediaUrl;
      if (image) {
        mediaUrl = await uploadMedia(image);
      }

      await createRoom({
        name: name.trim(),
        house_id: selectedHouseId,
        image: mediaUrl,
        location_lat: location?.coords.latitude,
        location_long: location?.coords.longitude,
      });

      router.navigate({ pathname: '/house', params: { house_id: selectedHouseId } });
    } catch (error) {
      console.error('Failed to create room:', error);
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
        title="Add Room"
        subtitle={selectedHouse ? `In ${selectedHouse.name}` : 'Select a property'}
        level="room"
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
            <View style={styles.sectionLabel}>
              <Text style={styles.label}>PROPERTY</Text>
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.propertySelector,
                pressed && styles.propertySelectorPressed,
              ]}
              onPress={() => setShowPropertyPicker(!showPropertyPicker)}
            >
              <View style={styles.propertySelectorIcon}>
                <Icon
                  name="home-city-outline"
                  size={20}
                  color={selectedHouse ? Colors.yellow : Colors.textMuted}
                />
              </View>
              <Text style={[
                styles.propertySelectorText,
                !selectedHouse && styles.propertySelectorPlaceholder,
              ]}>
                {selectedHouse?.name || 'Select property'}
              </Text>
              <Icon
                name={showPropertyPicker ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={Colors.textMuted}
              />
            </Pressable>

            {showPropertyPicker && (
              <View style={styles.propertyList}>
                {houses.map((house: any) => {
                  const isSelected = house.id === selectedHouseId;
                  return (
                    <Pressable
                      key={house.id}
                      style={({ pressed }) => [
                        styles.propertyItem,
                        isSelected && styles.propertyItemSelected,
                        pressed && styles.propertyItemPressed,
                      ]}
                      onPress={() => {
                        setSelectedHouseId(house.id);
                        setShowPropertyPicker(false);
                      }}
                    >
                      <View style={[
                        styles.propertyItemIcon,
                        isSelected && styles.propertyItemIconSelected,
                      ]}>
                        <Icon
                          name="home-city-outline"
                          size={18}
                          color={isSelected ? Colors.yellow : Colors.textGrey}
                        />
                      </View>
                      <Text style={[
                        styles.propertyItemText,
                        isSelected && styles.propertyItemTextSelected,
                      ]}>
                        {house.name}
                      </Text>
                      {isSelected && (
                        <Icon name="check" size={20} color={Colors.yellow} />
                      )}
                    </Pressable>
                  );
                })}
              </View>
            )}

            <View style={styles.sectionLabel}>
              <Text style={styles.label}>ROOM DETAILS</Text>
            </View>

            <TextInput
              placeholder="Room name"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              returnKeyType="done"
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
            label={isLoading ? 'Creating...' : 'Create Room'}
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
    gap: Spacing.md,
  },
  sectionLabel: {
    marginTop: Spacing.sm,
    marginBottom: -Spacing.xs,
  },
  label: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.bodySemiBold,
    color: Colors.textMuted,
    letterSpacing: 0.8,
  },
  propertySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
    gap: Spacing.sm,
  },
  propertySelectorPressed: {
    backgroundColor: Colors.greyBg,
  },
  propertySelectorIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.yellowSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  propertySelectorText: {
    flex: 1,
    fontSize: Typography.fontSize.subhead,
    fontFamily: Typography.fontFamily.bodyMedium,
    color: Colors.textDark,
  },
  propertySelectorPlaceholder: {
    color: Colors.textMuted,
  },
  propertyList: {
    backgroundColor: Colors.white,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.greyBg,
    overflow: 'hidden',
  },
  propertyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  propertyItemSelected: {
    backgroundColor: Colors.yellowSoft,
  },
  propertyItemPressed: {
    backgroundColor: Colors.greyBg,
  },
  propertyItemIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.greyBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  propertyItemIconSelected: {
    backgroundColor: Colors.yellowSoft,
  },
  propertyItemText: {
    flex: 1,
    fontSize: Typography.fontSize.body2,
    fontFamily: Typography.fontFamily.bodyMedium,
    color: Colors.textDark,
  },
  propertyItemTextSelected: {
    fontFamily: Typography.fontFamily.bodySemiBold,
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
