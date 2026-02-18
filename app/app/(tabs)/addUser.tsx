import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import Animated from 'react-native-reanimated';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { User } from '@/types/user';
import { PageHeader } from '@/components/ui/PageHeader';
import { TextInput } from '@/components/ui/TextInput';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { Colors, Spacing } from '@/constants/DesignTokens';
import { useNavigation } from '@/contexts/NavigationContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCreateUser, useUpdateUser, useDeleteUser, CreateUserData, UpdateUserData } from '@/lib/mutations';
import { useHierarchicalBack } from '@/hooks/useHierarchicalBack';

interface UserFormData {
  name: string;
  user_name: string;
  password: string;
}

export default function AddUserScreen() {
  const { username } = useLocalSearchParams<{ username?: string }>();
  const queryClient = useQueryClient();
  const isEditing = Boolean(username);

  const { data: user, isLoading } = useQuery<User>({
    queryKey: [`/users/${username}`],
    enabled: Boolean(username),
  });

  const { setNavigationMode } = useNavigation();
  const insets = useSafeAreaInsets();
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const { screenAnimatedStyle, animatedBack } = useHierarchicalBack();

  const { control, handleSubmit, reset, formState: { isDirty } } = useForm<UserFormData>({
    defaultValues: {
      name: '',
      user_name: '',
      password: '',
    },
  });

  useEffect(() => {
    setNavigationMode('form');
    return () => setNavigationMode('shell');
  }, []);

  useEffect(() => {
    if (user) {
      reset({
        name: user.name,
        user_name: user.user_name,
        password: '',
      });
    }
  }, [user, reset]);

  const { mutateAsync: createUser } = useCreateUser();
  const { mutateAsync: updateUser } = useUpdateUser();
  const { mutateAsync: deleteUser } = useDeleteUser();

  const onSubmit = async (data: UserFormData) => {
    if (isSaving) return;

    if (!isEditing && !data.password) {
      Alert.alert('Error', 'Password is required for new users');
      return;
    }

    setIsSaving(true);
    try {
      if (user) {
        const updateData: UpdateUserData = {
          id: user.id,
          name: data.name,
          user_name: data.user_name,
        };
        if (data.password && data.password.trim().length > 0) {
          updateData.password = data.password;
        }
        await updateUser(updateData);
      } else {
        await createUser(data as CreateUserData);
      }
      await queryClient.invalidateQueries({ queryKey: ['/users'] });
      animatedBack();
    } catch (error) {
      console.error('Failed to save user:', error);
      Alert.alert('Error', 'Failed to save user. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!user) return;
    
    try {
      await deleteUser(user.id);
      await queryClient.invalidateQueries({ queryKey: ['/users'] });
      animatedBack();
    } catch (error) {
      console.error('Failed to delete user:', error);
      Alert.alert('Error', 'Failed to delete user. Please try again.');
    }
  };

  return (
    <Animated.View style={[styles.container, screenAnimatedStyle]}>
      <PageHeader
        title={isEditing ? 'Edit User' : 'Add User'}
        subtitle={isEditing ? user?.user_name : undefined}
        level="portfolio"
        showBack
        onBackPress={animatedBack}
        actionIcon={isEditing ? 'trash-can-outline' : undefined}
        onActionPress={isEditing ? () => setShowDeleteModal(true) : undefined}
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
            name="name"
            rules={{ required: 'Full name is required' }}
            render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
              <TextInput
                label="Full Name"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Enter full name"
                error={error?.message}
                icon="account-outline"
              />
            )}
          />

          <Controller
            control={control}
            name="user_name"
            rules={{ 
              required: 'Username is required',
              pattern: {
                value: /^[a-zA-Z0-9_]+$/,
                message: 'Username can only contain letters, numbers, and underscores',
              },
            }}
            render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
              <TextInput
                label="Username"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Enter username"
                error={error?.message}
                icon="at"
                editable={!isEditing}
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            rules={{ 
              required: isEditing ? false : 'Password is required',
              validate: (value) => {
                if (!isEditing && (!value || value.length < 6)) {
                  return 'Password must be at least 6 characters';
                }
                if (isEditing && value && value.length > 0 && value.length < 6) {
                  return 'Password must be at least 6 characters';
                }
                return true;
              },
            }}
            render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
              <TextInput
                label={isEditing ? 'New Password (leave blank to keep current)' : 'Password'}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder={isEditing ? 'Enter new password' : 'Enter password'}
                secureTextEntry
                error={error?.message}
                icon="lock-outline"
              />
            )}
          />
        </View>

        <View style={styles.actions}>
          <PrimaryButton
            label={isSaving ? "Saving..." : (isEditing ? "Save Changes" : "Create User")}
            onPress={handleSubmit(onSubmit)}
            disabled={isSaving || (isEditing && !isDirty)}
          />
        </View>
      </ScrollView>

      <ConfirmationModal
        visible={showDeleteModal}
        title="Delete User"
        message={`Are you sure you want to delete ${user?.name}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
        destructive
      />
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
  form: {
    gap: Spacing.lg,
  },
  actions: {
    marginTop: Spacing.xxl,
  },
});
