import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing } from '../../constants/DesignTokens';
import { IconCircle } from './IconCircle';
import { MaterialIconName } from './Icon';
import { HierarchyLevel } from './types';

interface OnboardingSlideProps {
  icon: MaterialIconName;
  level?: HierarchyLevel;
  titleLine1: string;
  titleLine2: string;
  description: string;
  style?: object;
}

const getLevelAccentColor = (level: HierarchyLevel) => {
  switch (level) {
    case 'portfolio':
      return Colors.green;
    case 'property':
      return Colors.yellow;
    case 'room':
      return Colors.orange;
  }
};

export function OnboardingSlide({
  icon,
  level = 'portfolio',
  titleLine1,
  titleLine2,
  description,
  style,
}: OnboardingSlideProps) {
  const accentColor = getLevelAccentColor(level);

  return (
    <View style={[styles.container, style]}>
      <IconCircle icon={icon} level={level} size="lg" animated={true} />
      
      <View style={styles.textContainer}>
        <Text style={styles.title}>
          {titleLine1}
          {'\n'}
          <Text style={[styles.titleAccent, { color: accentColor }]}>
            {titleLine2}
          </Text>
        </Text>
        
        <Text style={styles.description}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  textContainer: {
    marginTop: Spacing.xxxl,
    alignItems: 'center',
  },
  title: {
    fontSize: 30,
    fontFamily: Typography.fontFamily.extraBold,
    color: Colors.textDark,
    textAlign: 'center',
    lineHeight: 36,
    letterSpacing: -1,
  },
  titleAccent: {
    fontSize: 30,
    fontFamily: Typography.fontFamily.extraBold,
    lineHeight: 36,
    letterSpacing: -1,
  },
  description: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bodyMedium,
    color: Colors.textGrey,
    textAlign: 'center',
    lineHeight: 24,
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
});
