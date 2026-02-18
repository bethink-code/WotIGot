import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Pressable, Image } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextInput } from '@/components/ui/TextInput';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { Icon } from '@/components/ui/Icon';
import { Colors, Typography, Spacing, Radii } from '@/constants/DesignTokens';
import { useLogin, useGoogleLogin } from '@/lib/mutations';
import { useSharedAxisTransition } from '@/hooks/useSharedAxisTransition';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';

interface LoginScreenProps {
  onClose?: () => void;
  onNavigateToRegister?: () => void;
}

export function LoginScreen({ onClose, onNavigateToRegister }: LoginScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { mutate, isPending } = useLogin();
  const { mutate: googleLogin, isPending: isGooglePending } = useGoogleLogin();
  const { request, response, promptAsync } = useGoogleAuth();

  const { screenAnimatedStyle, animatedExit } = useSharedAxisTransition();

  useEffect(() => {
    if (response?.type === 'success') {
      const idToken = response.params.id_token;
      if (idToken) {
        setError(null);
        googleLogin(idToken, {
          onError: (err: any) => {
            setError(err?.response?.data?.message || 'Google sign-in failed');
          },
        });
      }
    }
  }, [response]);

  const handleClose = useCallback(() => {
    if (onClose) {
      animatedExit(onClose);
    }
  }, [onClose, animatedExit]);

  const handleLogin = () => {
    setError(null);
    
    if (!username.trim()) {
      setError('Please enter your username');
      return;
    }
    if (!password.trim()) {
      setError('Please enter your password');
      return;
    }

    mutate(
      { username: username.trim(), password },
      {
        onError: (err: any) => {
          setError(err?.response?.data?.message || 'Invalid username or password');
        },
      }
    );
  };

  const handleGoogleSignUp = () => {
    setError(null);
    promptAsync();
  };

  return (
    <Animated.View style={[styles.animatedContainer, screenAnimatedStyle]}>
      <SafeAreaView style={styles.container}>
        {onClose && (
          <Pressable style={styles.closeButton} onPress={handleClose}>
            <Icon name="close" size={24} color={Colors.textDark} />
          </Pressable>
        )}
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>
              <Text style={styles.logoW}>w</Text>
              <Text style={styles.logoO}>o</Text>
              <Text style={styles.logoT}>t</Text>
              <Text style={styles.logoI}>i</Text>
              <Text style={styles.logoG}>g</Text>
              <Text style={styles.logoO2}>o</Text>
              <Text style={styles.logoT2}>t</Text>
              <Text style={styles.logoDot}>.</Text>
            </Text>
          </View>

          <View style={styles.form}>
            {error && (
              <View style={styles.errorContainer}>
                <Icon name="alert-circle-outline" size={16} color={Colors.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <View style={styles.inputGroup}>
              <TextInput
                placeholder="Username"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TextInput
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <PrimaryButton
              label={isPending ? 'Signing in...' : 'Sign In'}
              onPress={handleLogin}
              disabled={isPending || isGooglePending}
              variant="dark"
            />

            <View style={styles.googleButtonContainer}>
              <SecondaryButton
                label={isGooglePending ? 'Signing in...' : 'Sign in with Google'}
                onPress={handleGoogleSignUp}
                disabled={!request || isPending || isGooglePending}
                googleIcon
              />
            </View>

            {onNavigateToRegister && (
              <Pressable style={styles.registerLink} onPress={onNavigateToRegister}>
                <Text style={styles.registerText}>
                  Don't have an account? <Text style={styles.registerTextBold}>Sign Up</Text>
                </Text>
              </Pressable>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  animatedContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.bgCanvas,
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    left: Spacing.lg,
    zIndex: 10,
    padding: Spacing.sm,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.pageHorizontal,
    paddingVertical: Spacing.xl,
    paddingTop: 100,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logoText: {
    fontSize: Typography.fontSize.logo,
    fontFamily: Typography.fontFamily.bold,
  },
  logoW: {
    color: Colors.textDark,
  },
  logoO: {
    color: Colors.textDark,
  },
  logoT: {
    color: Colors.textDark,
  },
  logoI: {
    color: Colors.green,
  },
  logoG: {
    color: Colors.textDark,
  },
  logoO2: {
    color: Colors.textDark,
  },
  logoT2: {
    color: Colors.textDark,
  },
  logoDot: {
    color: Colors.orange,
  },
  form: {
    width: '100%',
    maxWidth: 360,
    alignSelf: 'center',
  },
  inputGroup: {
    gap: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  googleButtonContainer: {
    marginTop: Spacing.lg,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dangerSoft,
    padding: Spacing.md,
    borderRadius: Radii.md,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  errorText: {
    flex: 1,
    fontSize: Typography.fontSize.body2,
    fontFamily: Typography.fontFamily.bodyMedium,
    color: Colors.danger,
  },
  registerLink: {
    marginTop: Spacing.xl,
    alignItems: 'center',
  },
  registerText: {
    fontSize: Typography.fontSize.body2,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textMuted,
  },
  registerTextBold: {
    fontFamily: Typography.fontFamily.bodySemiBold,
    color: Colors.textDark,
  },
});

export default LoginScreen;
