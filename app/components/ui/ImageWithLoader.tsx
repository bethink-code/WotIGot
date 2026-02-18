import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, ViewStyle, Image, Platform } from 'react-native';
import { Colors, Radii } from '../../constants/DesignTokens';

interface ImageWithLoaderProps {
  source: string | null | undefined;
  thumbnailSource?: string | null;
  style?: ViewStyle;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
  placeholderColor?: string;
}

export function ImageWithLoader({
  source,
  thumbnailSource,
  style,
  resizeMode = 'cover',
  placeholderColor = Colors.greyBg,
}: ImageWithLoaderProps) {
  const [thumbnailLoaded, setThumbnailLoaded] = useState(false);
  const [fullImageLoaded, setFullImageLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const hasThumbnail = !!thumbnailSource && thumbnailSource !== source;
  const hasFullImage = !!source;

  useEffect(() => {
    setThumbnailLoaded(false);
    setFullImageLoaded(false);
    setHasError(false);
  }, [source, thumbnailSource]);

  if ((!hasFullImage && !hasThumbnail) || hasError) {
    return (
      <View style={[styles.placeholder, style, { backgroundColor: placeholderColor }]} />
    );
  }

  const showLoader = !thumbnailLoaded && !fullImageLoaded;

  return (
    <View style={[styles.container, style]}>
      {hasThumbnail && !fullImageLoaded && (
        <Image
          source={{ uri: thumbnailSource! }}
          style={styles.image}
          resizeMode={resizeMode}
          onLoad={() => setThumbnailLoaded(true)}
          onError={() => {
            if (!hasFullImage) {
              setHasError(true);
            }
          }}
        />
      )}
      
      {hasFullImage && (
        <Image
          source={{ uri: source! }}
          style={[
            styles.image,
            hasThumbnail && !fullImageLoaded && styles.hiddenImage,
          ]}
          resizeMode={resizeMode}
          onLoad={() => setFullImageLoaded(true)}
          onError={() => {
            if (!thumbnailLoaded) {
              setHasError(true);
            }
          }}
        />
      )}

      {showLoader && (
        <View style={[styles.loaderContainer, { backgroundColor: placeholderColor }]}>
          <ActivityIndicator size="small" color={Colors.greyMid} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  hiddenImage: {
    opacity: 0,
  },
  placeholder: {
    width: '100%',
    height: '100%',
    borderRadius: Radii.md,
  },
  loaderContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
