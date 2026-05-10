export interface ThemeOption {
  id: string
  name: string
  description: string
  cssPath: string | null
  swatch: string
}

const themeUrls: Record<string, string> = import.meta.glob('./*.css', {
  eager: true,
  query: '?url',
  import: 'default'
})

const themeRaws: Record<string, string> = import.meta.glob('./*.css', {
  eager: true,
  query: '?raw',
  import: 'default'
})

const primaryColor = (content: string): string => {
  const darkMatch = content.match(/\.dark\s*\{([^}]*--primary\s*:[^}]*)\}/)
  if (darkMatch) {
    const inner = darkMatch[1].match(/--primary:\s*([^;]+)/)
    if (inner) return inner[1].trim()
  }
  const rootMatch = content.match(/:root\s*\{([^}]*--primary\s*:[^}]*)\}/)
  if (rootMatch) {
    const inner = rootMatch[1].match(/--primary:\s*([^;]+)/)
    if (inner) return inner[1].trim()
  }
  const fallback = content.match(/--primary:\s*([^;]+)/)
  return fallback ? fallback[1].trim() : '#6366f1'
}

const customThemes: ThemeOption[] = Object.entries(themeUrls).map(([path, url]) => {
  const id = path.replace('./', '').replace('.css', '')
  const name = id
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
  const raw = themeRaws[path] ?? ''
  return {
    id,
    name,
    description: `Custom theme: ${name}`,
    cssPath: url as string,
    swatch: primaryColor(raw)
  }
})

export const themes: ThemeOption[] = [
  {
    id: 'default',
    name: 'Default',
    description: 'The base Tesseract theme',
    cssPath: null,
    swatch: '#6366f1'
  },
  ...customThemes
]
