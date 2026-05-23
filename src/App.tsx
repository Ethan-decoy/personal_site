import { useState, useEffect, ReactNode } from 'react'

/* ==================== Themes ==================== */

const themes = {
  earth: {
    name: '浅棕米白',
    bg: '#F8F3EA',
    bgDeep: '#F0E8D8',
    bgCard: '#F5EDE0',
    text: '#2D2418',
    textSec: '#7A6B5A',
    accent: '#9B7B5A',
    accentHover: '#7E6045',
    accentLight: 'rgba(155, 123, 90, 0.08)',
    border: 'rgba(45, 36, 24, 0.12)',
    borderLight: 'rgba(45, 36, 24, 0.06)',
  },
  ocean: {
    name: '深蓝黑',
    bg: '#F5F0E8',
    bgDeep: '#EDE7DB',
    bgCard: '#F0EBE0',
    text: '#0F1B2D',
    textSec: '#4A5D73',
    accent: '#1B3A5C',
    accentHover: '#0F2540',
    accentLight: 'rgba(27, 58, 92, 0.08)',
    border: 'rgba(15, 27, 45, 0.12)',
    borderLight: 'rgba(15, 27, 45, 0.06)',
  },
  sage: {
    name: '浅青绿',
    bg: '#F5F0E8',
    bgDeep: '#E8EDE6',
    bgCard: '#EEF3EC',
    text: '#1A2A24',
    textSec: '#4E6A5E',
    accent: '#3D8B7A',
    accentHover: '#2E6B5E',
    accentLight: 'rgba(61, 139, 122, 0.08)',
    border: 'rgba(26, 42, 36, 0.12)',
    borderLight: 'rgba(26, 42, 36, 0.06)',
  },
}

type ThemeKey = keyof typeof themes
type Section = 'home' | 'about' | 'projects' | 'notes' | 'contact'
type Theme = (typeof themes)[ThemeKey]

/* ==================== Shared Components ==================== */

function SectionTitle({ children, theme }: { children: ReactNode; theme: Theme }) {
  return (
    <div className="flex items-center gap-4 mb-12">
      <h2 className="text-2xl font-bold tracking-tight" style={{ color: theme.text }}>
        {children}
      </h2>
      <div className="flex-1 h-px" style={{ backgroundColor: theme.borderLight }} />
    </div>
  )
}

function Tag({ children, theme }: { children: ReactNode; theme: Theme }) {
  return (
    <span
      className="px-3 py-1.5 rounded-lg text-xs font-medium tracking-wide"
      style={{ backgroundColor: theme.accentLight, color: theme.accent }}
    >
      {children}
    </span>
  )
}

/* ==================== Theme Switcher ==================== */

function ThemeSwitcher({
  current,
  onChange,
}: {
  current: ThemeKey
  onChange: (t: ThemeKey) => void
}) {
  const keys = Object.keys(themes) as ThemeKey[]
  return (
    <div className="fixed top-6 right-6 z-50 flex gap-1.5 p-1.5 rounded-xl" style={{ backgroundColor: themes[current].bgDeep, border: `1px solid ${themes[current].border}` }}>
      {keys.map((key) => (
        <button
          key={key}
          className="px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ease-out"
          style={{
            backgroundColor: current === key ? themes[key].accent : 'transparent',
            color: current === key ? '#fff' : themes[key].textSec,
          }}
          onClick={() => onChange(key)}
        >
          {themes[key].name}
        </button>
      ))}
    </div>
  )
}

/* ==================== NavBar ==================== */

