import { useEffect, useRef, useState, useCallback } from 'react'
import Quill from 'quill'
import 'quill/dist/quill.snow.css'
import { io } from 'socket.io-client'

const SAVE_INTERVAL = 3000
const TOOLBAR = [
  [{ header: [1, 2, 3, false] }],
  ['bold', 'italic', 'underline', 'strike'],
  [{ color: [] }, { background: [] }],
  [{ list: 'ordered' }, { list: 'bullet' }],
  [{ align: [] }],
  ['blockquote', 'code-block'],
  ['link'],
  ['clean'],
]

const s = {
  wrap: { display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg)' },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    height: 56,
    background: 'var(--surface)',
    borderBottom: '1px solid var(--border)',
    flexShrink: 0,
  },
  left: { display: 'flex', alignItems: 'center', gap: 16 },
  backBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    fontSize: 20,
    padding: '4px 8px',
    borderRadius: 6,
    transition: 'color 0.2s',
  },
  logo: {
    fontFamily: 'var(--font-display)',
    fontSize: 20,
    fontWeight: 700,
    color: 'var(--text)',
  },
  logoSpan: { color: 'var(--accent)' },
  titleInput: {
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: 'var(--text)',
    fontSize: 15,
    fontFamily: 'var(--font-body)',
    fontWeight: 500,
    padding: '4px 8px',
    borderRadius: 6,
    minWidth: 200,
    maxWidth: 400,
    borderBottom: '1px solid transparent',
    transition: 'border-color 0.2s',
  },
  right: { display: 'flex', alignItems: 'center', gap: 12 },
  saveStatus: { fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 },
  dot: (saved) => ({
    width: 7,
    height: 7,
    borderRadius: '50%',
    background: saved ? 'var(--green)' : 'var(--accent2)',
    transition: 'background 0.3s',
  }),
  shareBtn: {
    background: 'rgba(124,106,247,0.15)',
    color: 'var(--accent)',
    border: '1px solid rgba(124,106,247,0.3)',
    borderRadius: 8,
    padding: '6px 14px',
    fontSize: 13,
    fontFamily: 'var(--font-body)',
    cursor: 'pointer',
    fontWeight: 500,
  },
  body: { display: 'flex', flex: 1, overflow: 'hidden' },
  sidebar: {
    width: 220,
    background: 'var(--surface)',
    borderRight: '1px solid var(--border)',
    padding: '20px 16px',
    flexShrink: 0,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  sideLabel: {
    fontSize: 11,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    fontWeight: 600,
    marginBottom: 8,
  },
  userPill: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '8px 10px',
    background: 'var(--surface2)',
    borderRadius: 8,
    fontSize: 13,
    marginBottom: 6,
  },
  avatar: (color) => ({
    width: 28,
    height: 28,
    borderRadius: '50%',
    background: color,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 11,
    fontWeight: 700,
    color: '#fff',
    flexShrink: 0,
  }),
  youBadge: {
    marginLeft: 'auto',
    background: 'rgba(124,106,247,0.15)',
    color: 'var(--accent)',
    fontSize: 10,
    padding: '1px 6px',
    borderRadius: 4,
    fontWeight: 600,
  },
  docIdBox: {
    background: 'var(--surface2)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    padding: '10px 12px',
    fontSize: 11,
    color: 'var(--text-muted)',
    wordBreak: 'break-all',
    lineHeight: 1.6,
  },
  copyBtn: {
    marginTop: 8,
    background: 'none',
    border: '1px solid var(--border)',
    color: 'var(--text-muted)',
    borderRadius: 6,
    padding: '5px 10px',
    fontSize: 11,
    cursor: 'pointer',
    fontFamily: 'var(--font-body)',
    width: '100%',
  },
  editorWrap: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    background: 'var(--bg)',
  },
  editorContainer: { flex: 1, overflow: 'auto', background: 'var(--bg)' },
  toastWrap: {
    position: 'fixed',
    bottom: 24,
    right: 24,
    zIndex: 999,
  },
  toast: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 10,
    padding: '10px 18px',
    fontSize: 13,
    color: 'var(--text)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    animation: 'fadeIn 0.2s ease',
  },
}

