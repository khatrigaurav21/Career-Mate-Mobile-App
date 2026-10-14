import React from 'react';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';

// The Trozi "companion t" from brand/trozi/trozi-icon-v2.svg: a cream stroked
// t with two cream eyes on a terracotta rounded square, the same as the app
// icon. Fixed brand colours on purpose: the mark looks the same in light and
// dark mode.
export function TroziMark({ size = 42 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 1024 1024" accessibilityLabel="Trozi">
      <Rect width={1024} height={1024} rx={240} fill="#A83223" />
      <G transform="translate(235 192) scale(2.16)">
        <Path
          d="M90 40V190C90 253 155 272 200 240M38 128H218"
          fill="none"
          stroke="#FCF9F4"
          strokeWidth={65}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Circle cx={169} cy={65} r={8.4} fill="#FCF9F4" />
        <Circle cx={202.6} cy={65} r={8.4} fill="#FCF9F4" />
      </G>
    </Svg>
  );
}
