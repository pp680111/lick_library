let audioContext = null
let isPlaying = false
let currentTime = 0

function initAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)()
  }
  return audioContext
}

function noteNameToMidi(step, octave) {
  const noteMap = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }
  return noteMap[step.toUpperCase()] + (octave + 1) * 12
}

function playNoteFallback(midi, duration) {
  const ctx = initAudioContext()
  const freq = 440 * Math.pow(2, (midi - 69) / 12)
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()

  osc.type = 'triangle'
  osc.frequency.value = freq
  gain.gain.setValueAtTime(0.3, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration)

  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start()
  osc.stop(ctx.currentTime + duration)
}

function parseMusicXmlToMidi(musicXml, bpm) {
  const parser = new DOMParser()
  const xml = parser.parseFromString(musicXml, 'text/xml')
  const notes = []
  const tempo = 60 / bpm

  const noteElements = xml.querySelectorAll('note')
  let currentTime = 0

  noteElements.forEach((noteEl) => {
    const pitch = noteEl.querySelector('pitch')
    if (pitch) {
      const step = pitch.querySelector('step').textContent
      const octave = parseInt(pitch.querySelector('octave').textContent)
      const duration = parseInt(noteEl.querySelector('duration')?.textContent || '1')

      const midi = noteNameToMidi(step, octave)
      notes.push({
        midi: midi,
        time: currentTime,
        duration: duration * tempo * 0.9,
      })

      currentTime += duration * tempo
    }
  })

  return notes
}

export async function play(phraseMusicXml, bpm = 120) {
  if (isPlaying) {
    stop()
  }

  initAudioContext()

  const notes = parseMusicXmlToMidi(phraseMusicXml, bpm)
  if (notes.length === 0) return

  isPlaying = true
  currentTime = 0

  for (const note of notes) {
    if (!isPlaying) break

    const duration = note.duration
    playNoteFallback(note.midi, duration)

    await new Promise((resolve) => setTimeout(resolve, duration * 1000))
    currentTime = note.time
  }

  isPlaying = false
}

export function stop() {
  isPlaying = false
  currentTime = 0
}

export function getIsPlaying() {
  return isPlaying
}
