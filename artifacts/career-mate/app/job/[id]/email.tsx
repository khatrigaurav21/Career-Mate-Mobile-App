import React, { useState } from 'react';
import { Linking, Text, TextInput, View, type TextStyle } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import { JobGate } from '@/components/JobGate';
import { StepScreen } from '@/components/StepScreen';
import { Button } from '@/components/ui';
import { api, getDocumentUrl } from '@/lib/api';
import type { JobDetail } from '@/lib/api';
import { draftApplicationEmail, findAdEmail } from '@/lib/adContact';
import { useColors } from '@/hooks/useColors';
import { type } from '@/constants/typography';

// The ad names an address to send your application to. Offer a short message
// to edit, then hand it to the phone's email app. The CV and letter can't be
// attached from here, so say so and link to them.
export default function EmailStep() {
  return <JobGate>{(job, id) => <EmailBody job={job} id={id} />}</JobGate>;
}

function EmailBody({ job, id }: { job: JobDetail; id: string }) {
  const colors = useColors();
  const to = findAdEmail(typeof job.raw_description === 'string' ? job.raw_description : null);
  const cvUrl = getDocumentUrl(job, 'cv');
  const coverUrl = getDocumentUrl(job, 'cover');
  const cv = useQuery({ queryKey: ['cv', id], queryFn: () => api.getCv(id), enabled: !!cvUrl });
  const draft = draftApplicationEmail({ title: job.title, company: job.company, name: cv.data?.content.name });
  const [subject, setSubject] = useState<string | null>(null);
  const [body, setBody] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const subjectText = subject ?? draft.subject;
  const bodyText = body ?? draft.body;

  const field: TextStyle[] = [type.bodyMd, { color: colors.foreground, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 12 }];

  if (!to) {
    return (
      <StepScreen eyebrow={job.title || 'This job'} title="Email in the ad" primary={{ label: 'Back to this job', onPress: () => router.replace(`/job/${id}`) }}>
        <Text style={[type.bodyMd, { color: colors.mutedForeground }]}>We couldn’t find an address to email in this ad.</Text>
      </StepScreen>
    );
  }

  const open = () => void Linking.openURL(`mailto:${to}?subject=${encodeURIComponent(subjectText)}&body=${encodeURIComponent(bodyText)}`);
  const copy = () => void Clipboard.setStringAsync(`To: ${to}\nSubject: ${subjectText}\n\n${bodyText}`).then(() => setCopied(true)).catch(() => {});

  return (
    <StepScreen
      eyebrow={[job.title, job.company].filter(Boolean).join(' · ') || 'This job'}
      title="Email in the ad"
      primary={{ label: 'Open in my email app', icon: 'mail', onPress: open }}
      secondary={{ label: copied ? 'Copied' : 'Copy the message', onPress: copy }}
    >
      <Text style={[type.bodyMd, { color: colors.mutedForeground }]}>This ad lists an address to send your application to.</Text>
      <View style={{ gap: 8 }}>
        <Text style={[type.labelCaption, { color: colors.mutedForeground }]}>To</Text>
        <Text selectable style={[type.titleCard, { color: colors.navy }]}>{to}</Text>
        <Text style={[type.labelCaption, { color: colors.mutedForeground }]}>Subject</Text>
        <TextInput value={subjectText} onChangeText={setSubject} accessibilityLabel="Email subject" style={field} />
        <Text style={[type.labelCaption, { color: colors.mutedForeground }]}>Message</Text>
        <TextInput value={bodyText} onChangeText={setBody} multiline accessibilityLabel="Email message" style={[...field, { minHeight: 200, textAlignVertical: 'top' }]} />
      </View>
      <View style={{ gap: 8, padding: 14, borderRadius: 16, backgroundColor: colors.warningSoft }}>
        <Text style={[type.bodyMd, { color: colors.foreground }]}>Attach your CV and cover letter before you send. Download them first:</Text>
        {cvUrl ? <Button variant="secondary" icon="file-text" onPress={() => void Linking.openURL(cvUrl)}>Open my CV</Button> : <Button variant="secondary" icon="file-text" onPress={() => router.push(`/job/${id}/cv`)}>Make my CV</Button>}
        {coverUrl ? <Button variant="secondary" icon="edit-3" onPress={() => void Linking.openURL(coverUrl)}>Open my cover letter</Button> : <Button variant="secondary" icon="edit-3" onPress={() => router.push(`/job/${id}/letter`)}>Make my cover letter</Button>}
      </View>
    </StepScreen>
  );
}
