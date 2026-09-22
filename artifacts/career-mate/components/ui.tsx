import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

export function Screen({
  children,
  scroll = true,
  contentStyle,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const content = (
    <View
      style={[
        styles.screenContent,
        {
          paddingTop: insets.top + 20,
          paddingBottom: insets.bottom + 28,
          backgroundColor: colors.background,
        },
        contentStyle,
      ]}
    >
      {children}
    </View>
  );
  return scroll ? (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {content}
    </ScrollView>
  ) : (
    <View style={{ flex: 1, backgroundColor: colors.background }}>{content}</View>
  );
}

export function BrandMark({ compact = false }: { compact?: boolean }) {
  const colors = useColors();
  return (
    <View style={styles.brandRow}>
      <View style={[styles.brandMark, { backgroundColor: colors.primary }]}>
        <Feather name="arrow-up-right" size={compact ? 18 : 23} color={colors.primaryForeground} />
      </View>
      {!compact && (
        <Text style={[styles.brandName, { color: colors.navy }]}>
          career<Text style={{ color: colors.primary }}>mate</Text>
        </Text>
      )}
    </View>
  );
}

export function Button({
  children,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  icon,
  style,
  testID,
}: {
  children: React.ReactNode;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Feather.glyphMap;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  const colors = useColors();
  const background =
    variant === 'primary'
      ? colors.primary
      : variant === 'secondary'
        ? colors.secondary
        : variant === 'danger'
          ? colors.destructive
          : 'transparent';
  const foreground =
    variant === 'primary' || variant === 'danger'
      ? colors.primaryForeground
      : variant === 'secondary'
        ? colors.secondaryForeground
        : colors.primary;
  return (
    <Pressable
      testID={testID}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: background,
          opacity: pressed || disabled ? 0.72 : 1,
          shadowColor: colors.navy,
          shadowOpacity: variant === 'primary' && !disabled ? 0.12 : 0,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 5 },
          elevation: variant === 'primary' && !disabled ? 2 : 0,
        },
        variant === 'ghost' && styles.ghostButton,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={foreground} />
      ) : (
        <>
          {icon && <Feather name={icon} size={17} color={foreground} />}
          <Text style={[styles.buttonText, { color: foreground }]}>{children}</Text>
        </>
      )}
    </Pressable>
  );
}

export function IconButton({
  icon,
  onPress,
  label,
}: {
  icon: keyof typeof Feather.glyphMap;
  onPress: () => void;
  label: string;
}) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={10}
      style={({ pressed }) => [
        styles.iconButton,
        { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.6 : 1 },
      ]}
    >
      <Feather name={icon} size={21} color={colors.navy} />
    </Pressable>
  );
}

export function Field({
  label,
  helper,
  multiline = false,
  ...props
}: TextInputProps & { label?: string; helper?: string }) {
  const colors = useColors();
  return (
    <View style={styles.fieldGroup}>
      {label && <Text style={[styles.fieldLabel, { color: colors.navy }]}>{label}</Text>}
      <TextInput
        {...props}
        multiline={multiline}
        placeholderTextColor={colors.mutedForeground}
        style={[
          styles.input,
          { backgroundColor: colors.card, borderColor: colors.input, color: colors.foreground },
          multiline && styles.multilineInput,
          props.style,
        ]}
      />
      {helper && <Text style={[styles.helper, { color: colors.mutedForeground }]}>{helper}</Text>}
    </View>
  );
}

export function SectionEyebrow({ children }: { children: React.ReactNode }) {
  const colors = useColors();
  return <Text style={[styles.eyebrow, { color: colors.primary }]}>{children}</Text>;
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  onBack,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  onBack?: () => void;
}) {
  const colors = useColors();
  return (
    <View style={styles.pageHeader}>
      {onBack && <IconButton icon="arrow-left" onPress={onBack} label="Go back" />}
      <View style={styles.pageHeaderCopy}>
        <SectionEyebrow>{eyebrow}</SectionEyebrow>
        <Text style={[styles.pageTitle, { color: colors.navy }]}>{title}</Text>
        {subtitle && <Text style={[styles.pageSubtitle, { color: colors.mutedForeground }]}>{subtitle}</Text>}
      </View>
    </View>
  );
}

export function ChoiceTile({
  icon,
  label,
  caption,
  selected,
  onPress,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  caption: string;
  selected: boolean;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.choiceTile,
        {
          borderColor: selected ? colors.primary : colors.border,
          backgroundColor: selected ? colors.card : colors.background,
          opacity: pressed ? 0.76 : 1,
        },
      ]}
    >
      <View style={[styles.choiceIcon, { backgroundColor: selected ? colors.primary : colors.muted }]}>
        <Feather name={icon} size={18} color={selected ? colors.primaryForeground : colors.mutedForeground} />
      </View>
      <Text style={[styles.choiceLabel, { color: selected ? colors.navy : colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.choiceCaption, { color: colors.mutedForeground }]}>{caption}</Text>
    </Pressable>
  );
}

export function StatusChip({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'success' | 'warning' | 'neutral' }) {
  const colors = useColors();
  const background = tone === 'success' ? colors.successSoft : tone === 'warning' ? colors.warningSoft : colors.muted;
  const foreground = tone === 'success' ? colors.success : tone === 'warning' ? colors.warning : colors.mutedForeground;
  return (
    <View style={[styles.statusChip, { backgroundColor: background }]}>
      <Text style={[styles.statusChipText, { color: foreground }]}>{children}</Text>
    </View>
  );
}

