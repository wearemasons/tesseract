import { useRef } from 'react'
import { useAtomValue, useSetAtom } from 'jotai'
import { MDXEditorMethods } from '@mdxeditor/editor'
import { throttle } from 'lodash'
import { selectedNoteAtom, saveNoteAtom } from '@/store'
import { autoSavingTime } from '@shared/constants'

export function useMarkdownEditor() {
  const selectedNote = useAtomValue(selectedNoteAtom)
  const saveNote = useSetAtom(saveNoteAtom)
  const editorRef = useRef<MDXEditorMethods | null>(null)

  const throttledSave = useRef(
    throttle(
      (content: string) => {
        saveNote(content)
      },
      autoSavingTime,
      { leading: false, trailing: true }
    )
  ).current

  const handleAutoSaving = (content: string) => {
    throttledSave(content)
  }

  const handleBlur = () => {
    throttledSave.cancel()
    const content = editorRef.current?.getMarkdown()
    if (content != null) {
      saveNote(content)
    }
  }

  return { selectedNote, editorRef, handleAutoSaving, handleBlur }
}
