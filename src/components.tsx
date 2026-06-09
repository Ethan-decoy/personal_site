import { type ReactNode } from 'react'
import { type Section, type Theme } from './themes'
import { useI18n } from './i18n'

export function SectionTitle({ children, theme }: { children: ReactNode; theme: Theme }) {
  return (
    <div className="flex items-center gap-4 mb-12">
      <h2 className="text-2xl font-bold tracking-tight" style={{ color: theme.text }}>
        {children}
      </h2>
      <div className="flex-1 h-px" style={{ backgroundColor: theme.borderLight }} />
    </div>
  )
}

export function Tag({ children, theme }: { children: ReactNode; theme: Theme }) {
  return (
    <span
      className="px-3 py-1.5 rounded-lg text-xs font-medium tracking-wide"
      style={{ backgroundColor: theme.accentLight, color: theme.accent }}
    >
      {children}
    </span>
  )
}

export function NavBar({ theme, active, onNavigate }: { theme: Theme; active: Section; onNavigate: (s: Section) => void }) {
  const { t, locale, setLocale } = useI18n()
  const links: { key: Section; label: string }[] = [
    { key: 'home', label: t('nav.home') },
    { key: 'about', label: t('nav.about') },
    { key: 'projects', label: t('nav.projects') },
    { key: 'notes', label: t('nav.notes') },
    { key: 'contact', label: t('nav.contact') },
  ]

  return (
    <nav className="fixed top-0 left-0 right-0 z-40" style={{ backgroundColor: `${theme.bg}ee`, backdropFilter: 'blur(12px)' }}>
      <div className="max-w-5xl mx-auto flex items-center justify-between px-4 md:px-8 py-4">
        <span className="text-base font-bold tracking-widest cursor-pointer select-none shrink-0" style={{ color: theme.text }} onClick={() => onNavigate('home')}>ETHAN C.</span>
        <div className="flex gap-1 overflow-x-auto ml-2 items-center" style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
          {links.map((l) => (
            <button key={l.key} className="px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ease-out relative whitespace-nowrap shrink-0" style={{ color: active === l.key ? theme.text : theme.textSec, backgroundColor: active === l.key ? theme.accentLight : 'transparent' }} onClick={() => onNavigate(l.key)}>{l.label}</button>
          ))}

          {/* Language pill toggle with sliding indicator */}
          <div className="shrink-0 ml-1 flex items-center relative" style={{ backgroundColor: theme.borderLight, borderRadius: '9999px', padding: '2px' }}>
            <div
              className="absolute rounded-full"
              style={{
                left: locale === 'zh' ? '2px' : '50%',
                width: 'calc(50% - 2px)',
                height: 'calc(100% - 4px)',
                backgroundColor: theme.accent,
                transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            />
            <button className="relative z-10 px-2 py-1 text-xs font-semibold rounded-full transition-colors duration-300 ease-out" style={{ color: locale === 'zh' ? '#fff' : theme.textSec, opacity: locale === 'zh' ? 1 : 0.5 }} onClick={() => setLocale('zh')}>中</button>
            <button className="relative z-10 px-2 py-1 text-xs font-semibold rounded-full transition-colors duration-300 ease-out" style={{ color: locale === 'en' ? '#fff' : theme.textSec, opacity: locale === 'en' ? 1 : 0.5 }} onClick={() => setLocale('en')}>EN</button>
          </div>
        </div>
      </div>
    </nav>
  )
}

export function Footer({ theme, onNavigate }: { theme: Theme; onNavigate: (s: Section) => void }) {
  const { t } = useI18n()
  return (
    <footer className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-8" style={{ borderTop: `1px solid ${theme.borderLight}` }}>
      <div className="flex justify-between items-center">
        <p className="text-xs tracking-wide" style={{ color: theme.textSec }}>&copy; 2026 Ethan C.</p>
        <a className="text-xs font-medium transition-all duration-200 ease-out cursor-pointer" style={{ color: theme.textSec }} onClick={() => onNavigate('contact')} onMouseEnter={(e) => { e.currentTarget.style.color = theme.accent }} onMouseLeave={(e) => { e.currentTarget.style.color = theme.textSec }}>{t('footer.contact')}</a>
      </div>
    </footer>
  )
}
