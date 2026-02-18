import Button from '@/components/common/button';
import { Control, useController } from 'react-hook-form';
import { Image, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

interface ImageInputProps {
  /**
   * The name of the field in the form
   */
  name: string;
  /**
   * The form control object returned by `useForm`
   */
  control: Control<any>;
}

/**
 * A component that allows the user to select an image from the device's library
 */
const ImageInput = ({ name, control }: ImageInputProps) => {
  const { field } = useController({ control, name });

  const pickImage = async () => {
    // No permissions request is necessary for launching the image library
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      quality: 0.83,
    });

    if (!result.canceled) {
      field.onChange(result.assets[0]);
    }
  };

  return (
    <View style={{ gap: 8, alignItems: 'flex-start' }}>
      {field.value ? (
        <>
          <Button title="Delete Image" onPress={() => field.onChange(null)} />
          <Image
            source={{ uri: field.value.uri }}
            style={{ width: 70, height: 70 }}
          />
        </>
      ) : (
        <Button title="Select Image" onPress={pickImage} />
      )}
    </View>
  );
};

export default ImageInput;
