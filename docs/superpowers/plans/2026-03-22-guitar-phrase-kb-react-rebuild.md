# 吉他乐句知识库 - React 重构计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将吉他乐句知识库前端从 Vanilla JS 重构为 React，并使用 Pencil 设计工具生成符合 Material Design 3 风格的界面代码。

**Architecture:**
- 保持 Electron + Vite 技术栈
- 新增 React 18 作为前端框架
- 使用 Pencil 设计工具创建新的 UI 设计并生成 React 代码
- 保留现有的后端 API（database.js, main.js, preload.js）
- VexFlow 和 MIDI player 封装为 React Hooks/Components

**Tech Stack:** React 18, Vite, Electron, VexFlow, sql.js, Pencil (design tool)

---

## 文件结构

### 新增文件

```
guitar-phrase-kb/
├── src/renderer/
│   ├── components/           # React 组件
│   │   ├── App.jsx
│   │   ├── Toolbar.jsx
│   │   ├── Sidebar.jsx
│   │   ├── PhraseList.jsx
│   │   ├── PhraseDetail.jsx
│   │   ├── PhraseEditor.jsx  # Pencil 生成
│   │   ├── TagFilter.jsx
│   │   ├── StatusBar.jsx
│   │   └── icons/           # SVG icons
│   ├── hooks/
│   │   ├── usePhrases.js
│   │   ├── useTags.js
│   │   ├── useVexFlow.js
│   │   └── useMidiPlayer.js
│   └── styles/
│       └── index.css         # Material Design 3 变量
├── pencil_files/
│   ├── app.pen               # 新设计 - 主界面
│   └── editor.pen            # 新设计 - 编辑器
```

### 修改文件

```
guitar-phrase-kb/
├── package.json              # 添加 React 依赖
├── vite.config.js            # 配置 React 插件
├── src/renderer/
│   ├── index.html            # 更新为 React root
│   ├── scripts/renderer.js   # 替换为 React 入口
│   └── styles/main.css       # 替换为新样式
├── src/main/main.js          # 保持不变
├── src/main/database.js      # 保持不变
└── src/preload/preload.js    # 保持不变
```

---

## 任务分解

### Task 1: 初始化 React 环境

**Files:**
- Modify: `package.json`
- Modify: `vite.config.js`
- Create: `src/renderer/index.html` (React root)

- [ ] **Step 1: 添加 React 依赖**

```bash
cd guitar-phrase-kb
npm install react@18 react-dom@18 @vitejs/plugin-react
```

- [ ] **Step 2: 配置 Vite 支持 React**

```javascript
// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // ... existing config
})
```

- [ ] **Step 3: 更新 index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>吉他乐句知识库</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/renderer/main.jsx"></script>
</body>
</html>
```

- [ ] **Step 4: 创建 React 入口文件**

```jsx
// src/renderer/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './components/App'
import './styles/index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

- [ ] **Step 5: 创建基础 CSS 变量文件**

```css
/* src/renderer/styles/index.css */
:root {
  /* Material Design 3 Colors - Purple Theme */
  --md-primary: #6750A4;
  --md-on-primary: #FFFFFF;
  --md-primary-container: #EADDFF;
  --md-on-primary-container: #21005D;

  --md-secondary: #625B71;
  --md-secondary-container: #E8DEF8;
  --md-on-secondary-container: #1D192B;

  --md-surface: #FFFBFE;
  --md-surface-variant: #E7E0EC;
  --md-on-surface: #1C1B1F;
  --md-on-surface-variant: #49454F;

  --md-background: #FEF7FF;
  --md-on-background: #1C1B1F;

  --md-outline: #79747E;
  --md-outline-variant: #CAC4D0;

  /* Spacing */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;

  /* Border Radius */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 28px;
}

* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Segoe UI', sans-serif; background: var(--md-background); color: var(--md-on-surface); }
```

- [ ] **Step 6: 验证 React 环境**

Run: `cd guitar-phrase-kb && npm run dev:vite`
Expected: Vite dev server starts without errors

- [ ] **Step 7: 提交**

```bash
git add package.json vite.config.js src/renderer/index.html src/renderer/main.jsx src/renderer/styles/
git commit -m "feat: add React 18 and Vite configuration"
```

