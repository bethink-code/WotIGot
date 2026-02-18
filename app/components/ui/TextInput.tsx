import React, { useState, useRef } from 'react';
import { View, TextInput as RNTextInput, StyleSheet, Animated, Easing, TextInputProps as RNTextInputProps } from 'react-native';
import { Colors, Radii, Typography, Spacing } from '../../constants/DesignTokens';
import { Motion } from '../../constants/MotionContract';

interface TextInputProps extends Omit<RNTextInputProps, 'style'> {
  placeholder?: string;
  secureTextEntry?: boolean;
  style?: object;
}

export function TextInput({
  placeholder,
  secureTextEntry = false,
  style,
  ...props
}: TextInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const borderAnim = useRef(new Animated.Value(0)).current;

  const handleFocus = () => {
    setIsFocused(true);
    Animated.timing(borderAnim, {
      toValue: 1,
      duration: Motion.duration.fast,
      easing: Easing.bezier(0.2, 0, 0, 1),
      useNativeDriver: false,
    }).start();
  };

  const handleBlur = () => {
    setIsFocused(false);
    Animated.timing(borderAnim, {
      toValue: 0,
      duration: Motion.duration.fast,
      easing: Easing.bezier(0.2, 0, 0, 1),
      useNativeDriver: false,
    }).start();
  };

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(0,0,0,0.05)', Colors.green],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        { borderColor },
        style,
      ]}
    >
      <RNTextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={Colors.textMuted}
        secureTextEntry={secureTextEntry}
        selectionColor={Colors.green}
        onFocus={handleFocus}
        onBlur={handleBlur}
        {...props}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: Radii.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  input: {
    fontSize: Typography.fontSize.subhead,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textDark,
    padding: 0,
    // @ts-ignore - Web-specific style to remove browser focus outline
    outlineStyle: 'none',
  },
});
