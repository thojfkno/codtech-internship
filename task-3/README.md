# Task 3 — Real-Time Collaborative Document Editor

**Intern:** Karthika Shanmuga Pandian | **ID:** CTIS9056  
**Domain:** Full Stack Development | **CodTech IT Solutions**

## What It Does
A Google Docs-style collaborative editor where multiple users can edit the same document simultaneously in real time.

## Features
- Real-time multi-user editing via Socket.IO
- Rich text editor (Quill.js) — bold, italic, headings, lists, colors
- Live user presence sidebar showing who's online
- Editable document title synced across all users
- Auto-save every 3 seconds to MongoDB (or in-memory fallback)
- Share document by copying Document ID
- Dark themed, responsive UI

## Tech Stack
| Layer | Technology |
|---|---|
| Frontend | React.js + Vite |
| Editor | Quill.js |
| Backend | Node.js + Express |
| Real-time | Socket.IO |
| Database | MongoDB (Atlas or local) |

## How to Run

### Step 1 — Start the Backend
```bash
cd server
npm install
npm start
```
Server runs at http://localhost:3001

### Step 2 — Start the Frontend
```bash
cd client
npm install
npm run dev
```
App opens at http://localhost:5173

### Step 3 — Test Collaboration
1. Open http://localhost:5173 in two browser tabs
2. Tab 1: Enter name "Karthika" → Create New Document
3. Copy the Document ID shown in the sidebar
4. Tab 2: Enter a different name → paste the ID → Join
5. Type in one tab — it appears instantly in the other!

## MongoDB Setup (Optional)
- Without MongoDB: the app works using in-memory storage (data resets on server restart)
- With MongoDB Atlas (free): copy `.env.example` to `.env` and add your connection string

## Project Structure
```
task-3/
├── server/
│   ├── index.js          # Express + Socket.IO server
│   ├── package.json
│   └── .env.example
└── client/
    ├── src/
    │   ├── App.jsx
    │   ├── components/
    │   │   ├── Home.jsx   # Landing page
    │   │   └── Editor.jsx # Main editor
    │   └── index.css
    ├── index.html
    └── package.json
```
