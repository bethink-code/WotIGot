import * as Location from 'expo-location';
import { Alert } from 'react-native';

/**
 * Helper function to get the current location of the user
 */
export const getLocation = async () => {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permission to access location was denied');
    return null;
  }
  return Location.getCurrentPositionAsync({});
};
