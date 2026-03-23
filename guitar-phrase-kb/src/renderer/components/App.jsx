import React, { useCallback, useEffect, useRef, useState } from 'react'
import { PhraseDetail } from './PhraseDetail'
import { PhraseEditor } from './PhraseEditor'
import { Sidebar } from './Sidebar'
import { StatusBar } from './StatusBar'
import { Toolbar } from './Toolbar'

const fallbackApi = {
  getPhrases: async () => [],
  getTags: async () => [],
  getPhrase: async () => null,
  createPhrase: async () => null,
  updatePhrase: async () => undefined,
  deletePhrase: async () => undefined,
  createTag: async () => null,
}

function parseDuration(durationType) {
  const baseType = durationType.replace(/r$/, '')

  switch (baseType) {
    case 'w':
      return { numBeats: 4, beatValue: 4 }
    case 'h':
      return { numBeats: 2, beatValue: 4 }
    case '8':
      return { numBeats: 1, beatValue: 8 }
    default:
      return { numBeats: 1, beatValue: 4 }
  }
}

function xmlDurationToVexflow(duration, divisions) {
  const ratio = duration / Math.max(divisions, 1)

  if (ratio >= 4) return 'w'
  if (ratio >= 2) return 'h'
  if (ratio >= 1) return 'q'
  return '8'
}

function normalizePitch(step, octave, alter) {
  const accidental = alter === 1 ? '#' : alter === -1 ? 'b' : ''
  return `${step.toLowerCase()}${accidental}/${octave}`
}

function parseMusicXmlForPreview(musicXml) {
  const parser = new DOMParser()
  const xml = parser.parseFromString(musicXml, 'application/xml')

  if (xml.querySelector('parsererror')) {
    throw new Error('MusicXML parsing failed. Check the source content.')
  }

  const divisions = parseInt(
    xml.querySelector('divisions')?.textContent || '1',
    10
  )
  const beats = parseInt(xml.querySelector('beats')?.textContent || '4', 10)
  const beatType = parseInt(
    xml.querySelector('beat-type')?.textContent || '4',
    10
  )

  const parsedNotes = Array.from(xml.querySelectorAll('note'))
    .slice(0, 16)
    .map((noteElement) => {
      const isRest = Boolean(noteElement.querySelector('rest'))
      const duration = parseInt(
        noteElement.querySelector('duration')?.textContent || '1',
        10
      )
      const durationType = `${xmlDurationToVexflow(duration, divisions)}${
        isRest ? 'r' : ''
      }`

      if (isRest) {
        return {
          isRest: true,
          durationType,
        }
      }

      const step = noteElement.querySelector('step')?.textContent || 'C'
      const octave = parseInt(
        noteElement.querySelector('octave')?.textContent || '4',
        10
      )
      const alter = parseInt(
        noteElement.querySelector('alter')?.textContent || '0',
        10
      )

      return {
        isRest: false,
        durationType,
        keys: [normalizePitch(step, octave, alter)],
        accidental: alter === 1 ? '#' : alter === -1 ? 'b' : null,
      }
    })

  return {
    beats,
    beatType,
    parsedNotes,
  }
}

