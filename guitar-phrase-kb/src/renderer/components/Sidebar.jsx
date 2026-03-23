import React, { useEffect, useState } from 'react'

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
  phrases,
  currentPhrase,
  searchQuery,
  onPhraseSelect,
  onPhraseEdit,
  onPhraseDelete,
  onSearchChange,
}) {
  const [openMenuId, setOpenMenuId] = useState(null)

  useEffect(() => {
    const handleWindowClick = () => {
      setOpenMenuId(null)
    }

    window.addEventListener('click', handleWindowClick)
    return () => window.removeEventListener('click', handleWindowClick)
  }, [])

  return (
    <aside className="library-panel">
      <div className="library-search-wrap">
        <input
          type="text"
          className="library-search"
          placeholder="Search title, notes, or related tags"
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
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
            phrases.map((phrase) => {
              const menuOpen = openMenuId === phrase.id

              return (
                <div
                  key={phrase.id}
                  className={`phrase-card ${
                    currentPhrase?.id === phrase.id ? 'active' : ''
                  }`}
                  onClick={() => onPhraseSelect(phrase)}
                >
                  <div className="phrase-card-copy">
                    <span className="phrase-card-title">{phrase.title}</span>
                    <span className="phrase-card-meta">{formatPhraseMeta(phrase)}</span>
                  </div>

                  <div className="phrase-card-menu-wrap">
                    <button
                      type="button"
                      className="phrase-card-menu-button"
                      title="Open phrase menu"
                      onClick={(event) => {
                        event.stopPropagation()
                        setOpenMenuId(menuOpen ? null : phrase.id)
                      }}
                    >
                      ...
                    </button>

                    {menuOpen ? (
                      <div
                        className="phrase-card-menu"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <button
                          type="button"
                          className="phrase-card-menu-item"
                          onClick={() => {
                            setOpenMenuId(null)
                            onPhraseEdit(phrase)
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="phrase-card-menu-item danger"
                          onClick={() => {
                            setOpenMenuId(null)
                            onPhraseDelete(phrase)
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </aside>
  )
}
