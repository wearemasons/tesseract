import { useAtom } from 'jotai'
import { themePickerOpenAtom, activeThemeCssAtom } from '@renderer/store'
import { themes } from '@renderer/assets/themes'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { LuCheck, LuPalette } from 'react-icons/lu'

export const ThemePicker = () => {
  const [open, setOpen] = useAtom(themePickerOpenAtom)
  const [activeTheme, setActiveTheme] = useAtom(activeThemeCssAtom)

  const select = (cssPath: string | null) => {
    setActiveTheme(cssPath)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LuPalette className="h-5 w-5" />
            Pick a Theme
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-2 py-2">
          {themes.map((theme) => (
            <button
              key={theme.id}
              onClick={() => select(theme.cssPath)}
              className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-left transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background shrink-0">
                <div className="h-4 w-4 rounded-full" style={{ background: theme.swatch }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{theme.name}</div>
                <div className="text-xs text-muted-foreground truncate">{theme.description}</div>
              </div>
              {activeTheme === theme.cssPath && (
                <LuCheck className="h-4 w-4 shrink-0 text-primary" />
              )}
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
