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
  black: {
    name: '黑',
    bg: '#F5F0E8',
    bgDeep: '#EDE7DB',
    bgCard: '#E8E2D6',
    text: '#0A0A0A',
    textSec: '#555555',
    accent: '#0A0A0A',
    accentHover: '#222222',
    accentLight: 'rgba(10, 10, 10, 0.08)',
    border: 'rgba(10, 10, 10, 0.15)',
    borderLight: 'rgba(10, 10, 10, 0.06)',
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
      className="w-[320px] h-[320px] opacity-[0.12] pointer-events-none"
      style={{
        WebkitMask: `url(/assets/avatar.svg) center/contain no-repeat`,
        mask: `url(/assets/avatar.svg) center/contain no-repeat`,
        backgroundColor: theme.accent,
        transform: 'rotate(6deg)',
      }}
    />
  )
}

function HomePage({ theme, onNavigate }: { theme: Theme; onNavigate: (s: Section) => void }) {
  const [secondLineVisible, setSecondLineVisible] = useState(false)
  return (
    <div className="min-h-screen flex flex-col justify-center relative overflow-hidden">
      <div className="max-w-5xl mx-auto px-8 w-full relative z-10">

        {/* 两列布局：左侧内容 + 右侧头像 */}
        <div className="grid grid-cols-[1fr_auto] gap-12 items-start">

          {/* 左侧：文字内容 */}
          <div className="space-y-10">
            {/* 状态点 */}
            <div
              className="flex items-center gap-3"
              style={{ animation: 'fade-up 0.6s ease-out both', animationDelay: '0ms' }}
            >
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

            {/* 主标题 */}
            <h1
              className="text-5xl md:text-6xl font-bold tracking-tight leading-[1.05]"
              style={{ color: theme.text, animation: 'fade-up 0.6s ease-out both', animationDelay: '100ms' }}
            >
              我是 Ethan C.<br />
              <span className="font-normal" style={{ color: theme.textSec }}>
                R&amp;D / 探索者.
              </span>
            </h1>

            {/* 描述 */}
            <div
              className="space-y-3 max-w-md"
              style={{ animation: 'fade-up 0.6s ease-out both', animationDelay: '250ms' }}
            >
              <p className="text-lg leading-relaxed" style={{ color: theme.textSec }}>
                在这里记录我的探索与思考。
              </p>
              <p
                className="text-base leading-relaxed cursor-default select-none"
                onMouseEnter={() => setSecondLineVisible(true)}
                onMouseLeave={() => setSecondLineVisible(false)}
                style={{
                  color: theme.textSec,
                  opacity: secondLineVisible ? 0.7 : 0,
                  transition: 'opacity 0.5s ease-out',
                }}
              >
                我相信好的工具应该隐形，让你专注于真正重要的事情。
              </p>
            </div>

            {/* 分隔线 */}
            <div
              className="h-px w-16"
              style={{ backgroundColor: theme.border, animation: 'fade-in 0.6s ease-out both', animationDelay: '400ms' }}
            />

            {/* motto + CTA */}
            <div
              className="space-y-6"
              style={{ animation: 'fade-up 0.6s ease-out both', animationDelay: '500ms' }}
            >
              <blockquote className="text-sm italic max-w-sm" style={{ color: theme.textSec }}>
                "先做人民需要的工程师，再做自己时间的主人。"
              </blockquote>
              <button
                className="px-6 py-3 text-sm font-medium text-white rounded-xl transition-all duration-200 ease-out shadow-sm"
                style={{ backgroundColor: theme.accent }}
                onClick={() => onNavigate('about')}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = theme.accentHover
                  e.currentTarget.style.transform = 'translateY(-1px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = theme.accent
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                了解我
              </button>
            </div>
          </div>

          {/* 右侧：装饰头像 */}
          <div
            className="hidden md:flex items-center justify-center pt-8"
            style={{ animation: 'fade-up 0.8s ease-out both', animationDelay: '300ms' }}
          >
            <SmileyAvatar theme={theme} />
          </div>
        </div>
      </div>
    </div>
  )
}

type AboutView = 'personal' | 'work'

/* ==================== About Page ==================== */

