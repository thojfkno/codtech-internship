# ChatNow — Real-Time Chat Application
### Codtech IT Solutions Internship — Task 2
**Intern:** Karthika Shanmuga Pandian | **ID:** CTIS9056

---

## 📌 What This App Does
- Real-time messaging using **Socket.IO + WebSockets**
- Multiple chat rooms (General, Tech Talk, Random, Codtech)
- Live typing indicators ("Karthika is typing…")
- Online users list with colored avatars
- Message history on join
- Fully responsive dark UI

---

## 🛠️ Tech Stack
| Layer    | Technology              |
|----------|------------------------|
| Frontend | HTML, CSS, JavaScript  |
| Backend  | Node.js + Express      |
| Realtime | Socket.IO (WebSockets) |
| Storage  | In-memory (server RAM) |

---

## 🚀 How to Run

### Step 1 — Install Node.js
Download from: https://nodejs.org (choose LTS version)

### Step 2 — Install dependencies
Open terminal in the `task-2` folder and run:
```bash
npm install
```

### Step 3 — Start the server
```bash
npm start
```
You'll see:
```
✅ ChatNow server running at http://localhost:3000
```

### Step 4 — Open in browser
Go to: **http://localhost:3000**

### Step 5 — Test real-time chat
Open **two browser tabs** both at http://localhost:3000
- Enter different usernames in each tab
- Chat between them — messages appear instantly!

---

## 📁 Project Structure
```
task-2/
├── server.js          ← Node.js + Socket.IO backend
├── package.json       ← Dependencies
├── public/
│   └── index.html     ← Frontend (HTML + CSS + JS)
└── README.md
```

---

## ⚡ Socket.IO Events Used

| Event           | Direction       | Purpose                        |
|-----------------|-----------------|--------------------------------|
| `user:join`     | Client → Server | User joins with username+room  |
| `chat:send`     | Client → Server | Send a message                 |
| `chat:typing`   | Both ways       | Typing indicator               |
| `room:switch`   | Client → Server | Switch chat room               |
| `chat:history`  | Server → Client | Load last 50 messages          |
| `chat:message`  | Server → Client | Broadcast new message          |
| `room:users`    | Server → Client | Updated online users list      |
| `rooms:update`  | Server → Client | Updated room counts            |
