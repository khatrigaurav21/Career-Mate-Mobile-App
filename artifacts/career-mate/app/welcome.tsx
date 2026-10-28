import React, { useState } from 'react';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { Redirect, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useOnboarding } from '@/lib/onboarding';
import { useColors } from '@/hooks/useColors';
import { type } from '@/constants/typography';
import { Button } from '@/components/ui';

type Slide = {
  icon: keyof typeof Feather.glyphMap;
  eyebrow: string;
  title: string;
  body: string;
  points: string[];
};

type Question = {
  eyebrow: string;
  title: string;
  detail: string;
  answers: string[];
  reflection: string;
};

const QUESTIONS: Question[] = [
  {
    eyebrow: 'Your week',
    title: 'How does job searching fit into your week?',
    detail: 'There’s no right way to do it. Choose what feels closest.',
    answers: [
      'I set aside time for it',
      'I fit it around other things',
      'I save jobs to come back to later',
      'It’s not a challenge for me',
    ],
    reflection: 'Job searching fits into your week',
  },
  {
    eyebrow: 'The next step',
    title: 'What can slow down your next step?',
    detail: 'This can change from one day or job to the next.',
    answers: [
      'Finding a computer',
      'Finding time to tailor my documents',
      'Deciding whether a role is a good fit',
      'Keeping track of applications',
      'Nothing in particular',
    ],
    reflection: 'A next step can be slowed by',
  },
  {
    eyebrow: 'Your pace',
    title: 'If an application gets delayed, what does that mean to you?',
    detail: 'Choose what best reflects your experience, including if delays aren’t an issue.',
    answers: [
      'It can be hard to keep momentum',
      'It can make the search take longer',
      'I’m okay with my pace',
      'I don’t usually have to delay applying',
      'I haven’t really thought about it',
    ],
    reflection: 'About delays, you said',
  },
  {
    eyebrow: 'A little support',
    title: 'What would be useful right now?',
    detail: 'Pick one, even if what helps changes later.',
    answers: [
      'Getting started on my phone',
      'Checking a job’s fit before spending time on it',
      'Preparing a tailored CV and cover letter',
      'Keeping my applications organised',
      'Nothing right now',
    ],
    reflection: 'Right now, it could help to',
  },
];

// Copy follows DESIGN.md's rules: no claims the app can't back (no
// "verified", no auto-apply, no notifications), Seek is never read directly,
// and visa checks are guidance only.
const SLIDES: Slide[] = [
  {
    icon: 'compass',
    eyebrow: 'Welcome to Trozi',
    title: 'Know if a job is worth your time',
    body: 'Give Trozi a job ad and it scores how well you fit, using your CV — in about a minute.',
    points: ['A fit score out of 5', 'Where you match and where you fall short', 'What to change before you apply'],
  },
  {
    icon: 'shield',
    eyebrow: 'Work rights',
    title: 'Can you legally take it?',
    body: 'Every job is checked against your right to work, including Australia’s regional 491 and 494 visa conditions.',
    points: ['Eligible, check, or not on your visa', 'The line in the ad it’s based on', 'Guidance only — confirm anything unusual with a registered migration agent'],
  },
  {
    icon: 'file-text',
    eyebrow: 'Apply',
    title: 'A CV tailored to each job',
    body: 'Turn any evaluated job into a tailored CV and a cover letter, built only from what’s in your CV.',
    points: ['PDFs you can open and share', 'Nothing invented — your real experience, reordered for the role'],
  },
  {
    icon: 'flag',
    eyebrow: 'Track',
    title: 'From applied to offer',
    body: 'Mark where you are with each job. Trozi keeps track and helps at each step.',
    points: ['A nudge to follow up, with an email drafted for you', 'Interview prep with answers from your CV', 'Job titles you’re not searching for yet'],
  },
  {
    icon: 'share-2',
    eyebrow: 'Adding jobs',
    title: 'Bring jobs in your way',
    body:
      Platform.OS === 'android'
        ? 'Share a job link from LinkedIn or a company site straight to Trozi, or paste it into Evaluate.'
        : 'Copy a job link from LinkedIn or a company site and paste it into Evaluate.',
    points: [
      'Seek and Indeed links: the ad opens in Trozi. When you can see it, tap Use this ad',
      'Got the ad as a file? Upload a PDF or Word document',
    ],
  },
];

const TOTAL_STEPS = QUESTIONS.length + 1 + SLIDES.length;

