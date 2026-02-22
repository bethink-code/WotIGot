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
import { Colors, Spacing } from '@/constants/DesignTokens';
import { Durations, Easings } from '@/constants/MotionContract';
import { useUpdateRoom, useDeleteRoom, useUploadMedia } from '@/lib/mutations';
import { useNavigation } from '@/contexts/NavigationContext';
import { Room } from '@/types/room';
import { House } from '@/types/house';

export default function EditRoomScreen() {
  const { room_id } = useLocalSearchParams();
  const id = Number(room_id);
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
  
  const { data: room, isLoading: isLoadingRoom } = useQuery<Room>({
    queryKey: [`/rooms/${id}`],
  });

  const { data: house } = useQuery<House>({
    queryKey: [`/houses/${room?.house_id}`],
    enabled: !!room?.house_id,
  });

  const [name, setName] = useState('');
  const [image, setImage] = useState<ImagePickerAsset | null>(null);
  const [existingImage, setExistingImage] = useState<string | undefined>();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    setNavigationMode('form');
    return () => setNavigationMode('shell');
  }, []);

  useEffect(() => {
    if (room) {
      setName(room.name || '');
      setExistingImage(room.image);
    }
  }, [room]);

  const { mutateAsync: updateRoom, isPending } = useUpdateRoom();
  const { mutateAsync: deleteRoom, isPending: isDeleting } = useDeleteRoom();
  const { mutateAsync: uploadMedia, isPending: isUploadingMedia } = useUploadMedia();

  const isLoading = isPending || isUploadingMedia || isDeleting;
  const isValid = name.trim().length > 0;

  const handleSubmit = async () => {
    if (!isValid || isLoading) return;

    try {
      let imageUrl = existingImage;
      if (image) {
        const mediaResult = await uploadMedia(image);
        imageUrl = mediaResult.url;
      }

      await updateRoom({
        id,
        name: name.trim(),
        image: imageUrl,
      });

      room?.house_id 
        ? router.navigate({ pathname: '/(tabs)/house', params: { house_id: room.house_id } })
        : router.navigate('/');
    } catch (error) {
      console.error('Failed to update room:', error);
    }
  };

  const handleDelete = async () => {
    if (room) {
      setShowDeleteModal(false);
      await deleteRoom(room.id);
      router.navigate({ pathname: '/(tabs)/house', params: { house_id: room.house_id } });
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

  if (isLoadingRoom) {
    return (
      <Animated.View style={[styles.container, screenAnimatedStyle]}>
        <PageHeader
          title="Loading..."
          level="room"
          onBackPress={handleBack}
        />
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.container, screenAnimatedStyle]}>
      <PageHeader
        title="Edit Room"
        subtitle={house?.name ? `In ${house.name}` : undefined}
        level="room"
        onBackPress={handleBack}
        actionIcon="trash-can-outline"
        onActionPress={() => setShowDeleteModal(true)}
      />

      <ConfirmationModal
        visible={showDeleteModal}
        title="Delete Room"
        message={`Are you sure you want to delete "${room?.name}"? This will permanently delete all items inside.`}
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
