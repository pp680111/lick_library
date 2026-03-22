import React from 'react'

export function Sidebar({
  tags,
  selectedTags,
  phrases,
  currentPhrase,
  onTagToggle,
  onPhraseSelect,
  onAddTag,
}) {
  const presetTags = tags.filter((t) => t.type === 'preset')
  const customTags = tags.filter((t) => t.type === 'custom')

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      onAddTag(e.target.value.trim())
      e.target.value = ''
    }
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-section">
        <div className="sidebar-title">标签筛选</div>
        <div className="tag-filter">
          <div className="tag-list">
            {presetTags.map((tag) => (
              <span
                key={tag.id}
                className={`tag preset ${
                  selectedTags.includes(tag.id) ? 'active' : ''
                }`}
                onClick={() => onTagToggle(tag.id)}
              >
                {tag.name}
              </span>
            ))}
            {customTags.map((tag) => (
              <span
                key={tag.id}
                className={`tag custom ${
                  selectedTags.includes(tag.id) ? 'active' : ''
                }`}
                onClick={() => onTagToggle(tag.id)}
              >
                {tag.name}
              </span>
            ))}
          </div>
          <input
            type="text"
            className="tag-add-input"
            placeholder="+ 添加标签"
            onKeyDown={handleTagKeyDown}
          />
        </div>
      </div>

      <div className="phrase-list">
        {phrases.length === 0 ? (
          <div className="phrase-list-empty">暂无乐句</div>
        ) : (
          phrases.map((phrase) => (
            <div
              key={phrase.id}
              className={`phrase-item ${
                currentPhrase?.id === phrase.id ? 'active' : ''
              }`}
              onClick={() => onPhraseSelect(phrase)}
            >
              <div className="phrase-title">{phrase.title}</div>
              <div className="phrase-meta">
                {new Date(phrase.updated_at).toLocaleDateString()}
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  )
}
