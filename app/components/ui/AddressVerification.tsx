import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Colors, Spacing, Typography, Radii } from '@/constants/DesignTokens';
import { TextInput } from './TextInput';
import { SecondaryButton } from './SecondaryButton';
import { SimpleCard } from './SimpleCard';
import { Icon } from './Icon';
import { Motion } from '@/constants/MotionContract';

export type AddressVerificationStatus = 'unverified' | 'verifying' | 'verified' | 'error';

interface AddressVerificationProps {
  address: string;
  onAddressChange: (address: string) => void;
  status: AddressVerificationStatus;
  onVerify: () => void;
  verifiedAddress?: string;
  errorMessage?: string;
  coordinates?: { lat: number; lng: number };
  onViewMap?: () => void;
}

export function AddressVerification({
  address,
  onAddressChange,
  status,
  onVerify,
  verifiedAddress,
  errorMessage,
  coordinates,
  onViewMap,
}: AddressVerificationProps) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (status === 'verifying') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(shimmerAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      shimmerAnim.setValue(0);
    }
  }, [status]);

  useEffect(() => {
    if (status === 'verified') {
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: Motion.duration.normal,
        useNativeDriver: true,
      }).start();
    } else {
      slideAnim.setValue(0);
    }
  }, [status]);

  const getStatusChip = () => {
    switch (status) {
      case 'unverified':
        return (
          <View style={[styles.chip, styles.chipUnverified]}>
            <Icon name="map-marker-question-outline" size={14} color={Colors.textGrey} />
            <Text style={[styles.chipText, styles.chipTextUnverified]}>Needs verification</Text>
          </View>
        );
      case 'verifying':
        return (
          <Animated.View 
            style={[
              styles.chip, 
              styles.chipVerifying,
              { opacity: shimmerAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.7, 1],
              })}
            ]}
          >
            <Icon name="map-marker-radius-outline" size={14} color={Colors.yellow} />
            <Text style={[styles.chipText, styles.chipTextVerifying]}>Verifying...</Text>
          </Animated.View>
        );
      case 'verified':
        return (
          <View style={[styles.chip, styles.chipVerified]}>
            <Icon name="map-marker-check-outline" size={14} color={Colors.yellow} />
            <Text style={[styles.chipText, styles.chipTextVerified]}>Address verified</Text>
          </View>
        );
      case 'error':
        return (
          <View style={[styles.chip, styles.chipError]}>
            <Icon name="map-marker-alert-outline" size={14} color={Colors.danger} />
            <Text style={[styles.chipText, styles.chipTextError]}>Not found</Text>
          </View>
        );
    }
  };

  const getHelperText = () => {
    switch (status) {
      case 'unverified':
        return 'Enter your address and verify to enable fraud protection';
      case 'verifying':
        return 'Looking up your address...';
      case 'verified':
        return null;
      case 'error':
        return errorMessage || 'Could not find this address. Please check and try again.';
    }
  };

  const helperText = getHelperText();

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <View style={styles.inputWrapper}>
          <TextInput
            placeholder="Address"
            value={address}
            onChangeText={(text) => {
              onAddressChange(text);
            }}
            autoCapitalize="words"
            editable={status !== 'verifying'}
          />
        </View>
        
        {(status === 'unverified' || status === 'error') && address.trim().length > 0 && (
          <SecondaryButton
            label="Verify"
            icon="crosshairs-gps"
            onPress={onVerify}
            fullWidth={false}
            compact
          />
        )}
        
        {status === 'verified' && (
          <SecondaryButton
            label="Re-verify"
            icon="refresh"
            onPress={onVerify}
            fullWidth={false}
            compact
          />
        )}
      </View>
      
      <View style={styles.statusRow}>
        {getStatusChip()}
        {helperText && (
          <Text style={[
            styles.helperText,
            status === 'error' && styles.helperTextError
          ]}>
            {helperText}
          </Text>
        )}
      </View>

      {status === 'verified' && verifiedAddress && (
        <Animated.View 
          style={[
            styles.verifiedCard,
            {
              opacity: slideAnim,
              transform: [{
                translateY: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [10, 0],
                })
              }]
            }
          ]}
        >
          <SimpleCard
            title={verifiedAddress}
            subtitle="Coordinates stored securely"
            icon="map-marker-check-outline"
            level="portfolio"
            actionLabel={onViewMap ? "View on map" : undefined}
            onActionPress={onViewMap}
          />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.xs,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  inputWrapper: {
    flex: 1,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flexWrap: 'wrap',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Spacing.xxs,
    paddingVertical: Spacing.xxs,
    paddingHorizontal: Spacing.xs,
    borderRadius: Radii.xs,
  },
  chipUnverified: {
    backgroundColor: Colors.greyBg,
  },
  chipVerifying: {
    backgroundColor: Colors.yellowSoft,
  },
  chipVerified: {
    backgroundColor: Colors.yellowSoft,
  },
  chipError: {
    backgroundColor: '#FFEBEE',
  },
  chipText: {
    fontSize: Typography.fontSize.caption,
    fontFamily: Typography.fontFamily.bodySemiBold,
  },
  chipTextUnverified: {
    color: Colors.textGrey,
  },
  chipTextVerifying: {
    color: Colors.yellow,
  },
  chipTextVerified: {
    color: Colors.yellow,
  },
  chipTextError: {
    color: Colors.danger,
  },
  helperText: {
    fontSize: Typography.fontSize.caption,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textMuted,
    marginLeft: Spacing.xxs,
  },
  helperTextError: {
    color: Colors.danger,
  },
  verifiedCard: {
    // Card takes full width
  },
});
