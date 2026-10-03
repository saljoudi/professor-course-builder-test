const input = document.getElementById('apiBase');
const status = document.getElementById('status');

function originPattern(url) {
  const parsed = new URL(url);
  return `${parsed.protocol}//${parsed.host}/*`;
}

async function load() {
  const data = await chrome.storage.local.get(['apiBase']);
  input.value = data.apiBase || 'http://localhost:8787';
}

async function save() {
  try {
    const base = input.value.trim().replace(/\/$/, '');
    const pattern = originPattern(base);
    if (!base.startsWith('http://localhost')) {
      const granted = await chrome.permissions.request({ origins: [pattern] });
      if (!granted) throw new Error('Host permission was not granted.');
    }
    const response = await fetch(`${base}/api/health`);
    if (!response.ok) throw new Error(`Health check failed (${response.status})`);
    const info = await response.json();
    await chrome.storage.local.set({ apiBase: base });
    status.textContent = `Connected. AI=${info.providers.ai}, Render=${info.providers.render}.`;
  } catch (error) {
    status.textContent = `Could not connect: ${error.message}`;
  }
}

document.getElementById('save').addEventListener('click', save);
document.getElementById('reset').addEventListener('click', async () => { input.value='http://localhost:8787'; await save(); });
load();
