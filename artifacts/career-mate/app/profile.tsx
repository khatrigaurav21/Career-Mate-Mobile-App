import React from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { Button, PageHeader, Screen } from '@/components/ui';
import { useColors } from '@/hooks/useColors';

export default function Profile() {
  const colors = useColors();
  const { profile, session, signOut } = useAuth();
  const confirmSignOut = () => {
    Alert.alert('Sign out?', 'You can come back anytime with another one-time code.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: async () => { await signOut(); router.replace('/login'); } },
    ]);
  };
  return (
    <Screen>
      <PageHeader eyebrow="Your profile" title="Career context" onBack={() => router.back()} />
      <View style={{ backgroundColor: colors.navy, borderRadius: 22, padding: 19, gap: 8 }}>
        <Feather name="mail" size={18} color={colors.primary} />
        <Text style={{ color: colors.onNavy, fontFamily: 'Inter_600SemiBold', fontSize: 16 }}>{session?.email}</Text>
        <Text style={{ color: colors.onNavyMuted, fontFamily: 'Inter_400Regular', fontSize: 13 }}>Your CV is used to make each evaluation specific to you.</Text>
      </View>
      <View style={{ gap: 11 }}>
        <Text style={{ color: colors.navy, fontFamily: 'Inter_700Bold', fontSize: 19 }}>Profile status</Text>
        <View style={{ borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, borderRadius: 18, padding: 16, gap: 12 }}>
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}><Feather name="check-circle" size={19} color={colors.success} /><Text style={{ color: colors.foreground, fontFamily: 'Inter_600SemiBold', fontSize: 14 }}>Profile is ready</Text></View>
          <Text numberOfLines={4} style={{ color: colors.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 20 }}>{profile?.cv_markdown || 'Your profile is ready for evaluations.'}</Text>
        </View>
      </View>
      <Button onPress={() => router.push('/setup?redo=1')} variant="secondary" icon="refresh-cw">Redo profile setup</Button>
      <Pressable onPress={confirmSignOut} style={{ minHeight: 50, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: colors.destructive, fontFamily: 'Inter_600SemiBold', fontSize: 14 }}>Sign out</Text>
      </Pressable>
    </Screen>
  );
}