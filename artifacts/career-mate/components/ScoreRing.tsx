import React from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useReducedMotion } from '@/components/ui';
import { useColors } from '@/hooks/useColors';

/**
 * The score as a big ring in the middle of the screen: the arc fills in
 * proportion to the score out of 5, and the number sits in the centre. The ring
 * takes its colour from the work-rights verdict so the answer to "can I take
 * this job?" reads before any text does.
 */
export function ScoreRing({ score, color, size = 212 }: { score: number | null; color: string; size?: number }) {
  const colors = useColors();
  const reduced = useReducedMotion();
  const stroke = 16;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const fraction = score === null ? 0 : Math.max(0, Math.min(1, score / 5));

  return (
    <Animated.View
      entering={reduced ? undefined : FadeIn.duration(320)}
      accessible
      accessibilityLabel={score === null ? 'Score still processing' : `Score ${score.toFixed(1)} out of 5`}
      style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
    >
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={colors.border} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={circumference * (1 - fraction)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={{ position: 'absolute', alignItems: 'center' }}>
        <Text style={{ color: colors.navy, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 58, lineHeight: 66 }}>
          {score === null ? '…' : score.toFixed(1)}
        </Text>
        <Text style={{ color: colors.mutedForeground, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 15, lineHeight: 20 }}>
          {score === null ? 'processing' : 'out of 5'}
        </Text>
      </View>
    </Animated.View>
  );
}
