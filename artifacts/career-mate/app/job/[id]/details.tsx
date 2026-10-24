import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { JobGate } from '@/components/JobGate';
import { StepScreen } from '@/components/StepScreen';
import { ReportView } from '@/components/ReportView';
import { AnimatedSection } from '@/components/ui';
import { reportLabels } from '@/lib/config';
import { useColors } from '@/hooks/useColors';

// The whole evaluation, section by section, for anyone who wants every detail.
export default function DetailsStep() {
  const colors = useColors();
  const [openSection, setOpenSection] = useState('');
  return (
    <JobGate>
      {(job) => {
        const entries = Object.entries(job.report ?? {}).filter(([, value]) => typeof value === 'string');
        return (
          <StepScreen eyebrow={[job.title, job.company].filter(Boolean).join(' · ') || 'This job'} title="Full report" showHome={false}>
            <View style={{ gap: 12 }}>
              {entries.map(([key, value]) => {
                const open = openSection === key;
                return (
                  <View key={key} style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 17, backgroundColor: colors.card, overflow: 'hidden' }}>
                    <Pressable onPress={() => setOpenSection(open ? '' : key)} style={{ minHeight: 57, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11 }}>
                        <View style={{ width: 27, height: 27, borderRadius: 9, backgroundColor: open ? colors.primary : colors.accent, alignItems: 'center', justifyContent: 'center' }}>
                          <Text style={{ color: open ? colors.primaryForeground : colors.accentForeground, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 12 }}>{key}</Text>
                        </View>
                        <Text style={{ color: colors.navy, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 16 }}>{reportLabels[key] ?? `Section ${key}`}</Text>
                      </View>
                      <Feather name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.mutedForeground} />
                    </Pressable>
                    <AnimatedSection open={open}>
                      <View style={{ paddingHorizontal: 16, paddingBottom: 16, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 15 }}>
                        <ReportView text={value} />
                      </View>
                    </AnimatedSection>
                  </View>
                );
              })}
            </View>
          </StepScreen>
        );
      }}
    </JobGate>
  );
}
