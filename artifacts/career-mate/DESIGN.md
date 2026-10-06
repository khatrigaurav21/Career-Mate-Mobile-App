# Career Mate — Design

How the Career Mate mobile app looks and behaves, written from the code as of
2026-10-06. If this file and the code disagree, the code wins — update this
file. Tokens live in `constants/colors.ts`; shared components in
`components/ui.tsx`.

## Product and tone

Career Mate helps job seekers in Australia (many on regional 491/494 visas)
decide whether a role is worth applying for, then tailors a CV and cover
letter. The UI should feel calm, warm and trustworthy — a capable career
coach, not a dashboard. Plain English, short labels, no jargon.

- Platform: Expo / React Native (iOS + Android), light and dark mode.
- Audience reads on phones, often quickly: readability beats density.

## Colour

Warm paper background, deep navy ink, coral as the single action colour,
sage/teal for positive and supportive states.

| Token | Light | Dark | Use |
|---|---|---|---|
| `background` | `#F4EFE8` | `#10283D` | Screen background (warm paper / deep navy) |
| `card` | `#FEFCF8` | `#19364E` | Cards, inputs, list rows |
| `foreground` | `#1E2A35` | `#F4EFE8` | Body text |
| `navy` | `#143249` | `#F4EFE8` | Headings and titles (flips to light in dark mode) |
| `mutedForeground` | `#6C767B` | `#B9C2C5` | Secondary text, captions |
| `primary` | `#D96153` | `#F18272` | Primary buttons, links, selected state (coral) |
| `accent` / `accentForeground` | `#DDE9E0` / `#2E5F52` | `#2C554D` / `#D8E7DF` | Supportive callouts (TL;DR, "shared post loaded") |
| `teal` | `#507A6F` | `#9AC8B5` | Icons in section titles, positive accents |
| `inkPanel` / `onNavy` | `#143249` / `#FEFCF8` | `#0C2235` / `#F4EFE8` | Dark feature panels (e.g. account email card) |
| `border` | `#DED5CB` | `#31516A` | Card and input borders |
| `success` / `successSoft` | `#2D705B` / `#E2EFE7` | `#9AC8B5` / `#21473F` | Strong match, eligible, finished |
| `warning` / `warningSoft` | `#946326` / `#F3E8D7` | `#E4B46D` / `#4A3A29` | Partial match, "check" states |
| `destructive` / `destructiveSoft` | `#B94F48` / `#F5E0DC` | `#EF776D` / `#4B2C30` | Missing, not eligible, delete |

Rules:
- Status always pairs colour with an icon and a word (never colour alone).
- Soft background + strong foreground for chips/pills/banners (`successSoft` + `success`, etc.).
- Coral (`primary`) is reserved for the main action on a screen and links.

## Typography

Font: **Inter** (`@expo-google-fonts/inter`) — 400 Regular, 500 Medium,
600 SemiBold, 700 Bold.

| Role | Size / line height | Weight |
|---|---|---|
| Screen title (login hero) | 34 / 40, letter-spacing −1.2 | Bold |
| Page title | 28–30 | Bold |
| Section title | 18–19 | Bold, with a teal icon |
| Card / job title | 16 / 21 | Bold |
| Body / report text | 16 / 24 | Regular |
| Secondary text, company names | 14 / 19 | Regular |
| Pills, chips, captions | 12 / 16 minimum | SemiBold |

**Minimum size is 12pt.** Body and card titles are 16pt. The user has
explicitly flagged tiny text as a problem — don't go below these.

## Shape and spacing

- Corner radius: 14–18 for cards and inputs (token `radius: 18`), 99 for pills.
- Card padding 14–19; gaps between stacked cards 10–14; screen padding ~20–22.
- Touch targets at least 44pt tall (links and text buttons use `minHeight: 44`).
- Cards: `card` background + 1px `border`; no heavy shadows.

## Navigation

Three persistent tabs (native tabs): **Home** (pipeline), **Evaluate** (add a
job), **Profile**. Stack screens on top: Login (one-time code), Setup
(upload / paste / guided Q&A), Job detail.

## Key components (`components/`)

| Component | Purpose |
|---|---|
| `Screen`, `PageHeader`, `SectionEyebrow` | Page scaffold, title + subtitle, small uppercase eyebrow |
| `Button`, `IconButton`, `Field`, `ChoiceTile` | Actions, icon actions (with accessibility labels), inputs, 3-way mode pickers |
| `OtpInput` | 8-box code entry on Login (fixed-height cells; shakes on error) |
| `ScoreRing` | Fit score out of 5 on job detail (Home uses a compact `PipelineScore`) |
| `StatusChip`, Home `CompactPill` | Small status labels |
| `ReportView` | Renders the A–H evaluation: requirement-match table as cards with coloured Importance/Match chips, fact rows, TL;DR callout, numbered lists |
| `WorkRightsBanner` / `WorkRightsPicker` | Visa/work-rights verdict on job detail (eligible / check / not allowed / not set + JD quote + "guidance only") and the picker in Profile/Setup |
| `AnimatedSection` | Collapsible report sections (mount-on-open) |
| `SegmentedProgress`, `LoadingNotice` | Progress for slow operations (evaluation ~1–2 min) |
| `ErrorNotice`, `WarningList` | Errors and document warnings |

## Motion

- `moti` + `react-native-reanimated`. Short (≈200–250ms) timing transitions; sections fade/slide in when opened.
- Respect reduced motion (`useReducedMotion()` → no movement, instant states).
- No decorative looping animation; motion explains a change of state.

## Accessibility

- Every icon-only button has an `accessibilityLabel`.
- Pickers use radio semantics; banners use icon + text + colour.
- Long-press actions have an `accessibilityHint` and a visible alternative (e.g. delete via the bin icon on job detail).

## Known gaps (as of this file)

Still below the 12pt minimum, to fix in the next UI pass:
- `components/ui.tsx` styles: `choiceCaption` 10, `statusChipText` 10, `progressLabel` 11, `progressMeta` 10, `scoreOutOf` 10.
- `app/(tabs)/index.tsx` `PipelineScore` "/5" label (8pt) and the login screen footer (11pt).

## Don't change in a visual pass

These are build/feature wiring, not UI: `eas.json`, the `plugins` section of
`app.json`, `lib/errorReporting.ts`, `components/ShareIntentHandler.tsx`,
`app/+native-intent.tsx`. The Evaluate tab's effect that applies shared jobs
(`sharedUrl` / `sharedText` / `shareId` params) must stay.
