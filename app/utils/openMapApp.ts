import { Linking, Platform } from 'react-native';

/**
 * Helper function to open the map app with the given latitude and longitude
 */
export const openMapApp = (lat?: number, long?: number) => {
  const url = Platform.select({
    ios: `maps:0,0?q=${lat},${long}`,
    android: `geo:0,0?q=${lat},${long}`,
    web: `https://www.google.com/maps/place/${lat},${long}`,
  });

  if (url) {
    Linking.openURL(url);
  }
};
