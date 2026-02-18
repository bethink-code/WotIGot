import ListItemWithImage from '@/components/common/listItemWithImage';
import { ItemsTotal } from '@/types/item';
import { Room } from '@/types/room';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';

interface RoomItemProps {
  room: Room;
}

/**
 * Renders a room list item with the total price and total number of items.
 */
const RoomItem = ({ room }: RoomItemProps) => {
  const { data: itemsTotal } = useQuery<ItemsTotal>({
    queryKey: [`/rooms/${room.id}/totals`],
  });

  return (
    <ListItemWithImage
      title={room.name}
      subTitle={
        itemsTotal?.total_items
          ? `R${itemsTotal.total_price} (${itemsTotal.total_items})`
          : '--'
      }
      image={room.image}
      onPress={() =>
        router.navigate({
          pathname: 'room',
          params: { id: room.id },
        })
      }
    />
  );
};

export default RoomItem;
