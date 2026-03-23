import React from 'react'

export function StatusBar({
  currentPhrase,
  totalCount,
  selectedTagCount,
  searchQuery,
}) {
  return (
    <footer className="statusbar">
      <span className="status-item">
        Current: {currentPhrase?.title || 'None'}
      </span>
      <span className="status-item">Total: {totalCount}</span>
      <span className="status-item">Tag filters: {selectedTagCount}</span>
      <span className="status-item">
        Search: {searchQuery.trim() ? searchQuery.trim() : 'Off'}
      </span>
    </footer>
  )
}
