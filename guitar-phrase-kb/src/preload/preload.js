const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getPhrases: (filter) => ipcRenderer.invoke('db:getPhrases', filter),
  getPhrase: (id) => ipcRenderer.invoke('db:getPhrase', id),
  createPhrase: (data) => ipcRenderer.invoke('db:createPhrase', data),
  updatePhrase: (id, data) => ipcRenderer.invoke('db:updatePhrase', id, data),
  deletePhrase: (id) => ipcRenderer.invoke('db:deletePhrase', id),
  getTags: () => ipcRenderer.invoke('db:getTags'),
  createTag: (name, type) => ipcRenderer.invoke('db:createTag', name, type),
  deleteTag: (id) => ipcRenderer.invoke('db:deleteTag', id),
  searchPhrases: (query) => ipcRenderer.invoke('db:searchPhrases', query),
  getDataPath: () => ipcRenderer.invoke('app:getDataPath'),
});
