import { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Check,
  ChevronDown,
  CircleHelp,
  FileUp,
  House,
  Link2,
  ListChecks,
  ShieldCheck,
  Sparkles,
  UserRound,
  X,
} from 'lucide-react';

type Tab = 'Home' | 'Evaluate' | 'Profile';
type Role = {
  title: string;
  company: string;
  score: string;
  status: 'Complete' | 'Processing';
  rights: string;
  tone: 'mint' | 'amber' | 'coral';
};

const roles: Role[] = [
  { title: 'Service Designer', company: 'Civic Studio', score: '2.6', status: 'Processing', rights: 'Eligible', tone: 'coral' },
  { title: 'Senior Product Designer', company: 'Northstar Energy', score: '4.1', status: 'Complete', rights: 'Eligible', tone: 'mint' },
  { title: 'UX Lead', company: 'Harbour Health', score: '3.3', status: 'Complete', rights: 'Check details', tone: 'amber' },
];

export function DecisionInbox() {
  const [tab, setTab] = useState<Tab>('Home');
  const [selected, setSelected] = useState<Role | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [source, setSource] = useState<'Link' | 'Paste' | 'Upload'>('Link');
  const [link, setLink] = useState('');
  const [notice, setNotice] = useState('');

  const beginEvaluation = () => {
    setTab('Evaluate');
    setSelected(null);
    setNotice('');
  };

  return (
    <main className="di">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Fraunces:opsz,wght@9..144,500;9..144,600&display=swap');
        .di {
          --ink:#173a3b; --muted:#657c78; --paper:#f5f4eb; --card:#fffef8;
          --line:#dce3d9; --coral:#c7654c; --coral-soft:#f8e7df;
          --mint:#477965; --mint-soft:#e4eee5; --amber:#936d30; --amber-soft:#f4eddb;
          position:relative; width:100%; max-width:480px; min-height:100dvh; margin:auto;
          overflow:hidden; padding:25px 21px 108px; color:var(--ink); background:var(--paper);
          font-family:'DM Sans',sans-serif; box-sizing:border-box;
        }
        .di * { box-sizing:border-box; }
        .di-header {display:flex;align-items:center;justify-content:space-between;margin-bottom:26px;animation:di-rise .5s ease both}
        .di-brand {display:flex;align-items:center;gap:9px;font-size:13px;font-weight:800;letter-spacing:-.2px}
        .di-mark {width:29px;height:29px;border-radius:10px;display:grid;place-items:center;background:var(--ink);color:#f7f1df}
        .di-profile {width:40px;height:40px;border:1px solid var(--line);border-radius:50%;background:var(--card);color:var(--ink);display:grid;place-items:center}
        .di-eyebrow {font-size:10px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:var(--coral);margin:0 0 8px}
        .di h1 {margin:0;font-family:'Fraunces',serif;font-size:32px;line-height:1.04;letter-spacing:-.7px;font-weight:500}
        .di-lede {font-size:12px;line-height:1.5;color:var(--muted);margin:9px 0 21px}
        .di-next {position:relative;border-radius:20px;background:var(--ink);color:#f9f6e9;padding:18px 17px 16px;overflow:hidden;animation:di-rise .55s .04s ease both}
        .di-next:after {content:'';position:absolute;width:146px;height:146px;border:1px solid rgba(220,234,210,.18);border-radius:50%;right:-46px;top:-69px;box-shadow:0 0 0 17px rgba(220,234,210,.04),0 0 0 34px rgba(220,234,210,.03)}
        .di-next-top {display:flex;align-items:center;justify-content:space-between;gap:8px;position:relative;z-index:1}
        .di-statusline {display:flex;align-items:center;gap:7px;color:#d6e5d4;font-size:10px;font-weight:700;letter-spacing:.7px;text-transform:uppercase}
        .di-pulse {width:7px;height:7px;border-radius:50%;background:#df9a76;box-shadow:0 0 0 4px rgba(223,154,118,.16)}
        .di-next-score {font-variant-numeric:tabular-nums;font-size:12px;font-weight:800;color:#f0d9bd}
        .di-next h2 {position:relative;z-index:1;margin:13px 0 3px;font-family:'Fraunces',serif;font-size:23px;line-height:1.08;font-weight:500}
        .di-company {position:relative;z-index:1;color:#b6c9bf;font-size:11px}
        .di-progress {height:3px;border-radius:4px;background:rgba(242,242,222,.18);margin:15px 0 10px;overflow:hidden}
        .di-progress span {display:block;width:62%;height:100%;background:#e3a17f;border-radius:4px}
        .di-next-bottom {display:flex;align-items:center;justify-content:space-between;color:#d6e0d4;font-size:10px}
        .di-next-bottom button {border:0;background:none;color:#f1c3a8;font:700 10px 'DM Sans',sans-serif;display:flex;align-items:center;gap:4px;padding:4px 0;cursor:pointer}
        .di-sectionhead {display:flex;justify-content:space-between;align-items:baseline;margin:25px 1px 10px}
        .di-sectionhead h2 {font-size:15px;letter-spacing:-.25px;margin:0;font-weight:800}
        .di-sectionhead span {font-size:10px;color:var(--muted);font-weight:600}
        .di-rolelist {display:grid;gap:8px}
        .di-role {width:100%;text-align:left;padding:12px 12px;border:1px solid var(--line);border-radius:15px;background:var(--card);display:flex;align-items:center;gap:11px;color:var(--ink);cursor:pointer;transition:transform .18s ease,border-color .18s ease}
        .di-role:active,.di-primary:active {transform:scale(.985)}
        .di-role:hover {border-color:#aabdb0}
        .di-glyph {flex:0 0 37px;width:37px;height:37px;border-radius:12px;display:grid;place-items:center;background:var(--mint-soft);color:var(--mint)}
        .di-glyph.amber {background:var(--amber-soft);color:var(--amber)}
        .di-rolecopy {min-width:0;flex:1}
        .di-rolecopy strong {display:block;font-size:12px;line-height:1.3;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .di-rolecopy small {display:block;margin-top:3px;color:var(--muted);font-size:10px}
        .di-rolemeta {text-align:right;flex:0 0 auto}
        .di-rolemeta strong {display:block;font-size:13px;font-variant-numeric:tabular-nums}
        .di-rolemeta small {display:block;font-size:9px;color:var(--muted);margin-top:3px}
        .di-detail {padding:14px 15px;margin-top:8px;border:1px solid #cad8ca;border-radius:16px;background:#eef1e5;animation:di-rise .22s ease both}
        .di-detailtop {display:flex;align-items:flex-start;justify-content:space-between}
        .di-detailtop strong {font-size:12px}
        .di-detail p {margin:7px 0 11px;color:#526d65;font-size:11px;line-height:1.5}
        .di-detail button {border:0;background:none;padding:0;color:var(--ink);font:700 10px 'DM Sans',sans-serif;display:flex;align-items:center;gap:5px;cursor:pointer}
        .di-completed {width:100%;margin-top:11px;padding:12px 1px;border:0;border-top:1px solid var(--line);background:transparent;color:var(--muted);font:700 11px 'DM Sans',sans-serif;display:flex;justify-content:space-between;align-items:center;cursor:pointer}
        .di-completed-list {display:grid;gap:8px;animation:di-rise .2s ease both}
        .di-primary {width:100%;border:0;border-radius:14px;background:var(--coral);color:#fffaf0;min-height:50px;display:flex;justify-content:center;align-items:center;gap:8px;font:800 12px 'DM Sans',sans-serif;cursor:pointer;transition:transform .18s ease}
        .di-cta {display:flex;align-items:center;justify-content:space-between;margin:20px 1px 0}
        .di-cta-copy {font-size:10px;color:var(--muted);line-height:1.45}
        .di-cta .di-primary {width:auto;padding:0 15px;min-height:42px}
        .di-nav {position:fixed;z-index:5;bottom:0;left:50%;transform:translateX(-50%);width:min(100%,480px);padding:8px 20px max(8px,env(safe-area-inset-bottom));min-height:75px;background:rgba(255,254,248,.96);border-top:1px solid var(--line);display:flex;justify-content:space-around;backdrop-filter:blur(12px)}
        .di-nav button {border:0;min-width:74px;border-radius:13px;background:transparent;color:#81918a;font:600 9px 'DM Sans',sans-serif;display:flex;align-items:center;justify-content:center;gap:4px;flex-direction:column;cursor:pointer}
        .di-nav button[aria-current="page"] {background:#e7eee4;color:var(--ink);font-weight:800}
        .di-evalhead {display:flex;align-items:center;gap:11px;margin:9px 0 26px}
        .di-back {border:0;background:none;color:var(--ink);padding:5px;cursor:pointer}
        .di-evalhead span {font-size:12px;font-weight:800}
        .di-source-tabs {display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin:18px 0 15px;padding:4px;background:#e8e9df;border-radius:13px}
        .di-source-tabs button {border:0;border-radius:10px;background:transparent;padding:9px 4px;color:var(--muted);font:700 10px 'DM Sans',sans-serif;display:flex;gap:5px;justify-content:center;align-items:center;cursor:pointer}
        .di-source-tabs button.active {background:var(--card);color:var(--ink);box-shadow:0 2px 7px rgba(23,58,59,.08)}
        .di-entry {width:100%;min-height:125px;padding:14px;border:1px solid var(--line);border-radius:15px;background:var(--card);font:12px 'DM Sans',sans-serif;color:var(--ink);resize:vertical;outline-color:#8ba994}
        .di-entry.single {min-height:49px;resize:none}
        .di-help {display:flex;gap:7px;align-items:center;margin:11px 0 17px;color:var(--muted);font-size:10px}
        .di-notice {padding:11px 12px;margin-top:12px;border-radius:11px;background:var(--mint-soft);color:#3e6a55;font-size:11px;line-height:1.45}
        .di-profilepanel {margin-top:22px;padding:15px;border:1px solid var(--line);border-radius:17px;background:var(--card)}
        .di-profilepanel h2 {margin:0 0 13px;font-size:15px}
        .di-profileline {padding:12px 0;border-top:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;font-size:11px}
        .di-profileline span {color:var(--muted)}
        @keyframes di-rise {from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @media (prefers-reduced-motion:reduce){.di *{animation-duration:.01ms!important;transition-duration:.01ms!important}}
      `}</style>

      <header className="di-header">
        <div className="di-brand"><span className="di-mark"><BriefcaseBusiness size={15} /></span> Career Mate</div>
        <button className="di-profile" aria-label="Open profile" onClick={() => setTab('Profile')}><UserRound size={18} /></button>
      </header>

      {tab === 'Home' && (
        <>
          <p className="di-eyebrow">Your next move</p>
          <h1>Keep the good<br />work moving.</h1>
          <p className="di-lede">One role is still being checked. The rest are ready when you are.</p>

          <section className="di-next" aria-label="Evaluation in progress">
            <div className="di-next-top">
              <span className="di-statusline"><span className="di-pulse" /> In progress</span>
              <span className="di-next-score">Fit {roles[0].score} / 5</span>
            </div>
            <h2>{roles[0].title}</h2>
            <div className="di-company">{roles[0].company}</div>
            <div className="di-progress" aria-label="Evaluation processing"><span /></div>
            <div className="di-next-bottom">
              <span>Finishing your role check</span>
              <button onClick={() => setSelected(roles[0])}>View status <ArrowRight size={13} /></button>
            </div>
          </section>

          <div className="di-sectionhead"><h2>Ready to revisit</h2><span>2 checked</span></div>
          <div className="di-rolelist">
            {roles.slice(1).map((role) => (
              <div key={role.company}>
                <button className="di-role" onClick={() => setSelected(selected?.company === role.company ? null : role)}>
                  <span className={`di-glyph ${role.tone === 'amber' ? 'amber' : ''}`}><BriefcaseBusiness size={16} /></span>
                  <span className="di-rolecopy"><strong>{role.title}</strong><small>{role.company} · Checked</small></span>
                  <span className="di-rolemeta"><strong>{role.score}<small style={{ display: 'inline', fontSize: 9 }}> /5</small></strong><small>fit score</small></span>
                </button>
                {selected?.company === role.company && (
                  <div className="di-detail">
                    <div className="di-detailtop"><strong><ShieldCheck size={13} style={{ verticalAlign: '-2px', marginRight: 4 }} />Work rights: {role.rights}</strong><button aria-label="Close details" onClick={() => setSelected(null)}><X size={15} /></button></div>
                    <p>Your evaluation is complete. Open the role report to review the fit score and work-rights details.</p>
                    <button onClick={() => setNotice(`Report opened for ${role.company}.`)}>Open role report <ArrowRight size={13} /></button>
                  </div>
                )}
              </div>
            ))}
          </div>
          <button className="di-completed" onClick={() => setShowCompleted(!showCompleted)} aria-expanded={showCompleted}>
            <span>Completed checks</span><span>{showCompleted ? 'Hide' : 'Show'} <ChevronDown size={13} style={{ verticalAlign: '-3px', transform: showCompleted ? 'rotate(180deg)' : undefined }} /></span>
          </button>
          {showCompleted && <div className="di-completed-list"><div className="di-role" style={{ cursor: 'default' }}><span className="di-glyph"><Check size={17} /></span><span className="di-rolecopy"><strong>Northstar Energy</strong><small>Senior Product Designer · Complete</small></span><span className="di-rolemeta"><strong>4.1</strong></span></div><div className="di-role" style={{ cursor: 'default' }}><span className="di-glyph amber"><Check size={17} /></span><span className="di-rolecopy"><strong>Harbour Health</strong><small>UX Lead · Complete</small></span><span className="di-rolemeta"><strong>3.3</strong></span></div></div>}
          <div className="di-cta"><span className="di-cta-copy">Found another role?<br />Check it before you apply.</span><button className="di-primary" onClick={beginEvaluation}>Evaluate a job <ArrowRight size={15} /></button></div>
          {notice && <div className="di-notice" role="status">{notice}</div>}
        </>
      )}

      {tab === 'Evaluate' && (
        <>
          <div className="di-evalhead"><button className="di-back" onClick={() => setTab('Home')} aria-label="Back home"><ArrowLeft size={18} /></button><span>New role check</span></div>
          <p className="di-eyebrow">Start with the job</p>
          <h1>Bring the role<br />you have in mind.</h1>
          <p className="di-lede">Add a job listing and we’ll check how it lines up with your experience.</p>
          <div className="di-source-tabs" role="tablist" aria-label="Job details source">
            <button className={source === 'Link' ? 'active' : ''} onClick={() => setSource('Link')}><Link2 size={13} /> Link</button>
            <button className={source === 'Paste' ? 'active' : ''} onClick={() => setSource('Paste')}><ListChecks size={13} /> Paste</button>
            <button className={source === 'Upload' ? 'active' : ''} onClick={() => setSource('Upload')}><FileUp size={13} /> Upload</button>
          </div>
          {source === 'Link' && <input className="di-entry single" aria-label="Job listing URL" placeholder="Paste the job listing link" value={link} onChange={(e) => setLink(e.target.value)} />}
          {source === 'Paste' && <textarea className="di-entry" aria-label="Job listing text" placeholder="Paste the job title and description here…" />}
          {source === 'Upload' && <button className="di-entry" style={{ display: 'grid', placeItems: 'center', cursor: 'pointer', color: 'var(--muted)' }} onClick={() => setNotice('Choose a document from your device to continue.')}><span><FileUp size={22} /><br />Choose a job description</span></button>}
          <div className="di-help"><CircleHelp size={14} /> Your role details stay private to your account.</div>
          <button className="di-primary" onClick={() => setNotice(link.trim() || source !== 'Link' ? 'Role details received. Your check is ready to continue.' : 'Add a job listing link to continue.')}>Continue with this role <ArrowRight size={15} /></button>
          {notice && <div className="di-notice" role="status">{notice}</div>}
        </>
      )}

      {tab === 'Profile' && (
        <>
          <p className="di-eyebrow">Your account</p>
          <h1>A little about<br />your next chapter.</h1>
          <p className="di-lede">Keep the details that help make each role check more useful.</p>
          <div className="di-profilepanel">
            <h2>Profile at a glance</h2>
            <div className="di-profileline"><span>Work rights</span><strong>On file <ShieldCheck size={14} style={{ verticalAlign: '-3px' }} /></strong></div>
            <div className="di-profileline"><span>Career documents</span><strong>Manage <ArrowRight size={13} style={{ verticalAlign: '-2px' }} /></strong></div>
            <div className="di-profileline"><span>Preferences</span><strong>Review <ArrowRight size={13} style={{ verticalAlign: '-2px' }} /></strong></div>
          </div>
          <div className="di-notice" style={{ marginTop: 14 }}><Sparkles size={14} style={{ verticalAlign: '-3px', marginRight: 5 }} />Your profile helps put each role check in context.</div>
        </>
      )}

      <nav className="di-nav" aria-label="Main navigation">
        {([
          ['Home', House],
          ['Evaluate', ListChecks],
          ['Profile', UserRound],
        ] as const).map(([label, Icon]) => (
          <button key={label} aria-current={tab === label ? 'page' : undefined} onClick={() => { setTab(label); setNotice(''); }}>
            <Icon size={18} /><span>{label}</span>
          </button>
        ))}
      </nav>
    </main>
  );
}
