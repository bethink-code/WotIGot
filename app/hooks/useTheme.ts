import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useMemo } from 'react';

/**
 * Hook to get the current theme colors based on the device color scheme.
 * @returns Object with the current theme colors @see Colors.
 */
export function useTheme() {
  const colorScheme = useColorScheme() ?? 'light';

  return useMemo(
    () => ({
      colorScheme,
      fontSize: 12,
      colors: Colors[colorScheme],
    }),
    [colorScheme],
  );
}
