import Button from '@/components/common/button';
import TextInput from '@/components/common/textInput';
import { useTheme } from '@/hooks/useTheme';
import { useLogin } from '@/lib/mutations';
import { useForm } from 'react-hook-form';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface LoginFormData {
  username: string;
  password: string;
}

/**
 * Renders a screen with login form
 */
const LoginForm = () => {
  const { mutate, isPending } = useLogin();
  const theme = useTheme();
  const { control, handleSubmit } = useForm<LoginFormData>({
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const onSubmit = (data: LoginFormData) => {
    mutate(data);
  };

  return (
    <SafeAreaView
      style={{
        backgroundColor: theme.colors.background,
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View style={{ width: '100%', maxWidth: 320, gap: 10 }}>
        <TextInput name="username" control={control} placeholder="Username" />
        <TextInput
          secureTextEntry
          name="password"
          control={control}
          placeholder="Password"
        />
        <Button
          title="Login"
          onPress={handleSubmit(onSubmit)}
          disabled={isPending}
        />
      </View>
    </SafeAreaView>
  );
};

export default LoginForm;
