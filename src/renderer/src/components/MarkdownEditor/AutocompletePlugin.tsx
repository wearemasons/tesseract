import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  $getSelection,
  $isRangeSelection,
  KEY_TAB_COMMAND,
  COMMAND_PRIORITY_HIGH,
  $createTextNode
} from 'lexical'
import { useEffect, useRef, useState, useCallback } from 'react'
import { $createAutocompleteNode, $isAutocompleteNode, AutocompleteNode } from './AutocompleteNode'

export const AutocompletePlugin = () => {
  const [editor] = useLexicalComposerContext()
  const [suggestion, setSuggestion] = useState<string | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const ghostNodeKey = useRef<string | null>(null)
  const isFetchingRef = useRef(false)

  const clearSuggestion = useCallback(() => {
    if (ghostNodeKey.current) {
      const key = ghostNodeKey.current
      ghostNodeKey.current = null
      editor.update(() => {
        const editorState = editor.getEditorState()
        editorState.read(() => {
          // Find and remove the autocomplete node
          const rootNode = editorState._nodeMap
          // Walk through all nodes to find our ghost node
        })
        // Use the node key to find and remove the node directly
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
      // Don't trigger on our own autocomplete updates
      if (tags.has('autocomplete')) return

      editorState.read(() => {
        const selection = $getSelection()
        if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
          clearSuggestion()
          return
        }

        // Don't trigger if cursor is on an autocomplete node
        const nodes = selection.getNodes()
        if (nodes.some($isAutocompleteNode)) return

        // Clear existing suggestion on any user edit
        if (ghostNodeKey.current) {
          clearSuggestion()
        }

        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        timeoutRef.current = setTimeout(() => {
          triggerAutocomplete()
        }, 1200)
      })
    })
  }, [editor, clearSuggestion])

  useEffect(() => {
    return editor.registerCommand(
      KEY_TAB_COMMAND,
      () => {
        if (suggestion && ghostNodeKey.current) {
          commitSuggestion()
          return true
        }
        return false
      },
      COMMAND_PRIORITY_HIGH
    )
  }, [editor, suggestion])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const triggerAutocomplete = async () => {
    if (isFetchingRef.current) return
    isFetchingRef.current = true

    try {
      // Read the text synchronously from the editor state
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

        // Find the ghost node and replace it with real text
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
