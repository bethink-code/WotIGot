import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, StyleProp, ViewStyle } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  withSpring,
  withDelay,
  Easing,
  interpolate,
  ReduceMotion,
} from 'react-native-reanimated';
import { Colors, Radii, Typography, Spacing, Shadows } from '../../constants/DesignTokens';
import { Icon, MaterialIconName } from './Icon';
import { HierarchyLevel } from './types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const EMPHASIZED_EASING = Easing.bezier(0.2, 0.8, 0.2, 1);
const VIEW_TRANSITION_DURATION = 280;
const MENU_HEIGHT = 280;
const STAGGER_DELAY = 40;

export interface LocationContext {
  propertyId?: string;
  propertyName?: string;
  propertyAddress?: string;
  roomId?: string;
  roomName?: string;
  roomItemCount?: number;
}

export interface PropertyOption {
  id: string;
  name: string;
  address?: string;
  icon?: MaterialIconName;
}

export interface RoomOption {
  id: string;
  name: string;
  itemCount?: number;
  propertyId: string;
  icon?: MaterialIconName;
}

interface AddMenuProps {
  visible: boolean;
  onClose: () => void;
  currentLevel: HierarchyLevel;
  currentContext: LocationContext;
  properties?: PropertyOption[];
  rooms?: RoomOption[];
  onAddProperty?: () => void;
  onAddRoom?: () => void;
  onScanItem?: () => void;
  onContextChange?: (context: LocationContext) => void;
  testID?: string;
}

interface ActionButtonProps {
  icon: MaterialIconName;
  label: string;
  level: HierarchyLevel;
  onPress?: () => void;
  delay?: number;
  visible?: boolean;
}

function ActionButton({ icon, label, level, onPress, delay = 0, visible = true }: ActionButtonProps) {
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);
  const pressScale = useSharedValue(1);
  
  React.useEffect(() => {
    if (visible) {
      scale.value = withDelay(delay, withSpring(1, { 
        damping: 18, 
        stiffness: 280,
        reduceMotion: ReduceMotion.Never 
      }));
      opacity.value = withDelay(delay, withTiming(1, { 
        duration: 140, 
        easing: EMPHASIZED_EASING 
      }));
    } else {
      scale.value = 0.8;
      opacity.value = 0;
    }
  }, [visible, delay]);
  
  const getLevelColors = () => {
    switch (level) {
      case 'portfolio':
        return { bg: Colors.green, icon: Colors.white, soft: Colors.greenSoft };
      case 'property':
        return { bg: Colors.yellow, icon: Colors.white, soft: Colors.yellowSoft };
      case 'room':
        return { bg: Colors.orange, icon: Colors.white, soft: Colors.orangeSoft };
    }
  };
  
  const colors = getLevelColors();
  
  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value * pressScale.value }
    ],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    pressScale.value = withTiming(0.92, { duration: 80, easing: EMPHASIZED_EASING });
  };

  const handlePressOut = () => {
    pressScale.value = withSpring(1, { damping: 12, stiffness: 300 });
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.actionButton, animatedContainerStyle]}
    >
      <View style={[styles.actionIconContainer, { backgroundColor: colors.soft }]}>
        <View style={[styles.actionIconInner, { backgroundColor: colors.bg }]}>
          <Icon name={icon} size={28} color={colors.icon} />
        </View>
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </AnimatedPressable>
  );
}

type MenuView = 'main' | 'selectLocation';

