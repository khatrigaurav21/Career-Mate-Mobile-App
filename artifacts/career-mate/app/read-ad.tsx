import React, { useRef, useState } from 'react';
import { Platform, Text, View } from 'react-native';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import type { WebViewMessageEvent } from 'react-native-webview';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { api, blockedJobSite } from '@/lib/api';
import { CAPTURE_SCRIPT, checkCapturedAd } from '@/lib/adCapture';
import { useColors } from '@/hooks/useColors';
import { type } from '@/constants/typography';
import { Button, ErrorNotice, IconButton, LoadingNotice } from '@/components/ui';

/**
 * Opens a Seek or Indeed ad in an in-app browser so the user can see it and
 * tap "Use this ad". The page loads on their phone, as it would in any
 * browser; the app then reads the ad's text and evaluates it. See
 * lib/adCapture.ts for why, and for the page selectors.
 */
export default function ReadAd() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { session, hydrated } = useAuth();
  const { url } = useLocalSearchParams<{ url?: string }>();
  const webView = useRef<WebView>(null);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const site = url ? blockedJobSite(url) ?? 'the job site' : 'the job site';

  if (hydrated && !session) return <Redirect href="/" />;
  const safeUrl = url && /^https?:\/\//i.test(url) ? url : null;

  const captureAd = () => {
    setError('');
    webView.current?.injectJavaScript(CAPTURE_SCRIPT);
  };

  const onMessage = async (event: WebViewMessageEvent) => {
    const result = checkCapturedAd(event.nativeEvent.data);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setBusy(true);
    try {
      // Keep the link the user gave as the job's source, not wherever they
      // may have clicked to inside the browser.
      const evaluated = await api.evaluateCaptured(result.ad.text, safeUrl ?? result.ad.url);
      void queryClient.invalidateQueries({ queryKey: ['pipeline'] });
      router.replace(`/job/${evaluated.job_id}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'We could not evaluate that job.');
      setBusy(false);
    }
  };

  const header = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingTop: insets.top + 6, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.card }}>
      <IconButton icon="x" onPress={() => router.back()} label="Close and go back" />
      <View style={{ flex: 1 }}>
        <Text style={[type.bodySemibold, { color: colors.navy }]} numberOfLines={1}>{`Job ad on ${site}`}</Text>
        <Text style={[type.labelCaption, { color: colors.mutedForeground }]} numberOfLines={1}>{safeUrl ?? ''}</Text>
      </View>
      {Platform.OS !== 'web' && <IconButton icon="refresh-cw" onPress={() => { setLoaded(false); webView.current?.reload(); }} label="Reload the page" />}
    </View>
  );

  if (!safeUrl || Platform.OS === 'web') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {header}
        <View style={{ padding: 20, gap: 12 }}>
          <ErrorNotice message={!safeUrl ? 'That link can’t be opened.' : 'Reading an ad from Seek or Indeed works in the phone app. Here, copy the job description and use Paste text.'} />
          <Button variant="secondary" onPress={() => router.back()} icon="arrow-left">Back</Button>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {header}
      <WebView
        ref={webView}
        source={{ uri: safeUrl }}
        originWhitelist={['https://*', 'http://*']}
        onLoadEnd={() => setLoaded(true)}
        onMessage={(event) => void onMessage(event)}
        setSupportMultipleWindows={false}
        javaScriptEnabled
        domStorageEnabled
        style={{ flex: 1, backgroundColor: colors.card }}
      />
      <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: insets.bottom + 12, gap: 10, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.card }}>
        {busy ? (
          <LoadingNotice
            title="Reading the role…"
            detail="This can take up to two minutes."
            steps={[
              { label: 'Checking fit and work rights', estimatedMs: 45000 },
              { label: 'Writing your report', estimatedMs: 45000 },
            ]}
          />
        ) : (
          <>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Feather name="info" size={16} color={colors.mutedForeground} style={{ marginTop: 3 }} />
              <Text style={[type.bodyMd, { color: colors.mutedForeground, flex: 1 }]}>
                {`When you can see the job ad, tap Use this ad. If ${site} asks you to confirm you’re a person, do that first.`}
              </Text>
            </View>
            {error ? <ErrorNotice message={error} /> : null}
            <Button onPress={captureAd} disabled={!loaded} icon="check">Use this ad</Button>
          </>
        )}
      </View>
    </View>
  );
}
