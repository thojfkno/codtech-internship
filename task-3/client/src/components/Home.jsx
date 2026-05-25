import { useState } from 'react'

const styles = {
  page: {
    minHeight: '100vh',
    background: 'var(--bg)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    position: 'relative',
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    width: 600,
    height: 600,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(124,106,247,0.12) 0%, transparent 70%)',
    top: '-100px',
    left: '50%',
    transform: 'translateX(-50%)',
    pointerEvents: 'none',
  },
  logo: {
    fontFamily: 'var(--font-display)',
    fontSize: 48,
    fontWeight: 700,
    color: 'var(--text)',
    marginBottom: 8,
    letterSpacing: '-1px',
  },
  logoSpan: { color: 'var(--accent)' },
  tagline: {
    color: 'var(--text-muted)',
    fontSize: 16,
    marginBottom: 48,
    fontWeight: 300,
    letterSpacing: '0.5px',
  },
  card: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 16,
    padding: '36px 40px',
    width: '100%',
    maxWidth: 420,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  label: {
    color: 'var(--text-muted)',
    fontSize: 12,
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '1px',
    marginBottom: 4,
  },
  input: {
    background: 'var(--surface2)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    padding: '12px 16px',
    color: 'var(--text)',
    fontSize: 15,
    fontFamily: 'var(--font-body)',
    outline: 'none',
    transition: 'border-color 0.2s',
    width: '100%',
  },
  btn: {
    background: 'var(--accent)',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '13px 24px',
    fontSize: 15,
    fontWeight: 500,
    fontFamily: 'var(--font-body)',
    cursor: 'pointer',
    transition: 'opacity 0.2s, transform 0.1s',
    marginTop: 4,
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    color: 'var(--text-muted)',
    fontSize: 13,
    margin: '4px 0',
  },
  divLine: { flex: 1, height: 1, background: 'var(--border)' },
  joinRow: { display: 'flex', gap: 10 },
  joinInput: {
    flex: 1,
    background: 'var(--surface2)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    padding: '12px 16px',
    color: 'var(--text)',
    fontSize: 14,
    fontFamily: 'var(--font-body)',
    outline: 'none',
  },
  joinBtn: {
    background: 'var(--surface2)',
    color: 'var(--accent)',
    border: '1px solid var(--accent)',
    borderRadius: 8,
    padding: '12px 18px',
    fontSize: 14,
    fontWeight: 500,
    fontFamily: 'var(--font-body)',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  features: {
    display: 'flex',
    gap: 24,
    marginTop: 40,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  feat: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    padding: '16px 20px',
    fontSize: 13,
    color: 'var(--text-muted)',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
}

export default function Home({ onNewDoc, onOpenDoc }) {
  const [name, setName] = useState('')
  const [docLink, setDocLink] = useState('')

  function handleNew() {
    if (!name.trim()) return alert('Enter your name first!')
    onNewDoc(name.trim())
  }

  function handleJoin() {
    if (!name.trim()) return alert('Enter your name first!')
    if (!docLink.trim()) return alert('Enter a document ID or link!')
    const id = docLink.includes('/') ? docLink.split('/').pop() : docLink.trim()
    onOpenDoc(id, name.trim())
  }

  return (
    <div style={styles.page}>
      <div style={styles.glow} />
      <div style={styles.logo}>
        Collab<span style={styles.logoSpan}>Docs</span>
      </div>
      <p style={styles.tagline}>Real-time collaborative document editing</p>

      <div style={styles.card}>
        <div>
          <div style={styles.label}>Your Name</div>
          <input
            style={styles.input}
            placeholder="e.g. Karthika"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleNew()}
          />
        </div>

        <button style={styles.btn} onClick={handleNew}
          onMouseEnter={e => e.target.style.opacity = '0.85'}
          onMouseLeave={e => e.target.style.opacity = '1'}>
          ✦ Create New Document
        </button>

        <div style={styles.divider}>
          <div style={styles.divLine} /> or join existing <div style={styles.divLine} />
        </div>

        <div style={styles.joinRow}>
          <input
            style={styles.joinInput}
            placeholder="Paste document ID or link"
            value={docLink}
            onChange={e => setDocLink(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleJoin()}
          />
          <button style={styles.joinBtn} onClick={handleJoin}>Join →</button>
        </div>
      </div>

      <div style={styles.features}>
        {[
          { icon: '⚡', text: 'Real-time sync' },
          { icon: '👥', text: 'Multi-user editing' },
          { icon: '💾', text: 'Auto-save' },
          { icon: '🎨', text: 'Rich text editor' },
        ].map(f => (
          <div key={f.text} style={styles.feat}>
            <span>{f.icon}</span> {f.text}
          </div>
        ))}
      </div>
    </div>
  )
}
