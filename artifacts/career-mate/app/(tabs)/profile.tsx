import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Updates from 'expo-updates';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { Button, Screen, SectionEyebrow } from '@/components/ui';
import { AppHeader, initialsFromEmail } from '@/components/AppHeader';
import { visaSummary, WorkRightsPicker } from '@/components/WorkRights';
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

// Which code is running: the built-in bundle, or an over-the-air update (its
// short id). Lets a tester and us confirm a fix actually arrived.
function versionLabel() {
  const id = Updates.updateId;
  return id ? `Update ${id.slice(0, 8)}` : 'Built-in version';
}

export default function Profile() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { profile, profileChecked, session, signOut, refreshProfile } = useAuth();
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
      <Screen topInset={false} contentStyle={{ paddingBottom: insets.bottom + 110 }}>
        <View style={{ gap: 4 }}>
          <SectionEyebrow>Your profile</SectionEyebrow>
          <Text style={[type.headlineLg, { color: colors.navy }]}>Career profile</Text>
        </View>

        <View style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 22, padding: 16, gap: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13 }}>
            <View style={{ width: 58, height: 58, borderRadius: 18, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={[type.titleCard, { color: colors.primaryForeground }]}>{initialsFromEmail(session?.email)}</Text>
            </View>
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={[type.labelCaption, { color: colors.mutedForeground }]}>Signed in as</Text>
              <Text numberOfLines={1} style={[type.bodySemibold, { color: colors.navy, flexShrink: 1 }]}>{session?.email}</Text>
              <View style={{ flexDirection: 'row', alignSelf: 'flex-start', alignItems: 'center', gap: 5, backgroundColor: !profileChecked ? colors.muted : savedWorkRights ? colors.successSoft : colors.warningSoft, borderRadius: 99, paddingHorizontal: 9, paddingVertical: 4 }}>
                {profileChecked
                  ? <Feather name={savedWorkRights ? 'check-circle' : 'info'} size={13} color={savedWorkRights ? colors.success : colors.warning} />
                  : <ActivityIndicator size="small" color={colors.mutedForeground} />}
                <Text style={[type.labelPill, { color: !profileChecked ? colors.mutedForeground : savedWorkRights ? colors.success : colors.warning }]}>{profileChecked ? savedWorkRights ? 'Work rights added' : 'Add your work rights' : 'Loading profile'}</Text>
              </View>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 9 }}>
            <ProfileMetric icon="target" label="Target roles" value={profileChecked ? String(profile?.target_roles?.length ?? 0) : 'Loading…'} colors={colors} />
            <ProfileMetric icon="file-text" label="CV profile" value={profileChecked ? profile?.cv_markdown ? 'Ready' : 'Add CV' : 'Loading…'} colors={colors} />
          </View>
        </View>

        <VisaPanel workRights={savedWorkRights} loading={!profileChecked} editing={editingRights} colors={colors} onEdit={() => { setDraftRights(savedWorkRights); setEditingRights(true); }} />
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
                <Text style={[type.labelCaption, { color: colors.mutedForeground }]}>{profileChecked ? profile?.cv_markdown ? updatedLabel(profile.updated_at) ?? 'Used for every evaluation' : 'Not added yet' : 'Loading CV profile'}</Text>
              </View>
            </View>
            {!profileChecked ? (
              <View accessibilityRole="progressbar" accessibilityLabel="Loading CV profile" style={{ minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <ActivityIndicator color={colors.primary} />
                <Text style={[type.bodyMd, { color: colors.mutedForeground }]}>Loading your CV profile…</Text>
              </View>
            ) : profile?.cv_markdown ? (
              <Text numberOfLines={3} style={[type.bodyMd, { color: colors.mutedForeground, flexShrink: 1 }]}>{profile.cv_markdown.replace(/[#*_>`-]/g, '').trim()}</Text>
            ) : (
              <Text style={[type.bodyMd, { color: colors.mutedForeground }]}>No CV added yet. Add one to personalize job evaluations.</Text>
            )}
            {profileChecked && (
              <Button onPress={() => router.push('/setup?redo=1')} variant="secondary" icon={profile?.cv_markdown ? 'refresh-cw' : 'file-text'}>{profile?.cv_markdown ? 'Update or replace CV' : 'Add a CV'}</Button>
            )}
          </View>
        </View>

        {preferenceRows.length > 0 && (
          <View style={{ gap: 10 }}>
            <SectionTitle icon="sliders" title="Preferences" colors={colors} />
            <View style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 22, overflow: 'hidden' }}>
              {preferenceRows.map((row, i) => (
                <View key={row.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: colors.border }}>
                  <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }}>
                    <Feather name={row.icon} size={17} color={colors.accentForeground} />
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={[type.bodySemibold, { color: colors.navy }]}>{row.label}</Text>
                    <Text style={[type.bodyMd, { color: colors.mutedForeground, flexShrink: 1 }]}>{row.value}</Text>
                  </View>
                </View>
              ))}
            </View>
            <Text style={[type.labelCaption, { color: colors.mutedForeground }]}>Change these with “{profile?.cv_markdown ? 'Update or replace CV' : 'Add a CV'}”.</Text>
          </View>
        )}

        <View style={{ backgroundColor: colors.warningSoft, borderRadius: 18, padding: 16, flexDirection: 'row', gap: 10 }}>
          <Feather name="info" size={18} color={colors.warning} style={{ marginTop: 2 }} />
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={[type.bodySemibold, { color: colors.warning }]}>Visa checks are guidance only</Text>
            <Text style={[type.bodyMd, { color: colors.foreground }]}>
              Trozi compares each job ad’s location and wording with the work rights you’ve set. It doesn’t verify your visa. Confirm anything unusual with a registered migration agent.
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
          <LinkRow icon="trending-up" label="Widen your search" onPress={() => router.push('/insights')} colors={colors} />
          <LinkRow icon="message-circle" label="Send feedback" onPress={() => router.push('/feedback')} colors={colors} />
          <LinkRow icon="shield" label="Privacy policy" onPress={() => void WebBrowser.openBrowserAsync(PRIVACY_POLICY_URL)} colors={colors} />
          <LinkRow icon="log-out" label="Sign out" tone="primary" onPress={confirmSignOut} colors={colors} />
          <Button
            onPress={confirmDeleteAccount}
            variant="danger"
            icon="trash-2"
            loading={deleting}
            style={{ minHeight: 44 }}
          >
            Delete account
          </Button>
          <Text style={[type.labelCaption, { color: colors.mutedForeground, textAlign: 'center' }]} selectable>
            {versionLabel()}
          </Text>
        </View>
      </Screen>
    </View>
  );
}

