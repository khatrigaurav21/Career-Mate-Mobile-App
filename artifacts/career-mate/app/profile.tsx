import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { Button, PageHeader, Screen } from '@/components/ui';
import { useColors } from '@/hooks/useColors';
import { api } from '@/lib/api';
import type { WorkRights } from '@/lib/api';
import { WorkRightsPicker, workRightsLabel } from '@/components/WorkRights';
import * as WebBrowser from 'expo-web-browser';
import { PRIVACY_POLICY_URL } from '@/lib/config';

export default function Profile() {
  const colors = useColors();
  const { profile, session, signOut, refreshProfile } = useAuth();
  const savedWorkRights = (profile?.preferences?.work_rights as WorkRights | undefined) ?? null;
  const [editingRights, setEditingRights] = useState(false);
  const [draftRights, setDraftRights] = useState<WorkRights | null>(savedWorkRights);
  const [savingRights, setSavingRights] = useState(false);
  const saveWorkRights = async () => {
    if (!draftRights) return;
    setSavingRights(true);
    try {
      await api.setWorkRights(draftRights);
      await refreshProfile();
      setEditingRights(false);
    } catch {
      Alert.alert('Couldn’t save', 'Something went wrong. Please try again.');
    } finally {
      setSavingRights(false);
    }
  };
  const confirmSignOut = () => {
    Alert.alert('Sign out?', 'You can come back anytime with another one-time code.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: async () => { await signOut(); router.replace('/login'); } },
    ]);
  };
  const [deleting, setDeleting] = useState(false);
  const deleteAccount = async () => {
    setDeleting(true);
    try {
      await api.deleteAccount();
      await signOut();
      router.replace('/login');
    } catch {
      setDeleting(false);
      Alert.alert('Couldn’t delete your account', 'Something went wrong. Please try again.');
    }
  };
  // Two steps on purpose: this permanently erases everything, with no undo.
  const confirmDeleteAccount = () => {
    Alert.alert(
      'Delete your account?',
      'This permanently deletes your profile, CV, every job evaluation and all generated CVs and cover letters.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          style: 'destructive',
          onPress: () =>
            Alert.alert('Are you sure?', 'This can’t be undone.', [
              { text: 'Keep my account', style: 'cancel' },
              { text: 'Delete everything', style: 'destructive', onPress: () => void deleteAccount() },
            ]),
        },
      ],
    );
  };
  return (
    <Screen>
      <PageHeader eyebrow="Your profile" title="Career context" onBack={() => router.back()} />
      <View style={{ backgroundColor: colors.inkPanel, borderRadius: 22, padding: 19, gap: 8 }}>
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
      <View style={{ gap: 11 }}>
        <Text style={{ color: colors.navy, fontFamily: 'Inter_700Bold', fontSize: 19 }}>Work rights</Text>
        <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20 }}>Each job is checked against this, so you know straight away whether you can legally take it.</Text>
        {editingRights ? (
          <>
            <WorkRightsPicker value={draftRights} onChange={setDraftRights} />
            <Button onPress={() => void saveWorkRights()} loading={savingRights} icon="check">Save work rights</Button>
            <Pressable onPress={() => { setDraftRights(savedWorkRights); setEditingRights(false); }} style={{ minHeight: 40, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_500Medium', fontSize: 14 }}>Cancel</Text>
            </Pressable>
          </>
        ) : (
          <Pressable onPress={() => { setDraftRights(savedWorkRights); setEditingRights(true); }} accessibilityRole="button" style={{ borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, borderRadius: 18, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Feather name="globe" size={19} color={savedWorkRights ? colors.teal : colors.warning} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ color: colors.foreground, fontFamily: 'Inter_600SemiBold', fontSize: 15 }}>{workRightsLabel(savedWorkRights?.status)}</Text>
              {savedWorkRights?.note ? <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 13 }}>{savedWorkRights.note}</Text> : null}
            </View>
            <Text style={{ color: colors.primary, fontFamily: 'Inter_600SemiBold', fontSize: 14 }}>{savedWorkRights ? 'Change' : 'Set'}</Text>
          </Pressable>
        )}
      </View>
      <Button onPress={() => router.push('/setup?redo=1')} variant="secondary" icon="refresh-cw">Redo profile setup</Button>
      <Pressable onPress={confirmSignOut} style={{ minHeight: 50, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: colors.destructive, fontFamily: 'Inter_600SemiBold', fontSize: 14 }}>Sign out</Text>
      </Pressable>
      <Pressable onPress={() => void WebBrowser.openBrowserAsync(PRIVACY_POLICY_URL)} accessibilityRole="link" style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_500Medium', fontSize: 13 }}>Privacy Policy</Text>
      </Pressable>
      <Pressable onPress={confirmDeleteAccount} disabled={deleting} style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center' }}>
        {deleting
          ? <ActivityIndicator color={colors.mutedForeground} />
          : <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_500Medium', fontSize: 13, textDecorationLine: 'underline' }}>Delete account</Text>}
      </Pressable>
    </Screen>
  );
}