export default function Editor({ documentId, username, onBack }) {
  const editorRef = useRef(null)
  const quillRef = useRef(null)
  const socketRef = useRef(null)
  const [title, setTitle] = useState('Untitled Document')
  const [users, setUsers] = useState([])
  const [saved, setSaved] = useState(true)
  const [toast, setToast] = useState(null)
  const myColor = useRef('#7c6af7')

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  function copyDocId() {
    navigator.clipboard.writeText(documentId)
    showToast('📋 Document ID copied!')
  }

  useEffect(() => {
    const socket = io('http://localhost:3001')
    socketRef.current = socket

    const quill = new Quill(editorRef.current, {
      theme: 'snow',
      modules: { toolbar: TOOLBAR },
      placeholder: 'Start writing your document...',
    })
    quillRef.current = quill
    quill.disable()
    quill.setText('Loading document...')

    socket.emit('get-document', { documentId, username })

    socket.on('load-document', ({ content, title: t }) => {
      quill.setContents(quill.clipboard.convert(content))
      quill.enable()
      if (t) setTitle(t)
    })

    socket.on('receive-changes', (delta) => {
      quill.updateContents(delta)
    })

    socket.on('title-update', (t) => setTitle(t))

    socket.on('users-update', (list) => {
      setUsers(list)
      const me = list.find(u => u.username === username)
      if (me) myColor.current = me.color
    })

    socket.on('document-saved', () => {
      setSaved(true)
      showToast('✅ Document saved')
    })

    quill.on('text-change', (delta, _, source) => {
      if (source !== 'user') return
      setSaved(false)
      socket.emit('send-changes', delta)
    })

    return () => {
      socket.disconnect()
    }
  }, [documentId, username])

  // Auto-save every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!quillRef.current || !socketRef.current) return
      const content = quillRef.current.root.innerHTML
      socketRef.current.emit('save-document', { content, title })
    }, SAVE_INTERVAL)
    return () => clearInterval(interval)
  }, [title])

  function handleTitleChange(e) {
    setTitle(e.target.value)
    setSaved(false)
    socketRef.current?.emit('title-change', e.target.value)
  }

  return (
    <div style={s.wrap}>
      {/* Header */}
      <div style={s.header}>
        <div style={s.left}>
          <button style={s.backBtn} onClick={onBack} title="Back to home">←</button>
          <div style={s.logo}>Collab<span style={s.logoSpan}>Docs</span></div>
          <input
            style={s.titleInput}
            value={title}
            onChange={handleTitleChange}
            onFocus={e => e.target.style.borderBottomColor = 'var(--accent)'}
            onBlur={e => e.target.style.borderBottomColor = 'transparent'}
          />
        </div>
        <div style={s.right}>
          <div style={s.saveStatus}>
            <div style={s.dot(saved)} />
            {saved ? 'Saved' : 'Unsaved changes'}
          </div>
          <button style={s.shareBtn} onClick={copyDocId}>Share Doc</button>
        </div>
      </div>

      {/* Body */}
      <div style={s.body}>
        {/* Sidebar */}
        <div style={s.sidebar}>
          <div>
            <div style={s.sideLabel}>Online now ({users.length})</div>
            {users.map((u, i) => (
              <div key={i} style={s.userPill}>
                <div style={s.avatar(u.color)}>{u.username[0].toUpperCase()}</div>
                <span style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {u.username}
                </span>
                {u.username === username && <span style={s.youBadge}>you</span>}
              </div>
            ))}
          </div>

          <div>
            <div style={s.sideLabel}>Share this doc</div>
            <div style={s.docIdBox}>
              <div style={{ marginBottom: 4, fontSize: 10 }}>Document ID:</div>
              {documentId}
            </div>
            <button style={s.copyBtn} onClick={copyDocId}>Copy ID</button>
          </div>
        </div>

        {/* Editor */}
        <div style={s.editorWrap}>
          <div style={s.editorContainer}>
            <div ref={editorRef} />
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={s.toastWrap}>
          <div style={s.toast}>{toast}</div>
        </div>
      )}
    </div>
  )
}
