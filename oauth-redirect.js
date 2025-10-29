// Place this file at /static/oauth-redirect.js (or whichever path you serve scripts from).
// The HTML above loads it with script-src 'self' CSP in examples below.
(function () {
  const params = new URLSearchParams(window.location.search || window.location.hash.slice(1));
  const code = params.get('code');
  const state = params.get('state');
  const error = params.get('error') || params.get('error_description');

  const codeEl = document.getElementById('auth-code');
  const stateEl = document.getElementById('state');
  const copyBtn = document.getElementById('copyBtn');
  const copiedMsg = document.getElementById('copiedMsg');

  const message = { type: "oauthResponse", code: code || null, state: state || null, error: error || null };

  // Best-effort determine origin; prefer passing a trusted origin from opener if possible.
  let targetOrigin = "*";
  try {
    if (document.referrer) targetOrigin = new URL(document.referrer).origin;
  } catch (e) {}

  if (error) {
    codeEl.textContent = 'Error: ' + error;
  } else if (code) {
    codeEl.textContent = code;
    copyBtn.style.display = 'inline-block';
    if (state) {
      stateEl.style.display = 'block';
      stateEl.textContent = 'State: ' + state;
    }
  } else {
    codeEl.textContent = 'No code found in the redirect.';
  }

  try {
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage(message, targetOrigin);
    }
  } catch (err) { /* swallow */ }

  try {
    const channel = new BroadcastChannel('HMRCAUTHTOKEN');
    channel.postMessage(message);
    channel.close();
  } catch (err) { /* may not be available */ }

  copyBtn.addEventListener('click', async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      copiedMsg.style.display = 'block';
      setTimeout(() => (copiedMsg.style.display = 'none'), 2000);
    } catch (err) {
      alert('Failed to copy code. Please copy manually.');
    }
  });

  setTimeout(() => {
    try { window.close(); } catch (e) {}
  }, 700);
})();