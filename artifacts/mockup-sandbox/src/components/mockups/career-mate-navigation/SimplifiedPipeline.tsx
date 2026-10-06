import { useState } from 'react';
import {
  ArrowUpRight,
  BriefcaseBusiness,
  Check,
  ChevronRight,
  Compass,
  House,
  ListChecks,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import './_group.css';

const jobs = [
  {
    title: 'Senior Product Designer',
    company: 'Northstar Energy',
    score: '4.1',
    status: 'Complete',
    statusTone: 'success',
    rights: 'Eligible',
    scoreTone: 'success',
  },
  {
    title: 'UX Lead',
    company: 'Harbour Health',
    score: '3.3',
    status: 'Complete',
    statusTone: 'success',
    rights: 'Check details',
    scoreTone: 'warm',
  },
  {
    title: 'Service Designer',
    company: 'Civic Studio',
    score: '2.6',
    status: 'Processing',
    statusTone: 'pending',
    rights: 'Eligible',
    scoreTone: 'coral',
  },
] as const;

type Destination = 'Home' | 'Evaluate' | 'Profile';

const destinations: { label: Destination; icon: typeof House }[] = [
  { label: 'Home', icon: House },
  { label: 'Evaluate', icon: ListChecks },
  { label: 'Profile', icon: UserRound },
];

export function SimplifiedPipeline() {
  const [activeDestination, setActiveDestination] = useState<Destination>('Home');

  return (
    <main className="pipeline-screen">
      <style>{`
        .pipeline-screen {
          --pipe-ink: var(--cm-navy);
          --pipe-muted: var(--cm-muted-foreground);
          --pipe-border: var(--cm-border);
          --pipe-card: var(--cm-card);
          --pipe-bg: var(--cm-background);
          --pipe-coral: var(--cm-primary);
          --pipe-serif: 'DM Sans', ui-sans-serif, system-ui, sans-serif;
          min-height: 100dvh;
          width: 100%;
          max-width: 480px;
          margin: 0 auto;
          padding: max(25px, env(safe-area-inset-top)) 20px calc(100px + env(safe-area-inset-bottom));
          background: var(--pipe-bg);
          color: var(--pipe-ink);
          font-family: var(--pipe-serif);
          position: relative;
          overflow: hidden;
        }
        .pipeline-screen, .pipeline-screen * { box-sizing: border-box; }
        .pipe-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 25px;
          animation: pipe-in .5s ease both;
        }
        .pipe-kicker {
          display: block;
          margin-bottom: 7px;
          color: var(--pipe-coral);
          font-size: 10px;
          line-height: 1;
          font-weight: 800;
          letter-spacing: 1.4px;
          text-transform: uppercase;
        }
        .pipe-heading {
          margin: 0;
          font-size: 27px;
          line-height: 1.12;
          letter-spacing: -1.05px;
          font-weight: 750;
        }
        .pipe-avatar {
          width: 43px;
          height: 43px;
          display: grid;
          place-items: center;
          border: 1px solid var(--pipe-border);
          border-radius: 50%;
          background: var(--pipe-card);
          color: var(--pipe-ink);
          box-shadow: 0 3px 10px rgba(20, 50, 73, .04);
        }
        .pipe-evaluate {
          width: 100%;
          min-height: 86px;
          padding: 15px 16px;
          border: 0;
          border-radius: 18px;
          display: flex;
          align-items: center;
          gap: 13px;
          text-align: left;
          color: var(--cm-on-navy);
          background: var(--cm-ink-panel);
          cursor: pointer;
          box-shadow: 0 8px 22px rgba(20, 50, 73, .10);
          animation: pipe-in .55s .06s ease both;
          transition: transform .18s ease, opacity .18s ease;
        }
        .pipe-evaluate:active { transform: scale(.985); }
        .pipe-evaluate-icon {
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          flex: 0 0 auto;
          border-radius: 14px;
          color: var(--cm-primary-foreground);
          background: var(--cm-primary);
        }
        .pipe-evaluate-copy { min-width: 0; flex: 1; }
        .pipe-evaluate-title {
          display: block;
          margin-bottom: 3px;
          font-size: 15px;
          line-height: 1.25;
          font-weight: 750;
        }
        .pipe-evaluate-caption {
          display: block;
          color: var(--cm-on-navy-muted);
          font-size: 11px;
          line-height: 1.4;
        }
        .pipe-evaluate-arrow { color: var(--cm-primary); flex: 0 0 auto; }
        .pipe-section-head {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          margin: 27px 1px 12px;
          animation: pipe-in .55s .1s ease both;
        }
        .pipe-section-title {
          margin: 0;
          font-size: 17px;
          letter-spacing: -.35px;
          font-weight: 750;
        }
        .pipe-count {
          color: var(--pipe-muted);
          font-size: 11px;
          font-weight: 600;
        }
        .pipe-list { display: grid; gap: 10px; }
        .pipe-job {
          min-height: 104px;
          padding: 13px 12px;
          border: 1px solid var(--pipe-border);
          border-radius: 17px;
          display: flex;
          align-items: center;
          gap: 12px;
          background: var(--pipe-card);
          box-shadow: 0 3px 12px rgba(20, 50, 73, .035);
          animation: pipe-in .5s ease both;
          transition: transform .18s ease;
        }
        .pipe-job:active { transform: scale(.99); }
        .pipe-score {
          width: 58px;
          height: 58px;
          flex: 0 0 auto;
          display: grid;
          place-items: center;
          position: relative;
          border: 3px solid currentColor;
          border-radius: 50%;
          color: var(--cm-success);
          font-size: 17px;
          line-height: 1;
          font-weight: 800;
          letter-spacing: -.5px;
          font-variant-numeric: tabular-nums;
        }
        .pipe-score::after {
          content: '/5';
          position: absolute;
          bottom: 6px;
          font-size: 8px;
          font-weight: 650;
          letter-spacing: 0;
          opacity: .74;
        }
        .pipe-score.warm { color: var(--cm-warning); }
        .pipe-score.coral { color: var(--cm-primary); }
        .pipe-job-copy {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .pipe-job-title {
          overflow: hidden;
          color: var(--pipe-ink);
          font-size: 13px;
          line-height: 1.28;
          font-weight: 750;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .pipe-company {
          overflow: hidden;
          color: var(--pipe-muted);
          font-size: 11px;
          line-height: 1.3;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .pipe-tags { display: flex; gap: 5px; flex-wrap: wrap; margin-top: 2px; }
        .pipe-tag {
          min-height: 19px;
          padding: 3px 7px;
          border-radius: 99px;
          display: inline-flex;
          align-items: center;
          gap: 3px;
          color: var(--cm-success);
          background: var(--cm-success-soft);
          font-size: 9px;
          line-height: 1;
          font-weight: 750;
          white-space: nowrap;
        }
        .pipe-tag.pending {
          color: var(--cm-warning);
          background: var(--cm-warning-soft);
        }
        .pipe-tag.rights {
          color: var(--cm-accent-foreground);
          background: var(--cm-accent);
          font-weight: 650;
        }
        .pipe-chevron { flex: 0 0 auto; color: var(--pipe-muted); }
        .pipe-bottom-nav {
          position: fixed;
          z-index: 2;
          bottom: 0;
          left: 50%;
          width: min(100%, 480px);
          min-height: calc(73px + env(safe-area-inset-bottom));
          padding: 8px 22px calc(8px + env(safe-area-inset-bottom));
          transform: translateX(-50%);
          border-top: 1px solid var(--pipe-border);
          display: flex;
          align-items: center;
          justify-content: space-around;
          background: var(--pipe-card);
          box-shadow: 0 -7px 24px rgba(20, 50, 73, .045);
        }
        .pipe-nav-button {
          min-width: 76px;
          height: 52px;
          padding: 4px 12px;
          border: 0;
          border-radius: 14px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 3px;
          color: var(--pipe-muted);
          background: transparent;
          font-size: 10px;
          font-weight: 650;
          cursor: pointer;
          transition: color .18s ease, background .18s ease, transform .18s ease;
        }
        .pipe-nav-button[aria-current="page"] {
          color: var(--cm-accent-foreground);
          background: var(--cm-accent);
        }
        .pipe-nav-button:active { transform: scale(.95); }
        @keyframes pipe-in {
          from { opacity: 0; transform: translateY(9px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .pipeline-screen *, .pipeline-screen *::before, .pipeline-screen *::after {
            animation-duration: .01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: .01ms !important;
          }
        }
      `}</style>

      <header className="pipe-header">
        <div>
          <span className="pipe-kicker">Your pipeline</span>
          <h1 className="pipe-heading">Good to see you.</h1>
        </div>
        <button
          className="pipe-avatar"
          type="button"
          aria-label="Open profile"
          onClick={() => setActiveDestination('Profile')}
        >
          <UserRound size={19} strokeWidth={1.8} />
        </button>
      </header>

      <button
        className="pipe-evaluate"
        type="button"
        onClick={() => setActiveDestination('Evaluate')}
      >
        <span className="pipe-evaluate-icon"><BriefcaseBusiness size={20} strokeWidth={1.8} /></span>
        <span className="pipe-evaluate-copy">
          <span className="pipe-evaluate-title">Evaluate a job</span>
          <span className="pipe-evaluate-caption">Check the fit before you apply</span>
        </span>
        <ArrowUpRight className="pipe-evaluate-arrow" size={21} />
      </button>

      <section aria-labelledby="pipeline-list-heading">
        <div className="pipe-section-head">
          <h2 className="pipe-section-title" id="pipeline-list-heading">Recent evaluations</h2>
          <span className="pipe-count">3 roles</span>
        </div>

        <div className="pipe-list">
          {jobs.map((job, index) => (
            <article className="pipe-job" key={job.title} style={{ animationDelay: `${0.12 + index * 0.07}s` }}>
              <span className={`pipe-score ${job.scoreTone}`} aria-label={`${job.score} out of 5 fit score`}>
                {job.score}
              </span>
              <span className="pipe-job-copy">
                <strong className="pipe-job-title">{job.title}</strong>
                <span className="pipe-company">{job.company}</span>
                <span className="pipe-tags">
                  <span className={`pipe-tag ${job.statusTone === 'pending' ? 'pending' : ''}`}>
                    {job.statusTone === 'success' && <Check size={10} strokeWidth={2.7} />}
                    {job.status}
                  </span>
                  <span className="pipe-tag rights">
                    <ShieldCheck size={10} strokeWidth={2.1} />
                    {job.rights}
                  </span>
                </span>
              </span>
              <ChevronRight className="pipe-chevron" size={17} strokeWidth={1.8} />
            </article>
          ))}
        </div>
      </section>

      <nav className="pipe-bottom-nav" aria-label="Main navigation">
        {destinations.map(({ label, icon: Icon }) => (
          <button
            className="pipe-nav-button"
            type="button"
            key={label}
            aria-current={activeDestination === label ? 'page' : undefined}
            onClick={() => setActiveDestination(label)}
          >
            {label === 'Home' ? <House size={19} strokeWidth={1.9} /> : label === 'Evaluate' ? <Compass size={19} strokeWidth={1.9} /> : <Icon size={19} strokeWidth={1.9} />}
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </main>
  );
}
