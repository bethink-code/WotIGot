import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, ScrollView } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { Colors, Radii, Shadows, Typography, Spacing } from '../../constants/DesignTokens';
import { Motion, Durations, Easings, StaggerConfig } from '../../constants/MotionContract';
import { Icon } from './Icon';
import { ViewMode, MaterialStateLayer } from './types';

interface Filter {
  id: string;
  label: string;
  active?: boolean;
}

interface CardListProps {
  title?: string;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (text: string) => void;
  showSearch?: boolean;
  filters?: Filter[];
  onFilterPress?: (filterId: string) => void;
  showFilters?: boolean;
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
  showViewToggle?: boolean;
  children: React.ReactNode;
  emptyState?: React.ReactNode;
  isEmpty?: boolean;
}

export function CardList({
  title,
  searchPlaceholder = 'Search...',
  searchValue = '',
  onSearchChange,
  showSearch = true,
  filters = [],
  onFilterPress,
  showFilters = false,
  viewMode = 'list',
  onViewModeChange,
  showViewToggle = true,
  children,
  emptyState,
  isEmpty = false,
}: CardListProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.container}>
      {title && (
        <Text style={styles.sectionTitle}>{title}</Text>
      )}

      {(showSearch || showViewToggle) && (
        <View style={styles.toolbar}>
          {showSearch && (
            <View style={[
              styles.searchContainer,
              isFocused && styles.searchFocused
            ]}>
              <Icon name="magnify" size={20} color={Colors.greyMid} />
              <TextInput
                style={styles.searchInput}
                placeholder={searchPlaceholder}
                placeholderTextColor={Colors.greyMid}
                value={searchValue}
                onChangeText={onSearchChange}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
              />
              {searchValue.length > 0 && (
                <Pressable onPress={() => onSearchChange?.('')} hitSlop={8}>
                  <Icon name="close" size={18} color={Colors.greyMid} />
                </Pressable>
              )}
            </View>
          )}

          {showViewToggle && onViewModeChange && (
            <View style={styles.viewToggle}>
              <Pressable
                onPress={() => onViewModeChange('list')}
                style={[
                  styles.viewToggleBtn,
                  viewMode === 'list' && styles.viewToggleActive
                ]}
              >
                <Icon 
                  name="view-list-outline" 
                  size={22} 
                  color={viewMode === 'list' ? Colors.textDark : Colors.greyMid} 
                />
              </Pressable>
              <Pressable
                onPress={() => onViewModeChange('grid')}
                style={[
                  styles.viewToggleBtn,
                  viewMode === 'grid' && styles.viewToggleActive
                ]}
              >
                <Icon 
                  name="view-grid-outline" 
                  size={22} 
                  color={viewMode === 'grid' ? Colors.textDark : Colors.greyMid} 
                />
              </Pressable>
            </View>
          )}
        </View>
      )}

      {showFilters && filters.length > 0 && (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filtersScroll}
          contentContainerStyle={styles.filtersContainer}
        >
          {filters.map((filter) => (
            <Pressable
              key={filter.id}
              onPress={() => onFilterPress?.(filter.id)}
              style={[
                styles.filterChip,
                filter.active && styles.filterChipActive
              ]}
            >
              <Text style={[
                styles.filterText,
                filter.active && styles.filterTextActive
              ]}>
                {filter.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      <View style={styles.listContainer}>
        {isEmpty && emptyState ? emptyState : children}
      </View>
    </View>
  );
}

interface CardListItemProps {
  children: React.ReactNode;
  style?: object;
  index?: number;
  animated?: boolean;
}

export function CardListItem({ children, style, index = 0, animated = true }: CardListItemProps) {
  const opacity = useSharedValue(animated ? 0 : 1);
  const translateY = useSharedValue(animated ? 16 : 0);

  useEffect(() => {
    if (!animated) return;
    
    const delay = index * StaggerConfig.listItems;
    const timer = setTimeout(() => {
      opacity.value = withTiming(1, {
        duration: Durations.normal,
        easing: Easings.emphasizedDecelerate,
      });
      translateY.value = withTiming(0, {
        duration: Durations.normal,
        easing: Easings.emphasized,
      });
    }, delay);

    return () => clearTimeout(timer);
  }, [index, animated]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (!animated) {
    return (
      <View style={[styles.listItem, style]}>
        {children}
      </View>
    );
  }

  return (
    <Animated.View style={[styles.listItem, animatedStyle, style]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.caption,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textGrey,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.greyInput,
    borderRadius: Radii.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  searchFocused: {
    borderColor: Colors.green,
    backgroundColor: Colors.white,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.fontSize.body2,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textDark,
    padding: 0,
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.greyInput,
    borderRadius: Radii.lg,
    padding: 4,
  },
  viewToggleBtn: {
    padding: Spacing.xs,
    borderRadius: Radii.md,
  },
  viewToggleActive: {
    backgroundColor: Colors.white,
  },
  filtersScroll: {
    marginBottom: Spacing.md,
  },
  filtersContainer: {
    flexDirection: 'row',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.xxs,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radii.pill,
    backgroundColor: Colors.greyInput,
    borderWidth: 1,
    borderColor: Colors.greyBorder,
  },
  filterChipActive: {
    backgroundColor: Colors.greenSoft,
    borderColor: Colors.green,
  },
  filterText: {
    fontSize: Typography.fontSize.body2,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textGrey,
  },
  filterTextActive: {
    color: Colors.green,
  },
  listContainer: {
    gap: Spacing.sm,
  },
  listItem: {
    marginBottom: Spacing.xs,
  },
});
