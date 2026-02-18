import { useTheme } from '@/hooks/useTheme';
import { Picker, PickerProps } from '@react-native-picker/picker';
import { useQuery } from '@tanstack/react-query';
import { Control, useController } from 'react-hook-form';

interface AsyncSelectProps extends PickerProps {
  /**
   * The name of the field in the form
   */
  name: string;
  /**
   * The form control object returned by `useForm`
   */
  control: Control<any>;
  /**
   * API endpoint to fetch the options from
   */
  endpoint: string;
  /**
   * The field to use as the title of the option
   */
  titleField: string;
  /**
   * The field to use as the key of the option
   */
  keyField: string;
}

const AsyncSelect = ({
  name,
  control,
  endpoint,
  keyField,
  titleField,
  ...inputProps
}: AsyncSelectProps) => {
  const theme = useTheme();
  const { field } = useController({ control, name });
  const { data } = useQuery<any[]>({
    queryKey: [endpoint],
  });

  return (
    <Picker
      selectedValue={field.value}
      onValueChange={field.onChange}
      style={[
        {
          borderWidth: 1,
          borderColor: theme.colors.border,
          backgroundColor: '#ffffff',
          fontSize: theme.fontSize,
          height: 32,
          paddingHorizontal: 8,
        },
        inputProps.style,
      ]}
      {...inputProps}
    >
      {data?.map((item) => (
        <Picker.Item
          label={item[titleField]}
          value={item[keyField]}
          key={item[keyField]}
        />
      ))}
    </Picker>
  );
};

export default AsyncSelect;
