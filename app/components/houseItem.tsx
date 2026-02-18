import ListItemWithImage from '@/components/common/listItemWithImage';
import { House } from '@/types/house';
import { ItemsTotal } from '@/types/item';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';

interface HouseItemProps {
  house: House;
}

/**
 * Renders a house list item with the total price and total number of items.
 */
const HouseItem = ({ house }: HouseItemProps) => {
  const { data: itemsTotal } = useQuery<ItemsTotal>({
    queryKey: [`/houses/${house.id}/totals`],
  });

  return (
    <ListItemWithImage
      title={house.name}
      subTitle={
        itemsTotal?.total_items
          ? `R${itemsTotal.total_price} (${itemsTotal.total_items})`
          : '--'
      }
      image={house.image}
      onPress={() =>
        router.navigate({
          pathname: 'house',
          params: { id: house.id },
        })
      }
    />
  );
};

export default HouseItem;
