import { useAtom } from 'jotai'
import { themeAtom } from '@renderer/store'
import { useEffect } from 'react'
import { LuSun, LuMoon } from 'react-icons/lu'

export const ThemeToggle = () => {
  const [theme, setTheme] = useAtom(themeAtom)

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      root.classList.add(systemTheme)
    } else {
      root.classList.add(theme)
    }
  }, [theme])

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {theme === 'dark' ? (
        <LuSun className="w-5 h-5 text-muted-foreground" />
      ) : (
        <LuMoon className="w-5 h-5 text-muted-foreground" />
      )}
    </button>
  )
}