---

### Task 2: 在 Pencil 中设计新的应用界面

**Files:**
- Create: `pencil_files/app.pen` (新设计)
- Create: `pencil_files/editor.pen` (新设计)

**基于现有 spec 的布局要求：**

```
┌────────────────────────────────────────────────────────────┐
│  Toolbar (64px) - 播放控制 | BPM | 搜索 | 新建按钮          │
├──────────────┬─────────────────────────────────────────────┤
│              │                                              │
│  Sidebar     │  PhraseDetail (主内容区)                     │
│  (280px)     │                                              │
│              │  ┌────────────────────────────────────────┐  │
│  标签筛选     │  │  五线谱 + Tab 展示                    │  │
│  ─────────   │  └────────────────────────────────────────┘  │
│  乐句列表     │  ┌────────────────────────────────────────┐  │
│              │  │  分析笔记                              │  │
│              │  └────────────────────────────────────────┘  │
├──────────────┴─────────────────────────────────────────────┤
│  StatusBar (32px) - 当前乐句 | 总数 | 筛选状态               │
└────────────────────────────────────────────────────────────┘
```

- [ ] **Step 1: 获取 Pencil design system 组件列表**

Use: `get_editor_state` to understand available components

- [ ] **Step 2: 创建 app.pen 主界面设计**

使用 batch_design 创建设计，包含：
- Toolbar (64px): Logo + 播放控制按钮 + BPM 输入 + 搜索框 + 新建按钮
- Sidebar (280px): TagFilter 区域 + PhraseList 区域
- MainContent (flex-1): PhraseDetail 展示区
- StatusBar (32px): 状态信息

Design tokens to use:
- Primary: `#6750A4`
- Surface: `#FFFBFE`, `#FEF7FF`
- Surface Variant: `#E7E0EC`, `#F3EDF7`
- On Surface: `#1C1B1F`
- Corner radius: 8px (sm), 12px (md), 16px (lg), 28px (xl)

- [ ] **Step 3: 创建 editor.pen 编辑界面设计**

Modal 编辑器布局：
- Header: 标题 "编辑乐句" / "新建乐句" + 关闭按钮
- Body:
  - Left: 标题输入 + MusicXML 编辑器 + 标签选择 + 添加标签输入框
  - Right: 笔记输入 + 实时预览 (VexFlow)
- Footer: 取消 + 保存按钮

- [ ] **Step 4: 验证设计截图**

Use: `get_screenshot` 验证两个设计

- [ ] **Step 5: 提交设计**

```bash
git add pencil_files/app.pen pencil_files/editor.pen
git commit -m "design: add new UI designs for app and editor"
```

---

### Task 3: 从 Pencil 生成 React 组件

**Files:**
- Create: `src/renderer/components/App.jsx`
- Create: `src/renderer/components/Toolbar.jsx`
- Create: `src/renderer/components/Sidebar.jsx`
- Create: `src/renderer/components/PhraseList.jsx`
- Create: `src/renderer/components/PhraseDetail.jsx`
- Create: `src/renderer/components/PhraseEditor.jsx`
- Create: `src/renderer/components/TagFilter.jsx`
- Create: `src/renderer/components/StatusBar.jsx`

- [ ] **Step 1: 提取 App 组件设计**

Use: `batch_get` with `readDepth: 10` 获取 app.pen 完整结构

- [ ] **Step 2: 生成 Toolbar 组件**

基于 Pencil 设计的 Toolbar 区域：
- PlayButton (播放/暂停)
- StopButton (停止)
- BpmInput (BPM 输入)
- SearchInput (搜索框)
- NewButton (新建)

```jsx
// src/renderer/components/Toolbar.jsx
export function Toolbar({ onPlay, onStop, onNew, bpm, onBpmChange, searchQuery, onSearchChange }) {
  return (
    <header className="toolbar">
      <div className="toolbar-brand">
        <div className="logo-icon" />
        <span className="app-title">吉他乐句</span>
      </div>
      <div className="toolbar-controls">
        <button className="play-btn" onClick={onPlay}>▶</button>
        <button className="stop-btn" onClick={onStop}>⏹</button>
        <div className="bpm-control">
          <span>BPM:</span>
          <input type="number" value={bpm} onChange={onBpmChange} min="20" max="300" />
        </div>
      </div>
      <div className="toolbar-search">
        <input type="text" placeholder="搜索笔记..." value={searchQuery} onChange={onSearchChange} />
      </div>
      <button className="new-btn" onClick={onNew}>+ 新建</button>
    </header>
  )
}
```

