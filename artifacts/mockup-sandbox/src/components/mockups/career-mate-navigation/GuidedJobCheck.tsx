import { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Check,
  CircleHelp,
  FileText,
  Link2,
  MapPin,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

type Step = 1 | 2 | 3;

export function GuidedJobCheck() {
  const [step, setStep] = useState<Step>(1);
  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [notice, setNotice] = useState('');

  const goNext = () => {
    setNotice('');
    if (step === 1 && !jobTitle.trim()) {
      setNotice('Add a job title so we know which role to look at.');
      return;
    }
    if (step < 3) setStep((step + 1) as Step);
    else setNotice('Your role check is ready. We’ll compare the listing with your experience.');
  };

  return (
    <main className="gj">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Fraunces:opsz,wght@9..144,500;9..144,600&display=swap');
        .gj{--ink:#173a3b;--muted:#657c78;--paper:#f5f4eb;--card:#fffef8;--line:#dce3d9;--coral:#c7654c;--coral-soft:#f8e7df;--mint:#477965;position:relative;box-sizing:border-box;width:100%;max-width:480px;min-height:100dvh;margin:auto;padding:24px 22px 32px;overflow:hidden;background:var(--paper);color:var(--ink);font-family:'DM Sans',sans-serif}
        .gj *{box-sizing:border-box}.gj-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:26px}
        .gj-brand{display:flex;align-items:center;gap:9px;font-size:13px;font-weight:800;letter-spacing:-.2px}
        .gj-mark{width:29px;height:29px;border-radius:10px;display:grid;place-items:center;background:var(--ink);color:#f7f1df}
        .gj-exit{width:37px;height:37px;border:1px solid var(--line);border-radius:50%;display:grid;place-items:center;background:var(--card);color:var(--ink);cursor:pointer}
        .gj-progress-wrap{margin:0 1px 27px}.gj-progress-label{display:flex;justify-content:space-between;align-items:center;margin-bottom:9px;color:var(--muted);font-size:10px;font-weight:700}
        .gj-progress-label strong{color:var(--ink);font-size:10px}.gj-track{display:flex;gap:5px}.gj-track i{height:4px;flex:1;border-radius:9px;background:#dfe3d9;transition:background .25s ease}.gj-track i.done{background:var(--mint)}.gj-track i.current{background:var(--coral)}
        .gj-intro{animation:gj-rise .34s ease both}.gj-eyebrow{margin:0 0 8px;color:var(--coral);font-size:10px;font-weight:800;letter-spacing:1.45px;text-transform:uppercase}
        .gj h1{margin:0;font-family:'Fraunces',serif;font-size:32px;font-weight:500;line-height:1.04;letter-spacing:-.7px}.gj-lede{margin:10px 0 21px;color:var(--muted);font-size:12px;line-height:1.55}
        .gj-card{padding:17px;border:1px solid var(--line);border-radius:18px;background:var(--card);animation:gj-rise .38s .04s ease both}
        .gj-field{display:block;margin-bottom:16px}.gj-field:last-child{margin-bottom:0}.gj-field label{display:block;margin-bottom:7px;font-size:11px;font-weight:800}
        .gj-field small{display:block;margin-top:6px;color:var(--muted);font-size:10px;line-height:1.45}
        .gj-input,.gj-textarea{width:100%;border:1px solid #d9e0d6;border-radius:12px;background:#fffef9;padding:12px 13px;color:var(--ink);font:500 12px 'DM Sans',sans-serif;outline:none;transition:border-color .18s ease,box-shadow .18s ease}
        .gj-input:focus,.gj-textarea:focus{border-color:#7e9c86;box-shadow:0 0 0 3px rgba(71,121,101,.1)}.gj-input::placeholder,.gj-textarea::placeholder{color:#9aa8a0}
        .gj-input-icon{position:relative}.gj-input-icon svg{position:absolute;left:12px;top:12px;color:#779087}.gj-input-icon .gj-input{padding-left:38px}
        .gj-textarea{min-height:140px;resize:vertical;line-height:1.5}
        .gj-help{display:flex;align-items:flex-start;gap:8px;margin:13px 2px 0;color:var(--muted);font-size:10px;line-height:1.45}.gj-help svg{flex:none;margin-top:1px;color:var(--mint)}
        .gj-nudge{margin-top:15px;padding:12px 13px;border-radius:13px;background:#e9eee4;color:#45685a;font-size:10px;line-height:1.5}.gj-nudge strong{display:block;margin-bottom:2px;color:var(--ink);font-size:10px}
        .gj-actions{display:flex;align-items:center;gap:10px;margin-top:23px}.gj-back{width:48px;height:48px;flex:none;border:1px solid var(--line);border-radius:14px;background:var(--card);color:var(--ink);display:grid;place-items:center;cursor:pointer}
        .gj-primary{min-height:49px;flex:1;border:0;border-radius:14px;background:var(--coral);color:#fffaf0;display:flex;align-items:center;justify-content:center;gap:8px;font:800 12px 'DM Sans',sans-serif;cursor:pointer;transition:transform .18s ease}
        .gj-primary:active,.gj-back:active{transform:scale(.98)}.gj-note{margin-top:12px;padding:11px 12px;border-radius:11px;background:var(--coral-soft);color:#8a4b38;font-size:11px;line-height:1.45}
        .gj-review{display:grid;gap:0}.gj-review-row{padding:12px 0;border-bottom:1px solid var(--line)}.gj-review-row:first-child{padding-top:0}.gj-review-row:last-child{border:0;padding-bottom:0}.gj-review-row span{display:block;color:var(--muted);font-size:10px;margin-bottom:4px}.gj-review-row strong{font-size:12px;line-height:1.4;overflow-wrap:anywhere}
        .gj-success{text-align:center;padding:24px 6px 8px;animation:gj-rise .35s ease both}.gj-success-mark{width:54px;height:54px;margin:0 auto 15px;border-radius:18px;display:grid;place-items:center;background:#e3eee4;color:var(--mint)}.gj-success h1{font-size:31px}.gj-success p{max-width:280px;margin:10px auto 20px;color:var(--muted);font-size:12px;line-height:1.55}
        @keyframes gj-rise{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:translateY(0)}}@media(prefers-reduced-motion:reduce){.gj *{animation-duration:.01ms!important;transition-duration:.01ms!important}}
      `}</style>

      <header className="gj-top">
        <div className="gj-brand"><span className="gj-mark"><BriefcaseBusiness size={15} /></span> Career Mate</div>
        <button className="gj-exit" aria-label="Return to home" onClick={() => { setStep(1); setNotice(''); }}><ArrowLeft size={16} /></button>
      </header>

      <div className="gj-progress-wrap" aria-label={`Step ${step} of 3`}>
        <div className="gj-progress-label"><span>YOUR ROLE CHECK</span><strong>STEP {step} OF 3</strong></div>
        <div className="gj-track">{[1, 2, 3].map((item) => <i key={item} className={item < step ? 'done' : item === step ? 'current' : ''} />)}</div>
      </div>

      {step === 1 && (
        <section className="gj-intro">
          <p className="gj-eyebrow">First, the basics</p>
          <h1>Which role are<br />you considering?</h1>
          <p className="gj-lede">A couple of details help us find the right context. You can change these later.</p>
          <div className="gj-card">
            <div className="gj-field">
              <label htmlFor="gj-title">Job title</label>
              <div className="gj-input-icon"><BriefcaseBusiness size={15} /><input id="gj-title" className="gj-input" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="e.g. Service Designer" /></div>
              <small>Use the title from the listing if you have it.</small>
            </div>
            <div className="gj-field">
              <label htmlFor="gj-company">Company <span style={{ color: 'var(--muted)', fontWeight: 500 }}>· optional</span></label>
              <input id="gj-company" className="gj-input" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Who’s hiring?" />
            </div>
            <div className="gj-field">
              <label htmlFor="gj-location">Where is the role based?</label>
              <div className="gj-input-icon"><MapPin size={15} /><input id="gj-location" className="gj-input" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, region or remote" /></div>
              <small>Location can affect work-rights and role requirements.</small>
            </div>
          </div>
          <div className="gj-help"><ShieldCheck size={14} /> Your role details are private and only used for this check.</div>
        </section>
      )}

      {step === 2 && (
        <section className="gj-intro">
          <p className="gj-eyebrow">Add the listing</p>
          <h1>Give us the job<br />description.</h1>
          <p className="gj-lede">Paste the listing below, or start with the key parts. More detail helps us give you a more useful read.</p>
          <div className="gj-card">
            <div className="gj-field">
              <label htmlFor="gj-description">Job description</label>
              <textarea id="gj-description" className="gj-textarea" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Paste the job listing, including responsibilities and requirements…" />
              <small>Tip: include the “What you’ll do” and “What we’re looking for” sections.</small>
            </div>
            <div className="gj-field">
              <label htmlFor="gj-link">Listing link <span style={{ color: 'var(--muted)', fontWeight: 500 }}>· optional</span></label>
              <div className="gj-input-icon"><Link2 size={15} /><input id="gj-link" className="gj-input" placeholder="https://…" /></div>
            </div>
          </div>
          <div className="gj-nudge"><strong><FileText size={12} style={{ verticalAlign: '-2px', marginRight: 5 }} />No full listing handy?</strong>A short summary is a good start. We’ll make clear what we can and can’t assess.</div>
        </section>
      )}

      {step === 3 && (
        <section className="gj-intro">
          <p className="gj-eyebrow">Ready for a quick check</p>
          <h1>Take a look<br />before we begin.</h1>
          <p className="gj-lede">Just checking we’ve got the right role. You can go back and change anything.</p>
          <div className="gj-card gj-review">
            <div className="gj-review-row"><span>Job title</span><strong>{jobTitle || 'Role to be confirmed'}</strong></div>
            <div className="gj-review-row"><span>Company</span><strong>{company || 'Not specified'}</strong></div>
            <div className="gj-review-row"><span>Location</span><strong>{location || 'Not specified'}</strong></div>
            <div className="gj-review-row"><span>Listing details</span><strong>{description.trim() ? `${description.trim().length} characters added` : 'A listing summary hasn’t been added yet'}</strong></div>
          </div>
          <div className="gj-help"><CircleHelp size={14} /> We’ll compare role requirements with your profile. This is guidance, not a hiring decision.</div>
          <div className="gj-nudge"><strong><Sparkles size={12} style={{ verticalAlign: '-2px', marginRight: 5 }} />Small details make a better match.</strong>Adding a description gives your evaluation more context.</div>
        </section>
      )}

      {notice.startsWith('Your role check is ready') ? (
        <section className="gj-success" role="status">
          <div className="gj-success-mark"><Check size={25} /></div>
          <p className="gj-eyebrow">All set</p>
          <h1>Good place<br />to start.</h1>
          <p>{notice}</p>
          <button className="gj-primary" onClick={() => { setStep(1); setNotice(''); setJobTitle(''); setCompany(''); setLocation(''); setDescription(''); }}>Start another role check <ArrowRight size={15} /></button>
        </section>
      ) : (
        <>
          <div className="gj-actions">
            {step > 1 && <button className="gj-back" onClick={() => { setNotice(''); setStep((step - 1) as Step); }} aria-label="Go to previous step"><ArrowLeft size={18} /></button>}
            <button className="gj-primary" onClick={goNext}>{step === 3 ? 'Start my role check' : 'Continue'} <ArrowRight size={15} /></button>
          </div>
          {notice && <div className="gj-note" role="status">{notice}</div>}
        </>
      )}
    </main>
  );
}
