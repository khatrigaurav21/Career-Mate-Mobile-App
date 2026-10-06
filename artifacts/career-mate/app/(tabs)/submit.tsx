import React, { useState } from 'react';
import { Text, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as Clipboard from 'expo-clipboard';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Button, ChoiceTile, ErrorNotice, Field, LoadingNotice, PageHeader, Screen } from '@/components/ui';
import { useColors } from '@/hooks/useColors';
import { api, isFallbackToPaste } from '@/lib/api';

type SubmitMode = 'link' | 'paste' | 'file';

export default function SubmitJob() {
  const colors = useColors();
  // Filled in when a job is shared from another app (see ShareIntentHandler).
  const { sharedUrl, sharedText } = useLocalSearchParams<{ sharedUrl?: string; sharedText?: string }>();
  const fromShare = Boolean(sharedUrl || sharedText);
  const [mode, setMode] = useState<SubmitMode>(sharedText && !sharedUrl ? 'paste' : 'link');
  const [url, setUrl] = useState(sharedUrl ?? '');
  const [description, setDescription] = useState(sharedText ?? '');
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
        // The server says why (e.g. "Seek doesn't let apps read its job ads…").
        setError(submitError instanceof Error && submitError.message !== 'Something went wrong. Please try again.'
          ? submitError.message
          : 'We could not read that posting. Paste the job description instead and we’ll continue.');
      } else {
        setError(submitError instanceof Error ? submitError.message : 'We could not evaluate that job.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <PageHeader
        eyebrow="Evaluate"
        title="Check a role"
        subtitle="Choose how to share the job post."
        onBack={() => router.push('/(tabs)')}
      />
      {fromShare && (
        <View style={{ backgroundColor: colors.accent, borderRadius: 14, padding: 14, flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          <Feather name="share" size={18} color={colors.accentForeground} />
          <Text style={{ color: colors.accentForeground, fontFamily: 'Inter_500Medium', fontSize: 14, lineHeight: 20, flex: 1 }}>Shared post loaded. Check it, then evaluate.</Text>
        </View>
      )}
      <View style={{ flexDirection: 'row', gap: 9 }}>
        <ChoiceTile icon="link" label="Link" caption="Job URL" selected={mode === 'link'} onPress={() => { setMode('link'); setError(''); }} />
        <ChoiceTile icon="edit-3" label="Paste" caption="Job text" selected={mode === 'paste'} onPress={() => { setMode('paste'); setError(''); }} />
        <ChoiceTile icon="upload" label="Upload" caption="PDF or DOCX" selected={mode === 'file'} onPress={() => { setMode('file'); setError(''); }} />
      </View>
      {mode === 'link' && <Field label="Job posting URL" placeholder="https://company.com/jobs/role" value={url} onChangeText={setUrl} keyboardType="url" autoCapitalize="none" autoCorrect={false} />}
      {mode === 'paste' && (
        <Button
          variant="secondary"
          icon="clipboard"
          onPress={async () => {
            const copied = (await Clipboard.getStringAsync()).trim();
            if (copied) {
              setDescription(copied);
              setError('');
            } else {
              setError('Your clipboard is empty. Copy the job description first, then tap Paste again.');
            }
          }}
        >
          Paste from clipboard
        </Button>
      )}
      {mode === 'paste' && <Field label="Job description" placeholder="Paste the full job posting here..." value={description} onChangeText={setDescription} multiline />}
      {mode === 'file' && (
        <View style={{ borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, padding: 18, gap: 15 }}>
          <Text style={{ color: colors.navy, fontFamily: 'Inter_600SemiBold', fontSize: 17 }}>Upload a job post</Text>
          <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 20 }}>PDF, DOCX, or text · 5 MB max.</Text>
          <Button onPress={pickFile} variant="secondary" icon="paperclip">{file ? 'Choose a different file' : 'Choose job file'}</Button>
          {file && <Text style={{ color: colors.teal, fontFamily: 'Inter_600SemiBold', fontSize: 13 }}>{file.name}</Text>}
        </View>
      )}
      {loading && (
        <LoadingNotice
          title="Reading the role…"
          detail="This may take up to two minutes."
          steps={[
            { label: 'Reading the posting', estimatedMs: 30000 },
            { label: 'Comparing to your profile', estimatedMs: 45000 },
            { label: 'Writing your report', estimatedMs: 45000 },
          ]}
        />
      )}
      {error && <ErrorNotice message={error} />}
      <Button onPress={submit} loading={loading} icon="arrow-right">Evaluate this role</Button>
    </Screen>
  );
}
