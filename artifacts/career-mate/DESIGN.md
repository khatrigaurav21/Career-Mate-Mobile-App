# Career Mate — Design

How the Career Mate mobile app looks and behaves, written from the code as of
2026-10-06 (updated for the Stitch "Warm Editorial Career Coach" redesign).
If this file and the code disagree, the code wins — update this file.
Colours live in `constants/colors.ts`, the type scale in
`constants/typography.ts` (use `type.*`, not ad-hoc font sizes), shared
components in `components/ui.tsx`.

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

| Token (`type.*`) | Size / line height | Weight | Use |
|---|---|---|---|
| `headlineHero` | 34 / 40, −1.2 | Bold | Login hero |
| `headlineLg` | 28 / 34, −0.5 | Bold | Page titles |
| `headlineMd` | 22 / 28 | Bold | Big numbers (scores, stat tiles) |
| `headlineSm` | 18 / 24 | Bold | Section titles (with a teal icon) |
| `titleCard` | 16 / 22 | Bold | Card and job titles |
| `bodyLg` | 16 / 24 | Regular | Body, report text, page subtitles |
| `bodyMd` / `bodySemibold` | 14 / 20 | Regular / SemiBold | Secondary text, buttons in cards |
| `labelPill` / `labelEyebrow` / `labelCaption` | 12 / 16 | SemiBold / Bold caps / Medium | Pills, eyebrows, captions |

**Minimum size is 12pt.** Body and card titles are 16pt. The user has
explicitly flagged tiny text as a problem — don't go below these.

## Shape and spacing

- Corner radius: 14–18 for cards and inputs (token `radius: 18`), 99 for pills.
- Card padding 14–19; gaps between stacked cards 10–14; screen padding ~20–22.
- Touch targets at least 44pt tall (links and text buttons use `minHeight: 44`).
- Cards: `card` background + 1px `border`; no heavy shadows.

## Navigation

Three persistent tabs (native tabs): **Home** (pipeline), **Evaluate** (add a
job), **Profile**, each topped by `AppHeader` (brand mark, "Career Mate" +
section name, initials avatar → Profile). Stack screens on top: Login
(one-time code), Setup (upload / paste / guided Q&A), Job detail.

- **Home:** visa card (from saved work rights, or a "set your work rights" prompt), three stat tiles (Evaluated / High match 4.0+ / Applied), a "ready for a follow-up" banner when any are due, All / Applied / CV-ready filter, job cards (verdict pill, title, company, square score badge, stage or document line, action button — "Follow up" when one is due), and a dark "Found a role you like?" card with honest Seek guidance.
- **Evaluate:** Link / Paste text / Upload segmented control, Paste-from-clipboard, a coach note naming the user's visa, "Run evaluation", and Recent assessments.
- **Profile:** account card, dark work-rights panel (where you can work / who you can work for, per visa type), CV card, preferences list, "guidance only" note, privacy / sign out / delete account.

- **Job detail:** header actions, work-rights banner, score, **"Where are you with this?"** (stage chips Not applied → Applied → Interviewing → Offer / Rejected / Withdrawn, a follow-up card when due with a drafted email to copy or share, and a history list), the dark **interview prep** card (applied / interviewing / offer, or once built), documents, A–H report.
- **Career insights** (`app/insights.tsx`, from the "Roles you might be missing" card at the foot of Home): summary across evaluated jobs, titles to search for (Same work / Step up / Nearby move, CV quote, gap note, search tip, copy button), skills that keep coming up ("In 2 of 5 jobs" — counted by the API), what employers keep valuing, Rebuild.
- **Interview prep** (`app/prep/[id].tsx`): what they'll probe, the visa answer, a 60-second introduction, likely questions split Recruiter / Manager / The job (tap to expand the first-person answer, why they ask, and the CV line it uses; a fit chip says Strong example / Transferable / Prepare a story), questions to ask, stories to prepare, checklist, watch-outs, and Rebuild. Always says questions are predicted from the ad, not reported by past candidates.

Rules from the redesign: the card body and its action button are siblings, never nested buttons; a job the user can't legally take never gets the coral "Tailor CV" call to action (it shows "Review").

## Key components (`components/`)

| Component | Purpose |
|---|---|
| `Screen`, `PageHeader`, `SectionEyebrow` | Page scaffold, title + subtitle, small uppercase eyebrow |
| `Button`, `IconButton`, `Field`, `ChoiceTile` | Actions, icon actions (with accessibility labels), inputs, 3-way mode pickers |
| `OtpInput` | 8-box code entry on Login (fixed-height cells; shakes on error) |
| `ScoreRing` | Fit score out of 5 on job detail (Home uses a compact `PipelineScore`) |
| `StatusChip`, Home `CompactPill` | Small status labels |
| `ReportView` | Renders the A–H evaluation: requirement-match table as cards with coloured Importance/Match chips, fact rows, TL;DR callout, numbered lists |
| `AppHeader` | Shared tab header with initials avatar (`initialsFromEmail`) |
| `VISA_SUMMARY` (in `WorkRights.tsx`) | One source of plain-English visa text (title, where you can work, who you can work for) used by Home and Profile; mirrors the API's rules |
| `WorkRightsBanner` / `WorkRightsPicker` | Visa/work-rights verdict on job detail (eligible / check / not allowed / not set + JD quote + "guidance only") and the picker in Profile/Setup |
| `ApplicationTracker` (+ `STATUS_META`, `toneColors`) | Stage picker, follow-up nudge and draft, history on job detail. When a follow-up is due is decided by the API (7 days after applying, 4 after an interview) |
| `InterviewPrepCard`, `PrepQuestion`, `useBuildInterviewPrep` (`InterviewPrep.tsx`) | Prep entry card on job detail, expandable question card, and the build mutation that writes into the job's cached detail |
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

## Copy rules (from reviewing the Stitch mockups)

Never claim what the app doesn't do: no "verified", "compliant", "accredited",
postcode checks, closing dates, apply buttons, notifications or visa expiry.
The app never sends an email for the user — follow-ups are drafts they copy
or share and send themselves.
Seek links can't be read by the server — always say "copy the description and
paste it" for Seek. Visa text must differ by visa type (494 is tied to the
sponsoring employer). Every visa verdict carries "guidance only".

## Known gaps

None below 12pt as of the redesign. Not yet built from the Stitch mockups:
a location pill on job cards (needs the evaluation to store the job's
location) and the CV file name (only the text is stored).

## Don't change in a visual pass

These are build/feature wiring, not UI: `eas.json`, the `plugins` section of
`app.json`, `lib/errorReporting.ts`, `components/ShareIntentHandler.tsx`,
`app/+native-intent.tsx`. The Evaluate tab's effect that applies shared jobs
(`sharedUrl` / `sharedText` / `shareId` params) must stay.