export default function Welcome() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { session, hydrated } = useAuth();
  const { markWelcomeSeen } = useOnboarding();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Array<string | null>>(() => QUESTIONS.map(() => null));

  if (hydrated && !session) return <Redirect href="/" />;

  const summaryStep = QUESTIONS.length;
  const tourStart = summaryStep + 1;
  const inQuestion = step < QUESTIONS.length;
  const inSummary = step === summaryStep;
  const inTour = step >= tourStart;
  const slideIndex = step - tourStart;
  const slide = inTour ? SLIDES[slideIndex] : null;
  const last = inTour && slideIndex === SLIDES.length - 1;
  const question = inQuestion ? QUESTIONS[step] : null;
  const selectedAnswers = answers.flatMap((answer, index) =>
    answer ? [{ answer, reflection: QUESTIONS[index].reflection }] : [],
  );
  const selected = answers.filter((answer): answer is string => answer !== null);
  const needsComputer = selected.includes('Finding a computer');
  const wantsPhone = selected.includes('Getting started on my phone');
  const wantsDocuments =
    selected.includes('Finding time to tailor my documents') ||
    selected.includes('Preparing a tailored CV and cover letter');
  const wantsFitCheck =
    selected.includes('Deciding whether a role is a good fit') ||
    selected.includes('Checking a job’s fit before spending time on it');
  const wantsTracking =
    selected.includes('Keeping track of applications') ||
    selected.includes('Keeping my applications organised');
  const supportItems = [
    needsComputer || wantsPhone ? 'bring a job link into Evaluate from your phone' : null,
    wantsFitCheck ? 'check how a role fits your CV before deciding what to do next' : null,
    wantsDocuments ? 'prepare a tailored CV and cover letter from your CV' : null,
    wantsTracking ? 'keep track of each job’s stage in your pipeline' : null,
  ].filter((item): item is string => item !== null);
  const supportList =
    supportItems.length < 2
      ? supportItems[0] ?? ''
      : supportItems.length === 2
        ? supportItems.join(' and ')
        : `${supportItems.slice(0, -1).join(', ')}, and ${supportItems[supportItems.length - 1]}`;
  const supportText = selected.includes('Nothing right now')
    ? 'You said you don’t need anything extra right now. When you’re ready, Trozi can help you explore a role and prepare application materials.'
    : supportItems.length
      ? `Based on what you chose, Trozi may help you ${supportList}.`
      : selected.length
      ? 'Trozi can help you explore a role, understand how it fits, and prepare application materials when you’re ready.'
      : 'You can explore Trozi at your own pace. It can help you assess a role and prepare materials when you choose.';
  const finish = (to: '/(tabs)' | '/(tabs)/submit') => {
    void markWelcomeSeen();
    router.replace(to);
  };

  const goBack = () => {
    if (inQuestion) {
      setStep(Math.max(0, step - 1));
      return;
    }
    if (inSummary) {
      setStep(QUESTIONS.length - 1);
      return;
    }
    setStep(step === tourStart ? summaryStep : step - 1);
  };

  const selectAnswer = (answer: string) => {
    if (!question) return;
    setAnswers((current) => current.map((value, index) => (index === step ? answer : value)));
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        flexGrow: 1,
        paddingTop: insets.top + 12,
        paddingBottom: insets.bottom + 16,
        paddingHorizontal: 22,
      }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 44 }}>
        <View
          accessibilityRole="progressbar"
          accessibilityLabel={`Step ${step + 1} of ${TOTAL_STEPS}`}
          accessibilityValue={{ min: 1, max: TOTAL_STEPS, now: step + 1 }}
          style={{ flexDirection: 'row', gap: 5, flex: 1, paddingRight: 12 }}
        >
          {Array.from({ length: TOTAL_STEPS }, (_, index) => (
            <View
              key={index}
              style={{
                 flex: index === step ? 1.8 : 1,
                height: 7,
                borderRadius: 4,
                 backgroundColor: index <= step ? colors.primary : colors.border,
              }}
            />
          ))}
        </View>
        {!last && (
          <Pressable
            testID="welcome-skip"
            onPress={() => finish('/(tabs)')}
            accessibilityRole="button"
            accessibilityLabel={inTour ? 'Skip the tour and go to Home' : 'Skip onboarding and go to Home'}
            style={{ minHeight: 44, minWidth: 48, justifyContent: 'center', alignItems: 'flex-end' }}
          >
            <Text style={[type.bodySemibold, { color: colors.mutedForeground }]}>Skip</Text>
          </Pressable>
        )}
      </View>

      <View style={{ flexGrow: 1, justifyContent: 'center', gap: 18, paddingVertical: 22 }}>
        {inQuestion && question && (
          <>
            <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }}>
              <Feather name="message-circle" size={24} color={colors.teal} />
            </View>
            <View style={{ gap: 8 }}>
              <Text style={[type.labelEyebrow, { color: colors.teal }]}>A moment to reflect · {question.eyebrow}</Text>
              <Text accessibilityRole="header" style={[type.headlineLg, { color: colors.navy }]}>{question.title}</Text>
              <Text style={[type.bodyLg, { color: colors.foreground }]}>{question.detail}</Text>
            </View>
            <View accessibilityRole="radiogroup" accessibilityLabel={question.title} style={{ gap: 9 }}>
              {question.answers.map((answer, answerIndex) => {
                const selected = answers[step] === answer;
                return (
                  <Pressable
                    key={answer}
                    testID={`welcome-answer-${step + 1}-${answerIndex + 1}`}
                    onPress={() => selectAnswer(answer)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    accessibilityLabel={answer}
                    style={({ pressed }) => ({
                      minHeight: 54,
                      paddingHorizontal: 15,
                      paddingVertical: 12,
                      borderRadius: 16,
                      borderWidth: selected ? 2 : 1,
                      borderColor: selected ? colors.primary : colors.border,
                      backgroundColor: selected ? colors.card : colors.background,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                      opacity: pressed ? 0.78 : 1,
                    })}
                  >
                    <View
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 11,
                        borderWidth: selected ? 0 : 1.5,
                        borderColor: colors.input,
                        backgroundColor: selected ? colors.primary : 'transparent',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {selected && <Feather name="check" size={14} color={colors.primaryForeground} />}
                    </View>
                    <Text style={[type.bodyMd, { color: colors.foreground, flex: 1 }]}>{answer}</Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}

        {inSummary && (
          <>
            <View style={{ width: 62, height: 62, borderRadius: 31, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }}>
              <Feather name="book-open" size={27} color={colors.teal} />
            </View>
            <View style={{ gap: 8 }}>
              <Text style={[type.labelEyebrow, { color: colors.teal }]}>Your reflection</Text>
              <Text accessibilityRole="header" style={[type.headlineLg, { color: colors.navy }]}>A little about your search</Text>
              <Text style={[type.bodyLg, { color: colors.foreground }]}>
                {selectedAnswers.length
                  ? 'Here’s a reflection of what you chose to share.'
                  : 'You left these questions open for now. That’s completely fine — you can explore Trozi at your own pace.'}
              </Text>
            </View>
            <View style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 16, gap: 14 }}>
              {selectedAnswers.map((item) => (
                <View key={item.reflection} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 11 }}>
                  <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
                    <Feather name="check" size={15} color={colors.teal} />
                  </View>
                  <Text style={[type.bodyMd, { color: colors.foreground, flex: 1 }]}>
                    {item.reflection}: <Text style={type.bodySemibold}>{item.answer}.</Text>
                  </Text>
                </View>
              ))}
              <View style={{ borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 13, flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                <Feather name="smartphone" size={18} color={colors.teal} style={{ marginTop: 3 }} />
                <Text style={[type.bodyMd, { color: colors.foreground, flex: 1 }]}>{supportText}</Text>
              </View>
            </View>
            <Text style={[type.labelCaption, { color: colors.mutedForeground }]}>Your answers are only used for this reflection and aren’t saved to your profile.</Text>
          </>
        )}

        {inTour && slide && (
          <>
            <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }}>
              <Feather name={slide.icon} size={32} color={colors.teal} />
            </View>
            <View style={{ gap: 8 }}>
              <Text style={[type.labelEyebrow, { color: colors.teal }]}>{slide.eyebrow}</Text>
              <Text accessibilityRole="header" style={[type.headlineHero, { color: colors.navy }]}>{slide.title}</Text>
              <Text style={[type.bodyLg, { color: colors.foreground }]}>{slide.body}</Text>
            </View>
            <View style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 16, gap: 12 }}>
              {slide.points.map((point) => (
                <View key={point} style={{ flexDirection: 'row', gap: 10 }}>
                  <Feather name="check" size={16} color={colors.success} style={{ marginTop: 3 }} />
                  <Text style={[type.bodyMd, { color: colors.foreground, flex: 1 }]}>{point}</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </View>

      <View style={{ gap: 8 }}>
        {inQuestion && (
          <>
            <Button testID="welcome-question-next" onPress={() => setStep(step + 1)} icon="arrow-right">
              {step === QUESTIONS.length - 1 ? 'See my reflection' : 'Next'}
            </Button>
            <Button testID="welcome-skip-question" variant="ghost" onPress={() => setStep(step + 1)}>
              Skip this question
            </Button>
            {step > 0 && <Button testID="welcome-question-back" variant="ghost" onPress={goBack}>Back</Button>}
          </>
        )}
        {inSummary && (
          <>
            <Button testID="welcome-summary-continue" onPress={() => setStep(tourStart)} icon="arrow-right">Continue to the tour</Button>
            <Button testID="welcome-summary-edit" variant="ghost" onPress={() => setStep(QUESTIONS.length - 1)}>Edit my answers</Button>
            <Button testID="welcome-summary-back" variant="ghost" onPress={goBack}>Back</Button>
          </>
        )}
        {inTour && slide && (
          last ? (
            <>
              <Button testID="welcome-evaluate-first-job" onPress={() => finish('/(tabs)/submit')} icon="arrow-right">Evaluate my first job</Button>
              <Button testID="welcome-look-around" variant="ghost" onPress={() => finish('/(tabs)')}>Look around first</Button>
            </>
          ) : (
            <>
              <Button testID="welcome-tour-next" onPress={() => setStep(step + 1)} icon="arrow-right">Next</Button>
              <Button testID="welcome-tour-back" variant="ghost" onPress={goBack}>Back</Button>
            </>
          )
        )}
      </View>
    </ScrollView>
  );
}
