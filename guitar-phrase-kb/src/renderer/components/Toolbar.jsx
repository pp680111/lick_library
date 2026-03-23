import React from 'react'

export function Toolbar({
  bpm,
  currentPhrase,
  isPlaying,
  onBpmChange,
  onEdit,
}) {
  return (
    <header className="topbar">
      <div className="topbar-brand">
        <div className="logo-icon" />
        <div className="brand-copy">
          <span className="app-title">Guitar Phrase KB</span>
          <span className="app-subtitle">
            Organize phrases with tags, notes, and playback
          </span>
        </div>
      </div>

      <div className="topbar-spacer" />

      <div className="topbar-actions">
        <label className="tempo-chip">
          <span className="tempo-label">BPM</span>
          <input
            type="number"
            className="tempo-input"
            value={bpm}
            onChange={(e) => onBpmChange(parseInt(e.target.value, 10) || 120)}
            min={20}
            max={300}
          />
        </label>

        <button
          type="button"
          className="icon-action"
          onClick={onEdit}
          disabled={!currentPhrase}
          title={currentPhrase ? 'Edit current phrase' : 'Select a phrase first'}
        >
          Edit
        </button>

        <div className={`status-pill ${isPlaying ? 'playing' : ''}`}>
          {isPlaying ? 'Playing' : 'Idle'}
        </div>
      </div>
    </header>
  )
}
