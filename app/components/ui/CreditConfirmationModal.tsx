import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Colors, Spacing, Typography, Radii } from '@/constants/DesignTokens';
import { Durations, Easings, SpringConfigs } from '@/constants/MotionContract';
import { Icon } from './Icon';
import { PrimaryButton } from './PrimaryButton';
import { SecondaryButton } from './SecondaryButton';

interface CreditConfirmationModalProps {
  visible: boolean;
  actionName: string;
  creditCost: number;
  currentBalance: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export function CreditConfirmationModal({
  visible,
  actionName,
  creditCost,
  currentBalance,
  onConfirm,
  onCancel,
}: CreditConfirmationModalProps) {
  const [shouldRender, setShouldRender] = useState(visible);
  const hasEnough = currentBalance >= creditCost;
  const remaining = currentBalance - creditCost;
  const usagePercent = Math.min((creditCost / Math.max(currentBalance, 1)) * 100, 100);

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
            <View style={styles.iconCircle}>
              <Icon name="lightning-bolt" size={32} color={Colors.orange} />
            </View>
          </View>

          <Text style={styles.title}>{actionName}</Text>
          <Text style={styles.message}>
            This action will use {creditCost} {creditCost === 1 ? 'credit' : 'credits'}.
          </Text>

          <View style={styles.balanceCard}>
            <View style={styles.balanceRow}>
              <Text style={styles.balanceLabel}>Current balance</Text>
              <Text style={styles.balanceValue}>{currentBalance} credits</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[
                styles.progressFill,
                { width: `${Math.max(100 - usagePercent, 0)}%` },
                !hasEnough && styles.progressFillDanger,
              ]} />
            </View>
            <View style={styles.balanceRow}>
              <Text style={styles.balanceLabel}>After this action</Text>
              <Text style={[
                styles.balanceValue,
                !hasEnough && styles.balanceValueDanger,
              ]}>
                {hasEnough ? `${remaining} credits` : 'Not enough'}
              </Text>
            </View>
          </View>

          <View style={styles.actions}>
            <SecondaryButton
              label="Cancel"
              onPress={onCancel}
              fullWidth
            />
            {hasEnough ? (
              <PrimaryButton
                label={`Use ${creditCost} ${creditCost === 1 ? 'Credit' : 'Credits'}`}
                icon="lightning-bolt"
                onPress={onConfirm}
                fullWidth
              />
            ) : (
              <PrimaryButton
                label="Get Credits"
                icon="cart-outline"
                onPress={onCancel}
                fullWidth
                variant="orange"
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
    backgroundColor: Colors.orangeSoft,
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
  balanceCard: {
    width: '100%',
    backgroundColor: Colors.greyBg,
    borderRadius: Radii.md,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: Typography.fontSize.caption,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textGrey,
  },
  balanceValue: {
    fontSize: Typography.fontSize.caption,
    fontFamily: Typography.fontFamily.bodySemiBold,
    color: Colors.textDark,
  },
  balanceValueDanger: {
    color: Colors.danger,
  },
  progressTrack: {
    height: 6,
    backgroundColor: Colors.greyBorder,
    borderRadius: 3,
    marginVertical: Spacing.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.green,
    borderRadius: 3,
  },
  progressFillDanger: {
    backgroundColor: Colors.danger,
  },
  actions: {
    width: '100%',
    gap: Spacing.sm,
  },
});
