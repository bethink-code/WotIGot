import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { nativeApplicationVersion } from 'expo-application';
import { router } from 'expo-router';
import { User } from '@/types/user';
import { PageHeader } from '@/components/ui/PageHeader';
import { Avatar } from '@/components/ui/Avatar';
import { Icon, MaterialIconName } from '@/components/ui/Icon';
import { Colors, Spacing, Typography, Radii, Shadows } from '@/constants/DesignTokens';
import { useNavigation } from '@/contexts/NavigationContext';
import { useLogout } from '@/lib/mutations';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SettingsItemProps {
  icon: MaterialIconName;
  label: string;
  subtitle?: string;
  onPress?: () => void;
  showChevron?: boolean;
  destructive?: boolean;
  iconColor?: string;
  iconBgColor?: string;
}

function SettingsItem({ 
  icon, 
  label, 
  subtitle,
  onPress, 
  showChevron = true,
  destructive = false,
  iconColor,
  iconBgColor,
}: SettingsItemProps) {
  const textColor = destructive ? Colors.danger : Colors.textDark;
  const defaultIconColor = destructive ? Colors.danger : Colors.textGrey;
  const defaultIconBg = destructive ? Colors.dangerSoft : Colors.greyBg;
  
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.settingsItem,
        pressed && styles.settingsItemPressed,
      ]}
    >
      <View style={[styles.settingsIconContainer, { backgroundColor: iconBgColor || defaultIconBg }]}>
        <Icon name={icon} size={20} color={iconColor || defaultIconColor} />
      </View>
      <View style={styles.settingsItemContent}>
        <Text style={[styles.settingsItemLabel, { color: textColor }]}>{label}</Text>
        {subtitle && (
          <Text style={styles.settingsItemSubtitle}>{subtitle}</Text>
        )}
      </View>
      {showChevron && (
        <Icon name="chevron-right" size={20} color={Colors.greyLight} />
      )}
    </Pressable>
  );
}

interface SettingsSectionProps {
  title?: string;
  children: React.ReactNode;
}

function SettingsSection({ title, children }: SettingsSectionProps) {
  return (
    <View style={styles.section}>
      {title && <Text style={styles.sectionTitle}>{title}</Text>}
      <View style={styles.sectionContent}>
        {children}
      </View>
    </View>
  );
}

export default function SettingsScreen() {
  const { mutateAsync: logout } = useLogout();
  const { data: me } = useQuery<User>({
    queryKey: ['/auth/me'],
    retry: 0,
  });

  const { setActiveTab, setNavigationMode } = useNavigation();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    setActiveTab('settings');
    setNavigationMode('shell');
  }, []);

  const isAdmin = me?.role === 'admin';

  const handleEditProfile = () => {
    router.push('/editProfile');
  };

  const handleManageUsers = () => {
    router.push('/users');
  };

  const handleLogout = async () => {
    await logout();
  };

  if (!me) {
    return null;
  }

  return (
    <View style={styles.container}>
      <PageHeader
        title="Settings"
        level="portfolio"
      />

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 }
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileSection}>
          <Avatar 
            name={me.name} 
            size="lg"
            backgroundColor={Colors.greenSoft}
          />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{me.name}</Text>
            <Text style={styles.profileUsername}>{me.user_name}</Text>
            <Text style={styles.profileAuthNote}>
              {me.has_google ? 'Registered with Google' : 'Registered with password'}
            </Text>
            {isAdmin && (
              <View style={styles.adminBadge}>
                <Icon name="shield-check" size={12} color={Colors.green} />
                <Text style={styles.adminBadgeText}>Admin</Text>
              </View>
            )}
          </View>
        </View>

        <SettingsSection title="ACCOUNT">
          <SettingsItem
            icon="account-edit-outline"
            label="Edit Profile"
            subtitle="Update your name and details"
            onPress={handleEditProfile}
            iconColor={Colors.green}
            iconBgColor={Colors.greenSoft}
          />
          {me.has_password && (
            <SettingsItem
              icon="lock-outline"
              label="Change Password"
              subtitle="Update your password"
              onPress={() => router.push('/changePassword')}
              iconColor={Colors.yellow}
              iconBgColor={Colors.yellowSoft}
            />
          )}
        </SettingsSection>

        <SettingsSection title="BILLING">
          <SettingsItem
            icon="lightning-bolt"
            label="Usage & Billing"
            subtitle="Credits, plan, and usage history"
            onPress={() => router.push('/billing')}
            iconColor={Colors.orange}
            iconBgColor={Colors.orangeSoft}
          />
          <SettingsItem
            icon="cart-outline"
            label="Buy Credits"
            subtitle="Purchase additional AI credits"
            onPress={() => router.push('/buyCredits')}
            iconColor={Colors.yellow}
            iconBgColor={Colors.yellowSoft}
          />
        </SettingsSection>

        {isAdmin && (
          <SettingsSection title="ADMINISTRATION">
            <SettingsItem
              icon="account-group-outline"
              label="Manage Users"
              subtitle="Add, edit, or remove users"
              onPress={handleManageUsers}
              iconColor={Colors.orange}
              iconBgColor={Colors.orangeSoft}
            />
          </SettingsSection>
        )}

        <SettingsSection title="SUPPORT">
          <SettingsItem 
            icon="help-circle-outline"
            label="Help & FAQ"
            onPress={() => {}}
          />
          <SettingsItem 
            icon="file-document-outline"
            label="Privacy Policy"
            onPress={() => {}}
          />
          <SettingsItem 
            icon="file-check-outline"
            label="Terms of Service"
            onPress={() => {}}
          />
        </SettingsSection>

        <SettingsSection>
          <SettingsItem 
            icon="logout"
            label="Log Out"
            onPress={handleLogout}
            showChevron={false}
            destructive
          />
        </SettingsSection>

        {Platform.OS !== 'web' && (
          <Text style={styles.version}>Version {nativeApplicationVersion}</Text>
        )}
      </ScrollView>
    </View>
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
    paddingTop: Spacing.lg,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radii.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    ...Shadows.card,
  },
  profileInfo: {
    flex: 1,
    marginLeft: Spacing.lg,
  },
  profileName: {
    fontSize: Typography.fontSize.title,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textDark,
  },
  profileUsername: {
    fontSize: Typography.fontSize.body2,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textGrey,
    marginTop: Spacing.xxs,
  },
  profileAuthNote: {
    fontSize: Typography.fontSize.caption,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textMuted,
    marginTop: Spacing.xxs,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.greenSoft,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs,
    borderRadius: Radii.pill,
    alignSelf: 'flex-start',
    marginTop: Spacing.xs,
    gap: 4,
  },
  adminBadgeText: {
    fontSize: Typography.fontSize.caption,
    fontFamily: Typography.fontFamily.bodySemiBold,
    color: Colors.green,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bodySemiBold,
    color: Colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  sectionContent: {
    backgroundColor: Colors.white,
    borderRadius: Radii.xl,
    overflow: 'hidden',
    ...Shadows.card,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.greyBg,
  },
  settingsItemPressed: {
    backgroundColor: Colors.greyBg,
  },
  settingsIconContainer: {
    width: 36,
    height: 36,
    borderRadius: Radii.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  settingsItemContent: {
    flex: 1,
  },
  settingsItemLabel: {
    fontSize: Typography.fontSize.body1,
    fontFamily: Typography.fontFamily.bodyMedium,
    color: Colors.textDark,
  },
  settingsItemSubtitle: {
    fontSize: Typography.fontSize.caption,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textGrey,
    marginTop: 2,
  },
  version: {
    fontSize: Typography.fontSize.caption,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.lg,
  },
});
