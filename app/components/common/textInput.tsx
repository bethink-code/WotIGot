import { useTheme } from '@/hooks/useTheme';
import { Control, RegisterOptions, useController } from 'react-hook-form';
import {
  TextInputProps as TextInputBaseProps,
  TextInput as TextInputBase,
  View,
  Text,
  StyleProp,
  ViewStyle,
} from 'react-native';

interface TextInputProps extends TextInputBaseProps {
  /**
   * The name of the field in the form
   */
  name: string;
  /**
   * The form control object returned by `useForm`
   */
  control: Control<any>;
  /**
   * The validation rules for the field (react-hook-form)
   */
  rules?: Exclude<
    RegisterOptions,
    'valueAsNumber' | 'valueAsDate' | 'setValueAs'
  >;
  /**
   * The prefix to display before the input
   */
  prefix?: string;
  /**
   * Additional styles for the root view
   */
  rootStyle?: StyleProp<ViewStyle> | undefined;
}

const TextInput = ({
  name,
  control,
  prefix,
  rules,
  rootStyle,
  ...inputProps
}: TextInputProps) => {
  const theme = useTheme();
  const { field, fieldState } = useController({ control, name, rules });

  return (
    <View style={rootStyle}>
      <View
        style={{
          paddingLeft: 8,
          flexDirection: 'row',
          alignItems: 'center',
          borderWidth: 1,
          borderColor: fieldState.error
            ? theme.colors.error
            : theme.colors.border,
        }}
      >
        {prefix && (
          <Text style={{ color: theme.colors.textSecondary }}>{prefix}</Text>
        )}
        <TextInputBase
          {...inputProps}
          value={typeof field.value !== 'undefined' ? String(field.value) : ''}
          onChangeText={field.onChange}
          style={[
            {
              flexGrow: 1,
              fontSize: theme.fontSize,
              height: 32,
              paddingHorizontal: 8,
            },
            inputProps.style,
          ]}
          placeholderTextColor={theme.colors.textSecondary}
        />
      </View>
      {fieldState.error && (
        <Text style={{ color: theme.colors.error, fontSize: 10, marginTop: 2 }}>
          {fieldState.error.message}
        </Text>
      )}
    </View>
  );
};

export default TextInput;
