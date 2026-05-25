require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/collab-editor";

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.log("⚠️  MongoDB not connected — running in memory mode");
  });

// Document Schema
const documentSchema = new mongoose.Schema({
  _id: String,
  title: { type: String, default: "Untitled Document" },
  content: { type: String, default: "" },
  lastModified: { type: Date, default: Date.now },
});
const Document = mongoose.model("Document", documentSchema);

// In-memory fallback store (if MongoDB is not available)
const memoryStore = {};

async function findOrCreateDocument(id) {
  if (!id) return null;
  try {
    if (mongoose.connection.readyState === 1) {
      let doc = await Document.findById(id);
      if (!doc) {
        doc = await Document.create({ _id: id, content: "", title: "Untitled Document" });
      }
      return doc;
    }
  } catch (e) {}
  // fallback to memory
  if (!memoryStore[id]) {
    memoryStore[id] = { _id: id, title: "Untitled Document", content: "" };
  }
  return memoryStore[id];
}

async function saveDocument(id, content, title) {
  try {
    if (mongoose.connection.readyState === 1) {
      await Document.findByIdAndUpdate(id, { content, title, lastModified: Date.now() });
      return;
    }
  } catch (e) {}
  if (memoryStore[id]) {
    memoryStore[id].content = content;
    memoryStore[id].title = title;
  }
}

// Track active users per document
const documentUsers = {};

io.on("connection", (socket) => {
  console.log(`🔌 User connected: ${socket.id}`);

  socket.on("get-document", async ({ documentId, username }) => {
    const document = await findOrCreateDocument(documentId);
    socket.join(documentId);

    // Track user
    if (!documentUsers[documentId]) documentUsers[documentId] = {};
    documentUsers[documentId][socket.id] = { username, color: getColor(socket.id) };

    socket.emit("load-document", {
      content: document.content || "",
      title: document.title || "Untitled Document",
    });

    // Broadcast updated user list
    io.to(documentId).emit("users-update", Object.values(documentUsers[documentId]));

    socket.on("send-changes", (delta) => {
      socket.broadcast.to(documentId).emit("receive-changes", delta);
    });

    socket.on("title-change", async (newTitle) => {
      socket.broadcast.to(documentId).emit("title-update", newTitle);
      await saveDocument(documentId, document.content, newTitle);
    });

    socket.on("save-document", async ({ content, title }) => {
      await saveDocument(documentId, content, title);
      socket.emit("document-saved");
    });

    socket.on("cursor-move", (cursorData) => {
      socket.broadcast.to(documentId).emit("cursor-update", {
        ...cursorData,
        userId: socket.id,
        username: documentUsers[documentId]?.[socket.id]?.username,
        color: documentUsers[documentId]?.[socket.id]?.color,
      });
    });

    socket.on("disconnect", () => {
      if (documentUsers[documentId]) {
        delete documentUsers[documentId][socket.id];
        io.to(documentId).emit("users-update", Object.values(documentUsers[documentId]));
      }
      console.log(`❌ User disconnected: ${socket.id}`);
    });
  });
});

function getColor(id) {
  const colors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD", "#98D8C8", "#F7DC6F"];
  let hash = 0;
  for (let c of id) hash = c.charCodeAt(0) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

// API to list documents
app.get("/api/documents", async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const docs = await Document.find({}, "title lastModified").sort({ lastModified: -1 });
      return res.json(docs);
    }
  } catch (e) {}
  res.json(Object.values(memoryStore));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