- [ ] **Step 3: 生成 Sidebar 组件**

包含 TagFilter 和 PhraseList

```jsx
// src/renderer/components/Sidebar.jsx
export function Sidebar({ tags, selectedTags, phrases, currentPhrase, onTagToggle, onPhraseSelect }) {
  return (
    <aside className="sidebar">
      <TagFilter tags={tags} selectedTags={selectedTags} onToggle={onTagToggle} />
      <PhraseList phrases={phrases} currentPhrase={currentPhrase} onSelect={onPhraseSelect} />
    </aside>
  )
}
```

- [ ] **Step 4: 生成 TagFilter 组件**

```jsx
// src/renderer/components/TagFilter.jsx
export function TagFilter({ tags, selectedTags, onToggle, onAddTag }) {
  return (
    <div className="tag-filter">
      <div className="tag-list">
        {tags.map(tag => (
          <span
            key={tag.id}
            className={`tag ${tag.type} ${selectedTags.includes(tag.id) ? 'active' : ''}`}
            onClick={() => onToggle(tag.id)}
          >
            {tag.name}
          </span>
        ))}
        <input
          type="text"
          className="tag-add-input"
          placeholder="+ 添加"
          onKeyPress={(e) => e.key === 'Enter' && onAddTag(e.target.value)}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 5: 生成 PhraseList 组件**

```jsx
// src/renderer/components/PhraseList.jsx
export function PhraseList({ phrases, currentPhrase, onSelect }) {
  return (
    <div className="phrase-list">
      {phrases.map(phrase => (
        <div
          key={phrase.id}
          className={`phrase-item ${currentPhrase?.id === phrase.id ? 'active' : ''}`}
          onClick={() => onSelect(phrase)}
        >
          <div className="phrase-title">{phrase.title}</div>
          <div className="phrase-meta">{new Date(phrase.updated_at).toLocaleDateString()}</div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 6: 生成 PhraseDetail 组件**

```jsx
// src/renderer/components/PhraseDetail.jsx
export function PhraseDetail({ phrase, vexflowRef }) {
  if (!phrase) {
    return (
      <div className="phrase-detail empty">
        <div className="empty-state">选择或创建一个乐句开始</div>
      </div>
    )
  }

  return (
    <div className="phrase-detail">
      <h1 className="detail-title">{phrase.title}</h1>
      <div className="detail-tags">
        {phrase.tags?.map(tag => (
          <span key={tag.id} className={`tag ${tag.type}`}>{tag.name}</span>
        ))}
      </div>
      <div className="vexflow-container" ref={vexflowRef} />
      <div className="note-section">
        <h3>分析笔记</h3>
        <div className="note-content">{phrase.note || '暂无笔记'}</div>
      </div>
    </div>
  )
}
```

- [ ] **Step 7: 生成 PhraseEditor 组件 (Modal)**

基于 editor.pen 设计

```jsx
// src/renderer/components/PhraseEditor.jsx
export function PhraseEditor({ phrase, tags, isOpen, onClose, onSave, onPreview }) {
  if (!isOpen) return null

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{phrase ? '编辑乐句' : '新建乐句'}</h2>
          <button onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <div className="editor-left">
            <div className="field">
              <label>标题</label>
              <input id="editor-title" type="text" defaultValue={phrase?.title} />
            </div>
            <div className="field">
              <label>MusicXML</label>
              <textarea id="editor-musicxml" defaultValue={phrase?.music_xml} />
            </div>
            <div className="field">
              <label>标签</label>
              <div className="tag-list">
                {tags.map(tag => (
                  <span key={tag.id} className={`tag ${tag.type}`} data-tag-id={tag.id}>
                    {tag.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="editor-right">
            <div className="field">
              <label>笔记</label>
              <textarea id="editor-note" defaultValue={phrase?.note} />
            </div>
            <div className="editor-preview">
              <div className="preview-placeholder">预览区域</div>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>取消</button>
          <button className="btn-primary" onClick={onSave}>保存</button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 8: 生成 StatusBar 组件**

```jsx
// src/renderer/components/StatusBar.jsx
export function StatusBar({ currentPhrase, totalCount, selectedTagCount }) {
  return (
    <footer className="statusbar">
      <span>当前乐句: {currentPhrase?.title || '无'}</span>
      <span>共 {totalCount} 条乐句</span>
      {selectedTagCount > 0 && <span>筛选标签: {selectedTagCount}个</span>}
    </footer>
  )
}
```

- [ ] **Step 9: 生成 App 主组件**

```jsx
// src/renderer/components/App.jsx
import { useState, useEffect, useRef } from 'react'
import { Toolbar } from './Toolbar'
import { Sidebar } from './Sidebar'
import { PhraseDetail } from './PhraseDetail'
import { PhraseEditor } from './PhraseEditor'
import { StatusBar } from './StatusBar'
import { usePhrases } from '../hooks/usePhrases'
import { useTags } from '../hooks/useTags'
import { useVexFlow } from '../hooks/useVexFlow'
import { useMidiPlayer } from '../hooks/useMidiPlayer'

export default function App() {
  const { phrases, currentPhrase, loading, loadPhrases, createPhrase, updatePhrase, deletePhrase, selectPhrase } = usePhrases()
  const { tags, loadTags, createTag } = useTags()
  const { renderNote } = useVexFlow()
  const { play, stop, isPlaying } = useMidiPlayer()

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTags, setSelectedTags] = useState([])
  const [bpm, setBpm] = useState(120)
  const [editorOpen, setEditorOpen] = useState(false)
  const vexflowRef = useRef(null)

  useEffect(() => {
    loadPhrases()
    loadTags()
  }, [])

  useEffect(() => {
    if (currentPhrase && vexflowRef.current) {
      renderNote(currentPhrase.music_xml, vexflowRef.current)
    }
  }, [currentPhrase, renderNote])

  const handlePlay = () => {
    if (!currentPhrase) return
    if (isPlaying) {
      stop()
    } else {
      play(currentPhrase.music_xml, bpm)
    }
  }

  const handleSave = async (data) => {
    if (data.id) {
      await updatePhrase(data.id, data)
    } else {
      await createPhrase(data)
    }
    setEditorOpen(false)
    await loadPhrases()
  }

  const handleAddTag = async (name) => {
    await createTag(name, 'custom')
    await loadTags()
  }

  return (
    <div className="app">
      <Toolbar
        onPlay={handlePlay}
        onStop={stop}
        onNew={() => setEditorOpen(true)}
        bpm={bpm}
        onBpmChange={setBpm}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      <div className="main-container">
        <Sidebar
          tags={tags}
          selectedTags={selectedTags}
          phrases={phrases}
          currentPhrase={currentPhrase}
          onTagToggle={(id) => setSelectedTags(prev =>
            prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
          )}
          onPhraseSelect={selectPhrase}
        />
        <PhraseDetail phrase={currentPhrase} vexflowRef={vexflowRef} />
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
      />
    </div>
  )
}
```

- [ ] **Step 10: 提交**

```bash
git add src/renderer/components/ src/renderer/hooks/
git commit -m "feat: add React components for main app UI"
```

---

### Task 4: 创建 React Hooks 封装业务逻辑

**Files:**
- Create: `src/renderer/hooks/usePhrases.js`
- Create: `src/renderer/hooks/useTags.js`
- Create: `src/renderer/hooks/useVexFlow.js`
- Create: `src/renderer/hooks/useMidiPlayer.js`

- [ ] **Step 1: 创建 usePhrases Hook**

```javascript
// src/renderer/hooks/usePhrases.js
import { useState, useCallback } from 'react'

export function usePhrases() {
  const [phrases, setPhrases] = useState([])
  const [currentPhrase, setCurrentPhrase] = useState(null)
  const [loading, setLoading] = useState(false)

  const loadPhrases = useCallback(async (filter = {}) => {
    setLoading(true)
    try {
      const result = await window.electronAPI.getPhrases(filter)
      setPhrases(result)
    } finally {
      setLoading(false)
    }
  }, [])

  const createPhrase = useCallback(async (data) => {
    await window.electronAPI.createPhrase(data)
  }, [])

  const updatePhrase = useCallback(async (id, data) => {
    await window.electronAPI.updatePhrase(id, data)
  }, [])

  const deletePhrase = useCallback(async (id) => {
    await window.electronAPI.deletePhrase(id)
  }, [])

  const selectPhrase = useCallback(async (phrase) => {
    const fullPhrase = await window.electronAPI.getPhrase(phrase.id)
    setCurrentPhrase(fullPhrase)
  }, [])

  return {
    phrases,
    currentPhrase,
    loading,
    loadPhrases,
    createPhrase,
    updatePhrase,
    deletePhrase,
    selectPhrase,
  }
}
```

- [ ] **Step 2: 创建 useTags Hook**

```javascript
// src/renderer/hooks/useTags.js
import { useState, useCallback } from 'react'

export function useTags() {
  const [tags, setTags] = useState([])

  const loadTags = useCallback(async () => {
    const result = await window.electronAPI.getTags()
    setTags(result)
  }, [])

  const createTag = useCallback(async (name, type) => {
    await window.electronAPI.createTag(name, type)
  }, [])

  return { tags, loadTags, createTag }
}
```

- [ ] **Step 3: 创建 useVexFlow Hook**

```javascript
// src/renderer/hooks/useVexFlow.js
import { useCallback, useRef } from 'react'
import { Renderer, Stave, Voice, Formatter } from 'vexflow'

export function useVexFlow() {
  const rendererRef = useRef(null)

  const renderNote = useCallback((musicXml, container) => {
    // Clear previous content
    container.innerHTML = ''

    if (!musicXml) return

    // Parse MusicXML and render with VexFlow
    // This is a simplified example - full implementation needs MusicXML parsing
    try {
      const renderer = new Renderer(container, Renderer.Backends.SVG)
      renderer.resize(800, 200)
      const context = renderer.getContext()

      const stave = new Stave(0, 40, 800)
      stave.addClef('treble').addTimeSign('4/4')
      stave.setContext(context).draw()

      // Add notes... (MusicXML parsing logic needed here)
    } catch (err) {
      container.innerHTML = `<div style="color:red">解析错误: ${err.message}</div>`
    }
  }, [])

  return { renderNote }
}
```

- [ ] **Step 4: 创建 useMidiPlayer Hook**

```javascript
// src/renderer/hooks/useMidiPlayer.js
import { useState, useCallback, useRef, useEffect } from 'react'

export function useMidiPlayer() {
  const [isPlaying, setIsPlaying] = useState(false)
  const playerRef = useRef(null)

  useEffect(() => {
    // Initialize MIDI player
    const initMidi = async () => {
      // MIDI initialization logic using soundfont-player
    }
    initMidi()

    return () => {
      if (playerRef.current) {
        playerRef.current.stop()
      }
    }
  }, [])

  const play = useCallback((musicXml, bpm) => {
    // Parse MusicXML and play with MIDI
    setIsPlaying(true)
  }, [])

  const stop = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.stop()
    }
    setIsPlaying(false)
  }, [])

  return { play, stop, isPlaying }
}
```

- [ ] **Step 5: 提交**

```bash
git add src/renderer/hooks/
git commit -m "feat: add React hooks for business logic"
```

---

### Task 5: 添加样式

**Files:**
- Modify: `src/renderer/styles/index.css`

- [ ] **Step 1: 添加完整样式**

```css
/* App Layout */
.app { display: flex; flex-direction: column; height: 100vh; }
.main-container { display: flex; flex: 1; overflow: hidden; }

/* Toolbar */
.toolbar {
  height: 64px;
  background: var(--md-surface);
  border-bottom: 1px solid var(--md-outline-variant);
  display: flex;
  align-items: center;
  padding: 0 var(--space-4);
  gap: var(--space-4);
}
.toolbar-brand { display: flex; align-items: center; gap: var(--space-3); }
.logo-icon { width: 40px; height: 40px; background: var(--md-primary); border-radius: 20px; }
.app-title { font-size: 18px; font-weight: 500; }
.toolbar-controls { display: flex; align-items: center; gap: var(--space-2); }
.play-btn, .stop-btn {
  width: 36px; height: 36px;
  border: none; border-radius: 50%;
  background: var(--md-primary); color: white;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
}
.play-btn:hover, .stop-btn:hover { background: var(--md-primary-container); }
.bpm-control { display: flex; align-items: center; gap: var(--space-1); font-size: 13px; }
.bpm-control input { width: 50px; padding: var(--space-1); text-align: center; border: 1px solid var(--md-outline); border-radius: var(--radius-sm); background: var(--md-surface-variant); }
.toolbar-search { flex: 1; max-width: 300px; }
.toolbar-search input { width: 100%; padding: var(--space-2) var(--space-3); border: 1px solid var(--md-outline); border-radius: var(--radius-lg); background: var(--md-surface-variant); }
.new-btn { padding: var(--space-2) var(--space-4); border: none; border-radius: var(--radius-md); background: var(--md-primary); color: var(--md-on-primary); cursor: pointer; font-weight: 500; }

/* Sidebar */
.sidebar { width: 280px; background: var(--md-surface); border-right: 1px solid var(--md-outline-variant); display: flex; flex-direction: column; overflow: hidden; }
.sidebar-section { padding: var(--space-4); border-bottom: 1px solid var(--md-outline-variant); }
.sidebar-title { font-size: 11px; text-transform: uppercase; color: var(--md-on-surface-variant); margin-bottom: var(--space-2); letter-spacing: 0.5px; }

/* Tag Filter */
.tag-list { display: flex; flex-wrap: wrap; gap: var(--space-1); }
.tag {
  display: inline-block; padding: var(--space-1) var(--space-2);
  background: var(--md-surface-variant); border-radius: var(--radius-sm);
  font-size: 12px; cursor: pointer; transition: background 0.2s;
}
.tag:hover { background: var(--md-outline-variant); }
.tag.active { background: var(--md-primary); color: var(--md-on-primary); }
.tag.preset { border-left: 3px solid var(--md-primary); }
.tag.custom { border-left: 3px solid #4a9eff; }
.tag-add-input {
  background: transparent; border: 1px dashed var(--md-outline);
  border-radius: var(--radius-sm); padding: var(--space-1) var(--space-2);
  font-size: 12px; width: 70px; outline: none;
}
.tag-add-input:focus { border-color: var(--md-primary); }

/* Phrase List */
.phrase-list { flex: 1; overflow-y: auto; }
.phrase-item { padding: var(--space-3) var(--space-4); border-bottom: 1px solid var(--md-outline-variant); cursor: pointer; transition: background 0.2s; }
.phrase-item:hover { background: var(--md-surface-variant); }
.phrase-item.active { background: var(--md-surface-variant); border-left: 3px solid var(--md-primary); }
.phrase-title { font-size: 14px; margin-bottom: var(--space-1); }
.phrase-meta { font-size: 11px; color: var(--md-on-surface-variant); }

/* Phrase Detail */
#content { flex: 1; padding: var(--space-5); overflow-y: auto; background: var(--md-background); }
.phrase-detail { max-width: 900px; margin: 0 auto; }
.phrase-detail.empty { display: flex; align-items: center; justify-content: center; height: 100%; }
.empty-state { text-align: center; padding: 60px; color: var(--md-on-surface-variant); }
.detail-title { font-size: 24px; margin-bottom: var(--space-4); }
.detail-tags { margin-bottom: var(--space-4); display: flex; gap: var(--space-2); flex-wrap: wrap; }

/* VexFlow Container */
.vexflow-container { background: white; border-radius: var(--radius-lg); padding: var(--space-4); margin-bottom: var(--space-5); }
.vexflow-container svg { width: 100%; height: auto; }

/* Note Section */
.note-section { background: var(--md-surface); border-radius: var(--radius-lg); padding: var(--space-4); }
.note-section h3 { font-size: 14px; color: var(--md-on-surface-variant); margin-bottom: var(--space-2); }
.note-content { font-size: 14px; line-height: 1.6; white-space: pre-wrap; }

/* StatusBar */
.statusbar {
  height: 32px; background: var(--md-surface-variant);
  border-top: 1px solid var(--md-outline-variant);
  display: flex; align-items: center; padding: 0 var(--space-4);
  font-size: 12px; color: var(--md-on-surface-variant); gap: var(--space-4);
}

/* Modal */
.modal-overlay {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;
}
.modal-content {
  background: var(--md-surface); border-radius: var(--radius-xl);
  width: 95%; max-width: 1000px; max-height: 90vh; overflow: auto; padding: var(--space-5);
}
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-5); }
.modal-header h2 { font-size: 18px; font-weight: 600; }
.modal-close { background: none; border: none; font-size: 24px; cursor: pointer; color: var(--md-on-surface-variant); }
.modal-body { display: flex; gap: var(--space-5); }
.editor-left, .editor-right { flex: 1; }
.editor-field { margin-bottom: var(--space-4); }
.editor-field label { display: block; font-size: 12px; color: var(--md-on-surface-variant); margin-bottom: var(--space-1); }
.editor-field input, .editor-field textarea { width: 100%; padding: var(--space-2) var(--space-3); border: 1px solid var(--md-outline); border-radius: var(--radius-md); background: var(--md-surface-variant); }
.editor-field textarea { height: 150px; font-family: 'Consolas', monospace; resize: vertical; }
.editor-preview { background: white; border-radius: var(--radius-md); padding: var(--space-4); min-height: 150px; }
.modal-footer { display: flex; justify-content: flex-end; gap: var(--space-2); margin-top: var(--space-5); }
.btn-primary { padding: var(--space-2) var(--space-4); border: none; border-radius: var(--radius-md); background: var(--md-primary); color: var(--md-on-primary); cursor: pointer; font-weight: 500; }
.btn-secondary { padding: var(--space-2) var(--space-4); border: 1px solid var(--md-outline); border-radius: var(--radius-md); background: transparent; color: var(--md-on-surface); cursor: pointer; }

