// Put this file at /static/oauth-redirect.js (or another static path on the same origin).
// The HTML loads this with script-src 'self' in CSP.
(function () {
  // Parse params from URL (query or hash)
  const params = new URLSearchParams(window.location.search || window.location.hash.slice(1));
  const code = params.get('code');
  const state = params.get('state');
  const error = params.get('error') || params.get('error_description');

  const codeEl = document.getElementById('auth-code');
  const stateEl = document.getElementById('state');
  const copyBtn = document.getElementById('copyBtn');
  const copiedMsg = document.getElementById('copiedMsg');

  // Structured message to send to opener / other listeners (do not log secrets)
  const message = { type: "oauthResponse", code: code || null, state: state || null, error: error || null };

  // Best-effort derive the opener origin to use as targetOrigin for postMessage.
  // Prefer the opener to pass its origin explicitly if possible.
  let targetOrigin = "*";
  try {
    if (document.referrer) {
      targetOrigin = new URL(document.referrer).origin;
    }
  } catch (e) {
    // fallback to "*" if parsing fails
  }

  // Show result to user (textContent to avoid XSS)
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

  // Post message to opener (best-effort). The opener must still validate origin and state.
  try {
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage(message, targetOrigin);
    }
  } catch (err) {
    // swallow errors to avoid exposing secrets
  }

  // Broadcast structured message (close channel immediately)
  try {
    const channel = new BroadcastChannel('HMRCAUTHTOKEN');
    channel.postMessage(message);
    channel.close();
  } catch (err) {
    // BroadcastChannel may be unavailable in some environments
  }

  // Enable copy-to-clipboard button (user-initiated)
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

  // Optionally close the popup after a short delay. The opener should handle receipt/validation.
  setTimeout(() => {
    try { window.close(); } catch (e) {}
  }, 700);
})();
