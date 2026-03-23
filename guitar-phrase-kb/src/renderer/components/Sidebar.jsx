import React from 'react'

function formatPhraseMeta(phrase) {
  const updatedAt = phrase.updated_at
    ? new Date(phrase.updated_at).toLocaleDateString()
    : 'Unknown'
  const noteLength = phrase.note?.trim()
    ? `${phrase.note.trim().length} chars`
    : 'No notes'

  return `${updatedAt} - ${noteLength}`
}

export function Sidebar({
  tags,
  selectedTags,
  phrases,
  currentPhrase,
  searchQuery,
  onTagToggle,
  onPhraseSelect,
  onAddTag,
  onSearchChange,
}) {
  const presetTags = tags.filter((tag) => tag.type === 'preset')
  const customTags = tags.filter((tag) => tag.type === 'custom')

  const handleTagKeyDown = (event) => {
    if (event.key !== 'Enter') return

    const value = event.target.value.trim()
    if (!value) return

    onAddTag(value)
    event.target.value = ''
  }

  return (
    <aside className="library-panel">
      <div className="library-search-wrap">
        <input
          type="text"
          className="library-search"
          placeholder="Search title or notes"
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>

      <div className="library-section">
        <div className="section-header">
          <span className="section-title">Tag Filters</span>
          <span className="section-meta">{selectedTags.length} selected</span>
        </div>

        <div className="tag-cluster">
          {presetTags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              className={`tag-chip preset ${
                selectedTags.includes(tag.id) ? 'active' : ''
              }`}
              onClick={() => onTagToggle(tag.id)}
            >
              {tag.name}
            </button>
          ))}

          {customTags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              className={`tag-chip custom ${
                selectedTags.includes(tag.id) ? 'active' : ''
              }`}
              onClick={() => onTagToggle(tag.id)}
            >
              {tag.name}
            </button>
          ))}
        </div>

        <input
          type="text"
          className="tag-entry"
          placeholder="Press Enter to add a custom tag"
          onKeyDown={handleTagKeyDown}
        />
      </div>

      <div className="library-section library-list-section">
        <div className="section-header">
          <span className="section-title">Phrase Library</span>
          <span className="section-meta">{phrases.length} items</span>
        </div>

        <div className="phrase-list">
          {phrases.length === 0 ? (
            <div className="phrase-empty">No matching phrases</div>
          ) : (
            phrases.map((phrase) => (
              <button
                key={phrase.id}
                type="button"
                className={`phrase-card ${
                  currentPhrase?.id === phrase.id ? 'active' : ''
                }`}
                onClick={() => onPhraseSelect(phrase)}
              >
                <div className="phrase-card-copy">
                  <span className="phrase-card-title">{phrase.title}</span>
                  <span className="phrase-card-meta">{formatPhraseMeta(phrase)}</span>
                </div>
                <span className="phrase-card-more">...</span>
              </button>
            ))
          )}
        </div>
      </div>
    </aside>
  )
}
