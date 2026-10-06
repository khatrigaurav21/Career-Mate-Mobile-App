import { ArrowUpRight, ChevronRight, List, Target, UserRound } from 'lucide-react';
import './_group.css';

const jobs = [
  {
    title: 'Senior Product Designer',
    company: 'Northstar Energy',
    score: '4.1',
    status: 'Complete',
    statusTone: 'success',
    rights: 'Eligible',
  },
  {
    title: 'UX Lead',
    company: 'Harbour Health',
    score: '3.3',
    status: 'Complete',
    statusTone: 'success',
    rights: 'Check details',
  },
  {
    title: 'Service Designer',
    company: 'Civic Studio',
    score: '2.6',
    status: 'Processing',
    statusTone: 'warning',
    rights: 'Eligible',
  },
] as const;

const colors = {
  background: 'var(--cm-background)',
  card: 'var(--cm-card)',
  border: 'var(--cm-border)',
  muted: 'var(--cm-muted)',
  mutedForeground: 'var(--cm-muted-foreground)',
  navy: 'var(--cm-navy)',
  primary: 'var(--cm-primary)',
  primaryForeground: 'var(--cm-primary-foreground)',
  accent: 'var(--cm-accent)',
  accentForeground: 'var(--cm-accent-foreground)',
  teal: 'var(--cm-teal)',
  inkPanel: 'var(--cm-ink-panel)',
  onNavy: 'var(--cm-on-navy)',
  onNavyMuted: 'var(--cm-on-navy-muted)',
  success: 'var(--cm-success)',
  warning: 'var(--cm-warning)',
  successSoft: 'var(--cm-success-soft)',
  warningSoft: 'var(--cm-warning-soft)',
};

export function Current() {
  return (
    <main
      style={{
        minHeight: '100dvh',
        background: colors.background,
        color: colors.navy,
        fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
        padding: '26px 20px 94px',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}
    >
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <span style={{ color: colors.primary, fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase' }}>
            Your pipeline
          </span>
          <h1 style={{ color: colors.navy, fontSize: 28, lineHeight: 1.15, letterSpacing: -0.8, margin: 0, fontWeight: 700 }}>
            Good to see you.
          </h1>
        </div>
        <button
          aria-label="Open profile"
          style={{ width: 44, height: 44, borderRadius: 99, border: `1px solid ${colors.border}`, background: colors.card, color: colors.navy, display: 'grid', placeItems: 'center' }}
        >
          <UserRound size={19} />
        </button>
      </header>

      <section style={{ background: colors.inkPanel, color: colors.onNavy, borderRadius: 22, padding: 18, display: 'flex', alignItems: 'center', gap: 14 }}>
        <span style={{ width: 44, height: 44, borderRadius: 22, background: colors.primary, color: colors.primaryForeground, display: 'grid', placeItems: 'center', flex: '0 0 auto' }}>
          <Target size={21} />
        </span>
        <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <strong style={{ fontSize: 15 }}>Have a role in mind?</strong>
          <small style={{ color: colors.onNavyMuted, fontSize: 12, lineHeight: 1.5 }}>See how well it fits before you spend time applying.</small>
        </span>
        <ArrowUpRight size={21} color={colors.primary} />
      </section>

      <p style={{ color: colors.mutedForeground, fontSize: 13, margin: 0 }}>
        3 opportunities evaluated · hold one to delete
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {jobs.map((job) => {
          const tone = job.score === '4.1' ? colors.success : job.score === '3.3' ? colors.warning : colors.primary;
          return (
            <article
              key={job.title}
              style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 20, minHeight: 112, padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}
            >
              <span style={{ width: 68, height: 68, border: `4px solid ${tone}`, borderRadius: 99, display: 'grid', placeItems: 'center', color: tone, fontSize: 20, fontWeight: 700, flex: '0 0 auto' }}>
                {job.score}
              </span>
              <span style={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
                <strong style={{ color: colors.navy, fontSize: 15, lineHeight: 1.3 }}>{job.title}</strong>
                <span style={{ color: colors.mutedForeground, fontSize: 13 }}>{job.company}</span>
                <span style={{ display: 'flex', flexWrap: 'wrap', gap: 5, paddingTop: 1 }}>
                  <small style={{ background: job.statusTone === 'success' ? colors.successSoft : colors.warningSoft, color: job.statusTone === 'success' ? colors.success : colors.warning, borderRadius: 99, padding: '4px 8px', fontSize: 10, fontWeight: 700 }}>
                    {job.status}
                  </small>
                  <small style={{ background: colors.muted, color: colors.mutedForeground, borderRadius: 99, padding: '4px 8px', fontSize: 10, fontWeight: 600 }}>
                    {job.rights}
                  </small>
                </span>
              </span>
              <ChevronRight size={18} color={colors.mutedForeground} />
            </article>
          );
        })}
      </div>

      <nav aria-label="Main navigation" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: 76, background: colors.card, borderTop: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span aria-current="page" style={{ width: 112, display: 'flex', alignItems: 'center', flexDirection: 'column', gap: 5, color: colors.primary, fontSize: 11, fontWeight: 600 }}>
          <List size={21} />
          Pipeline
        </span>
      </nav>
    </main>
  );
}
