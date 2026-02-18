import { Text, View } from 'react-native';

interface EmptyStateProps {
  /**
   * The title of the empty state
   */
  title: string;
}

/**
 * Renders an empty state with a title (used when there is no data to display)
 */
const EmptyState = ({ title }: EmptyStateProps) => (
  <View
    style={{
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 24,
    }}
  >
    <Text>{title}</Text>
  </View>
);

export default EmptyState;