export function AddMenu({
  visible,
  onClose,
  currentLevel,
  currentContext,
  properties = [],
  rooms = [],
  onAddProperty,
  onAddRoom,
  onScanItem,
  onContextChange,
  testID,
}: AddMenuProps) {
  const insets = useSafeAreaInsets();
  const [menuView, setMenuView] = useState<MenuView>('main');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | undefined>(currentContext.propertyId);
  const [selectedRoomId, setSelectedRoomId] = useState<string | undefined>(currentContext.roomId);
  const [isRendered, setIsRendered] = useState(false);
  const [buttonsVisible, setButtonsVisible] = useState(false);
  
  const overlayOpacity = useSharedValue(0);
  const menuScale = useSharedValue(0.15);
  const menuOpacity = useSharedValue(0);
  const contentOpacity = useSharedValue(0);
  
  const mainOpacity = useSharedValue(1);
  const selectorOpacity = useSharedValue(0);
  const mainTranslateX = useSharedValue(0);
  const selectorTranslateX = useSharedValue(50);

  React.useEffect(() => {
    if (visible) {
      setIsRendered(true);
      setMenuView('main');
      mainOpacity.value = 1;
      selectorOpacity.value = 0;
      mainTranslateX.value = 0;
      selectorTranslateX.value = 50;
      setSelectedPropertyId(currentContext.propertyId);
      setSelectedRoomId(currentContext.roomId);
      
      overlayOpacity.value = withTiming(1, { duration: 180, easing: EMPHASIZED_EASING });
      menuScale.value = withSpring(1, { 
        damping: 20, 
        stiffness: 320, 
        reduceMotion: ReduceMotion.Never 
      });
      menuOpacity.value = withTiming(1, { duration: 140, easing: EMPHASIZED_EASING });
      contentOpacity.value = withDelay(60, withTiming(1, { duration: 120, easing: EMPHASIZED_EASING }));
      
      setTimeout(() => setButtonsVisible(true), 80);
    } else {
      setButtonsVisible(false);
      overlayOpacity.value = withTiming(0, { duration: 150, easing: EMPHASIZED_EASING });
      contentOpacity.value = withTiming(0, { duration: 80, easing: EMPHASIZED_EASING });
      menuOpacity.value = withTiming(0, { duration: 120, easing: EMPHASIZED_EASING });
      menuScale.value = withTiming(0.15, { duration: 160, easing: EMPHASIZED_EASING });
      
      const timer = setTimeout(() => {
        setIsRendered(false);
      }, 180);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const menuStyle = useAnimatedStyle(() => ({
    opacity: menuOpacity.value,
    transform: [
      { translateY: interpolate(menuScale.value, [0.15, 1], [MENU_HEIGHT * 0.4, 0]) },
      { scale: menuScale.value },
    ],
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  const mainViewStyle = useAnimatedStyle(() => ({
    opacity: mainOpacity.value,
    transform: [{ translateX: mainTranslateX.value }],
  }));

  const selectorViewStyle = useAnimatedStyle(() => ({
    opacity: selectorOpacity.value,
    transform: [{ translateX: selectorTranslateX.value }],
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    zIndex: menuView === 'selectLocation' ? 1 : 0,
    pointerEvents: menuView === 'selectLocation' ? 'auto' : 'none',
  }));

  const handleClose = () => {
    onClose();
  };

  const transitionToSelector = useCallback(() => {
    setMenuView('selectLocation');
    mainOpacity.value = withTiming(0, { duration: VIEW_TRANSITION_DURATION * 0.5, easing: EMPHASIZED_EASING });
    mainTranslateX.value = withTiming(-50, { duration: VIEW_TRANSITION_DURATION, easing: EMPHASIZED_EASING });
    selectorOpacity.value = withDelay(60, withTiming(1, { duration: VIEW_TRANSITION_DURATION * 0.6, easing: EMPHASIZED_EASING }));
    selectorTranslateX.value = withSpring(0, { damping: 20, stiffness: 280, reduceMotion: ReduceMotion.Never });
  }, []);

  const transitionToMain = useCallback(() => {
    setMenuView('main');
    selectorOpacity.value = withTiming(0, { duration: VIEW_TRANSITION_DURATION * 0.5, easing: EMPHASIZED_EASING });
    selectorTranslateX.value = withTiming(50, { duration: VIEW_TRANSITION_DURATION, easing: EMPHASIZED_EASING });
    mainOpacity.value = withDelay(60, withTiming(1, { duration: VIEW_TRANSITION_DURATION * 0.6, easing: EMPHASIZED_EASING }));
    mainTranslateX.value = withSpring(0, { damping: 20, stiffness: 280, reduceMotion: ReduceMotion.Never });
  }, []);

  const handleContextPress = () => {
    transitionToSelector();
  };

  const handleBackToMain = () => {
    transitionToMain();
  };

  const handlePropertySelect = (propertyId: string) => {
    setSelectedPropertyId(propertyId);
    setSelectedRoomId(undefined);
  };

  const handleRoomSelect = (roomId: string) => {
    setSelectedRoomId(roomId);
    const selectedProperty = properties.find(p => p.id === selectedPropertyId);
    const selectedRoom = rooms.find(r => r.id === roomId);
    if (selectedProperty && selectedRoom && onContextChange) {
      onContextChange({
        propertyId: selectedPropertyId,
        propertyName: selectedProperty.name,
        propertyAddress: selectedProperty.address,
        roomId: roomId,
        roomName: selectedRoom.name,
        roomItemCount: selectedRoom.itemCount,
      });
    }
    transitionToMain();
  };

  const hasContext = currentContext.propertyId || currentContext.roomId;
  const canChangeProperty = properties.length > 0;
  const canChangeRoom = rooms.length > 0 && (currentLevel === 'property' || currentLevel === 'room' || selectedPropertyId);
  const showChangeOption = hasContext && (canChangeProperty || canChangeRoom);
  
  const showPropertyOption = currentLevel === 'portfolio';
  const showRoomOption = currentLevel === 'portfolio' || currentLevel === 'property';
  const showScanOption = true;

  const filteredRooms = rooms.filter(r => r.propertyId === selectedPropertyId);

  const getContextDisplay = () => {
    const parts: string[] = [];
    if (currentContext.propertyName) parts.push(currentContext.propertyName);
    if (currentContext.roomName) parts.push(currentContext.roomName);
    return parts;
  };

  const contextParts = getContextDisplay();

  if (!isRendered) return null;

  const toolbarHeight = 64;
  const fabOffset = 28;
  const bottomOffset = Math.max(insets.bottom, 16) + toolbarHeight + fabOffset;

  let buttonIndex = 0;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={visible ? 'auto' : 'none'} testID={testID}>
      <AnimatedPressable 
        style={[styles.overlay, overlayStyle]} 
        onPress={handleClose}
      />
      
      <View style={[styles.menuPositioner, { bottom: bottomOffset }]}>
        <Animated.View style={[styles.menuCard, menuStyle]}>
          <View style={styles.handleBar} />
          
          <Animated.View style={contentStyle}>
            <View style={styles.viewContainer}>
              <Animated.View style={[styles.mainView, mainViewStyle]}>
                {hasContext && (
                  <View style={styles.locationIndicator}>
                    <Text style={styles.locationLabel}>ADDING TO</Text>
                    <View style={styles.locationRow}>
                      <View style={styles.locationIconContainer}>
                        <Icon 
                          name={currentContext.roomName ? 'sofa-outline' : 'home-city-outline'} 
                          size={20} 
                          color={Colors.orange} 
                        />
                      </View>
                      <View style={styles.locationTextContainer}>
                        <Text style={styles.locationPrimary} numberOfLines={1}>
                          {currentContext.propertyName || 'No Property'}
                        </Text>
                        {currentContext.roomName && (
                          <Text style={styles.locationSecondary} numberOfLines={1}>
                            {currentContext.roomName}
                          </Text>
                        )}
                      </View>
                      {showChangeOption && (
                        <Pressable 
                          onPress={handleContextPress}
                          style={({ pressed }) => [
                            styles.changeButton,
                            pressed && styles.changeButtonPressed
                          ]}
                        >
                          <Text style={styles.changeButtonText}>Change</Text>
                        </Pressable>
                      )}
                    </View>
                  </View>
                )}

                <View style={styles.actionsContainer}>
                  <View style={styles.actionsRow}>
                    {showPropertyOption && (
                      <ActionButton
                        icon="office-building-outline"
                        label="Property"
                        level="property"
                        onPress={onAddProperty}
                        delay={STAGGER_DELAY * buttonIndex++}
                        visible={buttonsVisible}
                      />
                    )}
                    {showRoomOption && (
                      <ActionButton
                        icon="floor-plan"
                        label="Room"
                        level="room"
                        onPress={onAddRoom}
                        delay={STAGGER_DELAY * buttonIndex++}
                        visible={buttonsVisible}
                      />
                    )}
                    {showScanOption && (
                      <ActionButton
                        icon="camera-outline"
                        label="Scan Item"
                        level="portfolio"
                        onPress={onScanItem}
                        delay={STAGGER_DELAY * buttonIndex++}
                        visible={buttonsVisible}
                      />
                    )}
                  </View>
                </View>
              </Animated.View>

              {menuView === 'selectLocation' && (
                <Animated.View style={[styles.selectorView, selectorViewStyle]}>
                  <View style={styles.selectorHeader}>
                    <Pressable onPress={handleBackToMain} style={styles.backButton}>
                      <Icon name="arrow-left" size={24} color={Colors.textDark} />
                    </Pressable>
                    <Text style={styles.selectorTitle}>Select Location</Text>
                  </View>

                  <ScrollView style={styles.selectorScroll} showsVerticalScrollIndicator={false}>
                    {canChangeProperty && (
                      <>
                        <Text style={styles.sectionLabel}>PROPERTY</Text>
                        <View style={styles.selectorList}>
                          {properties.map((property, index) => {
                            const isSelected = selectedPropertyId === property.id;
                            const isLast = index === properties.length - 1;
                            return (
                              <Pressable
                                key={property.id}
                                onPress={() => handlePropertySelect(property.id)}
                                style={({ pressed }) => [
                                  styles.selectorItem,
                                  !isLast && !isSelected && styles.selectorItemBorder,
                                  isSelected && { backgroundColor: Colors.yellowSoft },
                                  pressed && !isSelected && styles.selectorItemPressed,
                                ]}
                              >
                                <View style={[
                                  styles.selectorIconContainer,
                                  { backgroundColor: isSelected ? Colors.yellowSoft : Colors.greyBg }
                                ]}>
                                  <Icon 
                                    name={property.icon || 'home-city-outline'} 
                                    size={18} 
                                    color={isSelected ? Colors.yellow : Colors.textGrey} 
                                  />
                                </View>
                                <Text style={[
                                  styles.selectorItemText,
                                  isSelected && styles.selectorItemTextSelected
                                ]} numberOfLines={1}>
                                  {property.name}
                                </Text>
                                {isSelected && (
                                  <Icon name="check" size={20} color={Colors.yellow} />
                                )}
                              </Pressable>
                            );
                          })}
                        </View>
                      </>
                    )}

                    {canChangeRoom && selectedPropertyId && filteredRooms.length > 0 && (
                      <>
                        <Text style={styles.sectionLabel}>ROOM</Text>
                        <View style={styles.selectorList}>
                          {filteredRooms.map((room, index) => {
                            const isSelected = selectedRoomId === room.id;
                            const isLast = index === filteredRooms.length - 1;
                            return (
                              <Pressable
                                key={room.id}
                                onPress={() => handleRoomSelect(room.id)}
                                style={({ pressed }) => [
                                  styles.selectorItem,
                                  !isLast && !isSelected && styles.selectorItemBorder,
                                  isSelected && { backgroundColor: Colors.orangeSoft },
                                  pressed && !isSelected && styles.selectorItemPressed,
                                ]}
                              >
                                <View style={[
                                  styles.selectorIconContainer,
                                  { backgroundColor: isSelected ? Colors.orangeSoft : Colors.greyBg }
                                ]}>
                                  <Icon 
                                    name={room.icon || 'sofa-outline'} 
                                    size={18} 
                                    color={isSelected ? Colors.orange : Colors.textGrey} 
                                  />
                                </View>
                                <Text style={[
                                  styles.selectorItemText,
                                  isSelected && styles.selectorItemTextSelected
                                ]} numberOfLines={1}>
                                  {room.name}
                                </Text>
                                {isSelected && (
                                  <Icon name="check" size={20} color={Colors.orange} />
                                )}
                              </Pressable>
                            );
                          })}
                        </View>
                      </>
                    )}
                  </ScrollView>
                </Animated.View>
              )}
            </View>
          </Animated.View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  menuPositioner: {
    position: 'absolute',
    left: Spacing.md,
    right: Spacing.md,
    alignItems: 'center',
  },
  menuCard: {
    backgroundColor: Colors.white,
    borderRadius: 28,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xl,
    width: '100%',
    maxWidth: 380,
    ...Shadows.float,
  },
  handleBar: {
    width: 36,
    height: 4,
    backgroundColor: Colors.greyBorder,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.lg,
  },
  viewContainer: {
    position: 'relative',
  },
  mainView: {
    paddingHorizontal: 0,
  },
  selectorView: {
    flex: 1,
  },
  locationIndicator: {
    marginBottom: Spacing.lg,
  },
  locationLabel: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.bodySemiBold,
    color: Colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.greyBg,
    borderRadius: 12,
    padding: Spacing.sm,
    paddingRight: Spacing.md,
  },
  locationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.orangeSoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  locationTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  locationPrimary: {
    fontSize: 14,
    fontFamily: Typography.fontFamily.bodySemiBold,
    color: Colors.textDark,
    lineHeight: 18,
  },
  locationSecondary: {
    fontSize: 13,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textGrey,
    lineHeight: 17,
  },
  changeButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 8,
  },
  changeButtonPressed: {
    backgroundColor: Colors.greenSoft,
  },
  changeButtonText: {
    fontSize: 13,
    fontFamily: Typography.fontFamily.bodySemiBold,
    color: Colors.green,
  },
  actionsContainer: {
    marginTop: Spacing.sm,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.xxl,
  },
  actionButton: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  actionIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 6,
  },
  actionIconInner: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionLabel: {
    fontSize: 13,
    fontFamily: Typography.fontFamily.bodyMedium,
    color: Colors.textDark,
  },
  selectorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.xs,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -Spacing.sm,
  },
  selectorTitle: {
    fontSize: Typography.fontSize.title,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textDark,
  },
  selectorScroll: {
    flex: 1,
    maxHeight: 240,
    overflow: 'hidden',
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.bodySemiBold,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
    letterSpacing: 0.8,
    marginLeft: Spacing.xs,
  },
  selectorList: {
    marginBottom: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.greyBg,
    overflow: 'hidden',
  },
  selectorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    gap: Spacing.sm,
    backgroundColor: Colors.white,
  },
  selectorItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.greyBg,
  },
  selectorItemPressed: {
    backgroundColor: Colors.greyBg,
  },
  selectorIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectorItemText: {
    flex: 1,
    fontSize: 14,
    fontFamily: Typography.fontFamily.bodyMedium,
    color: Colors.textDark,
  },
  selectorItemTextSelected: {
    fontFamily: Typography.fontFamily.bodySemiBold,
  },
});
