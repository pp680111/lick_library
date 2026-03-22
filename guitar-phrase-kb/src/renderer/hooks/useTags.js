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

  const deleteTag = useCallback(async (id) => {
    await window.electronAPI.deleteTag(id)
  }, [])

  return { tags, loadTags, createTag, deleteTag }
}
