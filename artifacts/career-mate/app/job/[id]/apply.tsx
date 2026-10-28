import React, { useEffect, useRef, useState } from 'react';
import { AppState, Linking, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import * as WebBrowser from 'expo-web-browser';
import { Feather } from '@expo/vector-icons';
import { JobGate } from '@/components/JobGate';
import { StepScreen } from '@/components/StepScreen';
import { AppliedPrompt } from '@/components/AppliedPrompt';
import { Button } from '@/components/ui';
import { api, getDocumentUrl } from '@/lib/api';
import type { JobDetail } from '@/lib/api';
import { parseContact } from '@/lib/contactDetails';
import { useColors } from '@/hooks/useColors';
import { type } from '@/constants/typography';

// The hand-off to the employer: open the application, attach the files, paste
// the details. Trozi can't fill someone else's form, so this makes each piece
// one tap, and asks "Did you apply?" when the person comes back.
export default function ApplyStep() {
  return <JobGate>{(job, id) => <ApplyBody job={job} id={id} />}</JobGate>;
}

function ApplyBody({ job, id }: { job: JobDetail; id: string }) {
  const colors = useColors();
  const adUrl = typeof job.source_url === 'string' && /^https?:\/\//.test(job.source_url) ? job.source_url : null;
  const cvUrl = getDocumentUrl(job, 'cv');
  const coverUrl = getDocumentUrl(job, 'cover');
  const cv = useQuery({ queryKey: ['cv', id], queryFn: () => api.getCv(id), enabled: !!cvUrl });
  const contact = parseContact(cv.data?.content.name, cv.data?.content.contact_line);

  // Ask "Did you apply?" once the person returns from the employer's site.
  const [leftForSite, setLeftForSite] = useState(false);
  const [askApplied, setAskApplied] = useState(false);
  const leftRef = useRef(false);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && leftRef.current && job.status === 'evaluated') {
        leftRef.current = false;
        setAskApplied(true);
      }
    });
    return () => sub.remove();
  }, [job.status]);

  const openAd = () => {
    if (!adUrl) return;
    leftRef.current = true;
    setLeftForSite(true);
    void Linking.openURL(adUrl);
  };

  return (
    <StepScreen
      eyebrow={[job.title, job.company].filter(Boolean).join(' · ') || 'This job'}
      title="Apply"
      primary={adUrl ? { label: 'Open the application', icon: 'external-link', onPress: openAd } : { label: 'Back to this job', onPress: () => router.replace(`/job/${id}`) }}
      secondary={{ label: 'Application questions', onPress: () => router.push(`/job/${id}/answers`) }}
    >
      {askApplied && job.status === 'evaluated' ? <AppliedPrompt jobId={job.job_id} onDone={() => setAskApplied(false)} /> : null}

      <Text style={[type.bodyMd, { color: colors.mutedForeground }]}>
        Trozi can’t fill in the employer’s form, so here is everything you’ll need, one tap each.
      </Text>

      <View style={{ gap: 10, padding: 16, borderRadius: 20, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
        <Text style={[type.titleCard, { color: colors.navy }]}>Attach these</Text>
        <FileRow icon="file-text" label="Tailored CV" url={cvUrl} makeLabel="Make my CV" onMake={() => router.push(`/job/${id}/cv`)} />
        <FileRow icon="edit-3" label="Cover letter" url={coverUrl} makeLabel="Make my letter" onMake={() => router.push(`/job/${id}/letter`)} />
        {coverUrl ? (
          <>
            <Text style={[type.labelCaption, { color: colors.mutedForeground }]}>
              If the form has a text box for the letter instead of an upload, copy it as text.
            </Text>
            <Button variant="ghost" icon="copy" onPress={() => router.push(`/job/${id}/letter`)}>Copy the letter as text</Button>
          </>
        ) : null}
      </View>

      {cvUrl && (contact.first || contact.email || contact.phone) ? (
        <View style={{ gap: 4, padding: 16, borderRadius: 20, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
          <Text style={[type.titleCard, { color: colors.navy }]}>Your details</Text>
          <Text style={[type.labelCaption, { color: colors.mutedForeground }]}>Tap one to copy it, then paste it into the form.</Text>
          {contact.first ? <CopyRow label="First name" value={contact.first} /> : null}
          {contact.family ? <CopyRow label="Family name" value={contact.family} /> : null}
          {contact.email ? <CopyRow label="Email" value={contact.email} /> : null}
          {contact.phone ? <CopyRow label="Phone" value={contact.phone} /> : null}
        </View>
      ) : null}

      {!adUrl ? <Text style={[type.bodyMd, { color: colors.mutedForeground }]}>We don’t have a link for this ad. Open it from where you found it.</Text> : null}
      {leftForSite && job.status === 'evaluated' && !askApplied ? (
        <Text style={[type.labelCaption, { color: colors.mutedForeground }]}>When you come back to Trozi we’ll ask if you applied.</Text>
      ) : null}
    </StepScreen>
  );
}

function FileRow({ icon, label, url, makeLabel, onMake }: { icon: keyof typeof Feather.glyphMap; label: string; url: string | null; makeLabel: string; onMake: () => void }) {
  const colors = useColors();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52 }}>
      <Feather name={icon} size={20} color={url ? colors.success : colors.mutedForeground} />
      <Text style={[type.bodySemibold, { color: colors.foreground, flex: 1 }]}>{label}</Text>
      {url ? (
        <Button variant="secondary" onPress={() => void WebBrowser.openBrowserAsync(url).catch(() => Linking.openURL(url))}>Open</Button>
      ) : (
        <Button variant="secondary" onPress={onMake}>{makeLabel}</Button>
      )}
    </View>
  );
}

function CopyRow({ label, value }: { label: string; value: string }) {
  const colors = useColors();
  const [copied, setCopied] = useState(false);
  return (
    <Pressable
      onPress={() =>
        void Clipboard.setStringAsync(value).then(() => {
          void Haptics.selectionAsync().catch(() => {});
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        })
      }
      accessibilityRole="button"
      accessibilityLabel={`Copy ${label}: ${value}`}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48, opacity: pressed ? 0.7 : 1 })}
    >
      <View style={{ flex: 1 }}>
        <Text style={[type.labelCaption, { color: colors.mutedForeground }]}>{label}</Text>
        <Text style={[type.bodyMd, { color: colors.foreground }]}>{value}</Text>
      </View>
      <Feather name={copied ? 'check' : 'copy'} size={18} color={copied ? colors.success : colors.mutedForeground} />
    </Pressable>
  );
}
