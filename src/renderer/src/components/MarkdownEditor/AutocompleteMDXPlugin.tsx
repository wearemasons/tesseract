import { realmPlugin, addLexicalNode$, addComposerChild$ } from '@mdxeditor/editor'
import { AutocompleteNode } from './AutocompleteNode'
import { AutocompletePlugin } from './AutocompletePlugin'

export const autocompleteMDXPlugin = realmPlugin({
  init(realm) {
    realm.pub(addLexicalNode$, AutocompleteNode)
    realm.pub(addComposerChild$, AutocompletePlugin)
  }
})