function NavBar({
  theme,
  active,
  onNavigate,
}: {
  theme: Theme
  active: Section
  onNavigate: (s: Section) => void
}) {
  const links: { key: Section; label: string }[] = [
    { key: 'home', label: '首页' },
    { key: 'about', label: '关于' },
    { key: 'projects', label: '项目' },
    { key: 'notes', label: '笔记' },
    { key: 'contact', label: '联系' },
  ]

  return (
    <nav className="fixed top-0 left-0 right-0 z-40" style={{ backgroundColor: `${theme.bg}ee`, backdropFilter: 'blur(12px)' }}>
      <div className="max-w-5xl mx-auto flex items-center justify-between px-8 py-4">
        <span
          className="text-base font-bold tracking-widest cursor-pointer select-none"
          style={{ color: theme.text }}
          onClick={() => onNavigate('home')}
        >
          ETHAN C.
        </span>
        <div className="flex gap-1">
          {links.map((l) => (
            <button
              key={l.key}
              className="px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ease-out relative"
              style={{
                color: active === l.key ? theme.text : theme.textSec,
                backgroundColor: active === l.key ? theme.accentLight : 'transparent',
              }}
              onClick={() => onNavigate(l.key)}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  )
}

/* ==================== Home Page ==================== */

function SmileyAvatar({ theme }: { theme: Theme }) {
  return (
    <div
      className="absolute right-[8%] top-[15%] w-[35vw] h-[35vw] max-w-[420px] max-h-[420px] opacity-[0.12] pointer-events-none"
      style={{
        WebkitMask: `url(/assets/avatar.svg) center/contain no-repeat`,
        mask: `url(/assets/avatar.svg) center/contain no-repeat`,
        backgroundColor: theme.accent,
        transform: 'rotate(6deg)',
      }}
    />
  )
}

function HomePage({ theme }: { theme: Theme }) {
  const stats = [
    { num: '3', label: '项目' },
    { num: '2024', label: '开始探索' },
    { num: '∞', label: '持续学习中' },
  ]

  return (
    <div className="min-h-screen flex flex-col justify-center relative overflow-hidden">
      <div className="max-w-5xl mx-auto px-8 w-full relative z-10">

        {/* 主标题区域 */}
        <div className="mb-20 relative">
          {/* 装饰头像 - 背景 */}
          <SmileyAvatar theme={theme} />

          {/* 内容 */}
          <div className="relative z-10">
            {/* 状态点 */}
            <div className="flex items-center gap-3 mb-8">
              <span className="relative flex h-2.5 w-2.5">
                <span
                  className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping"
                  style={{ backgroundColor: theme.accent }}
                />
                <span
                  className="relative inline-flex h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: theme.accent }}
                />
              </span>
              <p className="text-xs font-semibold tracking-[0.2em] uppercase" style={{ color: theme.accent }}>
                当前在构建个人网站
              </p>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.05] mb-8" style={{ color: theme.text }}>
              我是 Ethan C.<br />
              <span className="font-normal" style={{ color: theme.textSec }}>
                开发者，设计爱好者.
              </span>
            </h1>

            <p className="text-lg leading-relaxed max-w-md" style={{ color: theme.textSec }}>
              在这里记录我的项目、思考与成长。
              我相信好的工具应该隐形，让你专注于真正重要的事情。
            </p>
          </div>
        </div>

        {/* 分隔线 */}
        <div className="h-px w-full mb-8" style={{ backgroundColor: theme.borderLight }} />

        {/* 数据展示 */}
        <div className="grid grid-cols-3 gap-8 mb-16">
          {stats.map((stat) => (
            <div key={stat.label} className="p-5 rounded-2xl" style={{ backgroundColor: theme.bgDeep, border: `1px solid ${theme.borderLight}` }}>
              <p className="text-3xl font-bold mb-1 tracking-tight" style={{ color: theme.text }}>
                {stat.num}
              </p>
              <p className="text-xs tracking-wider" style={{ color: theme.textSec }}>
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* 底部：金句 + CTA */}
        <div className="flex items-end justify-between">
          <blockquote className="text-sm italic max-w-sm" style={{ color: theme.textSec }}>
            "好的设计是尽可能少的设计。"
            <span className="block mt-1 text-xs not-italic" style={{ color: theme.textSec }}>
              — Dieter Rams
            </span>
          </blockquote>
          <button
            className="px-6 py-3 text-sm font-medium text-white rounded-xl transition-all duration-200 ease-out shadow-sm shrink-0"
            style={{ backgroundColor: theme.accent }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme.accentHover
              e.currentTarget.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = theme.accent
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            查看项目 →
          </button>
        </div>
      </div>
    </div>
  )
}

/* ==================== About Page ==================== */

function AboutPage({ theme }: { theme: Theme }) {
  return (
    <div className="max-w-5xl mx-auto px-8 py-32 space-y-20">
      <SectionTitle theme={theme}>关于</SectionTitle>

      {/* 两栏布局 */}
      <div className="grid grid-cols-3 gap-12">
        <div className="col-span-2 max-w-prose space-y-5" style={{ color: theme.textSec }}>
          <p className="text-lg leading-relaxed">
            我是一名开发者，热衷于前端技术与极简设计的结合。
            我相信好的工具应该隐形 — 让你专注于真正重要的事情。
          </p>
          <p className="leading-relaxed">
            闲暇时，我喜欢研究技术细节、探索设计趋势、以及思考如何让复杂的概念变得简单。
            这个网站是我实践这些想法的地方。
          </p>
        </div>

        {/* 右侧：快速信息 */}
        <div className="space-y-6" style={{ color: theme.textSec }}>
          {[
            { label: '位置', value: '中国' },
            { label: '语言', value: '中文 / English' },
            { label: '状态', value: '持续学习中' },
          ].map((item) => (
            <div key={item.label}>
              <p className="text-xs tracking-wider uppercase mb-1" style={{ color: theme.text }}>{item.label}</p>
              <p className="text-sm">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 技术栈 */}
      <div>
        <h3 className="text-sm font-semibold tracking-wider uppercase mb-5" style={{ color: theme.text }}>
          技术栈
        </h3>
        <div className="flex flex-wrap gap-2">
          {[
            'TypeScript', 'React', 'Vite', 'Tailwind CSS',
            'Node.js', 'Git', 'Docker', 'Python',
          ].map((t) => (
            <Tag key={t} theme={theme}>{t}</Tag>
          ))}
        </div>
      </div>

      {/* 理念 */}
      <div className="p-8 rounded-2xl" style={{ backgroundColor: theme.bgDeep, border: `1px solid ${theme.borderLight}` }}>
        <p className="text-xl font-medium italic leading-relaxed" style={{ color: theme.text }}>
          "好的设计是尽可能少的设计。"
        </p>
        <p className="text-sm mt-4" style={{ color: theme.textSec }}>— Dieter Rams</p>
      </div>
    </div>
  )
}

/* ==================== Projects Page ==================== */

function ProjectCard({
  title,
  desc,
  tags,
  theme,
}: {
  title: string
  desc: string
  tags: string[]
  theme: Theme
}) {
  return (
    <div
      className="group p-6 rounded-2xl border transition-all duration-200 ease-out cursor-default"
      style={{
        backgroundColor: theme.bgDeep,
        borderColor: theme.border,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = theme.accent
        e.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = theme.border
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      {/* 顶部指示点 */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1.5 h-1.5 rounded-full transition-all duration-200" style={{ backgroundColor: theme.accent }} />
      </div>

      <h3 className="text-lg font-semibold mb-2 tracking-tight" style={{ color: theme.text }}>
        {title}
      </h3>
      <p className="text-sm leading-relaxed mb-5" style={{ color: theme.textSec }}>
        {desc}
      </p>
      <div className="flex gap-2 flex-wrap">
        {tags.map((t) => (
          <Tag key={t} theme={theme}>{t}</Tag>
        ))}
      </div>
    </div>
  )
}

function ProjectsPage({ theme }: { theme: Theme }) {
  const projects = [
    {
      title: 'Kind Teacher Agent',
      desc: '基于 AI 的智能教学助手，帮助学生理解和掌握复杂概念。',
      tags: ['AI', 'TypeScript', '教育'],
    },
    {
      title: '个人网站',
      desc: '使用现代前端技术栈构建的个人主页，极简主义设计风格。',
      tags: ['React', 'Vite', 'Tailwind CSS'],
    },
    {
      title: 'Knowledge Flow',
      desc: '知识管理工作流工具，帮助整理和沉淀个人知识体系。',
      tags: ['工具', '知识管理', '自动化'],
    },
  ]

  return (
    <div className="max-w-5xl mx-auto px-8 py-32">
      <SectionTitle theme={theme}>项目</SectionTitle>
      <p className="text-base mb-10 -mt-4" style={{ color: theme.textSec }}>
        我正在构建和参与的项目
      </p>
      <div className="grid grid-cols-3 max-lg:grid-cols-2 max-sm:grid-cols-1 gap-5">
        {projects.map((p) => (
          <ProjectCard key={p.title} {...p} theme={theme} />
        ))}
      </div>
    </div>
  )
}

/* ==================== Notes Page ==================== */

function NotesPage({ theme }: { theme: Theme }) {
  const noteCategories = [
    {
      category: '前端',
      notes: [
        { title: 'TypeScript 泛型笔记', date: '2026-05-20' },
        { title: 'React Hooks 最佳实践', date: '2026-05-18' },
        { title: 'Tailwind CSS 实用技巧', date: '2026-05-15' },
      ],
    },
    {
      category: '后端',
      notes: [
        { title: 'Node.js 事件循环机制', date: '2026-05-12' },
      ],
    },
    {
      category: '其他',
      notes: [
        { title: 'Git 工作流整理', date: '2026-05-10' },
      ],
    },
  ]

  return (
    <div className="max-w-5xl mx-auto px-8 py-32">
      <SectionTitle theme={theme}>笔记</SectionTitle>
      <p className="text-base mb-10 -mt-4" style={{ color: theme.textSec }}>
        个人学习笔记，主要给自己看
      </p>

      <div className="space-y-12">
        {noteCategories.map((cat) => (
          <div key={cat.category}>
            <h3 className="text-sm font-semibold tracking-wider uppercase mb-4" style={{ color: theme.text }}>
              {cat.category}
            </h3>
            <div className="space-y-2">
              {cat.notes.map((note) => (
                <div
                  key={note.title}
                  className="flex items-center justify-between py-3 px-4 rounded-xl border transition-all duration-200 ease-out cursor-default"
                  style={{
                    backgroundColor: theme.bgDeep,
                    borderColor: theme.borderLight,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = theme.border
                    e.currentTarget.style.backgroundColor = theme.bgCard || theme.bgDeep
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = theme.borderLight
                    e.currentTarget.style.backgroundColor = theme.bgDeep
                  }}
                >
                  <span className="text-sm font-medium" style={{ color: theme.text }}>
                    {note.title}
                  </span>
                  <span className="text-xs font-mono" style={{ color: theme.textSec }}>
                    {note.date}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ==================== Contact Page ==================== */

function ContactPage({ theme }: { theme: Theme }) {
  return (
    <div className="max-w-5xl mx-auto px-8 py-32">
      <SectionTitle theme={theme}>联系</SectionTitle>

      <div className="grid grid-cols-2 gap-12 mt-8">
        <div className="space-y-5 max-w-md" style={{ color: theme.textSec }}>
          <p className="text-lg leading-relaxed">
            如果你想聊聊技术、合作想法，或者只是想打个招呼，欢迎联系。
          </p>
        </div>

        <div className="space-y-8">
          {[
            { label: '邮箱', value: 'hello@example.com', href: 'mailto:hello@example.com' },
            { label: 'GitHub', value: 'github.com/Ethan-decoy', href: 'https://github.com/Ethan-decoy' },
          ].map((item) => (
            <div key={item.label}>
              <p className="text-xs font-semibold tracking-wider uppercase mb-2" style={{ color: theme.text }}>
                {item.label}
              </p>
              <a
                href={item.href}
                className="text-base font-medium transition-all duration-200 ease-out"
                style={{ color: theme.accent }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = theme.accentHover
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = theme.accent
                }}
              >
                {item.value}
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ==================== Footer ==================== */

function Footer({ theme }: { theme: Theme }) {
  return (
    <footer className="max-w-5xl mx-auto px-8 py-8" style={{ borderTop: `1px solid ${theme.borderLight}` }}>
      <div className="flex justify-between items-center">
        <p className="text-xs tracking-wide" style={{ color: theme.textSec }}>
          &copy; 2026 Ethan C.
        </p>
        <div className="flex gap-6">
          {['GitHub', '邮箱'].map((l) => (
            <a
              key={l}
              href="#"
              className="text-xs font-medium transition-all duration-200 ease-out"
              style={{ color: theme.textSec }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = theme.accent
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = theme.textSec
              }}
            >
              {l}
            </a>
          ))}
        </div>
      </div>
    </footer>
  )
}

/* ==================== App ==================== */

const sectionMap: Record<Section, React.FC<{ theme: Theme }>> = {
  home: HomePage,
  about: AboutPage,
  projects: ProjectsPage,
  notes: NotesPage,
  contact: ContactPage,
}

function App() {
  const [currentTheme, setCurrentTheme] = useState<ThemeKey>('earth')
  const [active, setActive] = useState<Section>('home')
  const theme = themes[currentTheme]
  const Page = sectionMap[active]

  useEffect(() => {
    const hash = window.location.hash.replace('#', '') as Section
    if (hash && sectionMap[hash]) setActive(hash)
  }, [])

  const navigate = (s: Section) => {
    setActive(s)
    window.history.replaceState(null, '', `#${s}`)
    window.scrollTo({ top: 0 })
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: theme.bg, color: theme.text }}>
      <ThemeSwitcher current={currentTheme} onChange={setCurrentTheme} />
      <NavBar theme={theme} active={active} onNavigate={navigate} />
      <main className="flex-1">
        <Page theme={theme} />
      </main>
      <Footer theme={theme} />
    </div>
  )
}

export default App