/* Highlight */
.highlight { background: yellow; color: #000; padding: 0 2px; border-radius: 2px; }
```

- [ ] **Step 2: 提交**

```bash
git add src/renderer/styles/index.css
git commit -m "style: add Material Design 3 styling"
```

---

### Task 6: 集成测试

**Files:**
- Test: `npm run dev`

- [ ] **Step 1: 启动开发服务器**

Run: `cd guitar-phrase-kb && npm run dev`
Expected: Vite + React dev server starts on localhost:5173

- [ ] **Step 2: 验证界面渲染**

- 检查 Toolbar 是否正确显示
- 检查 Sidebar 是否显示标签和乐句列表
- 检查空状态是否正常

- [ ] **Step 3: 测试创建乐句**

1. 点击 "+ 新建" 按钮
2. 填写标题和 MusicXML
3. 选择标签
4. 点击保存
5. 验证乐句出现在列表中

- [ ] **Step 4: 测试播放功能**

1. 选择一个乐句
2. 调整 BPM
3. 点击播放按钮
4. 验证 MIDI 播放

- [ ] **Step 5: 测试标签筛选**

1. 点击标签筛选
2. 验证乐句列表更新

- [ ] **Step 6: 测试搜索**

1. 在搜索框输入关键词
2. 验证乐句列表过滤

- [ ] **Step 7: 提交最终版本**

```bash
git add -A
git commit -m "feat: complete React UI rebuild with Pencil design"
```

---

## 验收标准

| 功能 | 验收条件 |
|------|----------|
| React 环境 | Vite dev server 正常启动，无编译错误 |
| 界面布局 | Toolbar, Sidebar, Content, StatusBar 正确显示 |
| 乐句 CRUD | 可创建、编辑、删除乐句 |
| 标签管理 | 可添加自定义标签，标签筛选生效 |
| 乐谱展示 | VexFlow 正确渲染 MusicXML |
| MIDI 播放 | 点击播放可听到旋律 |
| 搜索 | 输入关键词可检索笔记内容 |
| 编辑器 | Modal 编辑器正常打开/关闭/保存 |

---

## 依赖清单

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "vexflow": "^4.2.3",
    "soundfont-player": "^0.12.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.0",
    "vite": "^5.0.10"
  }
}
```
