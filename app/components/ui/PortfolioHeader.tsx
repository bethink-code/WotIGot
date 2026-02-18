import React from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { Colors, Radii, Typography, Spacing } from '../../constants/DesignTokens';
import { Logo } from './Logo';
import { Avatar } from './Avatar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface PortfolioHeaderProps {
  portfolioValue: string;
  userName?: string;
  userImage?: string | null;
  onAvatarPress?: () => void;
  testID?: string;
}

export function PortfolioHeader({
  portfolioValue,
  userName,
  userImage,
  onAvatarPress,
  testID,
}: PortfolioHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View 
      style={[
        styles.container, 
        { 
          backgroundColor: Colors.green,
          paddingTop: insets.top,
        }
      ]}
      testID={testID}
    >
      <StatusBar barStyle="light-content" />
      
      <View style={styles.toolbar}>
        <Logo size="md" background="green" />
        <Avatar 
          source={userImage}
          name={userName}
          size="md"
          onPress={onAvatarPress}
          backgroundColor="rgba(255,255,255,0.25)"
        />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{portfolioValue}</Text>
        <Text style={styles.subtitle}>Total Portfolio Value</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.xxxl,
    paddingBottom: Spacing.xxl,
    borderBottomLeftRadius: Radii.xxxl,
    borderBottomRightRadius: Radii.xxxl,
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
  content: {
  },
  title: {
    fontSize: Typography.fontSize.hero,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
    lineHeight: Typography.fontSize.hero * Typography.lineHeight.tight,
  },
  subtitle: {
    fontSize: Typography.fontSize.body2,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.white,
    opacity: 0.9,
    marginTop: Spacing.xxs,
  },
});
