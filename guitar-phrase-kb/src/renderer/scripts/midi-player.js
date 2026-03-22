import Soundfont from 'soundfont-player';

class MidiPlayer {
  constructor() {
    this.audioContext = null;
    this.instrument = null;
    this.isPlaying = false;
    this.currentPhrase = null;
    this.currentTime = 0;
  }

  async init() {
    try {
      console.log('MidiPlayer: Starting initialization');
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      console.log('MidiPlayer: AudioContext created');

      // Skip soundfont loading in Electron to avoid crashes
      // Use oscillator-based fallback for audio synthesis
      console.log('MidiPlayer: Using fallback oscillator audio');
      this.useFallback = true;
      this.instrument = null;
    } catch (error) {
      console.warn('MidiPlayer: Init failed:', error);
      this.useFallback = true;
      this.instrument = null;
    }
  }

  playNoteFallback(midi, duration) {
    const freq = 440 * Math.pow(2, (midi - 69) / 12);
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = 'triangle';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.audioContext.destination);
    osc.start();
    osc.stop(this.audioContext.currentTime + duration);
  }

  async playPhrase(musicXml, bpm = 120, onProgress = null) {
    if (this.isPlaying) this.stop();

    const notes = this.parseMusicXmlToMidi(musicXml, bpm);
    if (notes.length === 0) return;

    this.isPlaying = true;
    this.currentTime = 0;
    const startTime = this.audioContext.currentTime;

    for (const note of notes) {
      if (!this.isPlaying) break;

      const scheduleTime = startTime + note.time;
      const duration = note.duration;

      if (this.useFallback) {
        // Use oscillator-based fallback
        this.playNoteFallback(note.midi, duration);
      } else {
        this.instrument.play(note.midi, scheduleTime, {
          duration: duration,
          gain: 0.8
        });
      }

      if (onProgress) {
        setTimeout(() => {
          if (this.isPlaying) {
            this.currentTime = note.time;
            onProgress(this.currentTime, note.time);
          }
        }, note.time * 1000);
      }

      await new Promise(resolve => setTimeout(resolve, duration * 1000));
    }

    this.isPlaying = false;
  }

  parseMusicXmlToMidi(musicXml, bpm) {
    const parser = new DOMParser();
    const xml = parser.parseFromString(musicXml, 'text/xml');
    const notes = [];
    const tempo = 60 / bpm;

    const noteElements = xml.querySelectorAll('note');
    let currentTime = 0;

    noteElements.forEach(noteEl => {
      const pitch = noteEl.querySelector('pitch');
      if (pitch) {
        const step = pitch.querySelector('step').textContent;
        const octave = parseInt(pitch.querySelector('octave').textContent);
        const duration = parseInt(noteEl.querySelector('duration')?.textContent || '1');

        const midi = this.noteNameToMidi(step, octave);
        notes.push({
          midi: midi,
          time: currentTime,
          duration: duration * tempo * 0.9
        });

        currentTime += duration * tempo;
      }
    });

    return notes;
  }

  noteNameToMidi(step, octave) {
    const noteMap = { 'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11 };
    return noteMap[step.toUpperCase()] + (octave + 1) * 12;
  }

  stop() {
    this.isPlaying = false;
    this.currentTime = 0;
  }

  pause() {
    this.isPlaying = false;
  }

  getCurrentTime() {
    return this.currentTime;
  }
}

export default MidiPlayer;
