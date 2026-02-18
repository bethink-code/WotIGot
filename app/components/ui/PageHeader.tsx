import React from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { Colors, Radii, Typography, Spacing } from '../../constants/DesignTokens';
import { MaterialIconName } from './Icon';
import { IconButton } from './IconButton';
import { HierarchyLevel } from './types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  level?: HierarchyLevel;
  onBackPress?: () => void;
  actionIcon?: MaterialIconName;
  onActionPress?: () => void;
  secondaryActionIcon?: MaterialIconName;
  onSecondaryActionPress?: () => void;
  tertiaryActionIcon?: MaterialIconName;
  onTertiaryActionPress?: () => void;
  testID?: string;
}

const getLevelColor = (level: HierarchyLevel = 'portfolio') => {
  switch (level) {
    case 'portfolio':
      return Colors.green;
    case 'property':
      return Colors.yellow;
    case 'room':
      return Colors.orange;
  }
};

const getTextColor = (level: HierarchyLevel = 'portfolio') => {
  switch (level) {
    case 'portfolio':
    case 'property':
    case 'room':
      return Colors.white;
  }
};

export function PageHeader({
  title,
  subtitle,
  level = 'portfolio',
  onBackPress,
  actionIcon,
  onActionPress,
  secondaryActionIcon,
  onSecondaryActionPress,
  tertiaryActionIcon,
  onTertiaryActionPress,
  testID,
}: PageHeaderProps) {
  const insets = useSafeAreaInsets();
  const bgColor = getLevelColor(level);
  const textColor = getTextColor(level);

  return (
    <View 
      style={[
        styles.container, 
        { 
          backgroundColor: bgColor,
          paddingTop: insets.top,
        }
      ]}
      testID={testID}
    >
      <StatusBar barStyle="light-content" />
      
      <View style={styles.toolbar}>
        <View style={styles.leftActions}>
          {onBackPress && (
            <IconButton 
              icon="arrow-left" 
              onPress={onBackPress} 
              iconColor={Colors.white}
              testID={testID ? `${testID}-back` : undefined}
            />
          )}
        </View>

        <View style={styles.rightActions}>
          {tertiaryActionIcon && onTertiaryActionPress && (
            <IconButton 
              icon={tertiaryActionIcon} 
              onPress={onTertiaryActionPress} 
              variant="transparent"
              iconColor={Colors.white}
              testID={testID ? `${testID}-tertiary-action` : undefined}
            />
          )}
          {secondaryActionIcon && onSecondaryActionPress && (
            <IconButton 
              icon={secondaryActionIcon} 
              onPress={onSecondaryActionPress} 
              variant="transparent"
              iconColor={Colors.white}
              testID={testID ? `${testID}-secondary-action` : undefined}
            />
          )}
          {actionIcon && onActionPress && (
            <IconButton 
              icon={actionIcon} 
              onPress={onActionPress} 
              variant="transparent"
              iconColor={Colors.white}
              testID={testID ? `${testID}-action` : undefined}
            />
          )}
        </View>
      </View>

      <View style={styles.content}>
        <Text style={[styles.title, { color: textColor }]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[styles.subtitle, { color: textColor, opacity: 0.9 }]}>
            {subtitle}
          </Text>
        )}
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
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  content: {
  },
  title: {
    fontSize: Typography.fontSize.headline,
    fontFamily: Typography.fontFamily.bold,
    lineHeight: Typography.fontSize.headline * Typography.lineHeight.tight,
  },
  subtitle: {
    fontSize: Typography.fontSize.body2,
    fontFamily: Typography.fontFamily.bodyRegular,
    marginTop: Spacing.xxs,
  },
});
