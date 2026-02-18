import ListItemWithImage from '@/components/common/listItemWithImage';
import { Item } from '@/types/item';
import { router } from 'expo-router';

interface ItemInlineProps {
  item: Item;
}

/**
 * Renders a product list item with the total price and total number of items.
 */
const ItemInline = ({ item }: ItemInlineProps) => {
  return (
    <ListItemWithImage
      title={item.category ?? '--'}
      suffix={item.amount > 1 ? `x${item.amount}` : undefined}
      subTitle={`R${(item.price ?? 0) * item.amount} (${item.brand} ${item.model})`}
      image={item.image}
      onPress={() =>
        router.navigate({ pathname: 'item', params: { id: item.id } })
      }
    />
  );
};

export default ItemInline;
