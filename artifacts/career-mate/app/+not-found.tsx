import { Stack, router } from 'expo-router';
import { Text } from 'react-native';
import { Button, Screen } from '@/components/ui';
import { type } from '@/constants/typography';
import { useColors } from '@/hooks/useColors';

export default function NotFoundScreen() {
  const colors = useColors();

  return (
    <>
      <Stack.Screen options={{ title: 'Page not found' }} />
      <Screen
        scroll={false}
        contentStyle={{ alignItems: 'center', justifyContent: 'center', gap: 14 }}
      >
        <Text style={[type.headlineLg, { color: colors.navy, textAlign: 'center' }]}>
          Page not found
        </Text>
        <Text style={[type.bodyMd, { color: colors.mutedForeground, textAlign: 'center' }]}>
          We couldn&apos;t find that page.
        </Text>
        <Button onPress={() => router.replace('/(tabs)')} icon="home" style={{ alignSelf: 'stretch' }}>
          Go to Home
        </Button>
      </Screen>
    </>
  );
}
