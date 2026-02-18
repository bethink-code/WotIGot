import { useTheme } from '@/hooks/useTheme';
import { ButtonProps, Button as ButtonBase } from 'react-native';

const Button = (props: ButtonProps) => {
  const theme = useTheme();
  return <ButtonBase {...props} color={theme.colors.primary} />;
};

export default Button;
