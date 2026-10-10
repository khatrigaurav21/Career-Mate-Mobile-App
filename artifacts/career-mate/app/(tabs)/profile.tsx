import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { useAuth } from '@/context/AuthContext';
import { Button, Screen, SectionEyebrow } from '@/components/ui';
import { AppHeader, initialsFromEmail } from '@/components/AppHeader';
import { VISA_SUMMARY, WorkRightsPicker } from '@/components/WorkRights';
import { useColors } from '@/hooks/useColors';
import { type } from '@/constants/typography';
import { api } from '@/lib/api';
import type { WorkRights } from '@/lib/api';
import { PRIVACY_POLICY_URL } from '@/lib/config';
import { useOnboarding } from '@/lib/onboarding';

type Colors = ReturnType<typeof useColors>;

function updatedLabel(iso?: string) {
  if (!iso) return null;
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (Number.isNaN(days)) return null;
  if (days <= 0) return 'Updated today';
  if (days === 1) return 'Updated yesterday';
  if (days < 30) return `Updated ${days} days ago`;
  return `Updated ${new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}`;
}

export default function Profile() {
  const colors = useColors();
  const { profile, session, signOut, refreshProfile } = useAuth();
  const onboarding = useOnboarding();
  const savedWorkRights = (profile?.preferences?.work_rights as WorkRights | undefined) ?? null;
  const [editingRights, setEditingRights] = useState(false);
  const [draftRights, setDraftRights] = useState<WorkRights | null>(savedWorkRights);
  const [savingRights, setSavingRights] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  const prefs = (profile?.preferences ?? {}) as { location?: string; salary_floor?: number; avoid?: string[] };
  const preferenceRows = [
    profile?.target_roles?.length ? { icon: 'target' as const, label: 'Target roles', value: profile.target_roles.join(', ') } : null,
    prefs.location ? { icon: 'map-pin' as const, label: 'Preferred locations', value: prefs.location } : null,
    prefs.salary_floor ? { icon: 'dollar-sign' as const, label: 'Minimum salary', value: `$${prefs.salary_floor.toLocaleString('en-AU')}` } : null,
    prefs.avoid?.length ? { icon: 'slash' as const, label: 'Avoid', value: prefs.avoid.join(', ') } : null,
  ].filter(Boolean) as { icon: keyof typeof Feather.glyphMap; label: string; value: string }[];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AppHeader section="Profile" />
      <Screen topInset={false}>
        <View style={{ gap: 4 }}>
          <SectionEyebrow>Your account</SectionEyebrow>
          <Text style={[type.headlineLg, { color: colors.navy }]}>Profile & work rights</Text>
          <Text style={[type.bodyLg, { color: colors.mutedForeground }]}>Your visa, your CV and your account.</Text>
        </View>

        <View style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: colors.inkPanel, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={[type.titleCard, { color: colors.onNavy }]}>{initialsFromEmail(session?.email)}</Text>
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[type.labelCaption, { color: colors.mutedForeground }]}>Signed in as</Text>
            <Text numberOfLines={1} style={[type.bodySemibold, { color: colors.navy }]}>{session?.email}</Text>
          </View>
        </View>

        <VisaPanel workRights={savedWorkRights} editing={editingRights} colors={colors} onEdit={() => { setDraftRights(savedWorkRights); setEditingRights(true); }} />
        {editingRights && (
          <View style={{ gap: 10 }}>
            <WorkRightsPicker value={draftRights} onChange={setDraftRights} />
            <Button onPress={() => void saveWorkRights()} loading={savingRights} icon="check">Save work rights</Button>
            <Pressable onPress={() => { setDraftRights(savedWorkRights); setEditingRights(false); }} style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={[type.bodySemibold, { color: colors.mutedForeground }]}>Cancel</Text>
            </Pressable>
          </View>
        )}

        <View style={{ gap: 10 }}>
          <SectionTitle icon="file-text" title="CV profile" colors={colors} />
          <View style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 16, gap: 12 }}>
            <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
              <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: colors.destructiveSoft, alignItems: 'center', justifyContent: 'center' }}>
                <Feather name="file-text" size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[type.titleCard, { color: colors.navy }]}>Your CV</Text>
                <Text style={[type.labelCaption, { color: colors.mutedForeground }]}>{updatedLabel(profile?.updated_at) ?? 'Used for every evaluation'}</Text>
              </View>
            </View>
            {profile?.cv_markdown ? (
              <Text numberOfLines={3} style={[type.bodyMd, { color: colors.mutedForeground }]}>{profile.cv_markdown.replace(/[#*_>`-]/g, '').trim()}</Text>
            ) : null}
            <Button onPress={() => router.push('/setup?redo=1')} variant="secondary" icon="refresh-cw">Update or replace CV</Button>
          </View>
        </View>

        {preferenceRows.length > 0 && (
          <View style={{ gap: 10 }}>
            <SectionTitle icon="sliders" title="Preferences" colors={colors} />
            <View style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 18, overflow: 'hidden' }}>
              {preferenceRows.map((row, i) => (
                <View key={row.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: colors.border }}>
                  <Feather name={row.icon} size={18} color={colors.teal} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={[type.bodySemibold, { color: colors.navy }]}>{row.label}</Text>
                    <Text style={[type.bodyMd, { color: colors.mutedForeground }]}>{row.value}</Text>
                  </View>
                </View>
              ))}
            </View>
            <Text style={[type.labelCaption, { color: colors.mutedForeground }]}>Change these with “Update or replace CV”.</Text>
          </View>
        )}

        <View style={{ backgroundColor: colors.warningSoft, borderRadius: 18, padding: 16, flexDirection: 'row', gap: 10 }}>
          <Feather name="info" size={18} color={colors.warning} style={{ marginTop: 2 }} />
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={[type.bodySemibold, { color: colors.warning }]}>Visa checks are guidance only</Text>
            <Text style={[type.bodyMd, { color: colors.foreground }]}>
              Career Mate compares each job ad’s location and wording with the work rights you’ve set. It doesn’t verify your visa. Confirm anything unusual with a registered migration agent.
            </Text>
          </View>
        </View>

        <View style={{ gap: 2 }}>
          <LinkRow
            icon="play-circle"
            label="Show the app tour again"
            onPress={() => {
              void onboarding.restart().then(() => router.push('/welcome'));
            }}
            colors={colors}
          />
          <LinkRow icon="shield" label="Privacy Policy" onPress={() => void WebBrowser.openBrowserAsync(PRIVACY_POLICY_URL)} colors={colors} />
          <LinkRow icon="log-out" label="Sign out" tone="primary" onPress={confirmSignOut} colors={colors} />
          <Pressable onPress={confirmDeleteAccount} disabled={deleting} accessibilityRole="button" style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center' }}>
            {deleting
              ? <ActivityIndicator color={colors.mutedForeground} />
              : <Text style={[type.bodyMd, { color: colors.mutedForeground, textDecorationLine: 'underline' }]}>Delete account</Text>}
          </Pressable>
        </View>
      </Screen>
    </View>
  );
}

