import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';
import { type } from '@/constants/typography';

/** "jane.smith@x.com" -> "JS"; "alex@x.com" -> "AL". */
export function initialsFromEmail(email?: string | null) {
  const local = (email ?? '').split('@')[0].replace(/[^a-zA-Z.\-_ ]/g, '');
  const parts = local.split(/[.\-_ ]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (parts[0] ?? '?').slice(0, 2).toUpperCase();
}

/**
 * Top bar shared by the three tabs: brand mark, "Career Mate" with the
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
      <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
        <Feather name="arrow-up-right" size={20} color={colors.primaryForeground} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[type.titleCard, { color: colors.navy }]}>Career Mate</Text>
        <Text style={[type.labelCaption, { color: colors.mutedForeground }]}>{section}</Text>
      </View>
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
