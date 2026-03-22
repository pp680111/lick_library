# 吉他乐句知识库 - 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个Electron桌面应用，存储吉他五线谱乐句，支持MusicXML格式输入、VexFlow渲染五线谱和Tab、MIDI播放、标签管理和全文搜索

**Architecture:**
- Electron + Vite 前端分离架构
- SQLite + FTS5 本地数据库存储
- VexFlow 乐谱渲染
- Web MIDI API + SoundFont 音频播放
- 单页应用布局，模态框编辑

**Tech Stack:** Electron, Vite, SQLite (better-sqlite3), VexFlow, Web MIDI API, SoundFont2

---

## 文件结构

```
guitar-phrase-kb/
├── src/
│   ├── main/
│   │   ├── main.js              # Electron主进程入口
│   │   └── database.js          # SQLite数据库操作封装
│   ├── preload/
│   │   └── preload.js           # 预加载脚本，暴露IPC
│   └── renderer/
│       ├── index.html            # 主页面
│       ├── styles/
│       │   └── main.css         # 全局样式
│       ├── scripts/
│       │   ├── app.js           # 主应用逻辑，状态管理
│       │   ├── renderer.js      # 渲染进程初始化
│       │   ├── vexflow-renderer.js   # VexFlow五线谱+Tab渲染
│       │   ├── midi-player.js   # MIDI播放控制
│       │   ├── search.js        # 搜索功能封装
│       │   └── ipc.js           # IPC通信封装
│       └── components/
│           ├── sidebar.js        # 侧边栏组件
│           ├── phrase-list.js    # 乐句列表组件
│           ├── phrase-detail.js  # 乐句详情组件
│           ├── phrase-editor.js  # 乐句编辑模态框
│           ├── tag-filter.js    # 标签筛选组件
│           └── toolbar.js       # 工具栏组件
├── assets/
│   └── sounds/
│       └── piano.sf2            # SoundFont音色文件
├── data/                         # 数据目录（运行时创建）
├── package.json
├── vite.config.js
├── electron-builder.json
└── SPEC.md                       # 需求规格说明
```

---

## 实现任务

### Task 1: 项目脚手架搭建

**Files:**
- Create: `package.json`
- Create: `vite.config.js`
- Create: `electron-builder.json`
- Create: `src/main/main.js`
- Create: `src/preload/preload.js`
- Create: `src/renderer/index.html`
- Create: `src/renderer/styles/main.css`
- Create: `src/renderer/scripts/renderer.js`

- [ ] **Step 1: 创建 package.json**

```json
{
  "name": "guitar-phrase-kb",
  "version": "1.0.0",
  "description": "吉他乐句知识库 - 存储、管理、播放五线谱乐句",
  "main": "src/main/main.js",
  "scripts": {
    "dev": "concurrently \"npm run dev:vite\" \"npm run dev:electron\"",
    "dev:vite": "vite",
    "dev:electron": "wait-on http://localhost:5173 && electron .",
    "build": "vite build && electron-builder",
    "preview": "vite preview",
    "postinstall": "electron-builder install-app-deps"
  },
  "devDependencies": {
    "electron": "^28.0.0",
    "vite": "^5.0.0",
    "concurrently": "^8.2.0",
    "wait-on": "^7.2.0",
    "electron-builder": "^24.9.0",
    "@electron/rebuild": "^3.6.0"
  },
  "dependencies": {
    "better-sqlite3": "^9.2.0",
    "uuid": "^9.0.0"
  }
}
```

- [ ] **Step 2: 创建 vite.config.js**

```javascript
import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src/renderer',
  base: './',
  build: {
    outDir: '../../dist/renderer',
    emptyOutDir: true
  },
  server: {
    port: 5173
  }
});
```

- [ ] **Step 3: 创建 electron-builder.json**

```json
{
  "appId": "com.guitarphrase.kb",
  "productName": "Guitar Phrase KB",
  "directories": {
    "output": "release"
  },
  "files": [
    "src/**/*",
    "assets/**/*",
    "dist/**/*"
  ],
  "extraResources": [
    {
      "from": "assets/sounds",
      "to": "sounds"
    }
  ],
  "win": {
    "target": "nsis"
  },
  "nsis": {
    "oneClick": false,
    "allowToChangeInstallationDirectory": true
  }
}
```

- [ ] **Step 4: 创建 Electron 主进程 src/main/main.js**

