import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextInput } from '@/components/ui/TextInput';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { Icon } from '@/components/ui/Icon';
import { Colors, Typography, Spacing, Radii } from '@/constants/DesignTokens';
import { useCreateUser, useLogin, useGoogleLogin } from '@/lib/mutations';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';

interface RegisterScreenProps {
  onClose?: () => void;
  onNavigateToLogin?: () => void;
}

export function RegisterScreen({ onClose = () => {}, onNavigateToLogin }: RegisterScreenProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const { mutate: createUser, isPending: isCreating } = useCreateUser();
  const { mutate: login, isPending: isLoggingIn } = useLogin();
  const { mutate: googleLogin, isPending: isGooglePending } = useGoogleLogin();
  const { request, response, promptAsync } = useGoogleAuth();

  const isPending = isCreating || isLoggingIn || isGooglePending;

  useEffect(() => {
    if (response?.type === 'success') {
      const idToken = response.params.id_token;
      if (idToken) {
        setError(null);
        googleLogin(idToken, {
          onError: (err: any) => {
            setError(err?.response?.data?.message || 'Google sign-up failed');
          },
        });
      }
    }
  }, [response]);

  const handleRegister = () => {
    setError(null);
    
    if (!name.trim()) {
      setError('Please enter your full name');
      return;
    }
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }
    if (!password.trim()) {
      setError('Please enter a password');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    createUser(
      { 
        name: name.trim(), 
        user_name: email.trim(), 
        password 
      },
      {
        onSuccess: () => {
          login(
            { username: email.trim(), password },
            {
              onError: () => {
                setError('Account created! Please sign in.');
              },
            }
          );
        },
        onError: (err: any) => {
          setError(err?.response?.data?.message || 'Failed to create account');
        },
      }
    );
  };

  const handleGoogleSignUp = () => {
    setError(null);
    promptAsync();
  };

  return (
    <SafeAreaView style={styles.container}>
      <Pressable style={styles.closeButton} onPress={onClose}>
        <Icon name="close" size={24} color={Colors.textDark} />
      </Pressable>
      
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
                placeholder="Full Name"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                autoCorrect={false}
              />
              <TextInput
                placeholder="Email Address"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
              />
              <TextInput
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
              <TextInput
                placeholder="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
            </View>

            <PrimaryButton
              label={isPending ? 'Creating account...' : 'Create Account'}
              onPress={handleRegister}
              disabled={isPending}
              variant="dark"
            />

            <View style={styles.googleButtonContainer}>
              <SecondaryButton
                label={isGooglePending ? 'Signing up...' : 'Sign up with Google'}
                onPress={handleGoogleSignUp}
                disabled={!request || isPending}
                googleIcon
              />
            </View>

            {onNavigateToLogin && (
              <Pressable style={styles.loginLink} onPress={onNavigateToLogin}>
                <Text style={styles.loginText}>
                  Already have an account? <Text style={styles.loginTextBold}>Sign In</Text>
                </Text>
              </Pressable>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
    paddingTop: 80,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
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
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  googleButtonContainer: {
    marginTop: Spacing.lg,
  },
  loginLink: {
    marginTop: Spacing.xl,
    alignItems: 'center',
  },
  loginText: {
    fontSize: Typography.fontSize.body2,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textMuted,
  },
  loginTextBold: {
    fontFamily: Typography.fontFamily.bodySemiBold,
    color: Colors.textDark,
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
});

export default RegisterScreen;
