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
import { useMarkdownEditor } from '@/hooks/useMarkdownEditor'
import { autocompleteMDXPlugin } from './MarkdownEditor/AutocompleteMDXPlugin'

export const MarkdownEditor = ({ className }: { className?: string }) => {
  const { selectedNote, editorRef, handleAutoSaving, handleBlur } = useMarkdownEditor()

  if (!selectedNote) {
    return null
  }

  return (
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
      contentEditableClassName="outline-none min-h-screen max-w-none text-lg px-8 py-5 caret-primary prose dark:prose-invert prose-p:my-3 prose-p:leading-relaxed prose-headings:my-4 prose-blockquote:my-4 prose-ul:my-2 prose-li:my-0 prose-code:px-1 prose-code:text-primary prose-code:before:content-[''] prose-code:after:content-['']"
      className={className}
    />
  )
}
