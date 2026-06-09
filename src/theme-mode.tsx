import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { type ThemeMode } from './themes'

const STORAGE_KEY = 'theme-mode'

const ThemeModeContext = createContext<{ mode: ThemeMode; setMode: (m: ThemeMode) => void }>({
  mode: 'light',
  setMode: () => {},
})

export function ThemeModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored === 'dark' || stored === 'light') return stored
    }
    return 'light'
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, mode)
  }, [mode])

  return (
    <ThemeModeContext.Provider value={{ mode, setMode: setModeState }}>
      {children}
    </ThemeModeContext.Provider>
  )
}

export function useThemeMode() {
  return useContext(ThemeModeContext)
}
