import React, { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { BrandMark, Button, ErrorNotice, Field, SectionEyebrow, styles } from '@/components/ui';
import { useColors } from '@/hooks/useColors';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function Login() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const requestCode = async () => {
    if (!email.trim() || !email.includes('@')) {
      setError('Enter a valid email address to continue.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await api.sendMagicLink(email.trim());
      setStep('code');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'We could not send your code.');
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    if (code.trim().length < 6) {
      setError('Enter the 6–8 digit code from your email.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const session = await api.verify(email.trim(), code.trim());
      await signIn(session);
      router.replace('/');
    } catch (verifyError) {
      setError(verifyError instanceof Error ? verifyError.message : 'That code did not work.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAwareScrollViewCompat
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ flexGrow: 1, padding: 22, paddingTop: insets.top + 30, paddingBottom: insets.bottom + 24 }}
      bottomOffset={80}
      keyboardShouldPersistTaps="handled"
    >
      <BrandMark />
      <View style={{ flex: 1, justifyContent: 'center', gap: 22, maxWidth: 480, width: '100%', alignSelf: 'center' }}>
        <View style={{ gap: 10 }}>
          <SectionEyebrow>Your next move</SectionEyebrow>
          <Text style={{ color: colors.navy, fontFamily: 'Inter_700Bold', fontSize: 34, letterSpacing: -1.2, lineHeight: 40 }}>
            Make every application count.
          </Text>
          <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 15, lineHeight: 23 }}>
            Career Mate turns your CV and a job posting into a clear, tailored plan.
          </Text>
        </View>
        <View style={{ gap: 15 }}>
          {step === 'email' ? (
            <>
              <Field
                label="Email address"
                placeholder="you@example.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="send"
                onSubmitEditing={requestCode}
              />
              <Button onPress={requestCode} loading={loading} icon="arrow-right" testID="send-code">
                Email me a code
              </Button>
              <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18, textAlign: 'center' }}>
                No password to remember. We’ll send a one-time sign-in code.
              </Text>
            </>
          ) : (
            <>
              <View style={{ gap: 5 }}>
                <Text style={{ color: colors.navy, fontFamily: 'Inter_600SemiBold', fontSize: 14 }}>Check your inbox</Text>
                <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19 }}>
                  Enter the code we sent to {email}.
                </Text>
              </View>
              <Field
                label="One-time code"
                placeholder="123456"
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                autoCapitalize="none"
                maxLength={8}
                returnKeyType="done"
                onSubmitEditing={verifyCode}
              />
              <Button onPress={verifyCode} loading={loading} icon="check" testID="verify-code">
                Continue
              </Button>
              <Pressable onPress={() => { setStep('email'); setCode(''); setError(''); }}>
                <Text style={{ color: colors.primary, fontFamily: 'Inter_600SemiBold', fontSize: 13, textAlign: 'center' }}>Use a different email</Text>
              </Pressable>
            </>
          )}
          {error && <ErrorNotice message={error} />}
        </View>
      </View>
      <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 11, textAlign: 'center' }}>
        By continuing, you agree to use Career Mate for your own career materials.
      </Text>
    </KeyboardAwareScrollViewCompat>
  );
}