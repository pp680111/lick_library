import React, { useState, useEffect, useRef } from 'react'

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
  const previewRef = useRef(null)

  useEffect(() => {
    if (phrase) {
      setTitle(phrase.title || '')
      setMusicXml(phrase.music_xml || '')
      setNote(phrase.note || '')
      setSelectedTagIds(phrase.tags?.map((t) => t.id) || [])
    } else {
      setTitle('')
      setMusicXml('')
      setNote('')
      setSelectedTagIds([])
    }
  }, [phrase, isOpen])

  useEffect(() => {
    if (isOpen && musicXml && previewRef.current) {
      onPreview?.(musicXml, previewRef.current)
    }
  }, [isOpen, musicXml, onPreview])

  const handleTagClick = (tagId) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    )
  }

  const handleSave = () => {
    if (!title.trim()) {
      alert('请输入标题')
      return
    }
    if (!musicXml.trim()) {
      alert('请输入 MusicXML')
      return
    }

    onSave({
      id: phrase?.id,
      title: title.trim(),
      musicXml: musicXml.trim(),
      note: note.trim(),
      tagIds: selectedTagIds,
    })
  }

  const handleTagInputKeyDown = (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      onAddTag(e.target.value.trim())
      e.target.value = ''
    }
  }

  if (!isOpen) return null

  const isEdit = !!phrase

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {isEdit ? '编辑乐句' : '新建乐句'}
          </h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          <div className="editor-left">
            <div className="editor-field">
              <label className="editor-label">标题</label>
              <input
                type="text"
                className="editor-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="输入乐句标题"
              />
            </div>

            <div className="editor-field">
              <label className="editor-label">MusicXML</label>
              <textarea
                className="editor-textarea musicxml"
                value={musicXml}
                onChange={(e) => setMusicXml(e.target.value)}
                placeholder="输入 MusicXML 格式的乐谱数据"
              />
            </div>

            <div className="editor-field">
              <label className="editor-label">标签</label>
              <div className="tag-list">
                {tags.map((tag) => (
                  <span
                    key={tag.id}
                    className={`tag ${tag.type} ${
                      selectedTagIds.includes(tag.id) ? 'active' : ''
                    }`}
                    onClick={() => handleTagClick(tag.id)}
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
              <input
                type="text"
                className="tag-add-input"
                placeholder="+ 添加标签 (回车确认)"
                onKeyDown={handleTagInputKeyDown}
              />
            </div>
          </div>

          <div className="editor-right">
            <div className="editor-field">
              <label className="editor-label">笔记</label>
              <textarea
                className="editor-textarea note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="记录乐句的特点、和弦进行、演奏技巧等"
              />
            </div>

            <div className="editor-field">
              <label className="editor-label">预览</label>
              <div className="editor-preview" ref={previewRef}>
                <div className="preview-placeholder">
                  {musicXml ? '预览加载中...' : '输入 MusicXML 后在此预览'}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            取消
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            保存
          </button>
        </div>
      </div>
    </div>
  )
}
