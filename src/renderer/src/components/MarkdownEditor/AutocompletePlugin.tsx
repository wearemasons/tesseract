import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  $getSelection,
  $isRangeSelection,
  $createTextNode
} from 'lexical'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useAtom } from 'jotai'
import { autocompleteEnabledAtom } from '@renderer/store'
import { $createAutocompleteNode, $isAutocompleteNode } from './AutocompleteNode'

export const AutocompletePlugin = () => {
  const [editor] = useLexicalComposerContext()
  const [suggestion, setSuggestion] = useState<string | null>(null)
  const [autocompleteEnabled, setAutocompleteEnabled] = useAtom(autocompleteEnabledAtom)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const ghostNodeKey = useRef<string | null>(null)
  const isFetchingRef = useRef(false)

  const flashEditor = useCallback(() => {
    const root = editor.getRootElement()
    if (!root) return
    root.classList.add('autocomplete-flash')
    setTimeout(() => root.classList.remove('autocomplete-flash'), 350)
  }, [editor])

  const toggleAutocomplete = useCallback(() => {
    setAutocompleteEnabled((prev) => !prev)
    flashEditor()
  }, [setAutocompleteEnabled, flashEditor])

  const clearSuggestion = useCallback(() => {
    if (ghostNodeKey.current) {
      const key = ghostNodeKey.current
      ghostNodeKey.current = null
      editor.update(() => {
        const node = editor.getEditorState()._nodeMap.get(key)
        if (node && $isAutocompleteNode(node)) {
          node.remove()
        }
      })
    }
    setSuggestion(null)
  }, [editor])

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState, tags }) => {
      if (tags.has('autocomplete')) return

      editorState.read(() => {
        const selection = $getSelection()
        if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
          clearSuggestion()
          return
        }

        const nodes = selection.getNodes()
        if (nodes.some($isAutocompleteNode)) return

        if (ghostNodeKey.current) {
          clearSuggestion()
        }

        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        if (!autocompleteEnabled) return
        timeoutRef.current = setTimeout(() => {
          triggerAutocomplete()
        }, 1200)
      })
    })
  }, [editor, clearSuggestion, autocompleteEnabled])

  useEffect(() => {
    const root = editor.getRootElement()
    if (!root) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Tab' && suggestion && ghostNodeKey.current) {
        e.preventDefault()
        e.stopPropagation()
        commitSuggestion()
        return
      }
      if (e.ctrlKey && e.key === ' ' && suggestion && ghostNodeKey.current) {
        e.preventDefault()
        e.stopPropagation()
        commitSuggestion()
      }
    }
    root.addEventListener('keydown', handler)
    return () => root.removeEventListener('keydown', handler)
  }, [editor, suggestion])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'a') {
        e.preventDefault()
        toggleAutocomplete()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [toggleAutocomplete])

  useEffect(() => {
    if (!autocompleteEnabled) {
      clearSuggestion()
    }
  }, [autocompleteEnabled, clearSuggestion])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const triggerAutocomplete = async () => {
    if (isFetchingRef.current || !autocompleteEnabled) return
    isFetchingRef.current = true

    try {
      let textBefore = ''
      editor.getEditorState().read(() => {
        const selection = $getSelection()
        if (!$isRangeSelection(selection)) return
        textBefore = selection.anchor.getNode().getTextContent().slice(0, selection.anchor.offset)
      })

      if (textBefore.length < 5) return

      const completion = await window.context.generateAutocomplete(textBefore)
      if (completion && completion.trim()) {
        setSuggestion(completion)
        editor.update(
          () => {
            const selection = $getSelection()
            if (!$isRangeSelection(selection) || !selection.isCollapsed()) return

            const ghostNode = $createAutocompleteNode(completion)
            selection.insertNodes([ghostNode])
            ghostNodeKey.current = ghostNode.getKey()
          },
          { tag: 'autocomplete' }
        )
      }
    } catch (error) {
      console.error('Autocomplete error:', error)
    } finally {
      isFetchingRef.current = false
    }
  }

  const commitSuggestion = () => {
    editor.update(
      () => {
        if (!ghostNodeKey.current || !suggestion) return

        const node = editor.getEditorState()._nodeMap.get(ghostNodeKey.current)
        if (node && $isAutocompleteNode(node)) {
          const textNode = $createTextNode(suggestion)
          node.replace(textNode)
          textNode.selectEnd()
        }
      },
      { tag: 'autocomplete' }
    )
    setSuggestion(null)
    ghostNodeKey.current = null
  }

  return null
}
