import React from 'react'

export function Toolbar({
  bpm,
  isPlaying,
  onBpmChange,
}) {
  return (
    <header className="topbar">
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

        <div className={`status-pill ${isPlaying ? 'playing' : ''}`}>
          {isPlaying ? 'Playing' : 'Idle'}
        </div>
      </div>
    </header>
  )
}
