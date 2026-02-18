import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Image, ScrollView, KeyboardAvoidingView, Platform, Text, Pressable } from 'react-native';
import Animated from 'react-native-reanimated';
import { router, useLocalSearchParams } from 'expo-router';
import { ImagePickerAsset } from 'expo-image-picker';
import { PageHeader } from '@/components/ui/PageHeader';
import { TextInput } from '@/components/ui/TextInput';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { Icon } from '@/components/ui/Icon';
import { AnalyzingOverlay } from '@/components/ui/AnalyzingOverlay';
import { Colors, Spacing, Typography, Radii } from '@/constants/DesignTokens';
import { RecognitionResult } from '@/types/recognitionResult';
import {
  useReRecognize,
  useCreateItem,
  useUploadMedia,
} from '@/lib/mutations';
import { useRooms, useHouses } from '@/lib/queries';
import { getLocation } from '@/utils/getLocation';
import { Room } from '@/types/room';
import { useSharedAxisTransition } from '@/hooks/useSharedAxisTransition';

interface AddItemFormStepProps {
  image: ImagePickerAsset;
  data: RecognitionResult;
}

export default function AddItemFormStep({ image, data }: AddItemFormStepProps) {
  const { room_id } = useLocalSearchParams();
  const { screenAnimatedStyle, animatedBack } = useSharedAxisTransition();
  
  const [selectedRoomId, setSelectedRoomId] = useState<number | undefined>(
    room_id ? Number(room_id) : undefined
  );
  const [showRoomPicker, setShowRoomPicker] = useState(false);

  const [category, setCategory] = useState(data.category || '');
  const [brand, setBrand] = useState(data.brand || '');
  const [model, setModel] = useState(data.model || '');
  const [price, setPrice] = useState(data.price?.toString() || '');
  const [amount, setAmount] = useState(data.amount?.toString() || '1');
  const [serialNumber, setSerialNumber] = useState('');
  const [priceType, setPriceType] = useState<'AI' | 'user'>('AI');

  const [originalValues, setOriginalValues] = useState({
    brand: data.brand || '',
    model: data.model || '',
    category: data.category || '',
    price: data.price,
  });

  const { data: rooms = [] } = useRooms();
  const { data: houses = [] } = useHouses();
  const { isPending: isAskingPrice, mutateAsync: reRecognize } = useReRecognize();
  const { mutateAsync: createItem, isPending } = useCreateItem();
  const { mutateAsync: uploadMedia, isPending: isUploadingMedia } = useUploadMedia();

  const selectedRoom = rooms.find((r: Room) => r.id === selectedRoomId);
  const selectedHouse = selectedRoom ? houses.find((h: any) => h.id === selectedRoom.house_id) : null;
  const isLoading = isPending || isUploadingMedia;
  const isValid = category.trim().length > 0 && brand.trim().length > 0 && model.trim().length > 0 && selectedRoomId !== undefined;

  useEffect(() => {
    if (room_id) {
      setSelectedRoomId(Number(room_id));
    }
  }, [room_id]);

  useEffect(() => {
    setCategory(data.category || '');
    setBrand(data.brand || '');
    setModel(data.model || '');
    setPrice(data.price?.toString() || '');
    setAmount(data.amount?.toString() || '1');
    setPriceType('AI');
    setOriginalValues({
      brand: data.brand || '',
      model: data.model || '',
      category: data.category || '',
      price: data.price,
    });
  }, [data]);

  const handlePriceChange = (value: string) => {
    setPrice(value);
    setPriceType('user');
  };

  const handleSearchPrice = async () => {
    const result = await reRecognize({
      image,
      brand,
      model,
      category,
      originalBrand: originalValues.brand,
      originalModel: originalValues.model,
      originalCategory: originalValues.category,
      originalPrice: originalValues.price,
    });
    if (result.price) {
      setPrice(result.price.toString());
      setPriceType('AI');
    }
  };

  const handleSubmit = async () => {
    if (!isValid || isLoading || !selectedRoomId) return;

    try {
      const location = await getLocation();

      let mediaResult;
      if (image) {
        mediaResult = await uploadMedia(image);
      }

      await createItem({
        room_id: selectedRoomId,
        category: category.trim(),
        brand: brand.trim(),
        model: model.trim(),
        price: price ? Number(price) : undefined,
        price_type: priceType,
        amount: Number(amount) || 1,
        serial_number: serialNumber.trim() || undefined,
        image: mediaResult?.url,
        location_lat: location?.coords.latitude,
        location_long: location?.coords.longitude,
      });

      router.navigate({ pathname: '/room', params: { room_id: selectedRoomId } });
    } catch (error) {
      console.error('Failed to create item:', error);
    }
  };

  const handleBack = () => {
    animatedBack();
  };

  const getRoomDisplayName = (room: Room) => {
    const house = houses.find((h: any) => h.id === room.house_id);
    return house ? `${room.name} • ${house.name}` : room.name;
  };

  return (
    <Animated.View style={[styles.animatedContainer, screenAnimatedStyle]}>
      <View style={styles.container}>
        <PageHeader
          title="Review Item"
          subtitle={selectedRoom ? `Adding to ${selectedRoom.name}` : 'Select a room'}
          level="room"
          onBackPress={handleBack}
        />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.imageSection}>
            <Image source={{ uri: image.uri }} style={styles.image} />
            <View style={styles.aiChip}>
              <Icon name="creation" size={14} color={Colors.orange} />
              <Text style={styles.aiChipText}>AI Detected</Text>
            </View>
          </View>

          <View style={styles.form}>
            <View style={styles.sectionLabel}>
              <Text style={styles.label}>LOCATION</Text>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.roomSelector,
                pressed && styles.roomSelectorPressed,
              ]}
              onPress={() => setShowRoomPicker(!showRoomPicker)}
            >
              <View style={styles.roomSelectorIcon}>
                <Icon
                  name="floor-plan"
                  size={20}
                  color={selectedRoom ? Colors.orange : Colors.textMuted}
                />
              </View>
              <View style={styles.roomSelectorTextContainer}>
                <Text style={[
                  styles.roomSelectorText,
                  !selectedRoom && styles.roomSelectorPlaceholder,
                ]}>
                  {selectedRoom?.name || 'Select room'}
                </Text>
                {selectedHouse && (
                  <Text style={styles.roomSelectorSubtext}>
                    in {selectedHouse.name}
                  </Text>
                )}
              </View>
              <Icon
                name={showRoomPicker ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={Colors.textMuted}
              />
            </Pressable>

            {showRoomPicker && (
              <View style={styles.roomList}>
                {rooms.length === 0 ? (
                  <View style={styles.emptyRoomList}>
                    <Text style={styles.emptyRoomText}>No rooms available</Text>
                    <Text style={styles.emptyRoomHint}>Add a property and room first</Text>
                  </View>
                ) : (
                  rooms.map((room: Room) => {
                    const isSelected = room.id === selectedRoomId;
                    return (
                      <Pressable
                        key={room.id}
                        style={({ pressed }) => [
                          styles.roomItem,
                          isSelected && styles.roomItemSelected,
                          pressed && styles.roomItemPressed,
                        ]}
                        onPress={() => {
                          setSelectedRoomId(room.id);
                          setShowRoomPicker(false);
                        }}
                      >
                        <View style={[
                          styles.roomItemIcon,
                          isSelected && styles.roomItemIconSelected,
                        ]}>
                          <Icon
                            name="floor-plan"
                            size={18}
                            color={isSelected ? Colors.orange : Colors.textGrey}
                          />
                        </View>
                        <View style={styles.roomItemTextContainer}>
                          <Text style={[
                            styles.roomItemText,
                            isSelected && styles.roomItemTextSelected,
                          ]}>
                            {room.name}
                          </Text>
                          <Text style={styles.roomItemSubtext}>
                            {houses.find((h: any) => h.id === room.house_id)?.name || ''}
                          </Text>
                        </View>
                        {isSelected && (
                          <Icon name="check" size={20} color={Colors.orange} />
                        )}
                      </Pressable>
                    );
                  })
                )}
              </View>
            )}

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
            />

            <View style={styles.sectionLabel}>
              <Text style={styles.label}>VALUE</Text>
            </View>

            <View style={styles.priceRow}>
              <View style={styles.priceInputContainer}>
                <Text style={styles.currencyPrefix}>R</Text>
                <TextInput
                  placeholder="Price"
                  value={price}
                  onChangeText={handlePriceChange}
                  keyboardType="numeric"
                  style={styles.priceInput}
                />
                <View style={[
                  styles.valueSourceChip,
                  priceType === 'AI' ? styles.valueSourceChipAi : styles.valueSourceChipEntered
                ]}>
                  {priceType === 'AI' && <Icon name="star-four-points-outline" size={12} color={Colors.orange} />}
                  {priceType === 'user' && <Icon name="pencil-outline" size={12} color={Colors.textGrey} />}
                  <Text style={[
                    styles.valueSourceChipText,
                    priceType === 'AI' ? styles.valueSourceChipTextAi : styles.valueSourceChipTextEntered
                  ]}>
                    {priceType === 'AI' ? 'AI estimate' : 'Your value'}
                  </Text>
                </View>
              </View>
              <SecondaryButton
                label="New estimate"
                icon="star-four-points-outline"
                onPress={handleSearchPrice}
                fullWidth={false}
                compact
                disabled={isAskingPrice}
              />
            </View>

            <TextInput
              placeholder="Quantity"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />

            <View style={styles.sectionLabel}>
              <Text style={styles.label}>OPTIONAL</Text>
            </View>

            <TextInput
              placeholder="Serial number"
              value={serialNumber}
              onChangeText={setSerialNumber}
            />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <PrimaryButton
            label={isLoading ? 'Adding...' : 'Add Item'}
            onPress={handleSubmit}
            disabled={!isValid || isLoading}
            icon="check"
          />
        </View>
      </KeyboardAvoidingView>

      <AnalyzingOverlay
        visible={isAskingPrice}
        imageUri={image.uri}
        title="Re-estimating..."
        subtitle="AI is calculating a new price"
      />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  animatedContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.bgCanvas,
  },
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    paddingTop: Spacing.md,
  },
  imageSection: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  image: {
    width: 140,
    height: 105,
    borderRadius: Radii.lg,
  },
  aiChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xxs,
    backgroundColor: Colors.orangeSoft,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs,
    borderRadius: Radii.md,
    marginTop: Spacing.sm,
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
    marginTop: Spacing.sm,
    marginBottom: -Spacing.xs,
  },
  label: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.bodySemiBold,
    color: Colors.textMuted,
    letterSpacing: 0.8,
  },
  roomSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
    gap: Spacing.sm,
  },
  roomSelectorPressed: {
    backgroundColor: Colors.greyBg,
  },
  roomSelectorIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.orangeSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roomSelectorTextContainer: {
    flex: 1,
  },
  roomSelectorText: {
    fontSize: Typography.fontSize.subhead,
    fontFamily: Typography.fontFamily.bodyMedium,
    color: Colors.textDark,
  },
  roomSelectorSubtext: {
    fontSize: Typography.fontSize.caption,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textMuted,
    marginTop: 2,
  },
  roomSelectorPlaceholder: {
    color: Colors.textMuted,
  },
  roomList: {
    backgroundColor: Colors.white,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.greyBg,
    overflow: 'hidden',
  },
  roomItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  roomItemSelected: {
    backgroundColor: Colors.orangeSoft,
  },
  roomItemPressed: {
    backgroundColor: Colors.greyBg,
  },
  roomItemIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.greyBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roomItemIconSelected: {
    backgroundColor: Colors.orangeSoft,
  },
  roomItemTextContainer: {
    flex: 1,
  },
  roomItemText: {
    fontSize: Typography.fontSize.body2,
    fontFamily: Typography.fontFamily.bodyMedium,
    color: Colors.textDark,
  },
  roomItemTextSelected: {
    fontFamily: Typography.fontFamily.bodySemiBold,
  },
  roomItemSubtext: {
    fontSize: Typography.fontSize.caption,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textMuted,
    marginTop: 1,
  },
  emptyRoomList: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  emptyRoomText: {
    fontSize: Typography.fontSize.body2,
    fontFamily: Typography.fontFamily.bodyMedium,
    color: Colors.textDark,
  },
  emptyRoomHint: {
    fontSize: Typography.fontSize.caption,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textMuted,
    marginTop: Spacing.xxs,
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
