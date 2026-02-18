import Container from '@/components/common/container';
import EmptyState from '@/components/common/emptyState';
import FabButton from '@/components/common/fabButton';
import ListLoadingState from '@/components/listLoadingState';
import RoomItem from '@/components/roomItem';
import { Room } from '@/types/room';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { FlatList } from 'react-native';

export default function RoomsScreen() {
  const { data, isLoading } = useQuery<Room[]>({
    queryKey: ['/rooms'],
  });

  return (
    <Container>
      {data ? (
        <FlatList
          ListEmptyComponent={<EmptyState title="No rooms found" />}
          refreshing={isLoading}
          data={data}
          renderItem={({ item }) => <RoomItem room={item} />}
          keyExtractor={(item) => item.id.toString()}
        />
      ) : (
        <ListLoadingState />
      )}
      <FabButton
        title="Add room"
        onPress={() => router.navigate({ pathname: 'addRoom' })}
      />
    </Container>
  );
}
