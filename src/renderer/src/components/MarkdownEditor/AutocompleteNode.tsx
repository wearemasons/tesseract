import {
  DecoratorNode,
  NodeKey,
  EditorConfig,
  LexicalNode,
  SerializedLexicalNode,
  DOMExportOutput,
  LexicalEditor
} from 'lexical'
import React from 'react'

export type SerializedAutocompleteNode = SerializedLexicalNode & {
  text: string
}

export class AutocompleteNode extends DecoratorNode<React.ReactNode> {
  __text: string

  static getType(): string {
    return 'autocomplete'
  }

  static clone(node: AutocompleteNode): AutocompleteNode {
    return new AutocompleteNode(node.__text, node.__key)
  }

  constructor(text: string, key?: NodeKey) {
    super(key)
    this.__text = text
  }

  static importJSON(serializedNode: SerializedAutocompleteNode): AutocompleteNode {
    return $createAutocompleteNode(serializedNode.text)
  }

  exportJSON(): SerializedAutocompleteNode {
    return {
      ...super.exportJSON(),
      type: 'autocomplete',
      version: 1,
      text: this.__text
    }
  }

  createDOM(_config: EditorConfig): HTMLElement {
    return document.createElement('span')
  }

  updateDOM(): false {
    return false
  }

  decorate(_editor: LexicalEditor, _config: EditorConfig): React.ReactNode {
    return (
      <span className="text-muted-foreground opacity-50 select-none pointer-events-none italic">
        {this.__text}
      </span>
    )
  }
}

export function $createAutocompleteNode(text: string): AutocompleteNode {
  return new AutocompleteNode(text)
}

export function $isAutocompleteNode(node: LexicalNode | null | undefined): node is AutocompleteNode {
  return node instanceof AutocompleteNode
}