function ProfileMetric({ icon, label, value, colors }: { icon: keyof typeof Feather.glyphMap; label: string; value: string; colors: Colors }) {
  return (
    <View style={{ flex: 1, minHeight: 58, borderRadius: 14, backgroundColor: colors.muted, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 9 }}>
      <Feather name={icon} size={17} color={colors.accentForeground} />
      <View style={{ flex: 1 }}>
        <Text style={[type.labelCaption, { color: colors.mutedForeground }]}>{label}</Text>
        <Text style={[type.bodySemibold, { color: colors.navy }]}>{value}</Text>
      </View>
    </View>
  );
}

function VisaPanel({ workRights, loading, editing, onEdit, colors }: { workRights: WorkRights | null; loading: boolean; editing: boolean; onEdit: () => void; colors: Colors }) {
  const summary = workRights ? visaSummary(workRights) : null;
  return (
    <View style={{ backgroundColor: colors.inkPanel, borderRadius: 22, padding: 18, gap: 14 }}>
      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
        <Feather name="shield" size={20} color={colors.onNavy} style={{ marginTop: 2 }} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={[type.labelEyebrow, { color: colors.onNavyMuted }]}>Work rights</Text>
          <Text style={[type.headlineSm, { color: colors.onNavy }]}>{loading ? 'Loading…' : summary ? summary.title : 'Not set yet'}</Text>
        </View>
      </View>
      {loading ? (
        <View accessibilityRole="progressbar" accessibilityLabel="Loading work rights" style={{ minHeight: 80, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <ActivityIndicator color={colors.onNavy} />
          <Text style={[type.bodyMd, { color: colors.onNavyMuted }]}>Checking your profile…</Text>
        </View>
      ) : summary ? (
        <>
          <PanelRow icon="map" label="Where you can work" value={summary.areas} colors={colors} />
          <PanelRow icon="briefcase" label="Who you can work for" value={summary.entitlement} colors={colors} />
          {workRights?.note ? <PanelRow icon="edit-3" label="Your note" value={workRights.note} colors={colors} /> : null}
        </>
      ) : (
        <Text style={[type.bodyMd, { color: colors.onNavyMuted }]}>Set your work rights so every job is checked against where you can legally work.</Text>
      )}
      {!loading && !editing && (
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
