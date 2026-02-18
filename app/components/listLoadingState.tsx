import { View } from 'moti';
import { Skeleton } from 'moti/skeleton';

const ListLoadingState = () => {
  return (
    <View style={{ gap: 4 }}>
      <Skeleton colorMode="light" height={60} width="100%" />
      <Skeleton colorMode="light" height={60} width="100%" />
      <Skeleton colorMode="light" height={60} width="100%" />
      <Skeleton colorMode="light" height={60} width="100%" />
      <Skeleton colorMode="light" height={60} width="100%" />
    </View>
  );
};

export default ListLoadingState;
