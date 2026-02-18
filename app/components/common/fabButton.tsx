import { useTheme } from '@/hooks/useTheme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, PressableProps, Text, StyleSheet, Platform, ViewStyle } from 'react-native';

interface FabButtonProps extends PressableProps {
  title?: string;
}

const FabButton = (props: FabButtonProps) => {
  const { colors } = useTheme();
  
  const buttonStyle: ViewStyle = {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: colors.primary,
    padding: 4,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    ...(Platform.OS === 'web' 
      ? { boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.12)' } as any
      : { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 4, elevation: 4 }),
  };
  
  return (
    <Pressable {...props} style={[buttonStyle]}>
      <MaterialCommunityIcons name="plus" size={24} color={colors.background} />
      {props.title && (
        <Text style={{ color: 'white', marginRight: 4 }}>{props.title}</Text>
      )}
    </Pressable>
  );
};

export default FabButton;
