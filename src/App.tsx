import { useState, useEffect } from 'react'
import { themes, type ThemeKey, type Section } from './themes'
import { NavBar, Footer } from './components'
import { I18nProvider } from './i18n/index'
import HomePage from './pages/home'
import AboutPage from './pages/about'
import ProjectsPage from './pages/projects'
import NotesPage from './pages/notes'
import ContactPage from './pages/contact'

type AboutView = 'personal' | 'work'

const sectionMap: Record<Section, React.FC<{ theme: ReturnType<typeof getTheme>; onNavigate: (s: Section, sub?: AboutView) => void; aboutView?: AboutView }>> = {
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

function getTheme(key: ThemeKey) {
  return themes[key]
}

function AppInner() {
  const [active, setActive] = useState<Section>('home')
  const [aboutView, setAboutView] = useState<AboutView>('work')
  const theme = getTheme(sectionTheme[active])
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
      <main className="flex-1">
        {active === 'about'
          ? <Page theme={theme} onNavigate={navigate} aboutView={aboutView} />
          : <Page theme={theme} onNavigate={navigate} />
        }
      </main>
      <Footer theme={theme} onNavigate={navigate} />
    </div>
  )
}

export default function App() {
  return (
    <I18nProvider>
      <AppInner />
    </I18nProvider>
  )
}
