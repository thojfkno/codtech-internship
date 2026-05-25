// ─── FocusTrack Popup Script ────────────────────────────────────────────────

function formatTime(seconds) {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const m = Math.floor(seconds / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  return `${m}m`;
}

function getTodayKey() {
  return new Date().toISOString().split('T')[0];
}

function getLast7Days() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}

function dayLabel(dateStr) {
  const d = new Date(dateStr);
  return ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'][d.getDay()];
}

// ─── Tab Switching ────────────────────────────────────────────────────────────
document.querySelectorAll('.tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
  });
});

// ─── Load & Render ────────────────────────────────────────────────────────────
chrome.runtime.sendMessage({ type: 'GET_STATS' }, ({ timeData }) => {
  renderToday(timeData);
  renderWeek(timeData);
  renderSites(timeData);
});

function renderToday(timeData) {
  const today = getTodayKey();
  const todayData = timeData[today] || {};

  let productive = 0, unproductive = 0, neutral = 0;
  for (const [, val] of Object.entries(todayData)) {
    if (val.category === 'productive') productive += val.seconds;
    else if (val.category === 'unproductive') unproductive += val.seconds;
    else neutral += val.seconds;
  }

  document.getElementById('today-productive').textContent = formatTime(productive);
  document.getElementById('today-unproductive').textContent = formatTime(unproductive);
  document.getElementById('today-neutral').textContent = formatTime(neutral);

  // Focus score: productive / (productive + unproductive) * 100
  const total = productive + unproductive;
  const score = total > 0 ? Math.round((productive / total) * 100) : null;
  document.getElementById('score-bar').style.width = score !== null ? score + '%' : '0%';
  document.getElementById('score-num').textContent = score !== null ? score + '%' : '–';

  // Top 5 sites
  const list = document.getElementById('today-list');
  const sorted = Object.entries(todayData).sort((a, b) => b[1].seconds - a[1].seconds).slice(0, 5);
  const maxSec = sorted[0]?.[1]?.seconds || 1;

  if (sorted.length === 0) {
    list.innerHTML = `<div class="empty"><div class="icon">📊</div>No data yet today.<br>Browse some sites and check back!</div>`;
    return;
  }

  list.innerHTML = sorted.map(([domain, val]) => `
    <div class="site-row">
      <div class="site-dot ${val.category}"></div>
      <div class="site-name">${domain}</div>
      <div class="site-time">${formatTime(val.seconds)}</div>
      <div class="site-bar-wrap">
        <div class="site-bar ${val.category}" style="width:${(val.seconds/maxSec*100).toFixed(0)}%"></div>
      </div>
    </div>
  `).join('');
}

function renderWeek(timeData) {
  const days = getLast7Days();
  const today = getTodayKey();
  const chart = document.getElementById('week-chart');

  let totalP = 0, totalU = 0;
  const dayStats = days.map(d => {
    const data = timeData[d] || {};
    let p = 0, u = 0;
    for (const val of Object.values(data)) {
      if (val.category === 'productive') p += val.seconds;
      else if (val.category === 'unproductive') u += val.seconds;
    }
    totalP += p; totalU += u;
    return { date: d, productive: p, unproductive: u };
  });

  const maxTotal = Math.max(...dayStats.map(d => d.productive + d.unproductive), 1);

  chart.innerHTML = dayStats.map(d => {
    const pPct = (d.productive / maxTotal * 90).toFixed(1);
    const uPct = (d.unproductive / maxTotal * 90).toFixed(1);
    const isToday = d.date === today;
    return `
      <div class="week-day">
        <div class="week-bar-wrap">
          ${d.unproductive > 0 ? `<div class="week-bar unproductive" style="height:${uPct}px"></div>` : ''}
          ${d.productive > 0 ? `<div class="week-bar productive" style="height:${pPct}px"></div>` : ''}
        </div>
        <div class="week-label ${isToday ? 'today' : ''}">${dayLabel(d.date)}</div>
      </div>
    `;
  }).join('');

  document.getElementById('week-productive').textContent = formatTime(totalP);
  document.getElementById('week-unproductive').textContent = formatTime(totalU);
}

function renderSites(timeData) {
  const today = getTodayKey();
  const todayData = timeData[today] || {};
  const list = document.getElementById('sites-list');

  const sorted = Object.entries(todayData).sort((a, b) => b[1].seconds - a[1].seconds);
  const maxSec = sorted[0]?.[1]?.seconds || 1;

  if (sorted.length === 0) {
    list.innerHTML = `<div class="empty"><div class="icon">🌐</div>No sites tracked yet today.</div>`;
    return;
  }

  list.innerHTML = sorted.map(([domain, val]) => `
    <div class="site-row" id="row-${CSS.escape(domain)}">
      <div class="site-dot ${val.category}"></div>
      <div class="site-name">${domain}</div>
      <div class="site-time">${formatTime(val.seconds)}</div>
      <div class="site-bar-wrap">
        <div class="site-bar ${val.category}" style="width:${(val.seconds/maxSec*100).toFixed(0)}%"></div>
      </div>
      <button class="cat-btn" data-domain="${domain}" data-cat="${val.category}" title="Toggle category">
        ${val.category === 'productive' ? '✅' : val.category === 'unproductive' ? '❌' : '➖'}
      </button>
    </div>
  `).join('');

  // Toggle category on click
  list.querySelectorAll('.cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const domain = btn.dataset.domain;
      const cats = ['productive', 'neutral', 'unproductive'];
      const next = cats[(cats.indexOf(btn.dataset.cat) + 1) % 3];
      chrome.runtime.sendMessage({ type: 'SET_CATEGORY', domain, category: next }, () => {
        chrome.runtime.sendMessage({ type: 'GET_STATS' }, ({ timeData }) => {
          renderToday(timeData);
          renderSites(timeData);
        });
      });
    });
  });
}

// ─── Clear button ─────────────────────────────────────────────────────────────
document.getElementById('clear-btn').addEventListener('click', () => {
  if (!confirm('Clear all tracking data? This cannot be undone.')) return;
  chrome.runtime.sendMessage({ type: 'CLEAR_DATA' }, () => {
    chrome.runtime.sendMessage({ type: 'GET_STATS' }, ({ timeData }) => {
      renderToday(timeData);
      renderWeek(timeData);
      renderSites(timeData);
    });
  });
});
