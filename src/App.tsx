import { useState, useEffect } from 'react'
import { type ThemeKey, type Section, type ThemeMode, getTheme } from './themes'
import { NavBar, Footer, LangToggle, ThemeToggle } from './components'
import { useI18n } from './i18n'
import { I18nProvider } from './i18n/index'
import { ThemeModeProvider, useThemeMode } from './theme-mode'
import HomePage from './pages/home'
import AboutPage from './pages/about'
import ProjectsPage from './pages/projects'
import NotesPage from './pages/notes'
import ContactPage from './pages/contact'

type AboutView = 'personal' | 'work'

const sectionMap: Record<Section, React.FC<{ theme: ReturnType<typeof getTheme>; onNavigate: (s: Section, sub?: AboutView) => void; aboutView?: AboutView; mode?: ThemeMode }>> = {
  home: HomePage,
  about: AboutPage,
  projects: ProjectsPage,
  notes: NotesPage,
  contact: ContactPage,
}

const sectionTheme: Record<Section, ThemeKey> = {
  home: 'earth',
  about: 'earth',
  projects: 'sage',
  notes: 'ocean',
  contact: 'black',
}

function AppInner() {
  const { locale, setLocale } = useI18n()
  const { mode, setMode } = useThemeMode()
  const [active, setActive] = useState<Section>('home')
  const [aboutView, setAboutView] = useState<AboutView>('work')
  const theme = getTheme(sectionTheme[active], mode)
  const Page = sectionMap[active]

  useEffect(() => {
    const hash = window.location.hash.replace('#', '')
    if (!hash) return
    const [section, sub] = hash.split('/') as [Section, AboutView?]
    if (sectionMap[section]) {
      setActive(section)
      if (section === 'about' && sub) setAboutView(sub)
    }
  }, [])

  const navigate = (s: Section, sub?: AboutView) => {
    setActive(s)
    if (s === 'about' && sub) { setAboutView(sub); window.history.replaceState(null, '', `#${s}/${sub}`) }
    else { window.history.replaceState(null, '', `#${s}`) }
    window.scrollTo({ top: 0 })
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: theme.bg, color: theme.text }}>
      <NavBar theme={theme} active={active} onNavigate={navigate} />
      <div className="fixed top-[18px] right-5 z-50 flex items-center gap-2">
        <ThemeToggle mode={mode} setMode={setMode} theme={theme} />
        <LangToggle locale={locale} setLocale={setLocale} theme={theme} />
      </div>
      <main className="flex-1">
        {active === 'about'
          ? <Page theme={theme} onNavigate={navigate} aboutView={aboutView} />
          : <Page theme={theme} onNavigate={navigate} mode={mode} />
        }
      </main>
      <Footer theme={theme} onNavigate={navigate} />
    </div>
  )
}

export default function App() {
  return (
    <I18nProvider>
      <ThemeModeProvider>
        <AppInner />
      </ThemeModeProvider>
    </I18nProvider>
  )
}
