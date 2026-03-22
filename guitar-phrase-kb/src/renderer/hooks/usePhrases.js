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
