import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { Colors, Spacing, Typography, Radii } from '@/constants/DesignTokens';
import { Durations, Easings, SpringConfigs } from '@/constants/MotionContract';
import { Icon, MaterialIconName } from './Icon';
import { PrimaryButton } from './PrimaryButton';
import { SecondaryButton } from './SecondaryButton';

interface ConfirmationModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmIcon?: MaterialIconName;
  variant?: 'default' | 'destructive';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmationModal({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmIcon,
  variant = 'default',
  onConfirm,
  onCancel,
}: ConfirmationModalProps) {
  const isDestructive = variant === 'destructive';
  const [shouldRender, setShouldRender] = useState(visible);
  
  const backdropOpacity = useSharedValue(0);
  const modalScale = useSharedValue(0.9);
  const modalOpacity = useSharedValue(0);
  const modalTranslateY = useSharedValue(20);

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      backdropOpacity.value = withTiming(1, {
        duration: Durations.fast,
        easing: Easings.emphasizedDecelerate,
      });
      modalOpacity.value = withTiming(1, {
        duration: Durations.normal,
        easing: Easings.emphasizedDecelerate,
      });
      modalScale.value = withSpring(1, SpringConfigs.gentle);
      modalTranslateY.value = withSpring(0, SpringConfigs.gentle);
    } else {
      backdropOpacity.value = withTiming(0, {
        duration: Durations.fast,
        easing: Easings.emphasizedAccelerate,
      });
      modalOpacity.value = withTiming(0, {
        duration: Durations.fast,
        easing: Easings.emphasizedAccelerate,
      });
      modalScale.value = withTiming(0.9, {
        duration: Durations.fast,
        easing: Easings.emphasizedAccelerate,
      });
      modalTranslateY.value = withTiming(20, {
        duration: Durations.fast,
        easing: Easings.emphasizedAccelerate,
      }, (finished) => {
        if (finished) {
          runOnJS(setShouldRender)(false);
        }
      });
    }
  }, [visible]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const modalStyle = useAnimatedStyle(() => ({
    opacity: modalOpacity.value,
    transform: [
      { scale: modalScale.value },
      { translateY: modalTranslateY.value },
    ],
  }));

  if (!shouldRender) return null;

  return (
    <Modal
      visible={shouldRender}
      transparent
      animationType="none"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <View style={styles.container}>
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />
        </Animated.View>
        
        <Animated.View style={[styles.modal, modalStyle]}>
          <View style={styles.iconContainer}>
            <View style={[
              styles.iconCircle,
              isDestructive ? styles.iconCircleDestructive : styles.iconCircleDefault
            ]}>
              <Icon 
                name={isDestructive ? 'trash-can-outline' : 'help-circle-outline'} 
                size={32} 
                color={isDestructive ? Colors.danger : Colors.orange} 
              />
            </View>
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.actions}>
            <SecondaryButton
              label={cancelLabel}
              onPress={onCancel}
              fullWidth
            />
            {isDestructive ? (
              <Pressable
                style={({ pressed }) => [
                  styles.destructiveButton,
                  pressed && styles.destructiveButtonPressed,
                ]}
                onPress={onConfirm}
              >
                {confirmIcon && <Icon name={confirmIcon} size={20} color={Colors.white} />}
                <Text style={styles.destructiveButtonText}>{confirmLabel}</Text>
              </Pressable>
            ) : (
              <PrimaryButton
                label={confirmLabel}
                icon={confirmIcon}
                onPress={onConfirm}
                fullWidth
              />
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modal: {
    backgroundColor: Colors.white,
    borderRadius: Radii.xxl,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: Spacing.lg,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircleDefault: {
    backgroundColor: Colors.orangeSoft,
  },
  iconCircleDestructive: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  title: {
    fontSize: Typography.fontSize.title,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textDark,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  message: {
    fontSize: Typography.fontSize.body2,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textGrey,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: Typography.fontSize.body2 * 1.5,
  },
  actions: {
    width: '100%',
    gap: Spacing.sm,
  },
  destructiveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.danger,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radii.lg,
    width: '100%',
  },
  destructiveButtonPressed: {
    opacity: 0.8,
  },
  destructiveButtonText: {
    fontSize: Typography.fontSize.body1,
    fontFamily: Typography.fontFamily.bodySemiBold,
    color: Colors.white,
  },
});
