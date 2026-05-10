import {
  MDXEditor,
  headingsPlugin,
  listsPlugin,
  markdownShortcutPlugin,
  quotePlugin,
  linkPlugin,
  linkDialogPlugin,
  imagePlugin,
  tablePlugin,
  thematicBreakPlugin,
  frontmatterPlugin,
  codeBlockPlugin,
  codeMirrorPlugin,
  directivesPlugin,
  diffSourcePlugin
} from '@mdxeditor/editor'
import { useEffect } from 'react'
import { useMarkdownEditor } from '@/hooks/useMarkdownEditor'
import { autocompleteMDXPlugin } from './MarkdownEditor/AutocompleteMDXPlugin'
import { useAtomValue } from 'jotai'
import { fontSizeAtom } from '@renderer/store'

export const MarkdownEditor = ({ className }: { className?: string }) => {
  const { selectedNote, editorRef, handleAutoSaving, handleBlur } = useMarkdownEditor()
  const fontSize = useAtomValue(fontSizeAtom)

  useEffect(() => {
    const id = 'editor-font-size-style'
    let style = document.getElementById(id) as HTMLStyleElement | null
    if (!style) {
      style = document.createElement('style')
      style.id = id
      document.head.appendChild(style)
    }
    style.textContent = `[contenteditable="true"] { font-size: ${fontSize}px !important; }`
    return () => style?.remove()
  }, [fontSize])

  if (!selectedNote) {
    return null
  }

  return (
    <div className="flex-1 flex flex-col">
      <MDXEditor
        ref={editorRef}
        key={selectedNote.title}
        markdown={selectedNote.content}
        onChange={handleAutoSaving}
        onBlur={handleBlur}
        plugins={[
          headingsPlugin(),
          listsPlugin(),
          quotePlugin(),
          linkPlugin(),
          linkDialogPlugin(),
          imagePlugin(),
          tablePlugin(),
          thematicBreakPlugin(),
          frontmatterPlugin(),
          codeBlockPlugin({ defaultCodeBlockLanguage: 'txt' }),
          codeMirrorPlugin({ codeBlockLanguages: { js: 'JavaScript', ts: 'TypeScript', txt: 'Text', css: 'CSS', html: 'HTML', json: 'JSON' } }),
          directivesPlugin({ directiveDescriptors: [] }),
          diffSourcePlugin({ diffMarkdown: 'boo', viewMode: 'rich-text' }),
          markdownShortcutPlugin(),
          autocompleteMDXPlugin()
        ]}
        contentEditableClassName="outline-none min-h-screen max-w-none px-8 py-5 caret-primary prose dark:prose-invert prose-p:my-3 prose-p:leading-relaxed prose-headings:my-4 prose-blockquote:my-4 prose-ul:my-2 prose-li:my-0 prose-code:px-1 prose-code:text-primary prose-code:before:content-[''] prose-code:after:content-['']"
        className={className}
      />
    </div>
  )
}
