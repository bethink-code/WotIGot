import React, { useCallback } from 'react';
import { View, StyleSheet, Pressable, Text } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  ReduceMotion,
} from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import { router, useFocusEffect } from 'expo-router';
import { PageHeader } from '@/components/ui/PageHeader';
import { Icon } from '@/components/ui/Icon';
import { Colors, Spacing, Typography, Radii } from '@/constants/DesignTokens';
import { Durations, Easings } from '@/constants/MotionContract';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface MakePhotoStepProps {
  onSelectPhoto: (image: ImagePicker.ImagePickerAsset) => void;
}

export default function MakePhotoStep({ onSelectPhoto }: MakePhotoStepProps) {
  const insets = useSafeAreaInsets();

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

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.83,
    });

    if (!result.canceled) {
      onSelectPhoto(result.assets[0]);
    }
  };

  const makeImage = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      onSelectPhoto(result.assets[0]);
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <Animated.View style={[styles.container, screenAnimatedStyle]}>
      <PageHeader
        title="Scan Item"
        subtitle="Take or upload a photo"
        level="room"
        onBackPress={handleBack}
      />

      <View style={[styles.content, { paddingBottom: insets.bottom + Spacing.xxl }]}>
        <View style={styles.optionsRow}>
          <Pressable
            style={({ pressed }) => [
              styles.optionCard,
              pressed && styles.optionPressed,
            ]}
            onPress={makeImage}
          >
            <View style={styles.optionIconContainer}>
              <Icon name="camera-outline" size={32} color={Colors.orange} />
            </View>
            <Text style={styles.optionTitle}>Take Photo</Text>
            <Text style={styles.optionDescription}>Use camera</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.optionCard,
              pressed && styles.optionPressed,
            ]}
            onPress={pickImage}
          >
            <View style={styles.optionIconContainer}>
              <Icon name="image-outline" size={32} color={Colors.orange} />
            </View>
            <Text style={styles.optionTitle}>Upload Photo</Text>
            <Text style={styles.optionDescription}>From library</Text>
          </Pressable>
        </View>

        <View style={styles.hint}>
          <Icon name="lightbulb-outline" size={16} color={Colors.textMuted} />
          <Text style={styles.hintText}>
            AI will identify your item and estimate its value
          </Text>
        </View>
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
    paddingVertical: Spacing.lg,
    justifyContent: 'center',
  },
  optionsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  optionCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: Radii.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  optionPressed: {
    backgroundColor: Colors.orangeSoft,
    borderColor: Colors.orange,
  },
  optionIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: Colors.orangeSoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  optionTitle: {
    fontSize: Typography.fontSize.subhead,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textDark,
    marginBottom: Spacing.xxs,
    textAlign: 'center',
  },
  optionDescription: {
    fontSize: Typography.fontSize.caption,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
  },
  hintText: {
    fontSize: Typography.fontSize.caption,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});
