import React, { forwardRef } from 'react'

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function highlightText(text, query) {
  if (!text || !query.trim()) return text

  const normalizedQuery = query.trim().toLowerCase()
  const regex = new RegExp(`(${escapeRegExp(query.trim())})`, 'gi')
  const parts = text.split(regex)

  return parts.map((part, index) =>
    part.toLowerCase() === normalizedQuery ? (
      <mark key={`${part}-${index}`} className="highlight">
        {part}
      </mark>
    ) : (
      <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>
    )
  )
}

export const PhraseDetail = forwardRef(function PhraseDetail(
  { phrase, searchQuery, bpm, isPlaying, onEdit, onDelete },
  ref
) {
  if (!phrase) {
    return (
      <section className="preview-panel">
        <div className="preview-card empty">
          <div className="empty-state">
            <div className="empty-title">No phrase selected</div>
            <div className="empty-copy">
              Select a phrase from the library, or create a new MusicXML phrase
              to begin.
            </div>
          </div>
        </div>
      </section>
    )
  }

  const updatedAt = phrase.updated_at
    ? new Date(phrase.updated_at).toLocaleString()
    : 'Unknown'
  const createdAt = phrase.created_at
    ? new Date(phrase.created_at).toLocaleString()
    : 'Unknown'

  return (
    <section className="preview-panel">
      <div className="preview-card">
        <div className="meta-card">
          <div className="meta-row meta-row-top">
            <span className="meta-badge">{isPlaying ? 'Auditioning' : 'Ready'}</span>
            <span className="meta-text">Tempo: {bpm} BPM</span>
          </div>

          <div className="meta-row meta-row-secondary">
            <span className="meta-text">Created: {createdAt}</span>
            <span className="meta-text">Updated: {updatedAt}</span>
            <span className="meta-text">Tags: {phrase.tags?.length || 0}</span>
          </div>

          <h1 className="preview-title">{highlightText(phrase.title, searchQuery)}</h1>

          <p className="preview-description">
            {phrase.note?.trim()
              ? highlightText(phrase.note, searchQuery)
              : 'No analysis notes yet. Add harmony, fingering, or practice goals in the editor.'}
          </p>

          <div className="tag-row">
            {phrase.tags?.length ? (
              phrase.tags.map((tag) => (
                <span key={tag.id} className={`tag-chip ${tag.type}`}>
                  {tag.name}
                </span>
              ))
            ) : (
              <span className="tag-chip muted">Unsorted</span>
            )}
          </div>
        </div>

        <div className="detail-actions">
          <button type="button" className="secondary-button" onClick={onEdit}>
            Edit Phrase
          </button>
          <button type="button" className="danger-button" onClick={onDelete}>
            Delete Phrase
          </button>
        </div>

        <div className="preview-divider" />

        <div className="score-panel">
          <div className="score-panel-header">
            <span className="score-title">Score Preview</span>
            <span className="score-subtitle">
              Simplified notation generated from MusicXML
            </span>
          </div>
          <div className="vexflow-container" ref={ref}>
            <div className="vexflow-placeholder">Preparing preview...</div>
          </div>
        </div>

        <div className="xml-panel">
          <div className="score-panel-header">
            <span className="score-title">MusicXML Source</span>
            <span className="score-subtitle">
              Use this to quickly inspect the raw score data
            </span>
          </div>
          <pre className="xml-block">{phrase.music_xml}</pre>
        </div>
      </div>
    </section>
  )
})
