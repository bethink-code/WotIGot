import { ScrollView, View, ViewProps } from 'react-native';

interface ContainerProps extends ViewProps {
  /**
   * If true, the container will use a ScrollView
   * @default false
   */
  useScrollView?: boolean;
}

const Container = ({ useScrollView, ...props }: ContainerProps) =>
  useScrollView ? (
    <ScrollView
      {...props}
      style={{ flex: 1 }}
      contentContainerStyle={[{ padding: 8 }, props.style]}
    >
      {props.children}
    </ScrollView>
  ) : (
    <View {...props} style={[{ flex: 1, padding: 8 }, props.style]} />
  );

export default Container;
