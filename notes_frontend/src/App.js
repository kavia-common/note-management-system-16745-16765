import React, { useEffect, useMemo, useState } from 'react';
import './App.css';

// Helpers
const STORAGE_KEY = 'notes_app_items_v1';

// Types
/**
 * @typedef {Object} Note
 * @property {string} id
 * @property {string} title
 * @property {string} content
 * @property {number} updatedAt
 */

// PUBLIC_INTERFACE
function App() {
  /** App State */
  const [notes, setNotes] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [selectedId, setSelectedId] = useState(null);
  const [query, setQuery] = useState('');

  /** Persist notes */
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  }, [notes]);

  /** Derived: filtered & sorted notes */
  const filteredNotes = useMemo(() => {
    const q = query.trim().toLowerCase();
    const items = q.length
      ? notes.filter(
          (n) =>
            n.title.toLowerCase().includes(q) ||
            n.content.toLowerCase().includes(q)
        )
      : notes;
    return [...items].sort((a, b) => b.updatedAt - a.updatedAt);
  }, [notes, query]);

  const selectedNote = useMemo(
    () => notes.find((n) => n.id === selectedId) || null,
    [notes, selectedId]
  );

  // PUBLIC_INTERFACE
  const createNote = () => {
    const id = cryptoRandomId();
    const now = Date.now();
    const newNote = {
      id,
      title: 'Untitled note',
      content: '',
      updatedAt: now,
    };
    setNotes((prev) => [newNote, ...prev]);
    setSelectedId(id);
  };

  // PUBLIC_INTERFACE
  const deleteNote = (id) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  // PUBLIC_INTERFACE
  const updateNote = (id, patch) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, ...patch, updatedAt: Date.now() } : n))
    );
  };

  // PUBLIC_INTERFACE
  const selectNote = (id) => setSelectedId(id);

  return (
    <div className="App notes-app">
      <TopBar
        onCreate={createNote}
        total={notes.length}
        query={query}
        onQueryChange={setQuery}
      />
      <div className="layout">
        <Sidebar
          notes={filteredNotes}
          selectedId={selectedId}
          onSelect={selectNote}
          onCreate={createNote}
          onDelete={deleteNote}
        />
        <MainPanel>
          {selectedNote ? (
            <NoteEditor
              key={selectedNote.id}
              note={selectedNote}
              onChange={(patch) => updateNote(selectedNote.id, patch)}
              onDelete={() => deleteNote(selectedNote.id)}
            />
          ) : (
            <EmptyState onCreate={createNote} />
          )}
        </MainPanel>
      </div>
    </div>
  );
}

function cryptoRandomId() {
  // use crypto if available; fallback to random string
  if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
  return 'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/** UI Components */

// PUBLIC_INTERFACE
function TopBar({ onCreate, total, query, onQueryChange }) {
  /** Top navigation with branding, global search, and create action */
  return (
    <header className="topbar" role="banner">
      <div className="brand">
        <div className="brand-mark" aria-hidden="true">✦</div>
        <div className="brand-text">
          <span className="brand-title">Notes</span>
          <span className="brand-subtitle">Light & Minimal</span>
        </div>
      </div>
      <div className="topbar-actions">
        <div className="search-wrap" role="search">
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search notes..."
            className="input"
            aria-label="Search notes"
          />
        </div>
        <button className="btn primary" onClick={onCreate} aria-label="Create note">
          + New
        </button>
      </div>
      <div className="meta">Total: {total}</div>
    </header>
  );
}

// PUBLIC_INTERFACE
function Sidebar({ notes, selectedId, onSelect, onCreate, onDelete }) {
  return (
    <aside className="sidebar" aria-label="Notes list">
      <div className="sidebar-header">
        <span className="sidebar-title">My Notes</span>
        <button className="btn ghost" onClick={onCreate} aria-label="Add note">+</button>
      </div>
      <ul className="note-list">
        {notes.length === 0 && (
          <li className="empty">No notes yet. Create your first note.</li>
        )}
        {notes.map((n) => (
          <li
            key={n.id}
            className={`note-item ${selectedId === n.id ? 'active' : ''}`}
            onClick={() => onSelect(n.id)}
          >
            <div className="note-item-main">
              <div className="note-title" title={n.title || 'Untitled'}>
                {n.title?.trim() || 'Untitled'}
              </div>
              <div className="note-snippet">{n.content?.slice(0, 80) || 'No content'}</div>
            </div>
            <div className="note-meta">
              <time className="note-time" dateTime={new Date(n.updatedAt).toISOString()}>
                {timeAgo(n.updatedAt)}
              </time>
              <button
                className="icon-button danger"
                aria-label="Delete note"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(n.id);
                }}
                title="Delete"
              >
                🗑
              </button>
            </div>
          </li>
        ))}
      </ul>
    </aside>
  );
}

// PUBLIC_INTERFACE
function MainPanel({ children }) {
  return <main className="main-panel">{children}</main>;
}

// PUBLIC_INTERFACE
function NoteEditor({ note, onChange, onDelete }) {
  const [title, setTitle] = useState(note.title || '');
  const [content, setContent] = useState(note.content || '');

  useEffect(() => {
    setTitle(note.title || '');
    setContent(note.content || '');
  }, [note.id]);

  useEffect(() => {
    const id = setTimeout(() => onChange({ title, content }), 200);
    return () => clearTimeout(id);
  }, [title, content, onChange]);

  return (
    <div className="note-editor">
      <div className="editor-header">
        <input
          className="title-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Note title"
          aria-label="Note title"
        />
        <div className="editor-actions">
          <button className="btn danger outline" onClick={onDelete} aria-label="Delete note">
            Delete
          </button>
        </div>
      </div>
      <textarea
        className="content-input"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Start typing..."
        aria-label="Note content"
      />
      <div className="editor-footer">
        <span className="muted">Last edited {timeAgo(note.updatedAt)}</span>
      </div>
    </div>
  );
}

function EmptyState({ onCreate }) {
  return (
    <div className="empty-state">
      <h2>Welcome to Notes</h2>
      <p>Create, edit, and manage your notes with a clean, minimal interface.</p>
      <button className="btn primary" onClick={onCreate}>Create your first note</button>
    </div>
  );
}

/** Utils */
function timeAgo(ts) {
  const diff = Date.now() - ts;
  const s = Math.floor(diff / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min${m > 1 ? 's' : ''} ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hour${h > 1 ? 's' : ''} ago`;
  const d = Math.floor(h / 24);
  return `${d} day${d > 1 ? 's' : ''} ago`;
}

export default App;
