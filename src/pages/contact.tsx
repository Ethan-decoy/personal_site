import { useState, useEffect } from 'react'
import { type Section, type Theme } from '../themes'
import { SectionTitle } from '../components'
import { useI18n } from '../i18n'

function TypingText({ text, className, style, delay = 0, cursorColor = '#333' }: { text: string; className?: string; style?: React.CSSProperties; delay?: number; cursorColor?: string }) {
  const [visible, setVisible] = useState(0)
  useEffect(() => {
    const startTimer = setTimeout(() => {
      let i = 0
      const timer = setInterval(() => { i++; setVisible(i); if (i >= text.length) clearInterval(timer) }, 20)
      return () => clearInterval(timer)
    }, delay)
    return () => clearTimeout(startTimer)
  }, [text.length, delay])
  return (
    <span className={className} style={style}>
      {text.slice(0, visible)}
      {visible < text.length && <span className="inline-block w-2 h-[1.2em] align-text-bottom" style={{ backgroundColor: cursorColor, marginLeft: '1px', animation: 'blink 1s step-end infinite' }} />}
    </span>
  )
}

export default function ContactPage({ theme }: { theme: Theme; onNavigate: (s: Section) => void }) {
  const { t } = useI18n()
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-16 sm:py-24 md:py-32">
      <SectionTitle theme={theme}>{t('contact.title')}</SectionTitle>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 md:gap-12 mt-8" style={{ animation: 'fade-up 0.6s ease-out both', animationDelay: '150ms' }}>
        <div className="space-y-5 max-w-md" style={{ color: theme.textSec }}>
          <p className="text-base leading-relaxed">{t('contact.desc')}</p>
        </div>
        <div className="space-y-8">
          {[
            { label: t('contact.email'), value: 'decoy.elevate399@passinbox.com', href: 'mailto:decoy.elevate399@passinbox.com' },
            { label: t('contact.github'), value: 'github.com/Ethan-decoy', href: 'https://github.com/Ethan-decoy' },
          ].map((item) => (
            <div key={item.label}>
              <p className="text-xs font-semibold tracking-wider uppercase mb-2" style={{ color: theme.textSec, opacity: 0.5 }}>{item.label}</p>
              <a href={item.href} className="text-base leading-relaxed transition-all duration-200 ease-out" style={{ color: theme.accent, fontFamily: "'JetBrains Mono', 'Fira Code', Menlo, Consolas, monospace" }} onMouseEnter={(e) => { e.currentTarget.style.color = theme.accentHover }} onMouseLeave={(e) => { e.currentTarget.style.color = theme.accent }}>
                <TypingText text={item.value} cursorColor={theme.accent} />
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