```javascript
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const Database = require('./database');

let mainWindow;
let db;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/renderer/index.html'));
  }
}

app.whenReady().then(() => {
  const userDataPath = app.getPath('userData');
  db = new Database(path.join(userDataPath, 'data/phrases.db'));
  db.initialize();
  registerIpcHandlers();
  createWindow();
});

function registerIpcHandlers() {
  // 数据库操作
  ipcMain.handle('db:getPhrases', (event, filter) => db.getPhrases(filter));
  ipcMain.handle('db:getPhrase', (event, id) => db.getPhrase(id));
  ipcMain.handle('db:createPhrase', (event, data) => db.createPhrase(data));
  ipcMain.handle('db:updatePhrase', (event, id, data) => db.updatePhrase(id, data));
  ipcMain.handle('db:deletePhrase', (event, id) => db.deletePhrase(id));

  // 标签操作
  ipcMain.handle('db:getTags', () => db.getTags());
  ipcMain.handle('db:createTag', (event, name, type) => db.createTag(name, type));
  ipcMain.handle('db:deleteTag', (event, id) => db.deleteTag(id));

  // 搜索
  ipcMain.handle('db:searchPhrases', (event, query) => db.searchPhrases(query));

  // 应用信息
  ipcMain.handle('app:getDataPath', () => app.getPath('userData'));
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
```

- [ ] **Step 5: 创建 preload.js**

```javascript
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // 数据库操作
  getPhrases: (filter) => ipcRenderer.invoke('db:getPhrases', filter),
  getPhrase: (id) => ipcRenderer.invoke('db:getPhrase', id),
  createPhrase: (data) => ipcRenderer.invoke('db:createPhrase', data),
  updatePhrase: (id, data) => ipcRenderer.invoke('db:updatePhrase', id, data),
  deletePhrase: (id) => ipcRenderer.invoke('db:deletePhrase', id),

  // 标签操作
  getTags: () => ipcRenderer.invoke('db:getTags'),
  createTag: (name, type) => ipcRenderer.invoke('db:createTag', name, type),
  deleteTag: (id) => ipcRenderer.invoke('db:deleteTag', id),

  // 搜索
  searchPhrases: (query) => ipcRenderer.invoke('db:searchPhrases', query),

  // 获取数据目录
  getDataPath: () => ipcRenderer.invoke('app:getDataPath')
});
```

- [ ] **Step 6: 创建 HTML 和 CSS 骨架**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>吉他乐句知识库</title>
  <link rel="stylesheet" href="./styles/main.css">
</head>
<body>
  <div id="app">
    <header id="toolbar"></header>
    <div id="main-container">
      <aside id="sidebar"></aside>
      <main id="content"></main>
    </div>
    <footer id="statusbar"></footer>
  </div>
  <div id="editor-modal" class="modal hidden"></div>
  <script type="module" src="./scripts/renderer.js"></script>
</body>
</html>
```

- [ ] **Step 7: 创建 renderer.js 入口**

```javascript
import App from './scripts/app.js';

