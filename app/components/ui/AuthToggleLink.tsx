import React from 'react';
import { Text, StyleSheet, Pressable, View } from 'react-native';
import { Colors, Typography, Spacing } from '../../constants/DesignTokens';

interface AuthToggleLinkProps {
  message: string;
  linkText: string;
  onPress: () => void;
  style?: object;
}

export function AuthToggleLink({
  message,
  linkText,
  onPress,
  style,
}: AuthToggleLinkProps) {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.message}>
        {message}{' '}
        <Text style={styles.link} onPress={onPress}>
          {linkText}
        </Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  message: {
    fontSize: Typography.fontSize.body2,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textGrey,
  },
  link: {
    fontFamily: Typography.fontFamily.bodyBold,
    color: Colors.textDark,
    textDecorationLine: 'underline',
  },
});
