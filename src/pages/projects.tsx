import { type Section, type Theme } from '../themes'
import { SectionTitle } from '../components'
import { useI18n } from '../i18n'

const GITHUB_USERNAME = 'Ethan-decoy'

function GitHubContributions() {
  return (
    <div className="overflow-x-auto flex justify-center pb-2 mt-6" style={{ scrollbarWidth: 'none' }}>
      <img src={`https://ghchart.rshah.org/${GITHUB_USERNAME}`} alt="GitHub Contributions" className="block" style={{ minWidth: 'fit-content' }} referrerPolicy="no-referrer" />
    </div>
  )
}

export default function ProjectsPage({ theme }: { theme: Theme; onNavigate: (s: Section) => void }) {
  const { t } = useI18n()
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-16 sm:py-24 md:py-32">
      <SectionTitle theme={theme}>{t('projects.title')}</SectionTitle>
      <div style={{ animation: 'fade-up 0.6s ease-out both', animationDelay: '100ms' }}>
        <GitHubContributions />
      </div>
      <div className="p-6 rounded-2xl mt-6 sm:p-8" style={{ animation: 'fade-up 0.6s ease-out both', animationDelay: '150ms', backgroundColor: theme.bgDeep, border: `1px solid ${theme.borderLight}` }}>
        <p className="text-base leading-relaxed" style={{ color: theme.textSec }}>{t('projects.empty')}</p>
        <p className="text-sm mt-2" style={{ color: theme.textSec, opacity: 0.6 }}>{t('projects.hint')}</p>
      </div>
    </div>
  )
}
