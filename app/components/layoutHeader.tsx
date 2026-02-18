import { Pressable, Text, View } from 'react-native';
import { BottomTabHeaderProps } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { SafeAreaView } from 'react-native-safe-area-context';

const LayoutHeader = ({ options, navigation }: BottomTabHeaderProps) => {
  const { colors } = useTheme();

  return (
    <SafeAreaView
      style={{ padding: 8, shadowColor: '#0000001F', shadowRadius: 6 }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {navigation.canGoBack() && (
          <Pressable style={{ marginRight: 4 }} onPress={navigation.goBack}>
            <MaterialCommunityIcons
              name="chevron-left"
              size={24}
              color={colors.primary}
            />
          </Pressable>
        )}
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 20, fontWeight: 500 }}>{options.title}</Text>
        </View>
        {options.headerRight?.({})}
      </View>
    </SafeAreaView>
  );
};

export default LayoutHeader;
