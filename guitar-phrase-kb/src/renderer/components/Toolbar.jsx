import React from 'react'

export function Toolbar({
  onPlay,
  onStop,
  onNew,
  bpm,
  onBpmChange,
  searchQuery,
  onSearchChange,
  isPlaying,
}) {
  return (
    <header className="toolbar">
      <div className="toolbar-brand">
        <div className="logo-icon" />
        <span className="app-title">吉他乐句</span>
      </div>

      <div className="toolbar-controls">
        <button
          className="play-btn"
          onClick={onPlay}
          title={isPlaying ? '暂停' : '播放'}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
        <button className="stop-btn" onClick={onStop} title="停止">
          ⏹
        </button>
        <div className="bpm-control">
          <span className="bpm-label">BPM:</span>
          <input
            type="number"
            className="bpm-input"
            value={bpm}
            onChange={(e) => onBpmChange(parseInt(e.target.value) || 120)}
            min={20}
            max={300}
          />
        </div>
      </div>

      <div className="toolbar-spacer" />

      <div className="search-box">
        <input
          type="text"
          className="search-input"
          placeholder="搜索笔记..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <button className="new-btn" onClick={onNew}>
        + 新建
      </button>
    </header>
  )
}