function AboutPage({ theme, onNavigate, aboutView }: { theme: Theme; onNavigate: (s: Section, sub?: AboutView) => void; aboutView?: AboutView }) {
  const view = aboutView ?? 'personal'
  const [valuesExpanded, setValuesExpanded] = useState(false)
  const [valuesContentOpen, setValuesContentOpen] = useState(false)
  const [hoveredDimension, setHoveredDimension] = useState<string | null>(null)

  const views: { key: AboutView; label: string }[] = [
    { key: 'personal', label: '生活' },
    { key: 'work', label: '工作' },
  ]

  const values = [
    { title: '终身学习', desc: '保持好奇，持续迭代。' },
    { title: '诚实', desc: '不为了迎合而说话。' },
    { title: '长期主义', desc: '做能活十年以上的事。' },
  ]

  const toggleValues = () => {
    if (!valuesExpanded) {
      setValuesExpanded(true)
      setTimeout(() => setValuesContentOpen(true), 100)
    } else {
      setValuesContentOpen(false)
      setTimeout(() => setValuesExpanded(false), 300)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-8 py-32">
      <div
        style={{ animation: 'fade-up 0.6s ease-out both', animationDelay: '0ms' }}
      >
        <SectionTitle theme={theme}>关于</SectionTitle>

        {/* 视图切换 */}
        <div className="flex gap-1 mb-3">
          {views.map((v) => (
            <button
              key={v.key}
              className="px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ease-out relative"
              style={{
                color: view === v.key ? theme.text : theme.textSec,
                backgroundColor: view === v.key ? theme.accentLight : 'transparent',
              }}
              onClick={() => onNavigate('about', v.key)}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* 个人面向 */}
      {view === 'personal' && (
        <div key="personal" style={{ animation: 'fade-up 0.6s ease-out both', animationDelay: '150ms' }}>
          {/* 上区：左侧（配图+生活切片）与右侧（速览+MBTI）并列 */}
          <div className="flex gap-12">
            {/* 左侧列 */}
            <div className="flex-[2]">
              {/* 配图 */}
              <div className="mb-8 rounded-2xl overflow-hidden" style={{ border: `1px solid ${theme.borderLight}`, height: '280px' }}>
                <img
                  src="/assets/钱学森和袁隆平.png"
                  alt=""
                  className="w-full h-full object-cover"
                  style={{ objectPosition: 'center 30%' }}
                />
              </div>

              <h3 className="text-sm font-semibold tracking-wider uppercase mb-5" style={{ color: theme.text }}>
                生活切片
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { title: '费曼式学习者', desc: '讲给别人听之前，自己先假装讲一遍。' },
                  { title: 'Google 工程思维', desc: '相信简单可扩展的解决方案，无论写代码还是生活。' },
                  { title: '模拟竞速', desc: '更好的走线，更快的入弯。' },
                  { title: '单排 AD', desc: '牢中牢，但是我扛得住。' },
                  { title: '无产主义', desc: '相信劳动的价值。' },
                  { title: '城市漫步', desc: '散步是整理思绪的最佳方式。' },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="p-5 rounded-2xl"
                    style={{ backgroundColor: theme.bgDeep, border: `1px solid ${theme.borderLight}` }}
                  >
                    <p className="text-sm font-semibold mb-1" style={{ color: theme.text }}>
                      {item.title}
                    </p>
                    <p className="text-sm" style={{ color: theme.textSec }}>
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* 右侧列 */}
            <div className="flex-1">
              {/* 速览 */}
              <div className="space-y-6 mb-12" style={{ color: theme.textSec }}>
                {[
                  { label: '位置', value: '中国' },
                  { label: '语言', value: '中文（母语），English（B1）' },
                  { label: 'MBTI', value: 'INTJ-T' },
                  { label: '当前', value: '构建并部署个人网站' },
                ].map((item) => (
                  <div key={item.label}>
                    <p className="text-xs tracking-wider uppercase mb-1" style={{ color: theme.text }}>{item.label}</p>
                    <p className="text-sm">{item.value}</p>
                  </div>
                ))}
              </div>

              {/* MBTI 维度 */}
              <div className="mb-4">
                <h3 className="text-sm font-semibold tracking-wider uppercase mb-5" style={{ color: theme.text }}>
                  MBTI
                </h3>
                <div className="space-y-4">
                  {[
                    {
                      key: 'I',
                      label: '内向', pct: 86, left: '外向', right: '内向', color: '#5A7A82',
                      desc: '往往更喜欢较少但深入和有意义的社交互动，通常更喜欢安静的环境。',
                    },
                    {
                      key: 'N',
                      label: '天马行空', pct: 58, left: '天马行空', right: '求真务实', color: '#B8944F',
                      desc: '将独创性视若珍宝，热衷于探寻那些隐藏在表象之下的深层含义，以及看似遥远却充满希望的可能性。',
                    },
                    {
                      key: 'T',
                      label: '理性思考', pct: 85, left: '理性思考', right: '情感细腻', color: '#5E8268',
                      desc: '注重客观性和合理性，通常不考虑情感，只考虑逻辑。往往认为效率比社会和谐更重要。',
                    },
                    {
                      key: 'J',
                      label: '运筹帷幄', pct: 71, left: '运筹帷幄', right: '随机应变', color: '#7B6B8B',
                      desc: '将明确性、可预测性以及事情的圆满解决奉为圭臬。',
                    },
                    {
                      key: 'T2',
                      label: '情绪易波动', pct: 51, left: '自信果断', right: '情绪易波动', color: '#A06060',
                      desc: '对压力敏感。在情绪上有一种紧迫感，往往以成功为导向，追求完美，渴望进步。',
                    },
                  ].map((d) => (
                    <div
                      key={d.key}
                      className="relative cursor-pointer"
                      onMouseEnter={() => setHoveredDimension(d.key)}
                      onMouseLeave={() => setHoveredDimension(null)}
                    >
                      <p className="text-center text-xs font-medium mb-1.5" style={{ color: hoveredDimension === d.key ? d.color : `${d.color}cc` }}>
                        {d.pct}% {d.label}
                      </p>
                      <div className="relative h-2 rounded-full overflow-hidden" style={{ backgroundColor: theme.border }}>
                        <div
                          className="absolute left-0 top-0 h-full rounded-full"
                          style={{
                            width: `${d.pct}%`,
                            backgroundColor: d.color,
                            filter: hoveredDimension === d.key ? 'none' : 'brightness(0.8)',
                            transition: 'filter 0.25s ease-out',
                          }}
                        />
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-xs" style={{ color: theme.textSec, opacity: 0.5 }}>{d.left}</span>
                        <span className="text-xs" style={{ color: theme.textSec, opacity: 0.5 }}>{d.right}</span>
                      </div>

                      {/* 悬浮解释面板 */}
                      <div
                        className="absolute left-[calc(100%+20px)] top-0 w-72 rounded-xl p-5 pointer-events-none"
                        style={{
                          backgroundColor: theme.bgDeep,
                          border: `1px solid ${theme.border}`,
                          boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                          opacity: hoveredDimension === d.key ? 1 : 0,
                          transform: hoveredDimension === d.key ? 'translateX(0)' : 'translateX(-8px)',
                          transition: 'opacity 0.25s ease-out, transform 0.25s ease-out',
                        }}
                      >
                        <p className="text-xs font-medium mb-2" style={{ color: d.color }}>{d.label}</p>
                        <p className="text-sm leading-relaxed" style={{ color: theme.textSec }}>{d.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <p className="text-[10px] mt-4 text-center" style={{ color: theme.textSec, opacity: 0.4 }}>
                  测试数据更新于半年内 · 未采用大五人格（自填结果误差较大）
                </p>
              </div>
            </div>
          </div>

          {/* 全宽区：价值观 */}
          <div className="mt-12">
              <div
                className="rounded-2xl cursor-pointer select-none transition-all duration-200 ease-out"
                onClick={toggleValues}
                style={{
                  backgroundColor: theme.bgDeep,
                  border: `1px solid ${valuesExpanded ? theme.border : theme.borderLight}`,
                  boxShadow: valuesExpanded ? '0 2px 8px rgba(0,0,0,0.04)' : 'none',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = theme.border
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = valuesExpanded ? theme.border : theme.borderLight
                }}
              >
                {/* 标题行 */}
                <div className="flex items-center justify-between px-5 py-4">
                  <span className="text-sm font-semibold tracking-wider uppercase" style={{ color: theme.text }}>
                    价值观
                  </span>
                  <svg
                    className="w-4 h-4 transition-transform duration-300 ease-out"
                    style={{
                      transform: valuesExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      color: theme.textSec,
                    }}
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M4 6l4 4 4-4" />
                  </svg>
                </div>

                {/* 展开内容 */}
                <div
                  className="overflow-hidden"
                  style={{
                    transition: 'max-height 0.7s ease-out',
                    maxHeight: valuesContentOpen ? '300px' : '0px',
                  }}
                >
                  <div className="grid grid-cols-3 gap-4 px-5 pb-5">
                    {values.map((v) => (
                      <div
                        key={v.title}
                        className="p-4 rounded-xl"
                        style={{
                          backgroundColor: theme.bgCard || theme.bg,
                          border: `1px solid ${theme.borderLight}`,
                        }}
                      >
                        <p className="text-sm font-semibold mb-1" style={{ color: theme.text }}>
                          {v.title}
                        </p>
                        <p className="text-sm" style={{ color: theme.textSec }}>
                          {v.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          {/* 引用卡片 */}
          <div className="mt-12 p-8 rounded-2xl" style={{ backgroundColor: theme.bgDeep, border: `1px solid ${theme.borderLight}` }}>
            <p className="text-xl font-medium italic leading-relaxed" style={{ color: theme.text }}>
              "好的设计是尽可能少的设计。"
            </p>
            <p className="text-sm mt-4" style={{ color: theme.textSec }}>— Dieter Rams</p>
          </div>
        </div>
      )}

      {/* 专业面向 */}
      {view === 'work' && (
        <div key="work" style={{ animation: 'fade-up 0.6s ease-out both', animationDelay: '150ms' }}>
          <div className="space-y-16">
          {/* 简介 */}
          <div>
            <h3 className="text-sm font-semibold tracking-wider uppercase mb-5" style={{ color: theme.text }}>
              简介
            </h3>
            <div className="max-w-prose space-y-4" style={{ color: theme.textSec }}>
              <p className="text-lg leading-relaxed">
                研发工程师，专注于前端工程与系统设计。热衷于用极简的设计思维解决复杂的技术问题。
              </p>
              <p className="leading-relaxed">
                擅长将复杂概念抽象为简单、优雅的解决方案，并在团队中推动工程规范与最佳实践。
              </p>
            </div>
          </div>

          {/* 经验 */}
          <div>
            <h3 className="text-sm font-semibold tracking-wider uppercase mb-5" style={{ color: theme.text }}>
              经验
            </h3>
            <div className="space-y-4">
              {[
                {
                  role: '研发工程师',
                  company: '某公司',
                  period: '2024 — 至今',
                  desc: '负责前端架构与核心功能开发，推动工程规范落地。',
                },
              ].map((exp) => (
                <div
                  key={exp.role}
                  className="p-6 rounded-2xl border"
                  style={{ backgroundColor: theme.bgDeep, borderColor: theme.border }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-base font-semibold" style={{ color: theme.text }}>
                        {exp.role}
                      </p>
                      <p className="text-sm" style={{ color: theme.textSec }}>
                        {exp.company}
                      </p>
                    </div>
                    <span className="text-xs font-mono" style={{ color: theme.textSec }}>
                      {exp.period}
                    </span>
                  </div>
                  <p className="text-sm mt-3" style={{ color: theme.textSec }}>
                    {exp.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* 能力矩阵 */}
          <div>
            <h3 className="text-sm font-semibold tracking-wider uppercase mb-5" style={{ color: theme.text }}>
              能力
            </h3>
            <div className="grid grid-cols-3 gap-5">
              {[
                { label: '前端', items: ['TypeScript', 'React', 'Vite', 'Tailwind CSS'] },
                { label: '后端', items: ['Node.js', 'Python', '系统设计'] },
                { label: '工具', items: ['Git', 'Docker', 'CI/CD'] },
              ].map((cat) => (
                <div key={cat.label} className="p-5 rounded-2xl" style={{ backgroundColor: theme.bgDeep, border: `1px solid ${theme.borderLight}` }}>
                  <p className="text-xs tracking-wider uppercase mb-3" style={{ color: theme.text }}>
                    {cat.label}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {cat.items.map((t) => (
                      <Tag key={t} theme={theme}>{t}</Tag>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 联系 CTA */}
          <div className="flex items-center justify-between p-6 rounded-2xl" style={{ backgroundColor: theme.bgDeep, border: `1px solid ${theme.border}` }}>
            <p className="text-sm" style={{ color: theme.textSec }}>
              想要进一步了解我的工作经历？
            </p>
            <button
              className="px-5 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ease-out"
              style={{ color: theme.accent, border: `1px solid ${theme.border}` }}
              onClick={() => onNavigate('contact')}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme.accentLight
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              联系我
            </button>
          </div>
          </div>
        </div>
      )}
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

function ProjectsPage({ theme, onNavigate: _onNavigate }: { theme: Theme; onNavigate: (s: Section) => void }) {
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

function NotesPage({ theme, onNavigate: _onNavigate }: { theme: Theme; onNavigate: (s: Section) => void }) {
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

function ContactPage({ theme, onNavigate: _onNavigate }: { theme: Theme; onNavigate: (s: Section) => void }) {
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
            { label: '邮箱', value: 'scarecrow_0459@proton.me', href: 'mailto:scarecrow_0459@proton.me' },
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

const sectionMap: Record<Section, React.FC<{ theme: Theme; onNavigate: (s: Section, sub?: AboutView) => void; aboutView?: AboutView }>> = {
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

function App() {
  const [active, setActive] = useState<Section>('home')
  const [aboutView, setAboutView] = useState<AboutView>('personal')
  const theme = themes[sectionTheme[active]]
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
    if (s === 'about' && sub) {
      setAboutView(sub)
      window.history.replaceState(null, '', `#${s}/${sub}`)
    } else {
      window.history.replaceState(null, '', `#${s}`)
    }
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
      <Footer theme={theme} />
    </div>
  )
}

export default App
