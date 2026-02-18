import { useCallback } from 'react';
import { router, usePathname, useLocalSearchParams } from 'expo-router';
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  ReduceMotion,
} from 'react-native-reanimated';
import { Durations, Easings } from '@/constants/MotionContract';
import { useNavigation } from '@/contexts/NavigationContext';

const HORIZONTAL_OFFSET = 300;

type HierarchyRoute = 
  | 'portfolio'
  | 'property'
  | 'room'
  | 'item'
  | 'settings'
  | 'form';

interface ParentDestination {
  pathname: string;
  params?: Record<string, any>;
}

function getParentDestination(
  currentPath: string,
  params: Record<string, any>,
  context: { propertyId?: string; roomId?: string }
): ParentDestination {
  const path = currentPath.replace('/(tabs)', '');
  
  switch (path) {
    case '/item':
      if (params.room_id) {
        return { pathname: '/(tabs)/room', params: { room_id: params.room_id } };
      }
      if (context.roomId) {
        return { pathname: '/(tabs)/room', params: { room_id: context.roomId } };
      }
      return { pathname: '/(tabs)/' };
      
    case '/room':
      if (params.house_id) {
        return { pathname: '/(tabs)/house', params: { house_id: params.house_id } };
      }
      if (context.propertyId) {
        return { pathname: '/(tabs)/house', params: { house_id: context.propertyId } };
      }
      return { pathname: '/(tabs)/' };
      
    case '/house':
      return { pathname: '/(tabs)/' };
      
    case '/editItem':
      if (params.id) {
        return { pathname: '/(tabs)/item', params: { item_id: params.id } };
      }
      return { pathname: '/(tabs)/' };
      
    case '/editRoom':
      if (params.room_id) {
        return { pathname: '/(tabs)/room', params: { room_id: params.room_id } };
      }
      return { pathname: '/(tabs)/' };
      
    case '/editHouse':
      if (params.house_id) {
        return { pathname: '/(tabs)/house', params: { house_id: params.house_id } };
      }
      return { pathname: '/(tabs)/' };
      
    case '/addRoom':
      if (params.house_id) {
        return { pathname: '/(tabs)/house', params: { house_id: params.house_id } };
      }
      if (context.propertyId) {
        return { pathname: '/(tabs)/house', params: { house_id: context.propertyId } };
      }
      return { pathname: '/(tabs)/' };
      
    case '/addItem':
      if (params.room_id) {
        return { pathname: '/(tabs)/room', params: { room_id: params.room_id } };
      }
      if (context.roomId) {
        return { pathname: '/(tabs)/room', params: { room_id: context.roomId } };
      }
      return { pathname: '/(tabs)/' };
      
    case '/addHouse':
      return { pathname: '/(tabs)/' };
      
    case '/changePassword':
    case '/users':
    case '/addUser':
    case '/editProfile':
      return { pathname: '/(tabs)/settings' };
      
    default:
      return { pathname: '/(tabs)/' };
  }
}

export function useHierarchicalBack() {
  const pathname = usePathname();
  const params = useLocalSearchParams();
  const { currentContext } = useNavigation();
  
  const screenOpacity = useSharedValue(1);
  const screenTranslateX = useSharedValue(0);

  const screenAnimatedStyle = useAnimatedStyle(() => ({
    opacity: screenOpacity.value,
    transform: [{ translateX: screenTranslateX.value }],
  }));

  const navigateToParent = useCallback(() => {
    const destination = getParentDestination(
      pathname, 
      params as Record<string, any>,
      {
        propertyId: currentContext.propertyId,
        roomId: currentContext.roomId,
      }
    );
    
    if (destination.params) {
      router.navigate({ pathname: destination.pathname as any, params: destination.params });
    } else {
      router.navigate(destination.pathname as any);
    }
  }, [pathname, params, currentContext.propertyId, currentContext.roomId]);

  const animatedBack = useCallback(() => {
    screenOpacity.value = withTiming(0, {
      duration: Durations.normal,
      easing: Easings.emphasized,
      reduceMotion: ReduceMotion.Never,
    });
    screenTranslateX.value = withTiming(HORIZONTAL_OFFSET, {
      duration: Durations.normal,
      easing: Easings.emphasized,
      reduceMotion: ReduceMotion.Never,
    }, () => {
      runOnJS(navigateToParent)();
    });
  }, [navigateToParent]);

  const animatedExit = useCallback((callback: () => void) => {
    screenOpacity.value = withTiming(0, {
      duration: Durations.normal,
      easing: Easings.emphasized,
      reduceMotion: ReduceMotion.Never,
    });
    screenTranslateX.value = withTiming(HORIZONTAL_OFFSET, {
      duration: Durations.normal,
      easing: Easings.emphasized,
      reduceMotion: ReduceMotion.Never,
    }, () => {
      runOnJS(callback)();
    });
  }, []);

  return {
    screenAnimatedStyle,
    animatedBack,
    animatedExit,
    screenOpacity,
    screenTranslateX,
    getParentDestination: () => getParentDestination(
      pathname,
      params as Record<string, any>,
      {
        propertyId: currentContext.propertyId,
        roomId: currentContext.roomId,
      }
    ),
  };
}
