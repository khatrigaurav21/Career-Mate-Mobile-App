import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';
import { type } from '@/constants/typography';
import { TroziMark } from '@/components/TroziMark';

/** "jane.smith@x.com" -> "JS"; "alex@x.com" -> "AL". */
export function initialsFromEmail(email?: string | null) {
  const local = (email ?? '').split('@')[0].replace(/[^a-zA-Z.\-_ ]/g, '');
  const parts = local.split(/[.\-_ ]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (parts[0] ?? '?').slice(0, 2).toUpperCase();
}

/**
 * Top bar shared by the three tabs: brand mark, "Trozi" with the
 * current section, and an initials avatar that opens Profile.
 */
export function AppHeader({ section }: { section: string }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  return (
    <View
      style={{
        paddingTop: insets.top + 10,
        paddingBottom: 12,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: colors.card,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      {/* The logo and name take you Home from any tab. */}
      <Pressable
        onPress={() => { if (section !== 'Home') router.replace('/(tabs)'); }}
        accessibilityRole="button"
        accessibilityLabel="Go to Home"
        style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44 }}
      >
        <TroziMark size={40} />
        <View style={{ flex: 1 }}>
          <Text style={[type.titleCard, { color: colors.navy }]}>Trozi</Text>
          <Text style={[type.labelCaption, { color: colors.mutedForeground }]}>{section}</Text>
        </View>
      </Pressable>
      <Pressable
        onPress={() => router.push('/profile')}
        accessibilityRole="button"
        accessibilityLabel="Open profile"
        hitSlop={4}
        style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.inkPanel, alignItems: 'center', justifyContent: 'center' }}
      >
        <Text style={[type.bodySemibold, { color: colors.onNavy }]}>{initialsFromEmail(session?.email)}</Text>
      </Pressable>
    </View>
  );
}
