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
    try {
      console.log('App initializing...');
      this.midiPlayer = new MidiPlayer();
      await this.midiPlayer.init();
      console.log('MIDI player initialized');

      this.setupEventListeners();
      await this.loadData();
      console.log('Data loaded');
      this.render();
      console.log('App rendered');
    } catch (error) {
      console.error('App init error:', error);
      document.getElementById('content').innerHTML = `
        <div style="color:red;padding:20px">
          <h2>初始化错误</h2>
          <p>${error.message}</p>
          <pre>${error.stack}</pre>
        </div>
      `;
    }
  }

  async loadData() {
    this.phrases = await window.electronAPI.getPhrases();
    this.tags = await window.electronAPI.getTags();
  }

  async createCustomTag(name) {
    if (!name || !name.trim()) return;
    const trimmedName = name.trim();
    // Check if tag already exists
    if (this.tags.some(t => t.name.toLowerCase() === trimmedName.toLowerCase())) {
      return;
    }
    await window.electronAPI.createTag(trimmedName, 'custom');
    await this.loadData();
    this.renderTagFilter();
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
    // BPM is now only used for playback, not stored with phrase
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
      const bpmInput = document.getElementById('bpm-input');
      const bpm = parseInt(bpmInput?.value) || 120;
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
    const selectedTags = Array.from(document.querySelectorAll('#editor-tags .tag.active')).map(el => el.dataset.tagId);

    const data = { title, musicXml, note, tagIds: selectedTags };

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
        <input type="number" class="bpm-input" id="bpm-input" value="120" min="20" max="300">
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
    `).join('') + `
      <span class="tag-add-wrapper">
        <input type="text" class="tag-add-input" id="tag-add-input" placeholder="+ 添加标签" onkeypress="app.handleTagAddKeypress(event)">
      </span>
    `;
  }

  handleTagAddKeypress(event) {
    if (event.key === 'Enter') {
      const input = event.target;
      const name = input.value;
      if (name.trim()) {
        this.createCustomTag(name);
        input.value = '';
      }
    }
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
