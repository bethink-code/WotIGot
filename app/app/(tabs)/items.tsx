import React, { useEffect } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Item } from '@/types/item';
import { PageHeader } from '@/components/ui/PageHeader';
import { DenseCard } from '@/components/ui/DenseCard';
import { Colors, Spacing } from '@/constants/DesignTokens';
import { useNavigation } from '@/contexts/NavigationContext';
import EmptyState from '@/components/common/emptyState';
import ListLoadingState from '@/components/listLoadingState';

export default function ItemsScreen() {
  const { data: items, isLoading } = useQuery<Item[]>({
    queryKey: ['/items'],
  });

  const { setActiveTab, setCurrentLevel, setCurrentContext } = useNavigation();

  useEffect(() => {
    setActiveTab('inventory');
    setCurrentLevel('portfolio');
    setCurrentContext({});
  }, []);

  const handleItemPress = (item: Item) => {
    router.push({
      pathname: '/(tabs)/item',
      params: { item_id: item.id },
    });
  };

  const calculateTotalValue = () => {
    if (!items) return 'R0';
    const total = items.reduce((sum, item) => {
      const price = typeof item.price === 'string' ? parseFloat(item.price) : (item.price || 0);
      return sum + (isNaN(price) ? 0 : price);
    }, 0);
    return `R${total.toLocaleString()}`;
  };

  const getItemThumbnail = (item: Item): { url: string | undefined; thumbnailUrl: string | undefined } => {
    const primaryImage = item.images?.find(img => img.is_primary);
    const image = primaryImage || item.images?.[0];
    return {
      url: image?.url || item.image || undefined,
      thumbnailUrl: image?.thumbnail_url || undefined,
    };
  };

  const formatPrice = (price: number | string | undefined): string | undefined => {
    if (price === undefined || price === null) return undefined;
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(numPrice)) return undefined;
    return `R${numPrice.toLocaleString()}`;
  };

  const renderItem = ({ item }: { item: Item }) => {
    const thumbnail = getItemThumbnail(item);
    return (
      <DenseCard
        title={item.description || item.brand || 'Unknown Item'}
        subtitle={item.model || item.category || 'No details'}
        valueBadge={item.price ? { text: formatPrice(item.price) || '', level: 'room' } : undefined}
        thumbnail={thumbnail.url}
        thumbnailSmall={thumbnail.thumbnailUrl}
        thumbnailIcon="cube-outline"
        onPress={() => handleItemPress(item)}
      />
    );
  };

  return (
    <View style={styles.container}>
      <PageHeader
        title="All Items"
        subtitle={`${items?.length || 0} items - ${calculateTotalValue()}`}
        level="portfolio"
      />

      <View style={styles.content}>
        {isLoading ? (
          <ListLoadingState />
        ) : items && items.length > 0 ? (
          <FlatList
            data={items}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <EmptyState title="No items yet" />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgCanvas,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xxxl,
    paddingTop: Spacing.lg,
  },
  list: {
    gap: Spacing.sm,
    paddingBottom: 100,
  },
});
