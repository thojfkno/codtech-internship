# Task 4 — Chrome Extension for Time Tracking

**Intern:** Karthika Shanmuga Pandian | **ID:** CTIS9056  
**Domain:** Full Stack Development | **CodTech IT Solutions**

## What It Does
A Chrome extension that automatically tracks time spent on every website, classifies sites as productive/unproductive, and shows a beautiful analytics dashboard.

## Features
- ⏱ Automatic time tracking on every website you visit
- ✅ Productive sites: GitHub, Stack Overflow, LeetCode, Coursera, Notion, etc.
- ❌ Unproductive sites: YouTube, Instagram, Twitter, Netflix, Reddit, etc.
- 📊 Focus Score — shows your productive vs unproductive ratio
- 📅 Today tab — top sites + summary cards
- 📈 Week tab — 7-day bar chart
- 🌐 Sites tab — all sites with toggle to re-classify
- 💾 Data stored locally in Chrome storage (private, no server)
- 🗑 Clear data button

## How to Install in Chrome

### Step 1 — Open Chrome Extensions
Open Chrome → go to `chrome://extensions`

### Step 2 — Enable Developer Mode
Toggle **Developer mode** ON (top right corner)

### Step 3 — Load the Extension
Click **"Load unpacked"** → select the `task-4` folder

### Step 4 — Pin it
Click the puzzle icon 🧩 in Chrome toolbar → pin **FocusTrack**

### Step 5 — Start Using
Browse normally for a few minutes, then click the FocusTrack icon to see your stats!

## Project Structure
```
task-4/
├── manifest.json     ← Extension config (Manifest V3)
├── background.js     ← Service worker: tracks active tab time
├── popup.html        ← Dashboard UI
├── popup.css         ← Dark-themed styles
├── popup.js          ← Renders stats, charts, toggle categories
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## How It Works
- `background.js` listens to `tabs.onActivated`, `tabs.onUpdated`, and `windows.onFocusChanged` events
- Every 10 seconds it flushes the current session time to `chrome.storage.local`
- Data is keyed by date (`YYYY-MM-DD`) → domain → `{ seconds, category }`
- The popup reads this data and renders charts and lists
