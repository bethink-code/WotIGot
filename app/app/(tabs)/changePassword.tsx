import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import Animated from 'react-native-reanimated';
import { useForm, Controller } from 'react-hook-form';
import { PageHeader } from '@/components/ui/PageHeader';
import { TextInput } from '@/components/ui/TextInput';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Colors, Spacing } from '@/constants/DesignTokens';
import { useNavigation } from '@/contexts/NavigationContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useChangePassword } from '@/lib/mutations';
import { useHierarchicalBack } from '@/hooks/useHierarchicalBack';

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function ChangePasswordScreen() {
  const { setNavigationMode } = useNavigation();
  const insets = useSafeAreaInsets();
  const [isSaving, setIsSaving] = useState(false);
  
  const { screenAnimatedStyle, animatedBack } = useHierarchicalBack();

  const { control, handleSubmit, watch, reset, formState: { isValid } } = useForm<PasswordFormData>({
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    mode: 'onChange',
  });

  const newPassword = watch('newPassword');

  useEffect(() => {
    setNavigationMode('form');
    return () => setNavigationMode('shell');
  }, []);

  const { mutateAsync: changePassword } = useChangePassword();

  const onSubmit = async (data: PasswordFormData) => {
    setIsSaving(true);
    try {
      await changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      Alert.alert('Success', 'Your password has been changed successfully.');
      reset();
      animatedBack();
    } catch (error: any) {
      console.error('Failed to change password:', error);
      const message = error?.response?.data?.message || 'Failed to change password. Please try again.';
      Alert.alert('Error', message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Animated.View style={[styles.animatedContainer, screenAnimatedStyle]}>
      <View style={styles.container}>
        <PageHeader
          title="Change Password"
          level="portfolio"
          showBack
          onBackPress={animatedBack}
        />

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 40 }
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.form}>
          <Controller
            control={control}
            name="currentPassword"
            rules={{ required: 'Current password is required' }}
            render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
              <TextInput
                label="Current Password"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Enter current password"
                secureTextEntry
                error={error?.message}
                icon="lock-outline"
              />
            )}
          />

          <Controller
            control={control}
            name="newPassword"
            rules={{ 
              required: 'New password is required',
              minLength: {
                value: 6,
                message: 'Password must be at least 6 characters',
              },
            }}
            render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
              <TextInput
                label="New Password"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Enter new password"
                secureTextEntry
                error={error?.message}
                icon="lock-plus-outline"
              />
            )}
          />

          <Controller
            control={control}
            name="confirmPassword"
            rules={{ 
              required: 'Please confirm your password',
              validate: value => value === newPassword || 'Passwords do not match',
            }}
            render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
              <TextInput
                label="Confirm New Password"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Confirm new password"
                secureTextEntry
                error={error?.message}
                icon="lock-check-outline"
              />
            )}
          />
        </View>

        <View style={styles.actions}>
          <PrimaryButton
            label={isSaving ? "Changing Password..." : "Change Password"}
            onPress={handleSubmit(onSubmit)}
            disabled={!isValid || isSaving}
          />
        </View>
      </ScrollView>
      </View>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  form: {
    gap: Spacing.lg,
  },
  actions: {
    marginTop: Spacing.xxl,
  },
});
