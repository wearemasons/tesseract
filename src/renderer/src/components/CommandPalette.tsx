import { useAtom, useSetAtom, useAtomValue } from 'jotai'
import {
  commandPaletteOpenAtom,
  themeAtom,
  fontSizeAtom,
  autocompleteEnabledAtom,
  themePickerOpenAtom,
  sessionPickerOpenAtom,
  aboutDialogOpenAtom,
  selectedNoteAtom
} from '@renderer/store'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from './ui/command'
import {
  LuMoon,
  LuPlus,
  LuMinus,
  LuRotateCcw,
  LuSparkles,
  LuPalette,
  LuHistory,
  LuInfo,
  LuDownload
} from 'react-icons/lu'

export const CommandPalette = () => {
  const [open, setOpen] = useAtom(commandPaletteOpenAtom)
  const setTheme = useSetAtom(themeAtom)
  const [fontSize, setFontSize] = useAtom(fontSizeAtom)
  const [autocompleteEnabled, setAutocompleteEnabled] = useAtom(autocompleteEnabledAtom)
  const setThemePickerOpen = useSetAtom(themePickerOpenAtom)
  const setSessionPickerOpen = useSetAtom(sessionPickerOpenAtom)
  const setAboutOpen = useSetAtom(aboutDialogOpenAtom)
  const selectedNote = useAtomValue(selectedNoteAtom)

  const exportNote = async (): Promise<void> => {
    if (!selectedNote?.title) return
    setOpen(false)
    await window.context.exportNote(selectedNote.title)
  }

  const run = (fn: () => void) => {
    fn()
    setOpen(false)
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command..." />
      <CommandList>
        <CommandEmpty>No commands found.</CommandEmpty>

        <CommandGroup heading="Editor">
          <CommandItem onSelect={() => run(() => setFontSize((p) => Math.min(p + 2, 36)))}>
            <LuPlus className="mr-2" />
            <span>Increase Font Size</span>
            <span className="ml-auto text-xs text-muted-foreground">{fontSize}px</span>
          </CommandItem>
          <CommandItem onSelect={() => run(() => setFontSize((p) => Math.max(p - 2, 10)))}>
            <LuMinus className="mr-2" />
            <span>Decrease Font Size</span>
            <span className="ml-auto text-xs text-muted-foreground">{fontSize}px</span>
          </CommandItem>
          <CommandItem onSelect={() => run(() => setFontSize(18))}>
            <LuRotateCcw className="mr-2" />
            <span>Reset Font Size</span>
          </CommandItem>
          <CommandItem onSelect={() => run(() => setAutocompleteEnabled((prev) => !prev))}>
            <LuSparkles className="mr-2" />
            <span>{autocompleteEnabled ? 'Disable' : 'Enable'} Autocomplete</span>
          </CommandItem>
        </CommandGroup>

        <CommandGroup heading="Theme">
          <CommandItem
            onSelect={() => run(() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark')))}
          >
            <LuMoon className="mr-2" />
            <span>Toggle Theme</span>
          </CommandItem>
          <CommandItem
            onSelect={() => {
              setOpen(false)
              setThemePickerOpen(true)
            }}
          >
            <LuPalette className="mr-2" />
            <span>Pick Theme...</span>
          </CommandItem>
        </CommandGroup>

        <CommandGroup heading="History">
          <CommandItem
            onSelect={() => {
              setOpen(false)
              setSessionPickerOpen(true)
            }}
          >
            <LuHistory className="mr-2" />
            <span>Load Session...</span>
          </CommandItem>
        </CommandGroup>

        <CommandGroup heading="Project">
          <CommandItem onSelect={exportNote}>
            <LuDownload className="mr-2" />
            <span>Export Note</span>
          </CommandItem>
          <CommandItem
            onSelect={() => {
              setOpen(false)
              setAboutOpen(true)
            }}
          >
            <LuInfo className="mr-2" />
            <span>About Tesseract</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
