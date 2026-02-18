import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Text, Image, Alert } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  runOnJS,
  ReduceMotion,
} from 'react-native-reanimated';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/PageHeader';
import { TextInput } from '@/components/ui/TextInput';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { Icon } from '@/components/ui/Icon';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { AnalyzingOverlay } from '@/components/ui/AnalyzingOverlay';
import { Colors, Spacing, Typography, Radii } from '@/constants/DesignTokens';
import { Durations, Easings } from '@/constants/MotionContract';
import { useUpdateItem, useDeleteItem, useReEstimate } from '@/lib/mutations';
import { useNavigation } from '@/contexts/NavigationContext';
import { Item } from '@/types/item';
import { Room } from '@/types/room';
import { House } from '@/types/house';

export default function EditItemScreen() {
  const { id } = useLocalSearchParams();
  const itemId = Number(id);
  const { setNavigationMode } = useNavigation();

  const screenTranslateX = useSharedValue(300);
  const screenOpacity = useSharedValue(0);

  const screenAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: screenTranslateX.value }],
    opacity: screenOpacity.value,
  }));

  useFocusEffect(
    useCallback(() => {
      screenTranslateX.value = 300;
      screenOpacity.value = 0;
      screenTranslateX.value = withTiming(0, {
        duration: Durations.normal,
        easing: Easings.emphasized,
        reduceMotion: ReduceMotion.Never,
      });
      screenOpacity.value = withTiming(1, {
        duration: Durations.normal,
        easing: Easings.emphasized,
        reduceMotion: ReduceMotion.Never,
      });
    }, [])
  );

  const { data: item, isLoading: isLoadingItem } = useQuery<Item>({
    queryKey: [`/items/${itemId}`],
  });

  const { data: room } = useQuery<Room>({
    queryKey: [`/rooms/${item?.room_id}`],
    enabled: !!item?.room_id,
  });

  const { data: house } = useQuery<House>({
    queryKey: [`/houses/${item?.house_id}`],
    enabled: !!item?.house_id,
  });

  const [category, setCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [price, setPrice] = useState('');
  const [amount, setAmount] = useState('1');
  const [serialNumber, setSerialNumber] = useState('');
  const [priceType, setPriceType] = useState<'AI' | 'user' | 'invoice'>('user');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    setNavigationMode('form');
    return () => setNavigationMode('shell');
  }, []);

  useEffect(() => {
    if (item) {
      setCategory(item.category || '');
      setBrand(item.brand || '');
      setModel(item.model || '');
      setPrice(item.price?.toString() || '');
      setAmount(item.amount?.toString() || '1');
      setSerialNumber(item.serial_number || '');
      setPriceType(item.price_type || 'user');
    }
  }, [item]);

  const { mutateAsync: updateItem, isPending } = useUpdateItem();
  const { mutateAsync: deleteItem, isPending: isDeleting } = useDeleteItem();
  const { mutateAsync: reEstimate, isPending: isReEstimating } = useReEstimate();

  const isLoading = isPending || isDeleting || isReEstimating;
  const isValid = category.trim().length > 0;

  const handleSubmit = async () => {
    if (!isValid || isLoading || !item) return;

    try {
      await updateItem({
        id: itemId,
        category: category.trim(),
        brand: brand.trim() || undefined,
        model: model.trim() || undefined,
        price: price ? Number(price) : undefined,
        amount: amount ? Number(amount) : 1,
        serial_number: serialNumber.trim() || undefined,
        price_type: priceType,
      });

      item?.room_id 
        ? router.navigate({ pathname: '/(tabs)/room', params: { room_id: item.room_id } })
        : router.navigate('/');
    } catch (error) {
      console.error('Failed to update item:', error);
    }
  };

  const handleReEstimate = async () => {
    if (!itemId) return;
    
    try {
      const result = await reEstimate({
        itemId,
        brand: brand.trim() || undefined,
        model: model.trim() || undefined,
        category: category.trim() || undefined,
      });
      
      if (result.brand !== undefined) setBrand(result.brand);
      if (result.model !== undefined) setModel(result.model);
      if (result.category !== undefined) setCategory(result.category);
      if (result.price !== undefined) {
        setPrice(result.price.toString());
        setPriceType('AI');
      }
      if (result.amount !== undefined) setAmount(result.amount.toString());
    } catch (error) {
      console.error('Failed to re-estimate item:', error);
      if (Platform.OS === 'web') {
        window.alert('Failed to get AI estimate. Please try again.');
      } else {
        Alert.alert('Error', 'Failed to get AI estimate. Please try again.');
      }
    }
  };

  const handleDelete = async () => {
    if (item) {
      setShowDeleteModal(false);
      await deleteItem(item.id);
      router.navigate({ pathname: '/(tabs)/room', params: { room_id: item.room_id } });
    }
  };

  const navigateBack = useCallback(() => {
    router.back();
  }, []);

  const handleBack = useCallback(() => {
    screenOpacity.value = withTiming(0, {
      duration: Durations.normal,
      easing: Easings.emphasized,
      reduceMotion: ReduceMotion.Never,
    });
    screenTranslateX.value = withTiming(300, {
      duration: Durations.normal,
      easing: Easings.emphasized,
      reduceMotion: ReduceMotion.Never,
    }, () => {
      runOnJS(navigateBack)();
    });
  }, [navigateBack]);

  if (isLoadingItem) {
    return (
      <Animated.View style={[styles.container, screenAnimatedStyle]}>
        <PageHeader
          title="Loading..."
          level="room"
          onBackPress={handleBack}
        />
      </Animated.View>
    );
  }

  const breadcrumb = [room?.name, house?.name].filter(Boolean).join(' • ');

  const itemName = `${brand} ${model}`.trim() || category || 'this item';

  return (
    <Animated.View style={[styles.container, screenAnimatedStyle]}>
      <PageHeader
        title="Edit Item"
        subtitle={breadcrumb || room?.name}
        level="room"
        onBackPress={handleBack}
        actionIcon="trash-can-outline"
        onActionPress={() => setShowDeleteModal(true)}
      />

      <ConfirmationModal
        visible={showDeleteModal}
        title="Delete Item"
        message={`Are you sure you want to delete "${itemName}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        confirmIcon="trash-can-outline"
        variant="destructive"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
      />

      <AnalyzingOverlay
        visible={isReEstimating}
        imageUri={item?.image}
        title="Re-estimating..."
        subtitle="AI is calculating new value"
        steps={[
          { label: 'Reading your changes', status: 'complete' },
          { label: 'Analyzing specifications', status: 'active' },
          { label: 'Calculating new price', status: 'pending' },
        ]}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.formContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Image Preview with AI chip */}
          {item?.image && (
            <View style={styles.imagePreview}>
              <Image 
                source={{ uri: item.image }} 
                style={styles.image}
                resizeMode="cover"
              />
              {item.price_type === 'AI' && (
                <View style={styles.aiChip}>
                  <Icon name="star-four-points-outline" size={14} color={Colors.orange} />
                  <Text style={styles.aiChipText}>AI Detected</Text>
                </View>
              )}
            </View>
          )}

          <View style={styles.form}>
            {/* ITEM DETAILS Section */}
            <View style={styles.sectionLabel}>
              <Text style={styles.label}>ITEM DETAILS</Text>
            </View>
            
            <TextInput
              placeholder="Category"
              value={category}
              onChangeText={setCategory}
              autoCapitalize="words"
            />

            <TextInput
              placeholder="Brand"
              value={brand}
              onChangeText={setBrand}
              autoCapitalize="words"
            />

            <TextInput
              placeholder="Model"
              value={model}
              onChangeText={setModel}
              autoCapitalize="words"
            />

            <TextInput
              placeholder="Serial Number"
              value={serialNumber}
              onChangeText={setSerialNumber}
              autoCapitalize="characters"
            />

            <TextInput
              placeholder="Quantity"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />

            {/* VALUE Section */}
            <View style={styles.sectionLabel}>
              <Text style={styles.label}>VALUE</Text>
            </View>

            <View style={styles.priceRow}>
              <View style={styles.priceInputContainer}>
                <Text style={styles.currencyPrefix}>R</Text>
                <TextInput
                  placeholder="Price"
                  value={price}
                  onChangeText={(text) => {
                    setPrice(text);
                    setPriceType('user');
                  }}
                  keyboardType="numeric"
                  style={styles.priceInput}
                />
                <View style={[
                  styles.valueSourceChip,
                  priceType === 'AI' ? styles.valueSourceChipAi : styles.valueSourceChipEntered
                ]}>
                  {priceType === 'AI' && <Icon name="star-four-points-outline" size={12} color={Colors.orange} />}
                  {priceType === 'user' && <Icon name="pencil-outline" size={12} color={Colors.textGrey} />}
                  {priceType === 'invoice' && <Icon name="text-box-check-outline" size={12} color={Colors.textGrey} />}
                  <Text style={[
                    styles.valueSourceChipText,
                    priceType === 'AI' ? styles.valueSourceChipTextAi : styles.valueSourceChipTextEntered
                  ]}>
                    {priceType === 'AI' ? 'AI estimate' : priceType === 'invoice' ? 'Invoice' : 'Your value'}
                  </Text>
                </View>
              </View>
              <SecondaryButton
                label="New estimate"
                icon="star-four-points-outline"
                onPress={handleReEstimate}
                fullWidth={false}
                compact
                disabled={isReEstimating}
              />
            </View>

          </View>
        </ScrollView>

        <View style={styles.footer}>
          <PrimaryButton
            label={isLoading ? 'Saving...' : 'Save Changes'}
            onPress={handleSubmit}
            disabled={!isValid || isLoading}
            icon="check-circle-outline"
          />
        </View>
      </KeyboardAvoidingView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgCanvas,
  },
  flex: {
    flex: 1,
  },
  formContent: {
    padding: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  imagePreview: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 180,
    borderRadius: Radii.lg,
  },
  aiChip: {
    position: 'absolute',
    bottom: Spacing.sm,
    left: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.orangeSoft,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs,
    borderRadius: Radii.md,
  },
  aiChipText: {
    fontSize: Typography.fontSize.caption,
    fontFamily: Typography.fontFamily.bodySemiBold,
    color: Colors.orange,
  },
  form: {
    gap: Spacing.md,
  },
  sectionLabel: {
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  label: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.bodySemiBold,
    color: Colors.textMuted,
    letterSpacing: 0.8,
  },
  priceRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
  },
  priceInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: Spacing.lg,
    height: 56,
  },
  currencyPrefix: {
    fontSize: Typography.fontSize.subhead,
    fontFamily: Typography.fontFamily.bodySemiBold,
    color: Colors.textGrey,
    marginRight: Spacing.xs,
  },
  priceInput: {
    flex: 1,
    borderWidth: 0,
    borderRadius: 0,
    paddingHorizontal: 0,
    backgroundColor: 'transparent',
    height: 54,
  },
  valueSourceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs,
    borderRadius: Radii.pill,
    gap: 4,
    marginLeft: Spacing.xs,
  },
  valueSourceChipAi: {
    backgroundColor: Colors.orangeSoft,
  },
  valueSourceChipEntered: {
    backgroundColor: Colors.greyBg,
  },
  valueSourceChipText: {
    fontSize: Typography.fontSize.caption,
    fontFamily: Typography.fontFamily.bodySemiBold,
  },
  valueSourceChipTextAi: {
    color: Colors.orange,
  },
  valueSourceChipTextEntered: {
    color: Colors.textGrey,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    paddingBottom: Spacing.xxl,
    backgroundColor: Colors.bgCanvas,
  },
});
