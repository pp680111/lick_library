import React, { forwardRef } from 'react'

export const PhraseDetail = forwardRef(function PhraseDetail(
  { phrase, searchQuery },
  ref
) {
  if (!phrase) {
    return (
      <main className="content">
        <div className="phrase-detail empty">
          <div className="empty-state">
            <div className="empty-icon">🎸</div>
            <div className="empty-text">选择或创建一个乐句开始</div>
          </div>
        </div>
      </main>
    )
  }

  const highlightText = (text, query) => {
    if (!query) return text
    const regex = new RegExp(`(${query})`, 'gi')
    const parts = text.split(regex)
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="highlight">
          {part}
        </mark>
      ) : (
        part
      )
    )
  }

  return (
    <main className="content">
      <div className="phrase-detail">
        <div className="detail-header">
          <h1 className="detail-title">
            {highlightText(phrase.title, searchQuery)}
          </h1>
          <div className="detail-tags">
            {phrase.tags?.map((tag) => (
              <span key={tag.id} className={`tag ${tag.type}`}>
                {tag.name}
              </span>
            ))}
          </div>
        </div>

        <div className="vexflow-container" ref={ref}>
          <div className="vexflow-placeholder">乐谱加载中...</div>
        </div>

        <div className="note-section">
          <h3 className="note-title">分析笔记</h3>
          <div className="note-content">
            {phrase.note ? (
              highlightText(phrase.note, searchQuery)
            ) : (
              <span className="note-empty">暂无笔记</span>
            )}
          </div>
        </div>
      </div>
    </main>
  )
})
