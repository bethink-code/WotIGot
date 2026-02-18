import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import Animated from 'react-native-reanimated';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { User } from '@/types/user';
import { PageHeader } from '@/components/ui/PageHeader';
import { TextInput } from '@/components/ui/TextInput';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Avatar } from '@/components/ui/Avatar';
import { Colors, Spacing, Typography, Radii } from '@/constants/DesignTokens';
import { useNavigation } from '@/contexts/NavigationContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUpdateProfile } from '@/lib/mutations';
import { useHierarchicalBack } from '@/hooks/useHierarchicalBack';

interface ProfileFormData {
  name: string;
}

export default function EditProfileScreen() {
  const queryClient = useQueryClient();
  const { data: me } = useQuery<User>({
    queryKey: ['/auth/me'],
    retry: 0,
  });

  const { setNavigationMode } = useNavigation();
  const insets = useSafeAreaInsets();
  const [isSaving, setIsSaving] = useState(false);

  const { screenAnimatedStyle, animatedBack } = useHierarchicalBack();

  const { control, handleSubmit, reset, formState: { isDirty } } = useForm<ProfileFormData>({
    defaultValues: {
      name: me?.name || '',
    },
  });

  useEffect(() => {
    setNavigationMode('form');
    return () => setNavigationMode('shell');
  }, []);

  useEffect(() => {
    if (me) {
      reset({ name: me.name });
    }
  }, [me, reset]);

  const { mutateAsync: updateProfile } = useUpdateProfile();

  const onSubmit = async (data: ProfileFormData) => {
    if (!me) return;
    
    setIsSaving(true);
    try {
      await updateProfile({ name: data.name });
      await queryClient.invalidateQueries({ queryKey: ['/auth/me'] });
      animatedBack();
    } catch (error) {
      console.error('Failed to update profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!me) {
    return null;
  }

  return (
    <Animated.View style={[styles.container, screenAnimatedStyle]}>
      <PageHeader
        title="Edit Profile"
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
        <View style={styles.avatarSection}>
          <Avatar 
            name={me.name} 
            size="lg"
            backgroundColor={Colors.greenSoft}
          />
        </View>

        <View style={styles.form}>
          <Controller
            control={control}
            name="name"
            rules={{ required: 'Name is required' }}
            render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
              <TextInput
                label="Full Name"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Enter your full name"
                error={error?.message}
                icon="account-outline"
              />
            )}
          />

          <View style={styles.readOnlyField}>
            <TextInput
              label="Username"
              value={me.user_name}
              editable={false}
              placeholder="Username"
              icon="at"
            />
          </View>
        </View>

        <View style={styles.actions}>
          <PrimaryButton
            label={isSaving ? "Saving..." : "Save Changes"}
            onPress={handleSubmit(onSubmit)}
            disabled={!isDirty || isSaving}
          />
        </View>
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
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
  avatarSection: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  form: {
    gap: Spacing.lg,
  },
  readOnlyField: {
    opacity: 0.6,
  },
  actions: {
    marginTop: Spacing.xxl,
  },
});
