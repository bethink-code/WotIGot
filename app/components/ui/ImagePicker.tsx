import React from 'react';
import { View, Image, StyleSheet, Pressable, Text } from 'react-native';
import * as ExpoImagePicker from 'expo-image-picker';
import { Colors, Radii, Typography, Spacing } from '../../constants/DesignTokens';
import { Icon } from './Icon';

interface ImagePickerProps {
  value?: ExpoImagePicker.ImagePickerAsset | null;
  onChange: (asset: ExpoImagePicker.ImagePickerAsset | null) => void;
  placeholder?: string;
  aspectRatio?: [number, number];
}

export function ImagePicker({
  value,
  onChange,
  placeholder = 'Add photo',
  aspectRatio = [4, 3],
}: ImagePickerProps) {
  const pickImage = async () => {
    const result = await ExpoImagePicker.launchImageLibraryAsync({
      mediaTypes: ExpoImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: aspectRatio,
      quality: 0.83,
    });

    if (!result.canceled) {
      onChange(result.assets[0]);
    }
  };

  const removeImage = () => {
    onChange(null);
  };

  if (value) {
    return (
      <View style={styles.container}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: value.uri }} style={styles.image} />
          <Pressable
            style={({ pressed }) => [
              styles.removeButton,
              pressed && styles.removeButtonPressed,
            ]}
            onPress={removeImage}
          >
            <Icon name="close" size={18} color={Colors.white} />
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <Pressable
      style={({ pressed }) => [
        styles.picker,
        pressed && styles.pickerPressed,
      ]}
      onPress={pickImage}
    >
      <View style={styles.iconContainer}>
        <Icon name="camera-outline" size={28} color={Colors.textMuted} />
      </View>
      <Text style={styles.placeholder}>{placeholder}</Text>
      <Text style={styles.hint}>Optional</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
  },
  imageContainer: {
    position: 'relative',
    borderRadius: Radii.lg,
    overflow: 'hidden',
  },
  image: {
    width: 120,
    height: 90,
    borderRadius: Radii.lg,
  },
  removeButton: {
    position: 'absolute',
    top: Spacing.xs,
    right: Spacing.xs,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonPressed: {
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  picker: {
    width: 120,
    height: 90,
    borderRadius: Radii.lg,
    borderWidth: 2,
    borderColor: Colors.greyBg,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  pickerPressed: {
    backgroundColor: Colors.greyBg,
  },
  iconContainer: {
    marginBottom: Spacing.xxs,
  },
  placeholder: {
    fontSize: Typography.fontSize.caption,
    fontFamily: Typography.fontFamily.bodyMedium,
    color: Colors.textMuted,
  },
  hint: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textMuted,
    opacity: 0.7,
  },
});
