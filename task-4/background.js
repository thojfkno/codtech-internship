// ─── FocusTrack Background Service Worker ───────────────────────────────────

const PRODUCTIVE_DOMAINS = [
  'github.com', 'stackoverflow.com', 'leetcode.com', 'docs.google.com',
  'notion.so', 'figma.com', 'codepen.io', 'replit.com', 'developer.mozilla.org',
  'w3schools.com', 'freecodecamp.org', 'coursera.org', 'udemy.com',
  'medium.com', 'dev.to', 'hashnode.com', 'npmjs.com', 'python.org',
  'reactjs.org', 'vuejs.org', 'nodejs.org', 'docs.anthropic.com',
  'linkedin.com', 'kaggle.com', 'codtech.in', 'localhost', 'chat.openai.com'
];

const UNPRODUCTIVE_DOMAINS = [
  'youtube.com', 'instagram.com', 'facebook.com', 'twitter.com', 'x.com',
  'reddit.com', 'tiktok.com', 'netflix.com', 'twitch.tv', 'snapchat.com',
  'pinterest.com', 'tumblr.com', 'buzzfeed.com', '9gag.com', 'discord.com',
  'whatsapp.com', 'telegram.org', 'primevideo.com', 'hotstar.com'
];

let activeTabId = null;
let activeUrl = null;
let sessionStart = null;

function getDomain(url) {
  try {
    if (!url || url.startsWith('chrome://') || url.startsWith('about:')) return null;
    return new URL(url).hostname.replace('www.', '');
  } catch { return null; }
}

function classifyDomain(domain) {
  if (!domain) return 'neutral';
  if (PRODUCTIVE_DOMAINS.some(d => domain.includes(d))) return 'productive';
  if (UNPRODUCTIVE_DOMAINS.some(d => domain.includes(d))) return 'unproductive';
  return 'neutral';
}

function getTodayKey() {
  return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
}

async function saveTime(domain, seconds) {
  if (!domain || seconds < 1) return;

  const today = getTodayKey();
  const category = classifyDomain(domain);

  const result = await chrome.storage.local.get(['timeData']);
  const timeData = result.timeData || {};

  if (!timeData[today]) timeData[today] = {};
  if (!timeData[today][domain]) {
    timeData[today][domain] = { seconds: 0, category };
  }

  timeData[today][domain].seconds += Math.round(seconds);
  timeData[today][domain].category = category;

  await chrome.storage.local.set({ timeData });
}

async function flushCurrentSession() {
  if (!activeUrl || !sessionStart) return;
  const domain = getDomain(activeUrl);
  const elapsed = (Date.now() - sessionStart) / 1000;
  await saveTime(domain, elapsed);
  sessionStart = Date.now(); // reset session start
}

// ─── Tab / Window Event Listeners ────────────────────────────────────────────

chrome.tabs.onActivated.addListener(async (info) => {
  await flushCurrentSession();
  try {
    const tab = await chrome.tabs.get(info.tabId);
    activeTabId = info.tabId;
    activeUrl = tab.url;
    sessionStart = Date.now();
  } catch {}
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (tabId !== activeTabId) return;
  if (changeInfo.status !== 'complete') return;
  await flushCurrentSession();
  activeUrl = tab.url;
  sessionStart = Date.now();
});

chrome.tabs.onRemoved.addListener(async (tabId) => {
  if (tabId === activeTabId) {
    await flushCurrentSession();
    activeTabId = null;
    activeUrl = null;
    sessionStart = null;
  }
});

chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    await flushCurrentSession();
    sessionStart = null;
  } else {
    try {
      const [tab] = await chrome.tabs.query({ active: true, windowId });
      if (tab) {
        activeTabId = tab.id;
        activeUrl = tab.url;
        sessionStart = Date.now();
      }
    } catch {}
  }
});

// ─── Periodic flush every 10 seconds ─────────────────────────────────────────
chrome.alarms.create('flush', { periodInMinutes: 1 / 6 });
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'flush') await flushCurrentSession();
});

// ─── Message Handler ──────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'GET_STATS') {
    flushCurrentSession().then(() => {
      chrome.storage.local.get(['timeData'], (result) => {
        sendResponse({ timeData: result.timeData || {} });
      });
    });
    return true;
  }

  if (msg.type === 'SET_CATEGORY') {
    const { domain, category } = msg;
    chrome.storage.local.get(['timeData'], (result) => {
      const timeData = result.timeData || {};
      const today = getTodayKey();
      if (timeData[today] && timeData[today][domain]) {
        timeData[today][domain].category = category;
        chrome.storage.local.set({ timeData }, () => sendResponse({ ok: true }));
      } else {
        sendResponse({ ok: false });
      }
    });
    return true;
  }

  if (msg.type === 'CLEAR_DATA') {
    chrome.storage.local.clear(() => sendResponse({ ok: true }));
    return true;
  }
});
