import Vex from 'vexflow';

const { Renderer, Stave, StaveNote, Voice, Formatter, TabStave, TabNote, Beam } = Vex.Flow;

class VexFlowRenderer {
  constructor(container) {
    this.container = container;
    this.renderer = new Renderer(container, Renderer.Backends.SVG);
    this.context = this.renderer.getContext();

    // 标准吉他调弦 (E2 A2 D3 G3 B3 E4)
    // 对应 MIDI 号: 40, 45, 50, 55, 59, 64
    this.tuning = [40, 45, 50, 55, 59, 64];
  }

  render(musicXml, options = {}) {
    const { width = 800, height = 400, showTab = true } = options;
    this.renderer.resize(width, height);
    this.context.clear();

    // 解析 MusicXML
    const { notes, timeSignature } = this.parseMusicXml(musicXml);

    // 渲染五线谱
    const stave = new Stave(10, 10, width - 20);
    stave.addClef('treble').addTimeSignature(timeSignature || '4/4');
    stave.setContext(this.context).draw();

    const voice = new Voice({ num_beats: 4, beat_value: 4 });
    voice.addTickables(notes);
    new Formatter().joinVoices([voice]).format([voice], width - 80);
    voice.draw(this.context, stave);

    // 渲染 Tab（如果需要）
    if (showTab) {
      const tabStave = new TabStave(10, 150, width - 20);
      tabStave.addClef('tab').addTimeSignature(timeSignature || '4/4');
      tabStave.setContext(this.context).draw();

      const tabNotes = this.convertToTab(notes);
      const tabVoice = new Voice({ num_beats: 4, beat_value: 4 });
      tabVoice.addTickables(tabNotes);
      new Formatter().joinVoices([tabVoice]).format([tabVoice], width - 80);
      tabVoice.draw(this.context, tabStave);
    }
  }

  parseMusicXml(musicXml) {
    const parser = new DOMParser();
    const xml = parser.parseFromString(musicXml, 'text/xml');
    const notes = [];
    let timeSignature = '4/4';

    // 解析节拍
    const divisions = parseInt(xml.querySelector('divisions')?.textContent || '1');
    const ts = xml.querySelector('time-signature');
    if (ts) {
      const beats = ts.querySelector('beats')?.textContent || '4';
      const beatType = ts.querySelector('beat-type')?.textContent || '4';
      timeSignature = `${beats}/${beatType}`;
    }

    const noteElements = xml.querySelectorAll('note');
    noteElements.forEach(noteEl => {
      const pitch = noteEl.querySelector('pitch');
      if (pitch) {
        const step = pitch.querySelector('step').textContent;
        const octave = parseInt(pitch.querySelector('octave').textContent);
        const duration = noteEl.querySelector('duration')?.textContent || '4';
        const durationType = this.durationToVexFlow(parseInt(duration), divisions);
        notes.push(new StaveNote({
          keys: [`${step.toLowerCase()}/${octave}`],
          duration: durationType
        }));
      } else {
        // 休止符
        notes.push(new StaveNote({
          keys: ['b/4'],
          duration: 'qr'
        }));
      }
    });

    return { notes: notes.length > 0 ? notes : this.getDefaultNotes(), timeSignature };
  }

  durationToVexFlow(duration, divisions) {
    // 将 MusicXML duration 转换为 VexFlow duration
    // 简化: 假设 divisions=1 对应四分音符
    if (duration >= 4) return 'w';
    if (duration >= 2) return 'h';
    if (duration >= 1) return 'q';
    return '8';
  }

  convertToTab(notes) {
    // 将五线谱音符转换为 Tab 位置
    // 使用标准吉他调弦找到最佳品位
    return notes.map(note => {
      if (note.getDuration() === 'qr') {
        // 休止符在 Tab 中显示为 -
        return new TabNote({
          positions: [{ str: 1, fret: '-' }],
          duration: 'q'
        });
      }

      const keys = note.getKeys();
      const key = keys[0];
      const [noteName, octave] = key.split('/');
      const midi = this.noteNameToMidi(noteName, parseInt(octave));

      // 找到最低品位（最舒适的弹奏位置）
      const position = this.findBestPosition(midi);
      return new TabNote({
        positions: [{ str: position.string, fret: position.fret }],
        duration: note.getDuration()
      });
    });
  }

  noteNameToMidi(noteName, octave) {
    const noteMap = { 'c': 0, 'd': 2, 'e': 4, 'f': 5, 'g': 7, 'a': 9, 'b': 11 };
    return noteMap[noteName.toLowerCase()] + (octave + 1) * 12;
  }

  findBestPosition(midi) {
    // 从低音弦到高音弦找第一个能弹奏的位置
    for (let i = 0; i < this.tuning.length; i++) {
      const openStringMidi = this.tuning[i];
      const fret = midi - openStringMidi;
      // 品格范围 0-24，超出则尝试下一根弦
      if (fret >= 0 && fret <= 24) {
        return { string: i + 1, fret };
      }
    }
    // 如果都超出，返回 -1 表示无法弹奏
    return { string: 1, fret: -1 };
  }

  getDefaultNotes() {
    return [
      new StaveNote({ keys: ['c/4'], duration: 'q' }),
      new StaveNote({ keys: ['e/4'], duration: 'q' }),
      new StaveNote({ keys: ['g/4'], duration: 'q' }),
      new StaveNote({ keys: ['c/5'], duration: 'q' })
    ];
  }
}

export default VexFlowRenderer;
