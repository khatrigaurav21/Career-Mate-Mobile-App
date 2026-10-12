/**
 * Reading a job ad from a page the user opened in the in-app browser
 * (app/read-ad.tsx). Seek and Indeed block our server, but not a person
 * browsing on their phone — the same reason career-ops works on a PC. The
 * user sees the real page and taps "Use this ad"; this is the copy-and-paste
 * they would otherwise do by hand. Nothing here runs in the background, and
 * a "verify you're human" check is always left for the user to complete.
 *
 * If Seek or Indeed change their page structure, update the selectors in
 * CAPTURE_SCRIPT; the generic fallback keeps it working meanwhile.
 */

// Runs inside the page. Picks the ad's parts by each site's own markers,
// falls back to <main> or the whole page, and posts the text back.
export const CAPTURE_SCRIPT = `
(function () {
  function text(selectors) {
    for (var i = 0; i < selectors.length; i++) {
      var el = document.querySelector(selectors[i]);
      if (el && el.innerText && el.innerText.trim()) return el.innerText.trim();
    }
    return '';
  }
  var title = text(['[data-automation="job-detail-title"]', '[data-testid="jobsearch-JobInfoHeader-title"]', 'h1.jobsearch-JobInfoHeader-title', 'h1']);
  var company = text(['[data-automation="advertiser-name"]', '[data-testid="inlineHeader-companyName"]', '[data-company-name]']);
  var place = text(['[data-automation="job-detail-location"]', '[data-testid="inlineHeader-companyLocation"]', '[data-testid="job-location"]']);
  var body = text(['[data-automation="jobAdDetails"]', '#jobDescriptionText', 'main']) || (document.body ? document.body.innerText : '');
  var parts = [title, company, place, '', body].filter(function (p, i) { return p || i === 3; });
  window.ReactNativeWebView.postMessage(JSON.stringify({ url: String(window.location.href), title: title, text: parts.join('\\n').slice(0, 30000) }));
})();
true;
`;

export type CapturedAd = { url: string; title: string; text: string };

// Bot-check and sign-in pages, which mean the ad isn't on screen yet.
const NOT_AN_AD = [
  /additional verification required/i,
  /verif(y|ies|ying) (that )?you are (not a bot|(a )?human)/i,
  /^just a moment/im,
  /performing security verification/i,
  /enable javascript and cookies/i,
  /press (&|and) hold/i,
];

const MIN_AD_LENGTH = 300;

/** The ad text to evaluate, or a message telling the user what to do. */
export function checkCapturedAd(raw: string): { ok: true; ad: CapturedAd } | { ok: false; message: string } {
  let ad: CapturedAd;
  try {
    ad = JSON.parse(raw) as CapturedAd;
  } catch {
    return { ok: false, message: 'We couldn’t read that page. Try again once the ad has loaded.' };
  }
  const text = (ad.text ?? '').trim();
  if (NOT_AN_AD.some((p) => p.test(text.slice(0, 2000)))) {
    return { ok: false, message: 'The site is checking you’re a person. Complete its check on the page, then tap Use this ad again.' };
  }
  if (text.length < MIN_AD_LENGTH) {
    return { ok: false, message: 'The ad hasn’t loaded yet. Open the job ad itself (not a search page), then tap Use this ad.' };
  }
  return { ok: true, ad: { ...ad, text } };
}
