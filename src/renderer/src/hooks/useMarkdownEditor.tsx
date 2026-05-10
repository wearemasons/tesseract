import { useRef, useEffect } from 'react'
import { useAtomValue, useSetAtom } from 'jotai'
import { MDXEditorMethods } from '@mdxeditor/editor'
import { throttle } from 'lodash'
import { selectedNoteAtom, saveNoteAtom, pendingWriteContentAtom } from '@/store'
import { autoSavingTime } from '@shared/constants'

export function useMarkdownEditor() {
  const selectedNote = useAtomValue(selectedNoteAtom)
  const saveNote = useSetAtom(saveNoteAtom)
  const pendingWriteContent = useAtomValue(pendingWriteContentAtom)
  const setPendingWriteContent = useSetAtom(pendingWriteContentAtom)
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

  useEffect(() => {
    if (pendingWriteContent && editorRef.current) {
      editorRef.current.setMarkdown(pendingWriteContent)
      setPendingWriteContent(null)
    }
  }, [pendingWriteContent, setPendingWriteContent])

  return { selectedNote, editorRef, handleAutoSaving, handleBlur }
}
