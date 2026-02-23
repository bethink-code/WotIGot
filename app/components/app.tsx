import { LoginScreen } from '@/components/auth/LoginScreen';
import { RegisterScreen } from '@/components/auth/RegisterScreen';
import { OnboardingScreen } from '@/components/auth/OnboardingScreen';
import { useQuery } from '@tanstack/react-query';
import { Stack, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationProvider } from '@/contexts/NavigationContext';
import { Colors } from '@/constants/DesignTokens';
import { initializeAuth } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';

const ONBOARDING_COMPLETE_KEY = '@wotigot:onboarding_complete';

interface AppProps {
  /**
   * Whether the app's assets (fonts, etc) have been loaded.
   */
  isAssetsLoaded: boolean;
}

const PUBLIC_ROUTES = ['/design-preview', '/add-screens-demo'];

const LoadingScreen = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color={Colors.green} />
  </View>
);

const App = ({ isAssetsLoaded }: AppProps) => {
  const pathname = usePathname();
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
  const [isAuthInitialized, setIsAuthInitialized] = useState(false);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);
  const [authScreen, setAuthScreen] = useState<'none' | 'login' | 'register'>('none');

  // Invalidate all queries on route change to ensure fresh data on every screen
  const prevPathRef = useRef(pathname);
  useEffect(() => {
    if (prevPathRef.current !== pathname) {
      prevPathRef.current = pathname;
      queryClient.invalidateQueries();
    }
  }, [pathname]);

  useEffect(() => {
    const init = async () => {
      const [, onboardingComplete] = await Promise.all([
        initializeAuth(),
        AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY),
      ]);
      setHasSeenOnboarding(onboardingComplete === 'true');
      setIsAuthInitialized(true);
    };
    init();
  }, []);

  const {
    data: me,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['/auth/me'],
    retry: 0,
    enabled: !isPublicRoute && isAuthInitialized,
  });

  useEffect(() => {
    if (isAssetsLoaded && (!isLoading || isPublicRoute) && isAuthInitialized && hasSeenOnboarding !== null) {
      SplashScreen.hideAsync();
      // Add fonts-loaded class to body on web to reveal content
      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        document.body.classList.add('fonts-loaded');
      }
    }
  }, [isAssetsLoaded, isLoading, isPublicRoute, isAuthInitialized, hasSeenOnboarding]);

  const handleOnboardingComplete = async () => {
    await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
    setHasSeenOnboarding(true);
    setAuthScreen('register');
  };

  const handleGoToLogin = () => {
    setAuthScreen('login');
  };

  const handleGoToRegister = () => {
    setAuthScreen('register');
  };

  const handleBackToOnboarding = () => {
    setAuthScreen('none');
    setHasSeenOnboarding(false);
  };

  if (!isAssetsLoaded || !isAuthInitialized || hasSeenOnboarding === null || (isLoading && !isPublicRoute)) {
    return <LoadingScreen />;
  }

  if (!isPublicRoute && (!me || isError)) {
    if (!hasSeenOnboarding && authScreen === 'none') {
      return (
        <OnboardingScreen
          onComplete={handleOnboardingComplete}
          onLogin={handleGoToLogin}
        />
      );
    }
    if (authScreen === 'register') {
      return (
        <RegisterScreen
          onClose={handleBackToOnboarding}
          onNavigateToLogin={handleGoToLogin}
        />
      );
    }
    return (
      <LoginScreen
        onClose={handleBackToOnboarding}
        onNavigateToRegister={handleGoToRegister}
      />
    );
  }

  return (
    <NavigationProvider>
      <Stack screenOptions={{ animation: 'fade' }}>
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
            animation: 'flip',
          }}
        />
        <Stack.Screen 
          name="design-preview" 
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen 
          name="add-screens-demo" 
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen name="+not-found" />
      </Stack>
    </NavigationProvider>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.bgCanvas,
  },
});

export default App;