export function LoadingState({ title, detail }: { title: string; detail: string }) {
  const colors = useColors();
  return (
    <View style={styles.loadingState}>
      <View style={[styles.loadingOrb, { backgroundColor: colors.accent }]}>
        <ActivityIndicator color={colors.teal} size="large" />
      </View>
      <Text style={[styles.loadingTitle, { color: colors.navy }]}>{title}</Text>
      <Text style={[styles.loadingDetail, { color: colors.mutedForeground }]}>{detail}</Text>
    </View>
  );
}

export function ErrorNotice({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  const colors = useColors();
  return (
    <View style={[styles.errorBox, { backgroundColor: colors.card, borderColor: colors.destructive }]}>
      <Feather name="alert-circle" size={18} color={colors.destructive} />
      <View style={{ flex: 1, gap: 6 }}>
        <Text style={[styles.errorText, { color: colors.foreground }]}>{message}</Text>
        {onRetry && (
          <Pressable onPress={onRetry}>
            <Text style={[styles.retryText, { color: colors.primary }]}>Try again</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

export function ScoreRing({ score, size = 74 }: { score: number | null; size?: number }) {
  const colors = useColors();
  const tone = score === null ? colors.mutedForeground : score >= 4 ? colors.success : score >= 2.8 ? colors.amber : colors.destructive;
  return (
    <View
      style={[
        styles.scoreRing,
        { width: size, height: size, borderRadius: size / 2, borderColor: tone },
      ]}
    >
      <Text style={[styles.scoreNumber, { color: tone, fontSize: size * 0.31 }]}>
        {score === null ? '—' : score.toFixed(1)}
      </Text>
      <Text style={[styles.scoreOutOf, { color: colors.mutedForeground }]}>/ 5</Text>
    </View>
  );
}

export function WarningList({ warnings }: { warnings: string[] }) {
  const colors = useColors();
  if (!warnings.length) return null;
  return (
    <View style={[styles.warningBox, { backgroundColor: colors.card, borderColor: colors.amber }]}>
      <View style={styles.warningHeading}>
        <Feather name="info" size={16} color={colors.amber} />
        <Text style={[styles.warningTitle, { color: colors.foreground }]}>A note from Career Mate</Text>
      </View>
      {warnings.map((warning, index) => (
        <Text key={`${warning}-${index}`} style={[styles.warningText, { color: colors.mutedForeground }]}>
          {warning}
        </Text>
      ))}
    </View>
  );
}

export const styles = StyleSheet.create({
  screenContent: { paddingHorizontal: 20, gap: 20 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandMark: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  brandName: { fontSize: 23, fontFamily: 'Inter_700Bold', letterSpacing: -0.8 },
  button: { minHeight: 54, borderRadius: 16, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  ghostButton: { paddingHorizontal: 6, minHeight: 40 },
  buttonText: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  iconButton: { width: 38, height: 38, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  fieldGroup: { gap: 8 },
  fieldLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 13, letterSpacing: 0.1 },
  input: { minHeight: 54, borderWidth: 1, borderRadius: 15, paddingHorizontal: 16, paddingVertical: 14, fontFamily: 'Inter_400Regular', fontSize: 15 },
  multilineInput: { minHeight: 145, textAlignVertical: 'top', lineHeight: 22 },
  helper: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18 },
  eyebrow: { fontFamily: 'Inter_700Bold', fontSize: 12, letterSpacing: 1.5, textTransform: 'uppercase' },
  pageHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  pageHeaderCopy: { flex: 1, gap: 4, paddingTop: 2 },
  pageTitle: { fontFamily: 'Inter_700Bold', fontSize: 28, lineHeight: 34, letterSpacing: -0.7 },
  pageSubtitle: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 21, marginTop: 2 },
  choiceTile: { flex: 1, minHeight: 124, borderRadius: 18, borderWidth: 1, padding: 12, justifyContent: 'space-between', gap: 7 },
  choiceIcon: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  choiceLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 12, lineHeight: 16 },
  choiceCaption: { fontFamily: 'Inter_400Regular', fontSize: 10, lineHeight: 14 },
  statusChip: { alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8 },
  statusChipText: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 0.7, textTransform: 'uppercase' },
  loadingState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 90, gap: 14 },
  loadingOrb: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  loadingTitle: { fontFamily: 'Inter_700Bold', fontSize: 21, textAlign: 'center' },
  loadingDetail: { fontFamily: 'Inter_400Regular', fontSize: 14, textAlign: 'center', lineHeight: 21, maxWidth: 300 },
  errorBox: { borderWidth: 1, borderRadius: 15, padding: 14, flexDirection: 'row', gap: 10 },
  errorText: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19 },
  retryText: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  scoreRing: { borderWidth: 6, alignItems: 'center', justifyContent: 'center' },
  scoreNumber: { fontFamily: 'Inter_700Bold' },
  scoreOutOf: { fontFamily: 'Inter_500Medium', fontSize: 10, marginTop: -2 },
  warningBox: { borderWidth: 1, borderRadius: 15, padding: 14, gap: 8 },
  warningHeading: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  warningTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  warningText: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19, paddingLeft: 24 },
});