function VisaPanel({ workRights, editing, onEdit, colors }: { workRights: WorkRights | null; editing: boolean; onEdit: () => void; colors: Colors }) {
  const summary = workRights ? VISA_SUMMARY[workRights.status] : null;
  return (
    <View style={{ backgroundColor: colors.inkPanel, borderRadius: 18, padding: 18, gap: 14 }}>
      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
        <Feather name="shield" size={20} color={colors.onNavy} style={{ marginTop: 2 }} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={[type.labelEyebrow, { color: colors.onNavyMuted }]}>Work rights</Text>
          <Text style={[type.headlineSm, { color: colors.onNavy }]}>{summary ? summary.title : 'Not set yet'}</Text>
        </View>
      </View>
      {summary ? (
        <>
          <PanelRow icon="map" label="Where you can work" value={summary.areas} colors={colors} />
          <PanelRow icon="briefcase" label="Who you can work for" value={summary.entitlement} colors={colors} />
          {workRights?.note ? <PanelRow icon="edit-3" label="Your note" value={workRights.note} colors={colors} /> : null}
        </>
      ) : (
        <Text style={[type.bodyMd, { color: colors.onNavyMuted }]}>Set your work rights so every job is checked against where you can legally work.</Text>
      )}
      {!editing && (
        <Pressable
          onPress={onEdit}
          accessibilityRole="button"
          style={({ pressed }) => ({ minHeight: 48, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.12)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: pressed ? 0.8 : 1 })}
        >
          <Feather name="sliders" size={16} color={colors.onNavy} />
          <Text style={[type.bodySemibold, { color: colors.onNavy }]}>{summary ? 'Update work rights' : 'Set work rights'}</Text>
        </Pressable>
      )}
    </View>
  );
}

function PanelRow({ icon, label, value, colors }: { icon: keyof typeof Feather.glyphMap; label: string; value: string; colors: Colors }) {
  return (
    <View style={{ flexDirection: 'row', gap: 10 }}>
      <Feather name={icon} size={16} color={colors.onNavyMuted} style={{ marginTop: 3 }} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[type.labelCaption, { color: colors.onNavyMuted }]}>{label}</Text>
        <Text style={[type.bodyMd, { color: colors.onNavy }]}>{value}</Text>
      </View>
    </View>
  );
}

function SectionTitle({ icon, title, colors }: { icon: keyof typeof Feather.glyphMap; title: string; colors: Colors }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Feather name={icon} size={18} color={colors.teal} />
      <Text style={[type.headlineSm, { color: colors.navy }]}>{title}</Text>
    </View>
  );
}

function LinkRow({ icon, label, onPress, colors, tone }: { icon: keyof typeof Feather.glyphMap; label: string; onPress: () => void; colors: Colors; tone?: 'primary' }) {
  const color = tone === 'primary' ? colors.primary : colors.navy;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => ({ minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: pressed ? 0.7 : 1 })}>
      <Feather name={icon} size={16} color={color} />
      <Text style={[type.bodySemibold, { color }]}>{label}</Text>
    </Pressable>
  );
}