export default function App() {
  const api = window.electronAPI ?? fallbackApi
  const [phrases, setPhrases] = useState([])
  const [currentPhrase, setCurrentPhrase] = useState(null)
  const [tags, setTags] = useState([])
  const [selectedTags, setSelectedTags] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [bpm, setBpm] = useState(120)
  const [isPlaying, setIsPlaying] = useState(false)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingPhrase, setEditingPhrase] = useState(null)
  const [activeView, setActiveView] = useState('library')
  const scoreRef = useRef(null)
  const midiPlayerRef = useRef(null)

  const loadPhrases = useCallback(async (filter = {}) => {
    try {
      const result = await api.getPhrases(filter)
      setPhrases(result)
      return result
    } catch (error) {
      console.error('Failed to load phrases:', error)
      return []
    }
  }, [api])

  const loadTags = useCallback(async () => {
    try {
      const result = await api.getTags()
      setTags(result)
      return result
    } catch (error) {
      console.error('Failed to load tags:', error)
      return []
    }
  }, [api])

  const loadPhraseById = useCallback(async (id) => {
    try {
      const result = await api.getPhrase(id)
      setCurrentPhrase(result)
      return result
    } catch (error) {
      console.error('Failed to load phrase:', error)
      return null
    }
  }, [api])

  useEffect(() => {
    loadTags()
  }, [loadTags])

  useEffect(() => {
    const loadFilteredPhrases = async () => {
      const result = await loadPhrases({
        tagIds: selectedTags,
        query: searchQuery.trim(),
      })

      if (!currentPhrase) return

      const stillVisible = result.some((phrase) => phrase.id === currentPhrase.id)
      if (!stillVisible) {
        setCurrentPhrase(null)
      }
    }

    loadFilteredPhrases()
  }, [currentPhrase, loadPhrases, searchQuery, selectedTags])

  useEffect(() => {
    const initMidiPlayer = async () => {
      try {
        const midiPlayer = await import('../utils/midi-player.js')
        midiPlayerRef.current = midiPlayer
      } catch (error) {
        console.error('Failed to init MIDI player:', error)
      }
    }

    initMidiPlayer()
  }, [])

  const renderVexFlow = useCallback(async (musicXml, targetContainer = scoreRef.current) => {
    if (!targetContainer) return

    targetContainer.innerHTML = ''

    if (!musicXml?.trim()) {
      targetContainer.innerHTML =
        '<div class="vexflow-placeholder">No MusicXML content to render.</div>'
      return
    }

    try {
      const { Renderer, Stave, StaveNote, Voice, Formatter, Accidental } =
        await import('vexflow')

      const { beats, beatType, parsedNotes } = parseMusicXmlForPreview(musicXml)

      if (!parsedNotes.length) {
        targetContainer.innerHTML =
          '<div class="vexflow-placeholder">No renderable notes were detected.</div>'
        return
      }

      const renderer = new Renderer(targetContainer, Renderer.Backends.SVG)
      const width = Math.min(targetContainer.clientWidth || 760, 820)
      renderer.resize(width, 220)

      const context = renderer.getContext()
      const stave = new Stave(20, 24, width - 40)
      stave.addClef('treble').addTimeSignature(`${beats}/${beatType}`)
      stave.setContext(context).draw()

      const notes = parsedNotes.map((parsedNote) => {
        const note = new StaveNote({
          keys: parsedNote.isRest ? ['b/4'] : parsedNote.keys,
          duration: parsedNote.durationType,
        })

        if (parsedNote.accidental) {
          note.addModifier(new Accidental(parsedNote.accidental), 0)
        }

        return note
      })

      const totalBeats = notes.reduce((sum, note) => {
        const { numBeats, beatValue } = parseDuration(note.getDuration())
        return sum + (numBeats * 4) / beatValue
      }, 0)

      const voice = new Voice({
        num_beats: Math.max(beats, Math.ceil(totalBeats)),
        beat_value: beatType,
      })

      voice.addTickables(notes)
      new Formatter().joinVoices([voice]).format([voice], width - 80)
      voice.draw(context, stave)
    } catch (error) {
      console.error('VexFlow render error:', error)
      targetContainer.innerHTML = `<div class="render-error">${error.message}</div>`
    }
  }, [])

  useEffect(() => {
    if (!currentPhrase) {
      if (scoreRef.current) {
        scoreRef.current.innerHTML =
          '<div class="vexflow-placeholder">Select a phrase to start the preview.</div>'
      }
      return
    }

    renderVexFlow(currentPhrase.music_xml, scoreRef.current)
  }, [currentPhrase, renderVexFlow])

  const handlePlay = async () => {
    if (!currentPhrase || !midiPlayerRef.current) return

    if (isPlaying) {
      midiPlayerRef.current.stop()
      setIsPlaying(false)
      return
    }

    setIsPlaying(true)

    try {
      await midiPlayerRef.current.play(currentPhrase.music_xml, bpm)
    } catch (error) {
      console.error('Playback failed:', error)
    } finally {
      setIsPlaying(false)
    }
  }

  const handleStop = () => {
    midiPlayerRef.current?.stop()
    setIsPlaying(false)
  }

  const handleOpenNew = () => {
    setEditingPhrase(null)
    setEditorOpen(true)
  }

  const handleOpenEdit = () => {
    if (!currentPhrase) return
    setEditingPhrase(currentPhrase)
    setEditorOpen(true)
  }

  const handlePhraseSelect = async (phrase) => {
    const fullPhrase = await loadPhraseById(phrase.id)
    if (fullPhrase && isPlaying) {
      handleStop()
    }
  }

  const handleTagToggle = (tagId) => {
    setSelectedTags((previous) =>
      previous.includes(tagId)
        ? previous.filter((id) => id !== tagId)
        : [...previous, tagId]
    )
  }

  const handleSave = async (data) => {
    try {
      let phraseId = data.id

      if (data.id) {
        await api.updatePhrase(data.id, data)
      } else {
        phraseId = await api.createPhrase(data)
      }

      setEditorOpen(false)
      setEditingPhrase(null)

      await Promise.all([
        loadPhrases({ tagIds: selectedTags, query: searchQuery.trim() }),
        loadTags(),
      ])

      if (phraseId) {
        await loadPhraseById(phraseId)
      }
    } catch (error) {
      console.error('Failed to save phrase:', error)
      window.alert(`Save failed: ${error.message}`)
    }
  }

  const handleDelete = async () => {
    if (!currentPhrase) return

    const confirmed = window.confirm(
      `Delete phrase "${currentPhrase.title}"?`
    )
    if (!confirmed) return

    try {
      await api.deletePhrase(currentPhrase.id)
      setCurrentPhrase(null)
      handleStop()
      await loadPhrases({ tagIds: selectedTags, query: searchQuery.trim() })
    } catch (error) {
      console.error('Failed to delete phrase:', error)
      window.alert(`Delete failed: ${error.message}`)
    }
  }

  const handleAddTag = async (name) => {
    const trimmedName = name.trim()
    if (!trimmedName) return

    const duplicate = tags.some(
      (tag) => tag.name.toLowerCase() === trimmedName.toLowerCase()
    )
    if (duplicate) return

    try {
      await api.createTag(trimmedName, 'custom')
      await loadTags()
    } catch (error) {
      console.error('Failed to create tag:', error)
    }
  }

  return (
    <div className="app-shell">
      <Toolbar
        bpm={bpm}
        currentPhrase={currentPhrase}
        isPlaying={isPlaying}
        onBpmChange={setBpm}
        onEdit={handleOpenEdit}
      />

      <div className="workspace">
        <aside className="nav-rail">
          <button
            type="button"
            className={`nav-rail-button ${activeView === 'library' ? 'active' : ''}`}
            onClick={() => setActiveView('library')}
            title="Phrase library"
          >
            LIB
          </button>
          <button
            type="button"
            className={`nav-rail-button ${isPlaying ? 'active' : ''}`}
            onClick={handlePlay}
            title={isPlaying ? 'Stop audition' : 'Audition current phrase'}
            disabled={!currentPhrase}
          >
            {isPlaying ? 'STOP' : 'PLAY'}
          </button>
          <button
            type="button"
            className="nav-rail-button"
            onClick={handleStop}
            disabled={!isPlaying}
            title="Stop playback"
          >
            END
          </button>
          <button
            type="button"
            className="nav-rail-add"
            onClick={handleOpenNew}
            title="Create phrase"
          >
            +
          </button>
        </aside>

        <Sidebar
          tags={tags}
          selectedTags={selectedTags}
          phrases={phrases}
          currentPhrase={currentPhrase}
          searchQuery={searchQuery}
          onTagToggle={handleTagToggle}
          onPhraseSelect={handlePhraseSelect}
          onAddTag={handleAddTag}
          onSearchChange={setSearchQuery}
        />

        <PhraseDetail
          ref={scoreRef}
          phrase={currentPhrase}
          searchQuery={searchQuery}
          bpm={bpm}
          isPlaying={isPlaying}
          onEdit={handleOpenEdit}
          onDelete={handleDelete}
        />
      </div>

      <StatusBar
        currentPhrase={currentPhrase}
        totalCount={phrases.length}
        selectedTagCount={selectedTags.length}
        searchQuery={searchQuery}
      />

      <PhraseEditor
        isOpen={editorOpen}
        phrase={editingPhrase}
        tags={tags}
        onClose={() => {
          setEditorOpen(false)
          setEditingPhrase(null)
        }}
        onSave={handleSave}
        onAddTag={handleAddTag}
        onPreview={renderVexFlow}
      />
    </div>
  )
}
