import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import { Button, ErrorNotice, Field, IconButton, Screen, SectionEyebrow, styles } from '@/components/ui';
import { useColors } from '@/hooks/useColors';
import { api, isFallbackToPaste } from '@/lib/api';

type SubmitMode = 'link' | 'paste' | 'file';

export default function SubmitJob() {
  const colors = useColors();
  const [mode, setMode] = useState<SubmitMode>('link');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
    if (mode === 'link' && !url.trim()) return setError('Paste the job posting link first.');
    if (mode === 'paste' && description.trim().length < 80) return setError('Paste a little more of the job description so we can evaluate it.');
    if (mode === 'file' && !file) return setError('Choose the job description file first.');
    setLoading(true);
    try {
      const result = mode === 'link'
        ? await api.evaluateUrl(url.trim())
        : mode === 'paste'
          ? await api.evaluateText(description.trim())
          : await api.evaluateFile(file!.uri, file!.name, file!.mimeType);
      router.replace(`/job/${result.job_id}`);
    } catch (submitError) {
      if (isFallbackToPaste(submitError)) {
        setMode('paste');
        setError('We could not read that posting. Paste the job description instead and we’ll continue.');
      } else {
        setError(submitError instanceof Error ? submitError.message : 'We could not evaluate that job.');
      }
    } finally {
      setLoading(false);
    }
  };

  const tab = (value: SubmitMode, label: string, icon: keyof typeof import('@expo/vector-icons').Feather.glyphMap) => (
    <Pressable onPress={() => { setMode(value); setError(''); }} style={{ flex: 1, minHeight: 86, borderRadius: 16, padding: 10, alignItems: 'center', justifyContent: 'center', gap: 7, borderWidth: 1, borderColor: mode === value ? colors.primary : colors.border, backgroundColor: mode === value ? colors.card : colors.background }}>
      <IconButton icon={icon} onPress={() => { setMode(value); setError(''); }} label={label} />
      <Text style={{ color: mode === value ? colors.primary : colors.mutedForeground, fontFamily: 'Inter_600SemiBold', fontSize: 11, textAlign: 'center' }}>{label}</Text>
    </Pressable>
  );

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <IconButton icon="arrow-left" onPress={() => router.back()} label="Go back" />
        <View style={{ gap: 3 }}>
          <SectionEyebrow>New evaluation</SectionEyebrow>
          <Text style={{ color: colors.navy, fontFamily: 'Inter_700Bold', fontSize: 25, letterSpacing: -0.6 }}>Find the signal.</Text>
        </View>
      </View>
      <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 15, lineHeight: 22 }}>Give us the role in whichever format you have. We’ll do the reading.</Text>
      <View style={{ flexDirection: 'row', gap: 9 }}>
        {tab('link', 'Paste a link', 'link')}
        {tab('paste', 'Paste text', 'edit-3')}
        {tab('file', 'Upload file', 'upload')}
      </View>
      {mode === 'link' && <Field label="Job posting URL" placeholder="https://company.com/jobs/role" value={url} onChangeText={setUrl} keyboardType="url" autoCapitalize="none" autoCorrect={false} />}
      {mode === 'paste' && <Field label="Job description" placeholder="Paste the full job posting here..." value={description} onChangeText={setDescription} multiline helper="The more context you share, the more useful the evaluation." />}
      {mode === 'file' && (
        <View style={{ borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, padding: 18, gap: 15 }}>
          <Text style={{ color: colors.navy, fontFamily: 'Inter_600SemiBold', fontSize: 17 }}>Upload a job description</Text>
          <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 20 }}>PDF, DOCX, or plain text. Maximum file size is 5MB.</Text>
          <Button onPress={pickFile} variant="secondary" icon="paperclip">{file ? 'Choose a different file' : 'Choose job file'}</Button>
          {file && <Text style={{ color: colors.teal, fontFamily: 'Inter_600SemiBold', fontSize: 13 }}>{file.name}</Text>}
        </View>
      )}
      {loading && <View style={{ backgroundColor: colors.accent, borderRadius: 16, padding: 15, gap: 6 }}><Text style={{ color: colors.accentForeground, fontFamily: 'Inter_600SemiBold', fontSize: 14 }}>Reading the role carefully…</Text><Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19 }}>This can take up to two minutes while we fetch the posting and compare it with your profile.</Text></View>}
      {error && <ErrorNotice message={error} />}
      <Button onPress={submit} loading={loading} icon="arrow-right">Evaluate this role</Button>
    </Screen>
  );
}