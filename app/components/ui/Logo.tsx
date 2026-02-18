import React from 'react';
import { View, Text, StyleSheet, TextStyle, ViewStyle } from 'react-native';
import { Colors, Typography } from '../../constants/DesignTokens';

type LogoSize = 'sm' | 'md' | 'lg' | 'xl';
type LogoVariant = 'light' | 'dark';
type LogoBackground = 'neutral' | 'green' | 'yellow' | 'orange';

interface LogoProps {
  size?: LogoSize;
  variant?: LogoVariant;
  background?: LogoBackground;
  style?: ViewStyle;
  showTagline?: boolean;
  tagline?: string;
}

const sizeConfig: Record<LogoSize, { fontSize: number; dotSize: number }> = {
  sm: { fontSize: 20, dotSize: 6 },
  md: { fontSize: 28, dotSize: 8 },
  lg: { fontSize: 36, dotSize: 10 },
  xl: { fontSize: 48, dotSize: 14 },
};

export function Logo({ size = 'md', variant = 'light', background = 'neutral', style, showTagline = false, tagline }: LogoProps) {
  const config = sizeConfig[size];
  const isDark = variant === 'dark';
  
  const isColoredBackground = background === 'green' || background === 'yellow' || background === 'orange';
  const useWhiteMonochrome = background === 'green' || background === 'orange';
  const useBlackMonochrome = background === 'yellow';
  
  const getTextColor = () => {
    if (useWhiteMonochrome) return 'rgba(255,255,255,0.9)';
    if (useBlackMonochrome) return 'rgba(0,0,0,0.55)';
    return isDark ? Colors.white : Colors.textDark;
  };
  
  const getIColor = () => {
    if (useWhiteMonochrome) return 'rgba(0,0,0,0.45)';
    if (useBlackMonochrome) return 'rgba(255,255,255,0.85)';
    return Colors.green;
  };
  
  const getDotColor = () => {
    if (useWhiteMonochrome) return 'rgba(0,0,0,0.45)';
    if (useBlackMonochrome) return 'rgba(255,255,255,0.85)';
    return Colors.orange;
  };
  
  const getTaglineColor = () => {
    if (useWhiteMonochrome) return 'rgba(255,255,255,0.95)';
    if (useBlackMonochrome) return 'rgba(0,0,0,0.95)';
    return isDark ? 'rgba(255,255,255,0.7)' : Colors.textGrey;
  };
  
  const textStyle: TextStyle = {
    fontSize: config.fontSize,
    fontFamily: Typography.fontFamily.bold,
    color: getTextColor(),
  };

  const iStyle: TextStyle = {
    color: getIColor(),
  };

  const dotStyle: TextStyle = {
    color: getDotColor(),
  };

  const taglineStyle: TextStyle = {
    fontFamily: Typography.fontFamily.regular,
    color: getTaglineColor(),
    marginTop: 4,
    fontSize: config.fontSize * 0.4,
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.logoRow}>
        <Text style={textStyle}>
          wot
          <Text style={iStyle}>i</Text>
          got
          <Text style={dotStyle}>.</Text>
        </Text>
      </View>
      {showTagline && tagline && (
        <Text style={taglineStyle}>
          {tagline}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
});
