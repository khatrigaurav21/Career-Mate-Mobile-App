import React, { useState } from 'react';
import { Text, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, ChoiceTile, ErrorNotice, Field, PageHeader, Screen } from '@/components/ui';
import { useColors } from '@/hooks/useColors';
import { api, isFallbackToPaste } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

type SetupMode = 'upload' | 'paste' | 'guided';

export default function Setup() {
  const colors = useColors();
  const { refreshProfile } = useAuth();
  const params = useLocalSearchParams<{ redo?: string }>();
  const [mode, setMode] = useState<SetupMode>('upload');
  const [cvText, setCvText] = useState('');
  const [file, setFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const update = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (!result.canceled) setFile(result.assets[0]);
  };

  const submit = async () => {
    setError('');
    if (mode === 'upload' && !file) {
      setError('Choose a PDF, DOCX, or text file first.');
      return;
    }
    if (mode === 'paste' && cvText.trim().length < 80) {
      setError('Paste a little more of your CV so we can work with it.');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'upload' && file) {
        await api.uploadProfile(file.uri, file.name, file.mimeType);
      } else if (mode === 'paste') {
        await api.pasteProfile(cvText.trim());
      } else {
        // target_roles lands in a Postgres text[] column and preferences
        // must be nested exactly like this — the backend reads
        // answers.target_roles (array) and answers.preferences (object);
        // anything else is either a type-mismatch insert error or silently
        // dropped.
        const splitList = (value: string) =>
          value
            .split(',')
            .map((entry) => entry.trim())
            .filter(Boolean);

        await api.intakeProfile({
          basic_info: {
            name: form.name ?? '',
            current_role: form.current_role ?? '',
            years_experience: form.years_experience ? Number(form.years_experience) : undefined,
          },
          work_history: form.work_history ?? '',
          education: form.education ?? '',
          skills: form.skills ?? '',
          proof_points: form.proof_points ?? '',
          target_roles: splitList(form.target_roles ?? ''),
          preferences: {
            location: form.location_preferences ?? '',
            salary_floor: form.salary_preferences ? Number(form.salary_preferences) : undefined,
            avoid: splitList(form.avoid_preferences ?? ''),
          },
        });
      }
      await refreshProfile();
      router.replace('/(tabs)');
    } catch (submitError) {
      if (isFallbackToPaste(submitError)) {
        setMode('paste');
        setError('We could not read that file. Paste your CV text below instead — it will be used as-is.');
      } else {
        setError(submitError instanceof Error ? submitError.message : 'We could not save your profile.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen contentStyle={{ paddingTop: 18 }}>
      <PageHeader
        eyebrow={params.redo ? 'Keep it current' : 'First things first'}
        title="Bring your best work"
        subtitle="Choose the way that feels easiest. Each path creates the same Career Mate profile."
      />
      <View style={{ flexDirection: 'row', gap: 9 }}>
        <ChoiceTile icon="upload" label="Upload a file" caption="Use the CV you already have" selected={mode === 'upload'} onPress={() => { setMode('upload'); setError(''); }} />
        <ChoiceTile icon="edit-3" label="Paste text" caption="Keep your content as-is" selected={mode === 'paste'} onPress={() => { setMode('paste'); setError(''); }} />
        <ChoiceTile icon="message-circle" label="Guided Q&A" caption="Build it from scratch" selected={mode === 'guided'} onPress={() => { setMode('guided'); setError(''); }} />
      </View>
      {mode === 'upload' && (
        <View style={[stylesCard(colors), { gap: 15 }]}>
          <Text style={{ color: colors.navy, fontFamily: 'Inter_600SemiBold', fontSize: 17 }}>Start with your existing CV</Text>
          <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 20 }}>
            PDF, DOCX, or plain text. Maximum file size is 5MB.
          </Text>
          <Button onPress={pickFile} variant="secondary" icon="paperclip">
            {file ? 'Choose a different file' : 'Choose CV file'}
          </Button>
          {file && <Text style={{ color: colors.teal, fontFamily: 'Inter_600SemiBold', fontSize: 13 }}>{file.name}</Text>}
        </View>
      )}
      {mode === 'paste' && (
        <Field label="Your CV" placeholder="Paste your CV text or markdown here..." value={cvText} onChangeText={setCvText} multiline helper="We’ll keep your content as the source of truth." />
      )}
      {mode === 'guided' && (
        <View style={{ gap: 14 }}>
          <Field label="Name" placeholder="Alex Morgan" value={form.name ?? ''} onChangeText={(value) => update('name', value)} />
          <Field label="Current role" placeholder="Product designer" value={form.current_role ?? ''} onChangeText={(value) => update('current_role', value)} />
          <Field label="Years of experience" placeholder="6" value={form.years_experience ?? ''} onChangeText={(value) => update('years_experience', value)} keyboardType="number-pad" />
          <Field label="Work history" placeholder="Company — Title — dates — achievements..." value={form.work_history ?? ''} onChangeText={(value) => update('work_history', value)} multiline />
          <Field label="Education" placeholder="Degree, institution, year" value={form.education ?? ''} onChangeText={(value) => update('education', value)} />
          <Field label="Skills" placeholder="Tools, methods, strengths" value={form.skills ?? ''} onChangeText={(value) => update('skills', value)} multiline />
          <Field label="Proof points" placeholder="Outcomes, metrics, wins, recognition" value={form.proof_points ?? ''} onChangeText={(value) => update('proof_points', value)} multiline />
          <Field label="Target roles" placeholder="Senior product designer, design lead" value={form.target_roles ?? ''} onChangeText={(value) => update('target_roles', value)} />
          <Field label="Location and salary preferences" placeholder="Remote, Darwin; $120k+" value={form.location_preferences ?? ''} onChangeText={(value) => update('location_preferences', value)} />
          <Field label="Anything to avoid?" placeholder="Industries, travel, or work patterns" value={form.avoid_preferences ?? ''} onChangeText={(value) => update('avoid_preferences', value)} />
        </View>
      )}
      {loading && mode === 'guided' && <Text style={{ color: colors.teal, fontFamily: 'Inter_500Medium', fontSize: 13, textAlign: 'center' }}>Writing your profile thoughtfully — this can take up to a minute.</Text>}
      {error && <ErrorNotice message={error} />}
      <Button onPress={submit} loading={loading} icon="arrow-right">{params.redo ? 'Save updated profile' : 'Build my profile'}</Button>
    </Screen>
  );
}

function stylesCard(colors: ReturnType<typeof useColors>) {
  return {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    padding: 18,
  };
}