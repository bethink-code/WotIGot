import { useTheme } from '@/hooks/useTheme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image, Pressable, Text, View } from 'react-native';

interface ListItemWithImageProps {
  /**
   * The title of the list item
   */
  title: string;
  /**
   * The title suffix of the list item
   */
  suffix?: string;
  /**
   * The subtitle of the list item
   */
  subTitle?: string;
  /**
   * The image uri of the list item
   */
  image?: string;
  /**
   * The function to call when the list item is pressed
   */
  onPress?: () => void;
}

/**
 * Renders a list item with an image and title
 */
const ListItemWithImage = ({
  title,
  suffix,
  subTitle,
  image,
  onPress,
}: ListItemWithImageProps) => {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        gap: 6,
        height: 60,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderColor: colors.border,
      }}
    >
      {image ? (
        <Image
          source={{ uri: image }}
          style={{
            width: 32,
            height: 32,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 6,
          }}
        />
      ) : (
        <View
          style={{
            width: 32,
            height: 32,
            backgroundColor: colors.backgroundDark,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 6,
          }}
        />
      )}
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontSize: 14 }}>{title}</Text>
          {suffix && (
            <Text
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: colors.textSecondary,
                marginLeft: 4,
              }}
            >
              {suffix}
            </Text>
          )}
        </View>
        {subTitle && (
          <Text
            style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}
          >
            {subTitle}
          </Text>
        )}
      </View>
      <MaterialCommunityIcons
        name="chevron-right"
        size={24}
        color={colors.textSecondary}
      />
    </Pressable>
  );
};

export default ListItemWithImage;
