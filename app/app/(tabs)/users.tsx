import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import Animated from 'react-native-reanimated';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { User } from '@/types/user';
import { PageHeader } from '@/components/ui/PageHeader';
import { Avatar } from '@/components/ui/Avatar';
import { Icon } from '@/components/ui/Icon';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Colors, Spacing, Typography, Radii, Shadows } from '@/constants/DesignTokens';
import { useNavigation } from '@/contexts/NavigationContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHierarchicalBack } from '@/hooks/useHierarchicalBack';

interface UserCardProps {
  user: User;
  onPress: () => void;
}

function UserCard({ user, onPress }: UserCardProps) {
  const isAdmin = user.role === 'admin';
  
  return (
    <Pressable 
      onPress={onPress}
      style={({ pressed }) => [
        styles.userCard,
        pressed && styles.userCardPressed,
      ]}
    >
      <Avatar 
        name={user.name} 
        size="md"
        backgroundColor={isAdmin ? Colors.greenSoft : Colors.greyBg}
      />
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{user.name}</Text>
        <Text style={styles.userUsername}>@{user.user_name}</Text>
      </View>
      {isAdmin && (
        <View style={styles.roleBadge}>
          <Icon name="shield-check" size={12} color={Colors.green} />
          <Text style={styles.roleBadgeText}>Admin</Text>
        </View>
      )}
      <Icon name="chevron-right" size={20} color={Colors.greyLight} />
    </Pressable>
  );
}

function EmptyState() {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <Icon name="account-group-outline" size={48} color={Colors.textMuted} />
      </View>
      <Text style={styles.emptyTitle}>No users yet</Text>
      <Text style={styles.emptySubtitle}>Add users to give them access to the app</Text>
    </View>
  );
}

export default function UsersScreen() {
  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ['/users'],
  });

  const { setNavigationMode } = useNavigation();
  const insets = useSafeAreaInsets();
  const { screenAnimatedStyle, animatedBack } = useHierarchicalBack();

  useEffect(() => {
    setNavigationMode('form');
    return () => setNavigationMode('shell');
  }, []);

  const handleUserPress = (user: User) => {
    router.push({
      pathname: '/addUser',
      params: { username: user.user_name },
    });
  };

  const handleAddUser = () => {
    router.push('/addUser');
  };

  return (
    <Animated.View style={[styles.animatedContainer, screenAnimatedStyle]}>
      <View style={styles.container}>
        <PageHeader
          title="Manage Users"
          subtitle={users ? `${users.length} user${users.length !== 1 ? 's' : ''}` : undefined}
          level="portfolio"
          showBack
          onBackPress={animatedBack}
          actionIcon="account-plus-outline"
          onActionPress={handleAddUser}
        />

      <FlatList
        data={users}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <UserCard user={item} onPress={() => handleUserPress(item)} />
        )}
        ListEmptyComponent={!isLoading ? <EmptyState /> : null}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 100 },
          (!users || users.length === 0) && styles.listContentEmpty,
        ]}
        showsVerticalScrollIndicator={false}
      />

      <View style={[styles.fabContainer, { bottom: insets.bottom + Spacing.lg }]}>
        <Pressable 
          onPress={handleAddUser}
          style={({ pressed }) => [
            styles.fab,
            pressed && styles.fabPressed,
          ]}
        >
          <Icon name="plus" size={28} color={Colors.white} />
        </Pressable>
      </View>
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
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  listContentEmpty: {
    flex: 1,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.card,
  },
  userCardPressed: {
    backgroundColor: Colors.greyBg,
  },
  userInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  userName: {
    fontSize: Typography.fontSize.body1,
    fontFamily: Typography.fontFamily.bodyMedium,
    color: Colors.textDark,
  },
  userUsername: {
    fontSize: Typography.fontSize.caption,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textGrey,
    marginTop: 2,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.greenSoft,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs,
    borderRadius: Radii.pill,
    marginRight: Spacing.sm,
    gap: 4,
  },
  roleBadgeText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bodySemiBold,
    color: Colors.green,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xxl,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.greyBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.title,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textDark,
    marginBottom: Spacing.xs,
  },
  emptySubtitle: {
    fontSize: Typography.fontSize.body2,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textGrey,
    textAlign: 'center',
  },
  fabContainer: {
    position: 'absolute',
    right: Spacing.lg,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.green,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.float,
  },
  fabPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.95 }],
  },
});
