import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Toolbar } from './Toolbar'
import { Sidebar } from './Sidebar'
import { PhraseDetail } from './PhraseDetail'
import { PhraseEditor } from './PhraseEditor'
import { StatusBar } from './StatusBar'

export default function App() {
  // State
  const [phrases, setPhrases] = useState([])
  const [currentPhrase, setCurrentPhrase] = useState(null)
  const [tags, setTags] = useState([])
  const [selectedTags, setSelectedTags] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [bpm, setBpm] = useState(120)
  const [isPlaying, setIsPlaying] = useState(false)
  const [editorOpen, setEditorOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  // Refs
  const vexflowRef = useRef(null)
  const midiPlayerRef = useRef(null)

  // Load data
  const loadPhrases = useCallback(async (filter = {}) => {
    try {
      const result = await window.electronAPI.getPhrases(filter)
      setPhrases(result)
    } catch (err) {
      console.error('Failed to load phrases:', err)
    }
  }, [])

  const loadTags = useCallback(async () => {
    try {
      const result = await window.electronAPI.getTags()
      setTags(result)
    } catch (err) {
      console.error('Failed to load tags:', err)
    }
  }, [])

  const loadPhraseById = useCallback(async (id) => {
    try {
      const result = await window.electronAPI.getPhrase(id)
      setCurrentPhrase(result)
      return result
    } catch (err) {
      console.error('Failed to load phrase:', err)
      return null
    }
  }, [])

  useEffect(() => {
    loadPhrases()
    loadTags()
    initMidiPlayer()
  }, [loadPhrases, loadTags])

  const initMidiPlayer = async () => {
    try {
      const midi = await import('../utils/midi-player.js')
      midiPlayerRef.current = midi
    } catch (err) {
      console.error('Failed to init MIDI:', err)
    }
  }

  // Search effect
  useEffect(() => {
    const search = async () => {
      if (searchQuery) {
        const result = await window.electronAPI.searchPhrases(searchQuery)
        setPhrases(result)
      } else {
        await loadPhrases({ tagIds: selectedTags })
      }
    }
    search()
  }, [searchQuery, selectedTags, loadPhrases])

  // VexFlow render effect
  useEffect(() => {
    if (currentPhrase && vexflowRef.current) {
      renderVexFlow(currentPhrase.music_xml)
    }
  }, [currentPhrase])

  const renderVexFlow = async (musicXml) => {
    if (!musicXml || !vexflowRef.current) return

    try {
      const container = vexflowRef.current
      container.innerHTML = ''

      // Lazy load VexFlow
      const VexFlow = await import('vexflow')
      const { Renderer, Stave, Voice, Formatter, Accidental, StaveNote, Beam } =
        VexFlow

      // Simple rendering for demonstration
      // Full MusicXML parsing would be more complex
      const renderer = new Renderer(container, Renderer.Backends.SVG)
      renderer.resize(800, 150)
      const context = renderer.getContext()

      const stave = new Stave(10, 40, 780)
      stave.addClef('treble').addTimeSign('4/4')
      stave.setContext(context).draw()
    } catch (err) {
      console.error('VexFlow render error:', err)
      if (vexflowRef.current) {
        vexflowRef.current.innerHTML = `<div style="color:red;padding:20px">解析错误: ${err.message}</div>`
      }
    }
  }

  // Event handlers
  const handlePlay = () => {
    if (!currentPhrase) return

    if (isPlaying) {
      midiPlayerRef.current?.stop()
      setIsPlaying(false)
    } else {
      midiPlayerRef.current?.play(currentPhrase.music_xml, bpm)
      setIsPlaying(true)
    }
  }

  const handleStop = () => {
    midiPlayerRef.current?.stop()
    setIsPlaying(false)
  }

  const handleNew = () => {
    setCurrentPhrase(null)
    setEditorOpen(true)
  }

  const handlePhraseSelect = async (phrase) => {
    await loadPhraseById(phrase.id)
  }

  const handleTagToggle = (tagId) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    )
  }

  const handleSave = async (data) => {
    try {
      if (data.id) {
        await window.electronAPI.updatePhrase(data.id, data)
      } else {
        await window.electronAPI.createPhrase(data)
      }
      setEditorOpen(false)
      await loadPhrases()
      await loadTags()
    } catch (err) {
      console.error('Failed to save phrase:', err)
      alert('保存失败: ' + err.message)
    }
  }

  const handleAddTag = async (name) => {
    try {
      await window.electronAPI.createTag(name, 'custom')
      await loadTags()
    } catch (err) {
      console.error('Failed to create tag:', err)
    }
  }

  const handlePreview = (musicXml, container) => {
    renderVexFlow(musicXml)
  }

  return (
    <div className="app">
      <Toolbar
        onPlay={handlePlay}
        onStop={handleStop}
        onNew={handleNew}
        bpm={bpm}
        onBpmChange={setBpm}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isPlaying={isPlaying}
      />

      <div className="main-container">
        <Sidebar
          tags={tags}
          selectedTags={selectedTags}
          phrases={phrases}
          currentPhrase={currentPhrase}
          onTagToggle={handleTagToggle}
          onPhraseSelect={handlePhraseSelect}
          onAddTag={handleAddTag}
        />

        <PhraseDetail ref={vexflowRef} phrase={currentPhrase} searchQuery={searchQuery} />
      </div>

      <StatusBar
        currentPhrase={currentPhrase}
        totalCount={phrases.length}
        selectedTagCount={selectedTags.length}
      />

      <PhraseEditor
        isOpen={editorOpen}
        phrase={currentPhrase}
        tags={tags}
        onClose={() => setEditorOpen(false)}
        onSave={handleSave}
        onAddTag={handleAddTag}
        onPreview={handlePreview}
      />
    </div>
  )
}
