import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, Pressable, ScrollView } from 'react-native';
import { PageHeader } from '@/components/ui/PageHeader';
import { TextInput } from '@/components/ui/TextInput';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { ImagePicker } from '@/components/ui/ImagePicker';
import { Icon, MaterialIconName } from '@/components/ui/Icon';
import { AddressVerification, AddressVerificationStatus } from '@/components/ui/AddressVerification';
import { AnalyzingOverlay } from '@/components/ui/AnalyzingOverlay';
import { useMockGeocodeAddress } from '@/hooks/useGeocodeAddress';
import { Colors, Spacing, Typography, Radii } from '@/constants/DesignTokens';

type DemoScreen = 'menu' | 'addProperty' | 'addRoom' | 'scanItem' | 'viewItem';

export default function AddScreensDemo() {
  const [currentScreen, setCurrentScreen] = useState<DemoScreen>('menu');
  const [propertyName, setPropertyName] = useState('');
  const [propertyAddress, setPropertyAddress] = useState('');
  const [roomName, setRoomName] = useState('');
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null);
  const [showPropertyPicker, setShowPropertyPicker] = useState(false);
  const [scanStep, setScanStep] = useState<'capture' | 'analyzing' | 'form'>('capture');
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [showRoomPicker, setShowRoomPicker] = useState(false);
  const [isAiEstimate, setIsAiEstimate] = useState(true);
  const [addressVerificationStatus, setAddressVerificationStatus] = useState<AddressVerificationStatus>('unverified');
  const [verifiedAddress, setVerifiedAddress] = useState<string | null>(null);
  const [addressCoordinates, setAddressCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  
  const geocode = useMockGeocodeAddress();

  useEffect(() => {
    if (geocode.status === 'loading') {
      setAddressVerificationStatus('verifying');
    } else if (geocode.status === 'success' && geocode.result) {
      setAddressVerificationStatus('verified');
      setVerifiedAddress(geocode.result.formattedAddress);
      setAddressCoordinates(geocode.result.coordinates);
    } else if (geocode.status === 'error') {
      setAddressVerificationStatus('error');
    }
  }, [geocode.status, geocode.result]);

  const mockProperties = [
    { id: '1', name: 'Beach House' },
    { id: '2', name: 'Mountain Cabin' },
    { id: '3', name: 'City Apartment' },
  ];

  const mockRooms = [
    { id: '1', name: 'Living Room', property: 'Beach House' },
    { id: '2', name: 'Master Bedroom', property: 'Beach House' },
    { id: '3', name: 'Kitchen', property: 'Mountain Cabin' },
  ];

  const resetAndGoBack = () => {
    setCurrentScreen('menu');
    setPropertyName('');
    setPropertyAddress('');
    setAddressVerificationStatus('unverified');
    setVerifiedAddress(null);
    setAddressCoordinates(null);
    geocode.reset();
    setRoomName('');
    setSelectedProperty(null);
    setShowPropertyPicker(false);
    setScanStep('capture');
    setSelectedRoom(null);
    setShowRoomPicker(false);
    setIsAiEstimate(true);
  };

  if (currentScreen === 'menu') {
    return (
      <View style={styles.container}>
        <View style={styles.menuHeader}>
          <Text style={styles.menuTitle}>Add Screens Demo</Text>
          <Text style={styles.menuSubtitle}>Preview the Tutti Frutti design system</Text>
        </View>

        <View style={styles.menuCards}>
          <Pressable
            style={({ pressed }) => [styles.menuCard, pressed && styles.menuCardPressed]}
            onPress={() => setCurrentScreen('addProperty')}
          >
            <View style={[styles.menuCardIcon, { backgroundColor: Colors.yellowSoft }]}>
              <Icon name="home-city-outline" size={28} color={Colors.yellow} />
            </View>
            <Text style={styles.menuCardTitle}>Add Property</Text>
            <Text style={styles.menuCardDesc}>Yellow header, name & address inputs</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.menuCard, pressed && styles.menuCardPressed]}
            onPress={() => setCurrentScreen('addRoom')}
          >
            <View style={[styles.menuCardIcon, { backgroundColor: Colors.orangeSoft }]}>
              <Icon name="view-grid-outline" size={28} color={Colors.orange} />
            </View>
            <Text style={styles.menuCardTitle}>Add Room</Text>
            <Text style={styles.menuCardDesc}>Orange header, property selector</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.menuCard, pressed && styles.menuCardPressed]}
            onPress={() => setCurrentScreen('scanItem')}
          >
            <View style={[styles.menuCardIcon, { backgroundColor: Colors.orangeSoft }]}>
              <Icon name="camera-outline" size={28} color={Colors.orange} />
            </View>
            <Text style={styles.menuCardTitle}>Scan Item</Text>
            <Text style={styles.menuCardDesc}>3-step flow: capture, analyze, review</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.menuCard, pressed && styles.menuCardPressed]}
            onPress={() => setCurrentScreen('viewItem')}
          >
            <View style={[styles.menuCardIcon, { backgroundColor: Colors.orangeSoft }]}>
              <Icon name="cube-outline" size={28} color={Colors.orange} />
            </View>
            <Text style={styles.menuCardTitle}>View Item</Text>
            <Text style={styles.menuCardDesc}>Item details with photos & value</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (currentScreen === 'addProperty') {
    return (
      <View style={styles.container}>
        <PageHeader
          title="Add Property"
          subtitle="Create a new property"
          level="property"
          onBackPress={resetAndGoBack}
        />
        <ScrollView style={styles.flex} contentContainerStyle={styles.formContent}>
          <View style={styles.form}>
            <View style={styles.sectionLabel}>
              <Text style={styles.label}>PROPERTY DETAILS</Text>
            </View>
            <TextInput
              placeholder="Property name"
              value={propertyName}
              onChangeText={setPropertyName}
              autoCapitalize="words"
            />
            <AddressVerification
              address={propertyAddress}
              onAddressChange={(text) => {
                setPropertyAddress(text);
                if (addressVerificationStatus !== 'unverified') {
                  setAddressVerificationStatus('unverified');
                  setVerifiedAddress(null);
                  setAddressCoordinates(null);
                  geocode.reset();
                }
              }}
              status={addressVerificationStatus}
              onVerify={() => geocode.geocode(propertyAddress)}
              verifiedAddress={verifiedAddress || undefined}
              errorMessage={geocode.error || undefined}
              coordinates={addressCoordinates || undefined}
              onViewMap={() => {
                console.log('View map for:', addressCoordinates);
              }}
            />
            <View style={styles.imageSection}>
              <ImagePicker
                value={null}
                onChange={() => {}}
                placeholder="Add cover photo"
              />
            </View>
          </View>
        </ScrollView>
        <View style={styles.footer}>
          {addressVerificationStatus !== 'verified' && propertyAddress.trim().length > 0 && (
            <Text style={styles.verificationRequiredText}>
              Address verification required before creating property
            </Text>
          )}
          <PrimaryButton
            label="Create Property"
            onPress={resetAndGoBack}
            disabled={!propertyName.trim() || addressVerificationStatus !== 'verified'}
            icon="check-circle-outline"
          />
        </View>
      </View>
    );
  }

  if (currentScreen === 'addRoom') {
    const selectedProp = mockProperties.find(p => p.id === selectedProperty);
    return (
      <View style={styles.container}>
        <PageHeader
          title="Add Room"
          subtitle={selectedProp ? `In ${selectedProp.name}` : 'Select a property'}
          level="room"
          onBackPress={resetAndGoBack}
        />
        <ScrollView style={styles.flex} contentContainerStyle={styles.formContent}>
          <View style={styles.form}>
            <View style={styles.sectionLabel}>
              <Text style={styles.label}>PROPERTY</Text>
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.selector,
                pressed && styles.selectorPressed,
              ]}
              onPress={() => setShowPropertyPicker(!showPropertyPicker)}
            >
              <View style={[styles.selectorIcon, { backgroundColor: Colors.yellowSoft }]}>
                <Icon
                  name="home-city-outline"
                  size={20}
                  color={selectedProp ? Colors.yellow : Colors.textMuted}
                />
              </View>
              <Text style={[
                styles.selectorText,
                !selectedProp && styles.selectorPlaceholder,
              ]}>
                {selectedProp?.name || 'Select property'}
              </Text>
              <Icon
                name={showPropertyPicker ? 'menu-up-outline' : 'menu-down-outline'}
                size={20}
                color={Colors.textMuted}
              />
            </Pressable>

            {showPropertyPicker && (
              <View style={styles.pickerList}>
                {mockProperties.map((prop) => {
                  const isSelected = prop.id === selectedProperty;
                  return (
                    <Pressable
                      key={prop.id}
                      style={({ pressed }) => [
                        styles.pickerItem,
                        isSelected && styles.pickerItemSelectedYellow,
                        pressed && styles.pickerItemPressed,
                      ]}
                      onPress={() => {
                        setSelectedProperty(prop.id);
                        setShowPropertyPicker(false);
                      }}
                    >
                      <View style={[
                        styles.pickerItemIcon,
                        isSelected && styles.pickerItemIconSelectedYellow,
                      ]}>
                        <Icon
                          name="home-city-outline"
                          size={18}
                          color={isSelected ? Colors.yellow : Colors.textGrey}
                        />
                      </View>
                      <Text style={[
                        styles.pickerItemText,
                        isSelected && styles.pickerItemTextSelected,
                      ]}>
                        {prop.name}
                      </Text>
                      {isSelected && (
                        <Icon name="check-circle-outline" size={20} color={Colors.yellow} />
                      )}
                    </Pressable>
                  );
                })}
              </View>
            )}

            <View style={styles.sectionLabel}>
              <Text style={styles.label}>ROOM DETAILS</Text>
            </View>
            <TextInput
              placeholder="Room name"
              value={roomName}
              onChangeText={setRoomName}
              autoCapitalize="words"
            />
            <View style={styles.imageSection}>
              <ImagePicker
                value={null}
                onChange={() => {}}
                placeholder="Add cover photo"
              />
            </View>
          </View>
        </ScrollView>
        <View style={styles.footer}>
          <PrimaryButton
            label="Create Room"
            onPress={resetAndGoBack}
            disabled={!roomName.trim() || !selectedProperty}
            icon="check-circle-outline"
          />
        </View>
      </View>
    );
  }

  if (currentScreen === 'scanItem') {
    if (scanStep === 'capture') {
      return (
        <View style={styles.container}>
          <PageHeader
            title="Scan Item"
            subtitle="Take or upload a photo"
            level="room"
            onBackPress={resetAndGoBack}
          />
          <View style={styles.scanContent}>
            <View style={styles.scanOptionsRow}>
              <Pressable
                style={({ pressed }) => [
                  styles.scanOptionCard,
                  pressed && styles.scanOptionPressed,
                ]}
                onPress={() => setScanStep('analyzing')}
              >
                <View style={styles.scanOptionIconContainer}>
                  <Icon name="image-outline" size={32} color={Colors.orange} />
                </View>
                <Text style={styles.scanOptionTitle}>Upload Photo</Text>
                <Text style={styles.scanOptionDescription}>From library</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.scanOptionCard,
                  pressed && styles.scanOptionPressed,
                ]}
                onPress={() => setScanStep('analyzing')}
              >
                <View style={styles.scanOptionIconContainer}>
                  <Icon name="camera-outline" size={32} color={Colors.orange} />
                </View>
                <Text style={styles.scanOptionTitle}>Take Photo</Text>
                <Text style={styles.scanOptionDescription}>Use camera</Text>
              </Pressable>
            </View>

            <View style={styles.scanHint}>
              <Icon name="lightbulb-outline" size={16} color={Colors.textMuted} />
              <Text style={styles.scanHintText}>
                AI will identify your item and estimate its value
              </Text>
            </View>
          </View>
        </View>
      );
    }

    if (scanStep === 'analyzing') {
      setTimeout(() => setScanStep('form'), 3000);
      return (
        <View style={styles.container}>
          <AnalyzingOverlay
            visible={true}
            title="Identifying item"
            subtitle="AI is analyzing your photo"
            steps={[
              { label: 'Photo captured', status: 'complete' },
              { label: 'Recognizing item', status: 'active' },
              { label: 'Estimating value', status: 'pending' },
            ]}
          />
        </View>
      );
    }

    if (scanStep === 'form') {
      const selectedRoomData = mockRooms.find(r => r.id === selectedRoom);

      return (
        <View style={styles.container}>
          <PageHeader
            title="Review Item"
            subtitle={selectedRoomData ? `Adding to ${selectedRoomData.name}` : 'Select a room'}
            level="room"
            onBackPress={resetAndGoBack}
            actionIcon="pencil-outline"
            onActionPress={() => console.log('Edit')}
          />
          <ScrollView style={styles.flex} contentContainerStyle={styles.formContent}>
            <View style={styles.imagePreview}>
              <View style={styles.imagePlaceholder}>
                <Icon name="image-outline" size={32} color={Colors.textMuted} />
              </View>
              <View style={styles.aiChip}>
                <Icon name="lightbulb-outline" size={14} color={Colors.orange} />
                <Text style={styles.aiChipText}>AI Detected</Text>
              </View>
            </View>

            <View style={styles.form}>
              <View style={styles.sectionLabel}>
                <Text style={styles.label}>LOCATION</Text>
              </View>
              <Pressable
                style={({ pressed }) => [
                  styles.selector,
                  pressed && styles.selectorPressed,
                ]}
                onPress={() => setShowRoomPicker(!showRoomPicker)}
              >
                <View style={[styles.selectorIcon, { backgroundColor: Colors.orangeSoft }]}>
                  <Icon
                    name="view-grid-outline"
                    size={20}
                    color={selectedRoomData ? Colors.orange : Colors.textMuted}
                  />
                </View>
                <View style={styles.selectorTextContainer}>
                  <Text style={[
                    styles.selectorText,
                    !selectedRoomData && styles.selectorPlaceholder,
                  ]}>
                    {selectedRoomData?.name || 'Select room'}
                  </Text>
                  {selectedRoomData && (
                    <Text style={styles.selectorSubtext}>in {selectedRoomData.property}</Text>
                  )}
                </View>
                <Icon
                  name={showRoomPicker ? 'menu-up-outline' : 'menu-down-outline'}
                  size={20}
                  color={Colors.textMuted}
                />
              </Pressable>

              {showRoomPicker && (
                <View style={styles.pickerList}>
                  {mockRooms.map((room) => {
                    const isSelected = room.id === selectedRoom;
                    return (
                      <Pressable
                        key={room.id}
                        style={({ pressed }) => [
                          styles.pickerItem,
                          isSelected && styles.pickerItemSelectedOrange,
                          pressed && styles.pickerItemPressed,
                        ]}
                        onPress={() => {
                          setSelectedRoom(room.id);
                          setShowRoomPicker(false);
                        }}
                      >
                        <View style={[
                          styles.pickerItemIcon,
                          isSelected && styles.pickerItemIconSelectedOrange,
                        ]}>
                          <Icon
                            name="view-grid-outline"
                            size={18}
                            color={isSelected ? Colors.orange : Colors.textGrey}
                          />
                        </View>
                        <View style={styles.pickerItemTextContainer}>
                          <Text style={[
                            styles.pickerItemText,
                            isSelected && styles.pickerItemTextSelected,
                          ]}>
                            {room.name}
                          </Text>
                          <Text style={styles.pickerItemSubtext}>{room.property}</Text>
                        </View>
                        {isSelected && (
                          <Icon name="check-circle-outline" size={20} color={Colors.orange} />
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              )}

              <View style={styles.sectionLabel}>
                <Text style={styles.label}>ITEM DETAILS</Text>
              </View>
              <TextInput placeholder="Category" value="Electronics" onChangeText={() => {}} />
              <TextInput placeholder="Brand" value="Samsung" onChangeText={() => {}} />
              <TextInput placeholder="Model" value="Galaxy S24 Ultra" onChangeText={() => {}} />

              <View style={styles.sectionLabel}>
                <Text style={styles.label}>VALUE</Text>
              </View>
              <View style={styles.priceRow}>
                <View style={styles.priceInputContainer}>
                  <Text style={styles.currencyPrefix}>R</Text>
                  <TextInput
                    placeholder="Price"
                    value="24,999"
                    onChangeText={() => setIsAiEstimate(false)}
                    keyboardType="numeric"
                    style={styles.priceInput}
                  />
                  <View style={[
                    styles.valueSourceChip,
                    isAiEstimate ? styles.valueSourceChipAi : styles.valueSourceChipEntered
                  ]}>
                    {isAiEstimate && <Icon name="lightbulb-outline" size={12} color={Colors.orange} />}
                    <Text style={[
                      styles.valueSourceChipText,
                      isAiEstimate ? styles.valueSourceChipTextAi : styles.valueSourceChipTextEntered
                    ]}>
                      {isAiEstimate ? 'AI estimate' : 'Entered value'}
                    </Text>
                  </View>
                </View>
                <SecondaryButton
                  label="New estimate"
                  icon="lightbulb-outline"
                  onPress={() => setIsAiEstimate(true)}
                  fullWidth={false}
                  compact
                />
              </View>
            </View>
          </ScrollView>
          <View style={styles.footer}>
            <PrimaryButton
              label="Add Item"
              onPress={resetAndGoBack}
              disabled={!selectedRoom}
              icon="check-circle-outline"
            />
          </View>
        </View>
      );
    }
  }

  if (currentScreen === 'viewItem') {
    const mockPhotos = [
      { id: 1, isPrimary: true, hasLocation: true, lat: -33.9249, lng: 18.4241, capturedAt: '15 Nov 2024, 14:32' },
      { id: 2, isPrimary: false, hasLocation: true, lat: -33.9250, lng: 18.4242, capturedAt: '15 Nov 2024, 14:33' },
      { id: 3, isPrimary: false, hasLocation: false, lat: null, lng: null, capturedAt: '28 Nov 2024, 09:15' },
    ];

    type PriceType = 'AI' | 'user' | 'invoice';
    const mockItem = {
      price: 3499,
      price_type: 'AI' as PriceType,
    };

    const priceTypeBadgeConfig: Record<PriceType, { label: string; icon: MaterialIconName; color: string; bgColor: string }> = {
      'AI': { label: 'AI estimate', icon: 'star-four-points-outline', color: Colors.orange, bgColor: Colors.orangeSoft },
      'user': { label: 'User entered', icon: 'pencil-outline', color: Colors.green, bgColor: Colors.greenSoft },
      'invoice': { label: 'Invoice price', icon: 'text-box-check-outline', color: Colors.textMuted, bgColor: Colors.greyBg },
    };

    const currentBadge = priceTypeBadgeConfig[mockItem.price_type];

    return (
      <View style={styles.container}>
        <PageHeader
          title="Smeg Electric Kettle"
          subtitle="Kitchen Appliances • Living Room • Main House"
          level="room"
          onBackPress={resetAndGoBack}
          actionIcon="pencil-outline"
          onActionPress={() => console.log('Edit item')}
        />
        <ScrollView style={styles.flex} contentContainerStyle={styles.itemDetailContent}>
          
          {/* VALUE CARD - 3 column layout: Photo | Price + Badge | Action */}
          <View style={styles.cardSection}>
            <Text style={styles.cardTitle}>Value</Text>
            <View style={styles.valueCardRow}>
              {/* Column 1: Primary Photo */}
              <Pressable style={styles.primaryPhotoThumb}>
                <Icon name="image-outline" size={36} color={Colors.orange} />
                <View style={styles.primaryPhotoBadge}>
                  <Icon name="star-outline" size={10} color="#fff" />
                </View>
              </Pressable>
              
              {/* Column 2: Price + Source Badge */}
              <View style={styles.valuePriceColumn}>
                <Text style={styles.valueAmount}>R {mockItem.price.toLocaleString()}</Text>
                <View style={[styles.priceSourceBadge, { backgroundColor: currentBadge.bgColor }]}>
                  <Icon name={currentBadge.icon} size={12} color={currentBadge.color} />
                  <Text style={[styles.priceSourceText, { color: currentBadge.color }]}>{currentBadge.label}</Text>
                </View>
                <Text style={styles.valueNote}>Based on SA market prices</Text>
              </View>
              
              {/* Column 3: New Estimate Button */}
              <View style={styles.valueActionColumn}>
                <SecondaryButton
                  label="New estimate"
                  icon="star-four-points-outline"
                  onPress={() => console.log('Request new estimate')}
                  fullWidth={false}
                  compact
                />
              </View>
            </View>
          </View>

          {/* DETAILS CARD */}
          <View style={styles.cardSection}>
            <Text style={styles.cardTitle}>Details</Text>
            
            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>DESCRIPTION</Text>
                <Text style={styles.detailValueMultiline}>
                  Retro-style electric kettle in cream finish. 1.7L capacity with soft-opening lid and removable limescale filter.
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>BRAND</Text>
                  <Text style={styles.detailValue}>Smeg</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>MODEL</Text>
                  <Text style={styles.detailValue}>KLF03CRUK</Text>
                </View>
              </View>
              
              <View style={styles.detailRow}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>SERIAL NUMBER</Text>
                  <Text style={styles.detailValue}>SMG-2024-78541</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>QUANTITY</Text>
                  <Text style={styles.detailValue}>1</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.detailRow}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>DATE CAPTURED</Text>
                  <Text style={styles.detailValue}>15 Nov 2024</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>LAST UPDATED</Text>
                  <Text style={styles.detailValue}>28 Nov 2024</Text>
                </View>
              </View>

              <View style={styles.divider} />

              {/* Proof of Purchase subsection */}
              <View style={styles.proofSection}>
                <View style={styles.proofHeader}>
                  <Text style={styles.detailLabel}>PROOF OF PURCHASE</Text>
                  <View style={styles.verifiedBadge}>
                    <Icon name="check-circle-outline" size={12} color={Colors.green} />
                    <Text style={styles.verifiedBadgeText}>Verified</Text>
                  </View>
                </View>
                <View style={styles.proofContent}>
                  <Pressable style={styles.receiptThumb}>
                    <Icon name="text-box-outline" size={24} color={Colors.orange} />
                  </Pressable>
                  <View style={styles.proofDetails}>
                    <Text style={styles.proofStore}>Yuppiechef</Text>
                    <Text style={styles.proofMeta}>12 Oct 2024 • R 3,299.00</Text>
                  </View>
                  <Icon name="chevron-right" size={20} color={Colors.textMuted} />
                </View>
                <Pressable style={styles.addReceiptLink}>
                  <Icon name="plus-circle-outline" size={14} color={Colors.orange} />
                  <Text style={styles.addReceiptText}>Add another receipt</Text>
                </Pressable>
              </View>
            </View>
          </View>

          {/* PICTURES GALLERY - Additional photos only (primary shown above) */}
          <View style={styles.cardSection}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>More Pictures</Text>
              <Text style={styles.photoCount}>{mockPhotos.filter(p => !p.isPrimary).length} additional</Text>
            </View>
            <View style={styles.photoGrid}>
              {mockPhotos.filter(photo => !photo.isPrimary).map((photo) => (
                <Pressable 
                  key={photo.id} 
                  style={styles.photoThumb}
                  onPress={() => console.log('Open photo detail:', photo.id)}
                >
                  <Icon name="image-outline" size={24} color={Colors.textMuted} />
                  {photo.hasLocation && (
                    <View style={styles.photoGeoBadge}>
                      <Icon name="map-marker-outline" size={10} color="#fff" />
                    </View>
                  )}
                </Pressable>
              ))}
              <Pressable 
                style={styles.photoThumb}
                onPress={() => console.log('Add photo')}
              >
                <Icon name="plus" size={24} color={Colors.orange} />
              </Pressable>
            </View>
          </View>

        </ScrollView>

        <View style={styles.footerActions}>
          <SecondaryButton
            label="Delete Item"
            icon="trash-can-outline"
            onPress={() => console.log('Delete')}
          />
        </View>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgCanvas,
  },
  flex: {
    flex: 1,
  },
  menuHeader: {
    padding: Spacing.xl,
    paddingTop: 60,
    backgroundColor: Colors.green,
  },
  menuTitle: {
    fontSize: Typography.fontSize.title,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.white,
  },
  menuSubtitle: {
    fontSize: Typography.fontSize.body2,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: 'rgba(255,255,255,0.8)',
    marginTop: Spacing.xxs,
  },
  menuCards: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  menuCard: {
    backgroundColor: Colors.white,
    borderRadius: Radii.xl,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  menuCardPressed: {
    backgroundColor: Colors.greyBg,
  },
  menuCardIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuCardTitle: {
    fontSize: Typography.fontSize.subhead,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textDark,
  },
  menuCardDesc: {
    fontSize: Typography.fontSize.caption,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textMuted,
    marginTop: 2,
  },
  formContent: {
    padding: Spacing.lg,
    paddingTop: Spacing.xl,
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
  imageSection: {
    marginTop: Spacing.sm,
  },
  footer: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
    backgroundColor: Colors.bgCanvas,
  },
  selector: {
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
  selectorPressed: {
    backgroundColor: Colors.greyBg,
  },
  selectorIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectorTextContainer: {
    flex: 1,
  },
  selectorText: {
    fontSize: Typography.fontSize.subhead,
    fontFamily: Typography.fontFamily.bodyMedium,
    color: Colors.textDark,
  },
  selectorSubtext: {
    fontSize: Typography.fontSize.caption,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textMuted,
    marginTop: 2,
  },
  selectorPlaceholder: {
    color: Colors.textMuted,
  },
  pickerList: {
    backgroundColor: Colors.white,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.greyBg,
    overflow: 'hidden',
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  pickerItemSelectedYellow: {
    backgroundColor: Colors.yellowSoft,
  },
  pickerItemSelectedOrange: {
    backgroundColor: Colors.orangeSoft,
  },
  pickerItemPressed: {
    backgroundColor: Colors.greyBg,
  },
  pickerItemIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.greyBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerItemIconSelectedYellow: {
    backgroundColor: Colors.yellowSoft,
  },
  pickerItemIconSelectedOrange: {
    backgroundColor: Colors.orangeSoft,
  },
  pickerItemTextContainer: {
    flex: 1,
  },
  pickerItemText: {
    fontSize: Typography.fontSize.body2,
    fontFamily: Typography.fontFamily.bodyMedium,
    color: Colors.textDark,
  },
  pickerItemTextSelected: {
    fontFamily: Typography.fontFamily.bodySemiBold,
  },
  pickerItemSubtext: {
    fontSize: Typography.fontSize.caption,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textMuted,
    marginTop: 1,
  },
  scanContent: {
    flex: 1,
    padding: Spacing.lg,
    justifyContent: 'center',
  },
  scanOptionsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  scanOptionCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: Radii.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  scanOptionPressed: {
    backgroundColor: Colors.orangeSoft,
    borderColor: Colors.orange,
  },
  scanOptionIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: Colors.orangeSoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  scanOptionTitle: {
    fontSize: Typography.fontSize.subhead,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textDark,
    marginBottom: Spacing.xxs,
    textAlign: 'center',
  },
  scanOptionDescription: {
    fontSize: Typography.fontSize.caption,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  scanHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
  },
  scanHintText: {
    fontSize: Typography.fontSize.caption,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  imagePreview: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  imagePlaceholder: {
    width: 140,
    height: 105,
    borderRadius: Radii.lg,
    backgroundColor: Colors.greyBg,
    justifyContent: 'center',
    alignItems: 'center',
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
  verificationRequiredText: {
    fontSize: Typography.fontSize.caption,
    fontFamily: Typography.fontFamily.bodyMedium,
    color: Colors.orange,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  itemDetailContent: {
    padding: Spacing.lg,
    paddingTop: Spacing.md,
    gap: Spacing.md,
  },
  cardSection: {
    backgroundColor: Colors.white,
    borderRadius: Radii.xl,
    padding: Spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  cardTitle: {
    fontSize: Typography.fontSize.subhead,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textDark,
  },
  priceContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  valueCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.greyBg,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    marginTop: Spacing.sm,
  },
  primaryPhotoThumb: {
    width: 72,
    height: 72,
    borderRadius: Radii.lg,
    backgroundColor: Colors.orangeSoft,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  primaryPhotoBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.orange,
    justifyContent: 'center',
    alignItems: 'center',
  },
  valuePriceColumn: {
    flex: 1,
    gap: 2,
    marginLeft: 10,
  },
  valueAmount: {
    fontSize: 24,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textDark,
  },
  priceSourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.pill,
    alignSelf: 'flex-start',
  },
  priceSourceText: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.bodySemiBold,
  },
  valueNote: {
    fontSize: Typography.fontSize.caption,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textMuted,
    marginTop: 2,
  },
  valueActionColumn: {
    justifyContent: 'center',
  },
  detailsGrid: {
    marginTop: Spacing.sm,
  },
  detailItem: {
    flex: 1,
    marginBottom: Spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  detailLabel: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.bodySemiBold,
    color: Colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: Typography.fontSize.body2,
    fontFamily: Typography.fontFamily.bodyMedium,
    color: Colors.textDark,
  },
  detailValueMultiline: {
    fontSize: Typography.fontSize.body2,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textDark,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.greyBg,
    marginVertical: Spacing.md,
  },
  proofSection: {
    marginTop: Spacing.xs,
  },
  proofHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  proofContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.greyBg,
    borderRadius: Radii.lg,
    padding: Spacing.sm,
  },
  receiptThumb: {
    width: 44,
    height: 44,
    borderRadius: Radii.md,
    backgroundColor: Colors.orangeSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  proofDetails: {
    flex: 1,
  },
  proofStore: {
    fontSize: Typography.fontSize.body2,
    fontFamily: Typography.fontFamily.bodyMedium,
    color: Colors.textDark,
  },
  proofMeta: {
    fontSize: Typography.fontSize.caption,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textMuted,
    marginTop: 2,
  },
  addReceiptLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
  },
  addReceiptText: {
    fontSize: Typography.fontSize.body2,
    fontFamily: Typography.fontFamily.bodyMedium,
    color: Colors.orange,
  },
  photoCount: {
    fontSize: Typography.fontSize.caption,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textMuted,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  photoThumb: {
    width: 64,
    height: 64,
    borderRadius: Radii.md,
    backgroundColor: Colors.greyBg,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  photoGeoBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.green,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiEstimateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.orangeSoft,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radii.pill,
    gap: 4,
  },
  aiEstimateBadgeText: {
    fontSize: Typography.fontSize.caption,
    fontFamily: Typography.fontFamily.bodySemiBold,
    color: Colors.orange,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.greenSoft,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radii.pill,
    gap: 4,
  },
  verifiedBadgeText: {
    fontSize: Typography.fontSize.caption,
    fontFamily: Typography.fontFamily.bodySemiBold,
    color: Colors.green,
  },
  timestampSection: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  timestampText: {
    fontSize: Typography.fontSize.caption,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textMuted,
  },
  footerActions: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
    backgroundColor: Colors.bgCanvas,
  },
});
