import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  $getSelection,
  $isRangeSelection,
  $createTextNode,
  KEY_TAB_COMMAND,
  COMMAND_PRIORITY_CRITICAL
} from 'lexical'
import { useEffect, useRef, useCallback } from 'react'
import { useAtomValue } from 'jotai'
import { autocompleteEnabledAtom } from '@renderer/store'
import { $createAutocompleteNode, $isAutocompleteNode } from './AutocompleteNode'

export const AutocompletePlugin = () => {
  const [editor] = useLexicalComposerContext()
  const suggestionRef = useRef<string | null>(null)
  const autocompleteEnabled = useAtomValue(autocompleteEnabledAtom)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const ghostNodeKey = useRef<string | null>(null)
  const isFetchingRef = useRef(false)

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
    suggestionRef.current = null
  }, [editor])

  const commitSuggestion = useCallback(() => {
    editor.update(
      () => {
        if (!ghostNodeKey.current || !suggestionRef.current) return

        const node = editor.getEditorState()._nodeMap.get(ghostNodeKey.current)
        if (node && $isAutocompleteNode(node)) {
          const textNode = $createTextNode(suggestionRef.current)
          node.replace(textNode)
          textNode.selectEnd()
        }
      },
      { tag: 'autocomplete' }
    )
    suggestionRef.current = null
    ghostNodeKey.current = null
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
        }, 600)
      })
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, clearSuggestion, autocompleteEnabled])

  useEffect(() => {
    return editor.registerCommand(
      KEY_TAB_COMMAND,
      (e: KeyboardEvent) => {
        if (suggestionRef.current && ghostNodeKey.current) {
          e.preventDefault()
          e.stopPropagation()
          commitSuggestion()
          return true
        }
        return false
      },
      COMMAND_PRIORITY_CRITICAL
    )
  }, [editor, commitSuggestion])

  useEffect(() => {
    const root = editor.getRootElement()
    if (!root) return
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === ' ' && suggestionRef.current && ghostNodeKey.current) {
        e.preventDefault()
        e.stopPropagation()
        commitSuggestion()
      }
    }
    root.addEventListener('keydown', handler)
    return () => root.removeEventListener('keydown', handler)
  }, [editor, commitSuggestion])

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
      let contextAbove = ''
      editor.getEditorState().read(() => {
        const selection = $getSelection()
        if (!$isRangeSelection(selection)) return

        const anchorNode = selection.anchor.getNode()
        const anchorOffset = selection.anchor.offset

        const nodeText = anchorNode.getTextContent()
        if (nodeText.length > 0) {
          textBefore = nodeText.slice(0, Math.min(anchorOffset, nodeText.length))
        } else {
          const parent = anchorNode.getParent()
          if (parent) {
            textBefore = parent.getTextContent().slice(0, anchorOffset)
          }
        }

        const block = anchorNode.getParentOrThrow()
        let current = block.getPreviousSibling()
        const contextLines: string[] = []
        while (current && contextLines.length < 10) {
          const text = current.getTextContent()
          if (text) contextLines.unshift(text)
          current = current.getPreviousSibling()
        }
        contextAbove = contextLines.join('\n')
      })

      const fullText = contextAbove ? `${contextAbove}\n${textBefore}` : textBefore

      if (textBefore.trim().length < 3) return

      console.info(
        '[Autocomplete] Context lines:',
        contextAbove.split('\n').length,
        '| Cursor line:',
        textBefore
      )
      const completion = await window.context.generateAutocomplete(fullText)
      if (completion && completion.trim()) {
        console.info('[Autocomplete] Got completion:', completion.substring(0, 80))
        suggestionRef.current = completion
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
      } else {
        console.warn('[Autocomplete] Empty response from API for text:', textBefore)
      }
    } catch (error) {
      console.error('[Autocomplete] Error:', error)
    } finally {
      isFetchingRef.current = false
    }
  }

  return null
}
