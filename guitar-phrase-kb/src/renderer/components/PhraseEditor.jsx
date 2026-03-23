import React, { useEffect, useRef, useState } from 'react'

export function PhraseEditor({
  isOpen,
  phrase,
  tags,
  onClose,
  onSave,
  onAddTag,
  onPreview,
}) {
  const [title, setTitle] = useState('')
  const [musicXml, setMusicXml] = useState('')
  const [note, setNote] = useState('')
  const [selectedTagIds, setSelectedTagIds] = useState([])
  const [errorMessage, setErrorMessage] = useState('')
  const previewRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return

    if (phrase) {
      setTitle(phrase.title || '')
      setMusicXml(phrase.music_xml || '')
      setNote(phrase.note || '')
      setSelectedTagIds(phrase.tags?.map((tag) => tag.id) || [])
    } else {
      setTitle('')
      setMusicXml('')
      setNote('')
      setSelectedTagIds([])
    }

    setErrorMessage('')
  }, [phrase, isOpen])

  useEffect(() => {
    if (!isOpen || !previewRef.current) return

    onPreview?.(musicXml, previewRef.current)
  }, [isOpen, musicXml, onPreview])

  const isEdit = Boolean(phrase?.id)

  const handleTagToggle = (tagId) => {
    setSelectedTagIds((previous) =>
      previous.includes(tagId)
        ? previous.filter((id) => id !== tagId)
        : [...previous, tagId]
    )
  }

  const handleSave = () => {
    if (!title.trim()) {
      setErrorMessage('Please enter a phrase title.')
      return
    }

    if (!musicXml.trim()) {
      setErrorMessage('Please enter MusicXML content.')
      return
    }

    setErrorMessage('')

    onSave({
      id: phrase?.id,
      title: title.trim(),
      musicXml: musicXml.trim(),
      note: note.trim(),
      tagIds: selectedTagIds,
    })
  }

  const handleTagInputKeyDown = (event) => {
    if (event.key !== 'Enter') return

    const value = event.target.value.trim()
    if (!value) return

    onAddTag(value)
    event.target.value = ''
  }

  if (!isOpen) return null

  return (
    <div className="editor-shell" onClick={onClose}>
      <div className="editor-dialog" onClick={(event) => event.stopPropagation()}>
        <div className="editor-left-panel">
          <div className="editor-left-scroll">
            <div className="editor-field-group">
              <label className="editor-label" htmlFor="phrase-title">
                Phrase Title
              </label>
              <input
                id="phrase-title"
                type="text"
                className="editor-input"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Example: G Mixolydian Turnaround"
              />
            </div>

            <div className="editor-field-group">
              <label className="editor-label" htmlFor="phrase-note">
                Analysis Notes
              </label>
              <textarea
                id="phrase-note"
                className="editor-textarea editor-note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Write down harmony, fingering, practice goals, or your own analysis."
              />
            </div>

            <div className="editor-field-group">
              <label className="editor-label" htmlFor="phrase-xml">
                MusicXML
              </label>
              <textarea
                id="phrase-xml"
                className="editor-textarea editor-xml"
                value={musicXml}
                onChange={(event) => setMusicXml(event.target.value)}
                placeholder="Paste MusicXML here."
              />
            </div>

            <div className="editor-field-group">
              <div className="editor-tag-header">
                <span className="editor-label">Tags</span>
                <span className="editor-tag-meta">{selectedTagIds.length} selected</span>
              </div>

              <div className="tag-cluster modal-tag-cluster">
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    className={`tag-chip ${tag.type} ${
                      selectedTagIds.includes(tag.id) ? 'active' : ''
                    }`}
                    onClick={() => handleTagToggle(tag.id)}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>

              <input
                type="text"
                className="tag-entry"
                placeholder="Press Enter to add a tag"
                onKeyDown={handleTagInputKeyDown}
              />
            </div>
          </div>
        </div>

        <div className="editor-right-panel">
          <div className="editor-right-scroll">
            <div className="preview-workbench">
              <div className="score-panel-header">
                <span className="score-title">{isEdit ? 'Edit Preview' : 'New Phrase Preview'}</span>
                <span className="score-subtitle">
                  Check whether the score can be parsed in real time
                </span>
              </div>
              <div className="editor-preview" ref={previewRef}>
                <div className="preview-placeholder">
                  {musicXml ? 'Rendering preview...' : 'The preview will appear after you enter MusicXML'}
                </div>
              </div>
            </div>
          </div>

          {errorMessage ? <div className="editor-error">{errorMessage}</div> : null}

          <div className="editor-action-bar">
            <div className="editor-action-spacer" />
            <button type="button" className="secondary-button" onClick={onClose}>
              Cancel
            </button>
            <button type="button" className="primary-button" onClick={handleSave}>
              {isEdit ? 'Save Changes' : 'Create Phrase'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
