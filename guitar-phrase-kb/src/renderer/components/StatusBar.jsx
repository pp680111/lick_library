import React from 'react'

export function StatusBar({ currentPhrase, totalCount, selectedTagCount }) {
  return (
    <footer className="statusbar">
      <span className="status-item">
        当前乐句: {currentPhrase?.title || '无'}
      </span>
      <span className="status-item">共 {totalCount} 条乐句</span>
      {selectedTagCount > 0 && (
        <span className="status-item">筛选标签: {selectedTagCount}个</span>
      )}
    </footer>
  )
}
