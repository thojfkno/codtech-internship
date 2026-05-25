import { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import Home from './components/Home'
import Editor from './components/Editor'

export default function App() {
  const [page, setPage] = useState('home')
  const [docId, setDocId] = useState(null)
  const [username, setUsername] = useState('')

  function openDoc(id, name) { setDocId(id); setUsername(name); setPage('editor') }
  function newDoc(name) { openDoc(uuidv4(), name) }

  if (page === 'editor') return <Editor documentId={docId} username={username} onBack={() => setPage('home')} />
  return <Home onNewDoc={newDoc} onOpenDoc={openDoc} />
}