document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
  window.app.init();
});
```

- [ ] **Step 8: 运行验证**

Run: `cd D:/otherCode/lick_library/guitar-phrase-kb && npm install && npm run dev:vite`
Expected: Vite 开发服务器在 localhost:5173 启动

---

### Task 2: SQLite 数据库层

**Files:**
- Create: `src/main/database.js`

- [ ] **Step 1: 创建数据库模块**

```javascript
const Database = require('better-sqlite3');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class PhraseDatabase {
  constructor(dbPath) {
    const dir = path.dirname(dbPath);
    require('fs').mkdirSync(dir, { recursive: true });
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
  }

  initialize() {
    // 创建表 - 注意 phrases 表使用 INTEGER PRIMARY KEY 以支持 FTS5 content sync
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS phrases (
        rowid INTEGER PRIMARY KEY AUTOINCREMENT,
        id TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        music_xml TEXT NOT NULL,
        note TEXT DEFAULT '',
        bpm INTEGER DEFAULT 120,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS tags (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        type TEXT NOT NULL CHECK(type IN ('preset', 'custom'))
      );

      CREATE TABLE IF NOT EXISTS phrase_tags (
        phrase_id TEXT NOT NULL,
        tag_id TEXT NOT NULL,
        PRIMARY KEY (phrase_id, tag_id),
        FOREIGN KEY (phrase_id) REFERENCES phrases(id) ON DELETE CASCADE,
        FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
      );

      -- FTS5 虚拟表，只索引 note 字段（按规格要求）
      CREATE VIRTUAL TABLE IF NOT EXISTS phrases_fts USING fts5(
        note,
        content='phrases',
        content_rowid='rowid'
      );

      -- INSERT 触发器
      CREATE TRIGGER IF NOT EXISTS phrases_ai AFTER INSERT ON phrases BEGIN
        INSERT INTO phrases_fts(rowid, note) VALUES (NEW.rowid, NEW.note);
      END;

      -- DELETE 触发器
      CREATE TRIGGER IF NOT EXISTS phrases_ad AFTER DELETE ON phrases BEGIN
        INSERT INTO phrases_fts(phrases_fts, rowid, note) VALUES('delete', OLD.rowid, OLD.note);
      END;

      -- UPDATE 触发器
      CREATE TRIGGER IF NOT EXISTS phrases_au AFTER UPDATE ON phrases BEGIN
        INSERT INTO phrases_fts(phrases_fts, rowid, note) VALUES('delete', OLD.rowid, OLD.note);
        INSERT INTO phrases_fts(rowid, note) VALUES (NEW.rowid, NEW.note);
      END;
    `);

    // 初始化预设标签
    const presetTags = ['Blues', 'Jazz', 'Rock', 'Country', 'Funk', 'Pop', 'R&B', 'Soul'];
    const insertTag = this.db.prepare('INSERT OR IGNORE INTO tags (id, name, type) VALUES (?, ?, ?)');
    presetTags.forEach(tag => insertTag.run(uuidv4(), tag, 'preset'));
  }

  getPhrases(filter = {}) {
    let sql = 'SELECT * FROM phrases WHERE 1=1';
    const params = [];

    if (filter.tagIds && filter.tagIds.length > 0) {
      sql += ` AND id IN (
        SELECT phrase_id FROM phrase_tags WHERE tag_id IN (${filter.tagIds.map(() => '?').join(',')})
      )`;
      params.push(...filter.tagIds);
    }

    sql += ' ORDER BY updated_at DESC';
    return this.db.prepare(sql).all(...params);
  }

  getPhrase(id) {
    const phrase = this.db.prepare('SELECT * FROM phrases WHERE id = ?').get(id);
    if (phrase) {
      phrase.tags = this.db.prepare(`
        SELECT t.* FROM tags t
        JOIN phrase_tags pt ON t.id = pt.tag_id
        WHERE pt.phrase_id = ?
      `).all(id);
    }
    return phrase;
  }

  createPhrase(data) {
    const id = uuidv4();
    const now = new Date().toISOString();
    const stmt = this.db.prepare(`
      INSERT INTO phrases (id, title, music_xml, note, bpm, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, data.title, data.musicXml, data.note || '', data.bpm || 120, now, now);

    if (data.tagIds) {
      const insertTag = this.db.prepare('INSERT INTO phrase_tags (phrase_id, tag_id) VALUES (?, ?)');
      data.tagIds.forEach(tagId => insertTag.run(id, tagId));
    }

    return id;
    // FTS 同步由触发器自动处理
  }

  updatePhrase(id, data) {
    const now = new Date().toISOString();
    this.db.prepare(`
      UPDATE phrases SET title = ?, music_xml = ?, note = ?, bpm = ?, updated_at = ?
      WHERE id = ?
    `).run(data.title, data.musicXml, data.note || '', data.bpm || 120, now, id);

    this.db.prepare('DELETE FROM phrase_tags WHERE phrase_id = ?').run(id);
    if (data.tagIds) {
      const insertTag = this.db.prepare('INSERT INTO phrase_tags (phrase_id, tag_id) VALUES (?, ?)');
      data.tagIds.forEach(tagId => insertTag.run(id, tagId));
    }
    // FTS 同步由触发器自动处理
  }

  deletePhrase(id) {
    this.db.prepare('DELETE FROM phrases WHERE id = ?').run(id);
  }

  getTags() {
    return this.db.prepare('SELECT * FROM tags ORDER BY type, name').all();
  }

  createTag(name, type) {
    const id = uuidv4();
    this.db.prepare('INSERT INTO tags (id, name, type) VALUES (?, ?, ?)').run(id, name, type);
    return id;
  }

  searchPhrases(query) {
    if (!query) return this.getPhrases();
    // FTS5 MATCH 查询 note 字段
    const results = this.db.prepare(`
      SELECT p.* FROM phrases p
      JOIN phrases_fts fts ON p.rowid = fts.rowid
      WHERE phrases_fts MATCH ?
      ORDER BY rank
    `).all(query + '*');
    return results;
  }
}

module.exports = PhraseDatabase;
```

- [ ] **Step 2: 验证数据库初始化**

Run: `cd D:/otherCode/lick_library/guitar-phrase-kb && node -e "const db = require('./src/main/database'); const d = new db('./test.db'); d.initialize(); console.log(d.getTags()); d.db.close();"`
Expected: 输出预设的8个标签

---

### Task 3: VexFlow 乐谱渲染

**Files:**
- Create: `src/renderer/scripts/vexflow-renderer.js`
- Add: `vexflow` to package.json dependencies

**说明：** MusicXML 解析使用浏览器内置 DOMParser，对于复杂 MusicXML 文件可能需要额外处理。Tab 转换使用标准吉他调弦（E A D G B e）。

- [ ] **Step 1: 创建 VexFlow 渲染器**

```javascript
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
```

- [ ] **Step 2: 添加 VexFlow 依赖到 package.json**

```json
{
  "dependencies": {
    "better-sqlite3": "^9.2.0",
    "uuid": "^9.0.0",
    "soundfont-player": "^0.12.0",
    "vexflow": "^4.2.3"
  }
}
```

- [ ] **Step 3: 验证渲染**

Run: `npm install && npm run dev`
Expected: 打开应用后可看到五线谱和吉他Tab正确渲染

---

### Task 4: MIDI 播放

**Files:**
- Create: `src/renderer/scripts/midi-player.js`
- Create: `assets/sounds/piano.sf2` (需要下载SoundFont文件)

**说明：** SoundFont 播放使用 `soundfont-player` 库，它能加载 .sf2 文件并使用 Web Audio API 播放高质量音色。

- [ ] **Step 1: 创建 MIDI 播放器**

```javascript
import Soundfont from 'soundfont-player';

class MidiPlayer {
  constructor() {
    this.audioContext = null;
    this.instrument = null;
    this.isPlaying = false;
    this.currentPhrase = null;
    this.currentTime = 0; // 当前播放位置（用于显示）
  }

  async init() {
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    // 加载钢琴音色
    this.instrument = await Soundfont.loadInstrument(this.audioContext, 'acoustic_grand_piano', {
      soundfont: 'MusyngKite' // 高质量音色
    });
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

      // 调度音符播放
      this.instrument.play(note.midi, scheduleTime, {
        duration: duration,
        gain: 0.8
      });

      // 更新播放进度
      if (onProgress) {
        setTimeout(() => {
          if (this.isPlaying) {
            this.currentTime = note.time;
            onProgress(this.currentTime, note.time);
          }
        }, note.time * 1000);
      }

      // 等待音符播放完成
      await new Promise(resolve => setTimeout(resolve, duration * 1000));
    }

    this.isPlaying = false;
  }

  parseMusicXmlToMidi(musicXml, bpm) {
    // 解析 MusicXML 并转换为 MIDI 事件序列
    // 简化实现，实际需要完整 XML 解析
    const parser = new DOMParser();
    const xml = parser.parseFromString(musicXml, 'text/xml');
    const notes = [];
    const tempo = 60 / bpm; // 每拍秒数

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
          duration: duration * tempo * 0.9 // 留点间隔
        });

        currentTime += duration * tempo;
      }
    });

    return notes;
  }

  noteNameToMidi(step, octave) {
    // 音符名到 MIDI 号转换 (C4 = 60)
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
```

- [ ] **Step 2: 添加 soundfont-player 依赖到 package.json**

```json
{
  "dependencies": {
    "better-sqlite3": "^9.2.0",
    "uuid": "^9.0.0",
    "soundfont-player": "^0.12.0"
  }
}
```

- [ ] **Step 3: 验证播放**

Run: `npm install && npm run dev`
Expected: 打开应用后按播放键可听到钢琴音色播放

---

### Task 5: UI 组件实现

**Files:**
- Create: `src/renderer/scripts/components/*.js`
- Modify: `src/renderer/styles/main.css`

- [ ] **Step 1: 创建 CSS 样式**

```css
* { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg-primary: #1a1a2e;
  --bg-secondary: #16213e;
  --bg-tertiary: #0f3460;
  --accent: #e94560;
  --text-primary: #eaeaea;
  --text-secondary: #a0a0a0;
  --border: #2a2a4a;
}

body { font-family: 'Segoe UI', sans-serif; background: var(--bg-primary); color: var(--text-primary); }

#app { display: flex; flex-direction: column; height: 100vh; }

/* 工具栏 */
#toolbar { height: 50px; background: var(--bg-secondary); border-bottom: 1px solid var(--border); display: flex; align-items: center; padding: 0 16px; gap: 16px; }
.toolbar-group { display: flex; align-items: center; gap: 8px; }
.toolbar-separator { width: 1px; height: 24px; background: var(--border); }

/* 播放控制按钮 */
.play-btn { width: 36px; height: 36px; border: none; border-radius: 50%; background: var(--accent); color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 16px; }
.play-btn:hover { background: #d63d56; }
.play-btn:disabled { opacity: 0.5; cursor: not-allowed; }

/* BPM 控制 */
.bpm-control { display: flex; align-items: center; gap: 4px; font-size: 13px; color: var(--text-secondary); }
.bpm-input { width: 50px; padding: 4px 8px; border: 1px solid var(--border); border-radius: 4px; background: var(--bg-tertiary); color: var(--text-primary); text-align: center; }

/* 搜索框 */
.search-box { flex: 1; max-width: 300px; }
.search-input { width: 100%; padding: 8px 12px; border: 1px solid var(--border); border-radius: 4px; background: var(--bg-tertiary); color: var(--text-primary); }
.search-input::placeholder { color: var(--text-secondary); }

/* 新建按钮 */
.btn-new { padding: 8px 16px; border: none; border-radius: 4px; background: var(--accent); color: white; cursor: pointer; font-weight: 500; }

/* 主布局 */
#main-container { display: flex; flex: 1; overflow: hidden; }

/* 侧边栏 */
#sidebar { width: 280px; background: var(--bg-secondary); border-right: 1px solid var(--border); display: flex; flex-direction: column; overflow: hidden; }
.sidebar-section { padding: 16px; border-bottom: 1px solid var(--border); }
.sidebar-title { font-size: 11px; text-transform: uppercase; color: var(--text-secondary); margin-bottom: 8px; letter-spacing: 0.5px; }

/* 标签筛选 */
.tag-list { display: flex; flex-wrap: wrap; gap: 4px; }
.tag { display: inline-block; padding: 4px 8px; background: var(--bg-tertiary); border-radius: 4px; font-size: 12px; cursor: pointer; transition: background 0.2s; }
.tag:hover { background: var(--bg-primary); }
.tag.active { background: var(--accent); color: white; }
.tag.preset { border-left: 3px solid var(--accent); }

/* 乐句列表 */
.phrase-list { flex: 1; overflow-y: auto; }
.phrase-item { padding: 12px 16px; border-bottom: 1px solid var(--border); cursor: pointer; transition: background 0.2s; }
.phrase-item:hover { background: var(--bg-tertiary); }
.phrase-item.active { background: var(--bg-tertiary); border-left: 3px solid var(--accent); }
.phrase-title { font-size: 14px; margin-bottom: 4px; }
.phrase-meta { font-size: 11px; color: var(--text-secondary); }

/* 主内容区 */
#content { flex: 1; padding: 24px; overflow-y: auto; background: var(--bg-primary); }

/* 乐句详情 */
.phrase-detail { max-width: 900px; margin: 0 auto; }
.detail-title { font-size: 24px; margin-bottom: 16px; }
.detail-tags { margin-bottom: 16px; }

/* 五线谱和Tab容器 */
#vexflow-container { background: white; border-radius: 8px; padding: 16px; margin-bottom: 24px; }
#vexflow-container svg { width: 100%; height: auto; }

/* 笔记区 */
.note-section { background: var(--bg-secondary); border-radius: 8px; padding: 16px; margin-bottom: 24px; }
.note-section h3 { font-size: 14px; color: var(--text-secondary); margin-bottom: 8px; }
.note-content { font-size: 14px; line-height: 1.6; white-space: pre-wrap; }

/* 笔记搜索高亮 */
.highlight { background: yellow; color: #000; padding: 0 2px; border-radius: 2px; }

/* 编辑模态框 */
.modal { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal.hidden { display: none; }
.modal-content { background: var(--bg-secondary); border-radius: 8px; width: 95%; max-width: 1000px; max-height: 90vh; overflow: auto; padding: 24px; }
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.modal-title { font-size: 18px; font-weight: 600; }
.modal-close { background: none; border: none; color: var(--text-secondary); font-size: 24px; cursor: pointer; }
.modal-body { display: flex; gap: 24px; }
.editor-left { flex: 1; }
.editor-right { flex: 1; }
.editor-field { margin-bottom: 16px; }
.editor-label { display: block; font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; }
.editor-input { width: 100%; padding: 8px 12px; border: 1px solid var(--border); border-radius: 4px; background: var(--bg-tertiary); color: var(--text-primary); }
.editor-textarea { width: 100%; height: 300px; padding: 12px; border: 1px solid var(--border); border-radius: 4px; background: var(--bg-tertiary); color: var(--text-primary); font-family: 'Consolas', monospace; resize: vertical; }
.editor-preview { background: white; border-radius: 4px; padding: 16px; min-height: 200px; }
.modal-footer { display: flex; justify-content: flex-end; gap: 8px; margin-top: 24px; }

/* 状态栏 */
#statusbar { height: 32px; background: var(--bg-tertiary); border-top: 1px solid var(--border); display: flex; align-items: center; padding: 0 16px; font-size: 12px; color: var(--text-secondary); gap: 16px; }
```

- [ ] **Step 2: 创建主应用类 (App.js)**

```javascript
import VexFlowRenderer from './vexflow-renderer.js';
import MidiPlayer from './midi-player.js';

class App {
  constructor() {
    this.phrases = [];
    this.currentPhrase = null;
    this.tags = [];
    this.selectedTags = [];
    this.searchQuery = '';
    this.vexflowRenderer = null;
    this.midiPlayer = null;
    this.isPlaying = false;
  }

  async init() {
    this.midiPlayer = new MidiPlayer();
    await this.midiPlayer.init();

    this.setupEventListeners();
    await this.loadData();
    this.render();
  }

  async loadData() {
    this.phrases = await window.electronAPI.getPhrases();
    this.tags = await window.electronAPI.getTags();
  }

  setupEventListeners() {
    document.getElementById('toolbar').addEventListener('click', e => this.handleToolbarClick(e));
    document.getElementById('search-input')?.addEventListener('input', e => this.handleSearch(e));
    document.getElementById('bpm-input')?.addEventListener('change', e => this.handleBpmChange(e));
  }

  handleToolbarClick(e) {
    const action = e.target.dataset.action;
    if (action === 'play') this.togglePlayback();
    if (action === 'stop') this.stopPlayback();
    if (action === 'new') this.openEditor();
  }

  handleBpmChange(e) {
    const bpm = parseInt(e.target.value);
    if (this.currentPhrase && bpm > 0) {
      this.currentPhrase.bpm = bpm;
    }
  }

  async handleSearch(e) {
    this.searchQuery = e.target.value;
    if (this.searchQuery) {
      this.phrases = await window.electronAPI.searchPhrases(this.searchQuery);
    } else {
      this.phrases = await window.electronAPI.getPhrases({ tagIds: this.selectedTags });
    }
    this.renderPhraseList();
  }

  togglePlayback() {
    if (!this.currentPhrase) return;
    if (this.midiPlayer.isPlaying) {
      this.midiPlayer.stop();
      this.isPlaying = false;
      this.updatePlayButton(false);
    } else {
      const bpm = this.currentPhrase.bpm || 120;
      this.midiPlayer.playPhrase(this.currentPhrase.music_xml, bpm);
      this.isPlaying = true;
      this.updatePlayButton(true);
    }
  }

  stopPlayback() {
    this.midiPlayer.stop();
    this.isPlaying = false;
    this.updatePlayButton(false);
  }

  updatePlayButton(playing) {
    const btn = document.getElementById('play-btn');
    if (btn) btn.textContent = playing ? '⏸' : '▶';
  }

  openEditor(phrase = null) {
    const modal = document.getElementById('editor-modal');
    modal.classList.remove('hidden');
    this.renderEditor(phrase);
  }

  closeEditor() {
    const modal = document.getElementById('editor-modal');
    modal.classList.add('hidden');
  }

  renderEditor(phrase = null) {
    const modal = document.getElementById('editor-modal');
    const isEdit = phrase !== null;
    const title = phrase?.title || '';
    const musicXml = phrase?.music_xml || '';
    const note = phrase?.note || '';
    const bpm = phrase?.bpm || 120;

    modal.innerHTML = `
      <div class="modal-header">
        <h2 class="modal-title">${isEdit ? '编辑乐句' : '新建乐句'}</h2>
        <button class="modal-close" onclick="app.closeEditor()">&times;</button>
      </div>
      <div class="modal-body">
        <div class="editor-left">
          <div class="editor-field">
            <label class="editor-label">标题</label>
            <input class="editor-input" id="editor-title" value="${title}">
          </div>
          <div class="editor-field">
            <label class="editor-label">BPM</label>
            <input class="editor-input" type="number" id="editor-bpm" value="${bpm}" style="width:100px">
          </div>
          <div class="editor-field">
            <label class="editor-label">MusicXML</label>
            <textarea class="editor-textarea" id="editor-musicxml">${musicXml}</textarea>
          </div>
          <div class="editor-field">
            <label class="editor-label">标签</label>
            <div class="tag-list" id="editor-tags">
              ${this.tags.map(t => `
                <span class="tag ${t.type}" data-tag-id="${t.id}">${t.name}</span>
              `).join('')}
            </div>
          </div>
        </div>
        <div class="editor-right">
          <div class="editor-field">
            <label class="editor-label">笔记</label>
            <textarea class="editor-textarea" id="editor-note" style="height:150px;font-family:inherit">${note}</textarea>
          </div>
          <div class="editor-preview" id="editor-preview">
            <div style="color:#666;text-align:center;padding:40px">预览区域</div>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="app.closeEditor()">取消</button>
        <button class="btn btn-primary" onclick="app.savePhrase(${isEdit ? `'${phrase.id}'` : 'null'})">保存</button>
      </div>
    `;

    // MusicXML 实时预览
    const musicXmlInput = document.getElementById('editor-musicxml');
    musicXmlInput?.addEventListener('input', () => {
      const xml = musicXmlInput.value;
      const preview = document.getElementById('editor-preview');
      try {
        if (!this.vexflowRenderer) {
          this.vexflowRenderer = new VexFlowRenderer(preview);
        }
        this.vexflowRenderer.render(xml);
      } catch (err) {
        preview.innerHTML = `<div style="color:red;padding:20px">解析错误: ${err.message}</div>`;
      }
    });

    // 标签点击
    document.querySelectorAll('#editor-tags .tag').forEach(tagEl => {
      tagEl.addEventListener('click', () => tagEl.classList.toggle('active'));
    });

    if (musicXml) {
      setTimeout(() => musicXmlInput.dispatchEvent(new Event('input')), 100);
    }
  }

  async savePhrase(id) {
    const title = document.getElementById('editor-title').value;
    const musicXml = document.getElementById('editor-musicxml').value;
    const note = document.getElementById('editor-note').value;
    const bpm = parseInt(document.getElementById('editor-bpm').value) || 120;
    const selectedTags = Array.from(document.querySelectorAll('#editor-tags .tag.active')).map(el => el.dataset.tagId);

    const data = { title, musicXml, note, bpm, tagIds: selectedTags };

    if (id) {
      await window.electronAPI.updatePhrase(id, data);
    } else {
      await window.electronAPI.createPhrase(data);
    }

    this.closeEditor();
    await this.loadData();
    this.renderPhraseList();
  }

  async selectPhrase(phrase) {
    this.currentPhrase = phrase;
    this.renderDetail();
    this.renderPhraseList();

    const previewEl = document.getElementById('vexflow-preview');
    if (!this.vexflowRenderer && previewEl) {
      this.vexflowRenderer = new VexFlowRenderer(previewEl);
    }
    if (this.vexflowRenderer) {
      this.vexflowRenderer.render(phrase.music_xml);
    }

    const bpmInput = document.getElementById('bpm-input');
    if (bpmInput) bpmInput.value = phrase.bpm || 120;
  }

  toggleTag(tagId) {
    const idx = this.selectedTags.indexOf(tagId);
    if (idx === -1) {
      this.selectedTags.push(tagId);
    } else {
      this.selectedTags.splice(idx, 1);
    }
    this.applyFilters();
  }

  async applyFilters() {
    if (this.searchQuery) {
      this.phrases = await window.electronAPI.searchPhrases(this.searchQuery);
    } else {
      this.phrases = await window.electronAPI.getPhrases({ tagIds: this.selectedTags });
    }
    this.renderPhraseList();
    this.renderTagFilter();
  }

  highlightText(text, query) {
    if (!query) return this.escapeHtml(text);
    const regex = new RegExp(`(${query})`, 'gi');
    return this.escapeHtml(text).replace(regex, '<mark class="highlight">$1</mark>');
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  render() {
    this.renderToolbar();
    this.renderSidebar();
    this.renderContent();
    this.renderStatusbar();
  }

  renderToolbar() {
    const toolbar = document.getElementById('toolbar');
    toolbar.innerHTML = `
      <div class="toolbar-group">
        <button class="play-btn" id="play-btn" data-action="play" ${!this.currentPhrase ? 'disabled' : ''}>▶</button>
        <button class="play-btn" data-action="stop" ${!this.currentPhrase ? 'disabled' : ''}>⏹</button>
      </div>
      <div class="toolbar-separator"></div>
      <div class="bpm-control">
        <span>BPM:</span>
        <input type="number" class="bpm-input" id="bpm-input" value="${this.currentPhrase?.bpm || 120}" min="20" max="300">
      </div>
      <div class="toolbar-separator"></div>
      <div class="search-box">
        <input type="text" class="search-input" id="search-input" placeholder="搜索笔记...">
      </div>
      <button class="btn-new" data-action="new">+ 新建</button>
    `;
  }

  renderSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.innerHTML = `
      <div class="sidebar-section">
        <div class="sidebar-title">标签筛选</div>
        <div class="tag-list" id="tag-filter"></div>
      </div>
      <div class="phrase-list" id="phrase-list"></div>
    `;
    this.renderTagFilter();
    this.renderPhraseList();
  }

  renderTagFilter() {
    const tagFilter = document.getElementById('tag-filter');
    if (!tagFilter) return;
    tagFilter.innerHTML = this.tags.map(t => `
      <span class="tag ${t.type} ${this.selectedTags.includes(t.id) ? 'active' : ''}"
            data-tag-id="${t.id}"
            onclick="app.toggleTag('${t.id}')">${t.name}</span>
    `).join('');
  }

  renderPhraseList() {
    const phraseList = document.getElementById('phrase-list');
    if (!phraseList) return;
    phraseList.innerHTML = this.phrases.map(p => `
      <div class="phrase-item ${this.currentPhrase?.id === p.id ? 'active' : ''}"
           onclick="app.selectPhrase(${JSON.stringify(p).replace(/"/g, '&quot;')})">
        <div class="phrase-title">${this.highlightText(p.title, this.searchQuery)}</div>
        <div class="phrase-meta">${new Date(p.updated_at).toLocaleDateString()}</div>
      </div>
    `).join('') || '<div style="padding:16px;color:var(--text-secondary)">暂无乐句</div>';
  }

  renderContent() {
    const content = document.getElementById('content');
    if (!this.currentPhrase) {
      content.innerHTML = `
        <div class="phrase-detail">
          <div style="text-align:center;padding:60px;color:var(--text-secondary)">
            <div style="font-size:48px;margin-bottom:16px">🎸</div>
            <div>选择或创建一个乐句开始</div>
          </div>
        </div>
      `;
      return;
    }

    const p = this.currentPhrase;
    const tags = p.tags || [];
    content.innerHTML = `
      <div class="phrase-detail">
        <h1 class="detail-title">${this.highlightText(p.title, this.searchQuery)}</h1>
        <div class="detail-tags">
          ${tags.map(t => `<span class="tag ${t.type}">${t.name}</span>`).join('')}
        </div>
        <div id="vexflow-preview"></div>
        <div class="note-section">
          <h3>分析笔记</h3>
          <div class="note-content">${p.note ? this.highlightText(p.note, this.searchQuery) : '<span style="color:var(--text-secondary)">暂无笔记</span>'}</div>
        </div>
      </div>
    `;
  }

  renderStatusbar() {
    const statusbar = document.getElementById('statusbar');
    statusbar.innerHTML = `
      <span>当前乐句: ${this.currentPhrase?.title || '无'}</span>
      <span>共 ${this.phrases.length} 条乐句</span>
      <span>${this.selectedTags.length > 0 ? `筛选标签: ${this.selectedTags.length}个` : ''}</span>
    `;
  }
}

export default App;
```

- [ ] **Step 3: 验证UI组件**

确保所有组件正确渲染和交互

---

### Task 6: 完整功能集成与测试

- [ ] **Step 1: 端到端测试**

1. 创建新乐句（输入MusicXML）
2. 保存并验证五线谱渲染
3. 验证Tab显示
4. 验证MIDI播放
5. 验证标签添加
6. 验证搜索功能

- [ ] **Step 2: 构建打包**

Run: `npm run build`
Expected: 生成可执行的.exe文件

---

## 任务依赖关系

```
Task 1 (脚手架)
    ↓
Task 2 (数据库) ←→ Task 3 (VexFlow)
    ↓                   ↓
Task 4 (MIDI)  ←→ Task 5 (UI组件)
            ↓
      Task 6 (集成测试)
```

---

## 验收检查清单

- [ ] Electron应用可启动
- [ ] SQLite数据库正确初始化，预设标签存在
- [ ] 可创建/编辑/删除乐句
- [ ] VexFlow正确渲染五线谱
- [ ] Tab视图正确显示
- [ ] MIDI播放有声音输出
- [ ] 标签筛选生效
- [ ] 笔记全文搜索生效
- [ ] 搜索结果高亮显示
- [ ] 可生成.exe打包文件
