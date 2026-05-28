import { useState, useEffect, type ReactNode } from 'react'

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
      <div className="max-w-5xl mx-auto flex items-center justify-between px-4 md:px-8 py-4">
        <span
          className="text-base font-bold tracking-widest cursor-pointer select-none shrink-0"
          style={{ color: theme.text }}
          onClick={() => onNavigate('home')}
        >
          ETHAN C.
        </span>
        <div className="flex gap-1 overflow-x-auto ml-2" style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
          {links.map((l) => (
            <button
              key={l.key}
              className="px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ease-out relative whitespace-nowrap shrink-0"
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
        WebkitMask: `url(${import.meta.env.BASE_URL}assets/avatar.svg) center/contain no-repeat`,
        mask: `url(${import.meta.env.BASE_URL}assets/avatar.svg) center/contain no-repeat`,
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
      <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 w-full relative z-10">

        {/* 两列布局：左侧内容 + 右侧头像 */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-8 md:gap-12 items-start">

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
                正在学习 ROS2
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
  const [valuesHovered, setValuesHovered] = useState(false)
  const [hoveredDimension, setHoveredDimension] = useState<string | null>(null)
  const [blindspotsExpanded, setBlindspotsExpanded] = useState(false)
  const [blindspotsContentOpen, setBlindspotsContentOpen] = useState(false)
  const [blindspotsHovered, setBlindspotsHovered] = useState(false)
  const [hoveredRelTrait, setHoveredRelTrait] = useState<string | null>(null)

  const views: { key: AboutView; label: string }[] = [
    { key: 'personal', label: '生活' },
    { key: 'work', label: '工作' },
  ]

  const values = [
    { title: '追根溯源', desc: '从根本上讲是什么问题导致的？' },
    { title: '高能效比', desc: '不要浪费彼此的时间。' },
    { title: '坚韧毅力', desc: '意志会带我杀出重围。' },
    { title: '追求卓越', desc: '完美主义是把双刃剑。' },
    { title: '终身学习', desc: '保持好奇，持续迭代。' },
    { title: '独立自主', desc: '更倾向独立高效地完成任务。' },
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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-16 sm:py-24 md:py-32">
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
          <div className="flex flex-col md:flex-row gap-8 md:gap-12">
            {/* 左侧列 */}
            <div className="w-full md:flex-[2]">
              {/* 配图 */}
              <div className="mb-6 md:mb-8 rounded-2xl overflow-hidden" style={{ border: `1px solid ${theme.borderLight}`, aspectRatio: '16/9', backgroundColor: theme.bgDeep }}>
                <img
                  src={`${import.meta.env.BASE_URL}assets/qian_xuesen_yuan_longping_style.jpg`}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                  style={{ objectPosition: 'center 30%' }}
                />
              </div>

              <h3 className="text-sm font-semibold tracking-wider uppercase mb-5" style={{ color: theme.text }}>
                生活切片
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                {[
                  { title: '费曼式学习者', desc: '讲给别人听之前，自己先假装讲一遍。' },
                  { title: 'Google 工程思维', desc: '相信简单可扩展的解决方案，无论写代码还是生活。' },
                  { title: '模拟竞速', desc: '更好的走线，更快的入弯。' },
                  { title: '单排 AD', desc: '牢中牢，但我扛得住。' },
                  { title: '共产主义', desc: '相信劳动的价值。' },
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
            <div className="w-full md:flex-1">
              {/* 速览 */}
              <div className="space-y-6 mb-12" style={{ color: theme.textSec }}>
                {[
                  { label: '位置', value: '中国' },
                  { label: '语言', value: '中文（母语），English（B1）' },
                  { label: 'MBTI', value: 'INTJ-T' },
                  { label: '当前', value: '学习 ROS2' },
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
                        className="absolute md:left-[calc(100%+20px)] md:top-0 left-0 top-full mt-2 w-72 max-w-full rounded-xl p-5 pointer-events-none z-10"
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
                  连续三年测评均为 INTJ · 未采用大五人格（自测置信度低）
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
                  border: `1px solid ${valuesHovered || valuesExpanded ? theme.border : theme.borderLight}`,
                  boxShadow: valuesExpanded ? '0 2px 8px rgba(0,0,0,0.04)' : 'none',
                }}
                onMouseEnter={() => setValuesHovered(true)}
                onMouseLeave={() => setValuesHovered(false)}
              >
                {/* 标题行 */}
                <div className="flex items-center justify-between px-3 py-3 sm:px-5 sm:py-4">
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
                    maxHeight: valuesContentOpen ? '600px' : '0px',
                  }}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 px-3 pb-3 sm:px-5 sm:pb-5">
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

          {/* 盲区 */}
          <div className="mt-12">
            <div
              className="rounded-2xl cursor-pointer select-none transition-all duration-200 ease-out"
              onClick={() => {
                if (!blindspotsExpanded) {
                  setBlindspotsExpanded(true)
                  setTimeout(() => setBlindspotsContentOpen(true), 100)
                } else {
                  setBlindspotsContentOpen(false)
                  setTimeout(() => setBlindspotsExpanded(false), 300)
                }
              }}
              style={{
                backgroundColor: theme.bgDeep,
                border: `1px solid ${blindspotsHovered || blindspotsExpanded ? theme.border : theme.borderLight}`,
                boxShadow: blindspotsExpanded ? '0 2px 8px rgba(0,0,0,0.04)' : 'none',
              }}
              onMouseEnter={() => setBlindspotsHovered(true)}
              onMouseLeave={() => setBlindspotsHovered(false)}
            >
              <div className="flex items-center justify-between px-3 py-3 sm:px-5 sm:py-4">
                <span className="text-sm font-semibold tracking-wider uppercase" style={{ color: theme.text }}>
                  人际关系
                </span>
                <svg
                  className="w-4 h-4 transition-transform duration-300 ease-out"
                  style={{
                    transform: blindspotsExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
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
              <div
                className="overflow-hidden"
                style={{
                  transition: 'max-height 0.7s ease-out',
                  maxHeight: blindspotsContentOpen ? '1000px' : '0px',
                }}
              >
                <div className="grid grid-cols-1 gap-3 md:gap-4 px-3 pb-3 sm:px-5 sm:pb-5">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: '#5E8268' }} />
                      <p className="text-xs tracking-wider uppercase" style={{ color: theme.text }}>
                        优
                      </p>
                    </div>
                    {[
                      { title: '冷静', detail: '等会，别急。' },
                      { title: '深入交流', detail: '很有意义，能再跟我说说吗？' },
                      { title: '合伙人责任制', detail: '信守承诺。提供坦率、真诚的建议，提供实际的帮助实现共同目标。' },
                      { title: '激励成长', detail: '无法理解停滞不前。' },
                    ].map((item) => (
                      <div
                        key={item.title}
                        className="p-4 rounded-xl cursor-pointer"
                        style={{
                          backgroundColor: 'rgba(94, 130, 104, 0.06)',
                          borderTop: `1px solid ${hoveredRelTrait === item.title ? 'rgba(94, 130, 104, 0.3)' : 'rgba(94, 130, 104, 0.12)'}`,
                          borderRight: `1px solid ${hoveredRelTrait === item.title ? 'rgba(94, 130, 104, 0.3)' : 'rgba(94, 130, 104, 0.12)'}`,
                          borderBottom: `1px solid ${hoveredRelTrait === item.title ? 'rgba(94, 130, 104, 0.3)' : 'rgba(94, 130, 104, 0.12)'}`,
                          borderLeft: `4px solid rgba(94, 130, 104, 0.5)`,
                          transition: 'border-color 0.2s ease-out',
                        }}
                        onMouseEnter={() => setHoveredRelTrait(item.title)}
                        onMouseLeave={() => setHoveredRelTrait(null)}
                        onClick={(e) => { e.stopPropagation(); setHoveredRelTrait(hoveredRelTrait === item.title ? null : item.title) }}
                      >
                        <p className="text-sm font-semibold" style={{ color: theme.text }}>{item.title}</p>
                        <div
                          className="overflow-hidden"
                          style={{
                            transition: 'max-height 0.5s ease-out, opacity 0.4s ease-out',
                            maxHeight: hoveredRelTrait === item.title ? '100px' : '0px',
                            opacity: hoveredRelTrait === item.title ? 1 : 0,
                          }}
                        >
                          <p className="text-sm leading-relaxed pt-2" style={{ color: theme.textSec }}>{item.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: '#A06060' }} />
                      <p className="text-xs tracking-wider uppercase" style={{ color: theme.text }}>
                        劣
                      </p>
                    </div>
                    {[
                      { title: '情感疏离', detail: '表面功夫的关心会让你觉得温暖吗？' },
                      { title: '压力与强控', detail: '直接批评，忽视情感，追求按自己方式行事，会无意中压制他人的想法与自发性。' },
                      { title: '缺乏耐心', detail: '当他人处理事情慢一点或更情绪化时，容易变得急躁并引发紧张。' },
                      { title: '自我隔离', detail: '当压力大时，会选择独处，他人无法靠近或提供帮助。' },
                    ].map((item) => (
                      <div
                        key={item.title}
                        className="p-4 rounded-xl cursor-pointer"
                        style={{
                          backgroundColor: 'rgba(160, 96, 96, 0.06)',
                          borderTop: `1px solid ${hoveredRelTrait === item.title ? 'rgba(160, 96, 96, 0.3)' : 'rgba(160, 96, 96, 0.12)'}`,
                          borderRight: `1px solid ${hoveredRelTrait === item.title ? 'rgba(160, 96, 96, 0.3)' : 'rgba(160, 96, 96, 0.12)'}`,
                          borderBottom: `1px solid ${hoveredRelTrait === item.title ? 'rgba(160, 96, 96, 0.3)' : 'rgba(160, 96, 96, 0.12)'}`,
                          borderLeft: `4px solid rgba(160, 96, 96, 0.5)`,
                          transition: 'border-color 0.2s ease-out',
                        }}
                        onMouseEnter={() => setHoveredRelTrait(item.title)}
                        onMouseLeave={() => setHoveredRelTrait(null)}
                        onClick={(e) => { e.stopPropagation(); setHoveredRelTrait(hoveredRelTrait === item.title ? null : item.title) }}
                      >
                        <p className="text-sm font-semibold" style={{ color: theme.text }}>{item.title}</p>
                        <div
                          className="overflow-hidden"
                          style={{
                            transition: 'max-height 0.5s ease-out, opacity 0.4s ease-out',
                            maxHeight: hoveredRelTrait === item.title ? '100px' : '0px',
                            opacity: hoveredRelTrait === item.title ? 1 : 0,
                          }}
                        >
                          <p className="text-sm leading-relaxed pt-2" style={{ color: theme.textSec }}>{item.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
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
                图像算法工程师，专注于 3D-AOI 工业视觉与点云处理。
              </p>
              <p className="leading-relaxed">
                擅长从数学推导到 C++ 实现的全链路开发，并在实际产线中验证算法的稳定性与精度。
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
                  role: '图像算法工程师',
                  company: '深圳市振华兴智能',
                  period: '2025 — 至今',
                  details: [
                    '负责 3D-AOI 工业视觉软件的点云处理模块开发',
                    '使用 C++/OpenCV/Eigen 实现相位解包裹与点云重建算法',
                    '基于 Qt Widgets 构建上位机界面',
                  ],
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
                  <ul className="mt-3 space-y-1.5" style={{ color: theme.textSec }}>
                    {exp.details.map((d) => (
                      <li key={d} className="text-sm leading-relaxed list-disc list-inside">
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* 能力矩阵 */}
          <div>
            <h3 className="text-sm font-semibold tracking-wider uppercase mb-5" style={{ color: theme.text }}>
              能力
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
              {[
                { label: '算法', items: ['3D 重建', '相位解包裹', 'OpenCV', 'Eigen'] },
                { label: '开发', items: ['C++', 'Python', 'Qt Widgets'] },
                { label: '工程', items: ['Git', '系统设计'] },
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
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-6 rounded-2xl" style={{ backgroundColor: theme.bgDeep, border: `1px solid ${theme.border}` }}>
            <p className="text-sm" style={{ color: theme.textSec }}>
              想要进一步了解我的技术栈与项目经验？
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

/* ==================== GitHub Contributions ==================== */

const GITHUB_USERNAME = 'Ethan-decoy'

function GitHubContributions() {
  return (
    <div className="overflow-x-auto flex justify-center pb-2 mt-6" style={{ scrollbarWidth: 'none' }}>
      <img
        src={`https://ghchart.rshah.org/${GITHUB_USERNAME}`}
        alt="GitHub Contributions"
        className="block"
        style={{ minWidth: 'fit-content' }}
        referrerPolicy="no-referrer"
      />
    </div>
  )
}

/* ==================== Projects Page ==================== */

function ProjectsPage({ theme }: { theme: Theme; onNavigate: (s: Section) => void }) {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-16 sm:py-24 md:py-32">
      <SectionTitle theme={theme}>项目</SectionTitle>

      {/* 贡献图 */}
      <div style={{ animation: 'fade-up 0.6s ease-out both', animationDelay: '100ms' }}>
        <GitHubContributions />
      </div>

      <div
        className="p-6 rounded-2xl mt-6 sm:p-8"
        style={{
          animation: 'fade-up 0.6s ease-out both',
          animationDelay: '150ms',
          backgroundColor: theme.bgDeep,
          border: `1px solid ${theme.borderLight}`,
        }}
      >
        <p className="text-base leading-relaxed" style={{ color: theme.textSec }}>
          目前还没有公开的开源项目仓库。
        </p>
        <p className="text-sm mt-2" style={{ color: theme.textSec, opacity: 0.6 }}>
          尚未整理为公开仓库，后续收录后会在此更新。
        </p>
      </div>
    </div>
  )
}

/* ==================== Notes Page ==================== */

import { treeData, modules, indexMap, searchNotes, getSuggestions, parseFrontmatter } from './notes'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypePrettyCode from 'rehype-pretty-code'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'

function parseMarkdownBody(raw: string) {
  raw = raw.replace(/\r\n/g, '\n')
  const m = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/)
  return m ? m[2].trim() : raw.trim()
}

function MarkdownPreview({ content, theme }: { content: string; theme: Theme }) {
  // react-markdown v10 passes { node, ...rest }; destructure to exclude `node` from spread
  const h = (
    Tag: 'h1' | 'h2' | 'h3' | 'h4',
    className: string,
    style?: React.CSSProperties,
  ) => ({ children, ...rest }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <Tag className={className} style={style} {...rest}>{children}</Tag>
  )

  return (
    <div className="max-w-2xl prose-note" style={{ color: theme.text }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          rehypeSlug,
          rehypeAutolinkHeadings,
          [rehypePrettyCode, { theme: 'min-light' }],
        ]}
        components={{
          h1: h('h1', 'text-2xl font-bold tracking-tight mt-8 mb-4', { color: theme.text }),
          h2: h('h2', 'text-xl font-bold tracking-tight mt-8 mb-3', { color: theme.text }),
          h3: h('h3', 'text-lg font-semibold mt-6 mb-2', { color: theme.text }),
          h4: h('h4', 'text-base font-semibold mt-4 mb-2', { color: theme.text }),
          p: ({ children, ...rest }) => (
            <p className="text-base leading-relaxed mb-4 last:mb-0" style={{ color: theme.text }} {...rest}>{children}</p>
          ),
          a: ({ children, ...rest }) => (
            <a className="underline transition-colors duration-150" style={{ color: theme.accent }} onMouseEnter={(e) => { (e.target as HTMLElement).style.color = theme.accentHover }} onMouseLeave={(e) => { (e.target as HTMLElement).style.color = theme.accent }} {...rest}>
              {children}
            </a>
          ),
          ul: ({ children, ...rest }) => (
            <ul className="list-disc list-inside space-y-1 mb-4 ml-2" style={{ color: theme.textSec }} {...rest}>{children}</ul>
          ),
          ol: ({ children, ...rest }) => (
            <ol className="list-decimal list-inside space-y-1 mb-4 ml-2" style={{ color: theme.textSec }} {...rest}>{children}</ol>
          ),
          li: ({ children, ...rest }) => (
            <li className="text-base leading-relaxed" style={{ color: theme.textSec }} {...rest}>{children}</li>
          ),
          blockquote: ({ children, ...rest }) => (
            <blockquote className="border-l-4 pl-4 italic mb-4" style={{ borderColor: theme.border, color: theme.textSec }} {...rest}>{children}</blockquote>
          ),
          code: ({ children, ...rest }) => (
            <code className="px-1.5 py-0.5 rounded text-sm font-mono" style={{ backgroundColor: theme.accentLight, color: theme.accent }} {...rest}>{children}</code>
          ),
          pre: ({ children, ...rest }) => (
            <pre className="rounded-xl overflow-x-auto mb-4 p-4 text-sm font-mono leading-relaxed" style={{ backgroundColor: theme.bgDeep, border: `1px solid ${theme.border}` }} {...rest}>{children}</pre>
          ),
          table: ({ children, ...rest }) => (
            <div className="overflow-x-auto mb-4">
              <table className="w-full text-sm border-collapse" style={{ borderColor: theme.border }} {...rest}>
                {children}
              </table>
            </div>
          ),
          th: ({ children, ...rest }) => (
            <th className="border px-3 py-2 text-left font-semibold" style={{ borderColor: theme.border, backgroundColor: theme.accentLight, color: theme.text }} {...rest}>{children}</th>
          ),
          td: ({ children, ...rest }) => (
            <td className="border px-3 py-2" style={{ borderColor: theme.border, color: theme.textSec }} {...rest}>{children}</td>
          ),
          hr: () => <div className="my-6 h-px" style={{ backgroundColor: theme.borderLight }} />,
          img: ({ ...rest }) => (
            <img className="rounded-lg max-w-full my-4" style={{ border: `1px solid ${theme.border}` }} {...rest} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

/* ---- Nested Tree Node ---- */
interface FileNode { title: string; date: string; order?: number; file: string }
interface TreeNode { key: string; title: string; children: (TreeNode | FileNode)[]; isDir: boolean }

function isTreeNode(node: TreeNode | FileNode): node is TreeNode {
  return 'key' in node
}

function buildNestedTree(): TreeNode[] {
  const root: Record<string, any> = {}
  for (const file of Object.keys(modules)) {
    if (file.endsWith('/_index.md')) continue
    const parts = file.replace(/^\.\//, '').split('/')
    let node = root
    for (let i = 0; i < parts.length - 1; i++) {
      const p = parts[i]
      const k = parts.slice(0, i + 1).join('/')
      if (!node[k]) node[k] = { key: k, title: p, children: {} }
      node = node[k].children
    }
    const fname = parts[parts.length - 1]
    node[fname] = { file }
  }

  function walk(obj: Record<string, any>): (TreeNode | FileNode)[] {
    const results: (TreeNode | FileNode)[] = []
    for (const k of Object.keys(obj)) {
      const v = obj[k]
      if ('file' in v) {
        const fm = parseFrontmatter(modules[v.file] || '')
        results.push({ title: fm.title, date: fm.date, order: fm.order, file: v.file })
      } else if ('key' in v) {
        const children = walk(v.children || {})
        const hasIndex = !!indexMap[v.key]
        results.push({
          key: v.key,
          title: hasIndex ? indexMap[v.key].title : v.title,
          children,
          isDir: true,
        })
      }
    }
    return results
  }
  // 顶层只返回目录节点
  return walk(root).filter(isTreeNode)
}

const nestedTree = buildNestedTree()

/* ---- Recursive Sidebar Node ---- */
function SidebarNode({
  node, theme, depth,
  expandedKeys, onToggle, selectedFile, onOpen,
}: {
  node: TreeNode; theme: Theme; depth: number;
  expandedKeys: Set<string>; onToggle: (key: string) => void;
  selectedFile: string | null; onOpen: (file: string, title: string) => void;
}) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)
  const expanded = expandedKeys.has(node.key)

  // Collect files in this node
  const fileChildren: { title: string; date: string; order?: number; file: string }[] = []
  const dirChildren: TreeNode[] = []
  for (const c of node.children) {
    if (isTreeNode(c)) dirChildren.push(c)
    else {
      const fm = parseFrontmatter(modules[c.file] || '')
      fileChildren.push({ title: fm.title, date: fm.date, order: fm.order, file: c.file })
    }
  }
  fileChildren.sort((a, b) => {
    if (a.order !== undefined && b.order !== undefined) return a.order - b.order
    if (a.order !== undefined) return -1
    if (b.order !== undefined) return 1
    return a.title.localeCompare(b.title)
  })

  const hasContent = fileChildren.length > 0 || dirChildren.length > 0 || indexMap[node.key]

  return (
    <div style={{ marginLeft: depth > 0 ? 12 : 0 }}>
      {/* Directory row */}
      <div
        className="flex items-center gap-1.5 w-full py-1.5 text-left cursor-pointer rounded-r transition-colors duration-150"
        style={{
          backgroundColor: selectedFile && indexMap[node.key] && selectedFile === `./${node.key}/_index.md` ? theme.accentLight : 'transparent',
        }}
        onClick={() => {
          if (hasContent) onToggle(node.key)
          if (indexMap[node.key]) {
            const idx = indexMap[node.key]
            onOpen(`./${node.key}/_index.md`, idx.title)
          }
        }}
      >
        <svg
          className="w-2.5 h-2.5 transition-transform duration-200 ease-out shrink-0"
          style={{
            transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
            color: theme.accent,
            opacity: hasContent ? 1 : 0.15,
          }}
          viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"
        >
          <path d="M6 4l4 4-4 4" />
        </svg>
        <span
          className="text-xs font-semibold uppercase tracking-wider truncate"
          style={{ color: theme.text, fontSize: depth > 0 ? '0.6rem' : undefined }}
        >
          {node.title}
        </span>
      </div>

      {/* Expanded children */}
      <div
        className="overflow-hidden"
        style={{
          transition: 'max-height 0.4s ease-out, opacity 0.3s ease-out',
          maxHeight: expanded ? '800px' : '0px',
          opacity: expanded ? 1 : 0,
        }}
      >
        {/* File children */}
        {fileChildren.length > 0 && (
          <div style={{ borderLeft: `1px solid ${theme.border}`, marginLeft: 10 }}>
            {fileChildren.map((f, i) => (
              <div
                key={f.file}
                className="py-1 pl-3 pr-2 cursor-pointer text-sm transition-colors duration-200 rounded-r"
                style={{
                  backgroundColor: selectedFile === f.file ? theme.accentLight : (hoveredIdx === i ? theme.accentLight + '60' : 'transparent'),
                  color: selectedFile === f.file ? theme.text : theme.textSec,
                }}
                onClick={() => onOpen(f.file, f.title)}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                {f.title}
              </div>
            ))}
          </div>
        )}
        {/* Dir children */}
        {dirChildren.map((d) => (
          <SidebarNode
            key={d.key} node={d} theme={theme} depth={depth + 1}
            expandedKeys={expandedKeys} onToggle={onToggle}
            selectedFile={selectedFile} onOpen={onOpen}
          />
        ))}
      </div>
    </div>
  )
}

function NotesPage({ theme }: { theme: Theme; onNavigate: (s: Section) => void }) {
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(() => {
    const s = new Set<string>()
    if (nestedTree.length > 0) s.add(nestedTree[0].key)
    return s
  })
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [selectedNote, setSelectedNote] = useState<{ title: string; date: string; content: string; file: string } | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)

  const toggleKey = (key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key); else next.add(key)
      return next
    })
  }

  const openNote = (file: string, title: string) => {
    const raw = modules[file]
    if (!raw) return
    const fm = parseFrontmatter(raw)
    setSelectedNote({
      title: fm.title || title,
      date: fm.date,
      content: parseMarkdownBody(raw),
      file,
    })
    setSearchQuery('')
    setSearchFocused(false)
  }

  const suggestions = searchFocused && searchQuery ? getSuggestions(searchQuery) : []
  const searchResults = searchQuery ? searchNotes(searchQuery) : []

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-16 sm:py-24 md:py-32">
      <SectionTitle theme={theme}>笔记</SectionTitle>

      {treeData.length === 0 ? (
        <div style={{ animation: 'fade-up 0.6s ease-out both', animationDelay: '150ms' }}>
          <p className="text-sm mt-8 leading-relaxed" style={{ color: theme.textSec }}>
            还没有笔记。
          </p>
          <p className="text-xs mt-2" style={{ color: theme.textSec, opacity: 0.5 }}>
            在 src/notes/ 下创建子目录并放入 .md 文件即可自动收录。
          </p>
        </div>
      ) : (
        <div className="mt-8 flex gap-6 md:gap-8" style={{ animation: 'fade-up 0.6s ease-out both', animationDelay: '150ms' }}>
          {/* 左侧栏：搜索 + 分类树 */}
          <div className="w-full md:w-56 md:shrink-0" style={{ color: theme.textSec }}>
            {/* 搜索框 */}
            <div className="relative mb-3">
              <input
                type="text"
                placeholder="搜索笔记..."
                className="w-full px-3 py-2 text-sm rounded-xl outline-none transition-all duration-200"
                style={{
                  backgroundColor: theme.bgDeep,
                  border: `1px solid ${searchFocused ? theme.accent : theme.border}`,
                  color: theme.text,
                }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
              />
              {/* 自动补全下拉 */}
              {suggestions.length > 0 && (
                <div
                  className="absolute top-full left-0 right-0 mt-1 rounded-xl overflow-hidden z-50"
                  style={{ backgroundColor: theme.bgDeep, border: `1px solid ${theme.border}`, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                >
                  {suggestions.map((s, i) => (
                    <div
                      key={s}
                      className="px-3 py-2 text-sm cursor-pointer transition-colors duration-100"
                      style={{
                        backgroundColor: i === 0 ? theme.accentLight : 'transparent',
                        color: theme.textSec,
                      }}
                      onMouseDown={() => openNote(
                        Object.entries(modules).find(([, raw]) => parseFrontmatter(raw).title === s)?.[0] || '',
                        s
                      )}
                    >
                      {s}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 搜索结果列表 */}
            {searchQuery && searchResults.length > 0 && (
              <div className="mb-3 rounded-xl p-2" style={{ backgroundColor: theme.bgDeep, border: `1px solid ${theme.border}` }}>
                <p className="text-[10px] uppercase tracking-wider mb-1 px-1" style={{ color: theme.textSec, opacity: 0.4 }}>
                  {searchResults.length} 条结果
                </p>
                {searchResults.slice(0, 8).map((r) => (
                  <div
                    key={r.file}
                    className="px-2 py-1.5 text-sm cursor-pointer rounded transition-colors duration-100"
                    style={{ color: theme.textSec }}
                    onClick={() => openNote(r.file, r.title)}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = theme.accentLight }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                  >
                    {r.title}
                  </div>
                ))}
              </div>
            )}

            {/* 手机端折叠/展开按钮 */}
            <button
              className="md:hidden flex items-center justify-between w-full py-3 px-4 rounded-xl mb-2"
              style={{ backgroundColor: theme.bgDeep, border: `1px solid ${theme.border}` }}
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            >
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: theme.text }}>
                笔记分类
              </span>
              <svg
                className="w-3 h-3 transition-transform duration-200 ease-out"
                style={{ transform: mobileSidebarOpen ? 'rotate(90deg)' : 'rotate(0deg)', color: theme.accent }}
                viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"
              >
                <path d="M6 4l4 4-4 4" />
              </svg>
            </button>

            {/* 树内容 */}
            <div className={mobileSidebarOpen ? 'block' : 'hidden md:block'}>
              {!searchQuery && nestedTree.map((node) => (
                <SidebarNode
                  key={node.key} node={node} theme={theme} depth={0}
                  expandedKeys={expandedKeys} onToggle={toggleKey}
                  selectedFile={selectedNote?.file || null} onOpen={openNote}
                />
              ))}
            </div>
          </div>

          {/* 右侧：笔记详情 */}
          <div className="flex-1 min-w-0">
            {selectedNote ? (
              <div key={selectedNote.file} style={{ animation: 'fade-up 0.5s ease-out both', animationDelay: '0ms' }}>
                <div className="mb-10 pb-6" style={{ borderBottom: `1px solid ${theme.borderLight}` }}>
                  <h3 className="text-xl font-bold tracking-tight mb-2" style={{ color: theme.text }}>{selectedNote.title}</h3>
                  <span className="text-xs font-mono" style={{ color: theme.textSec, opacity: 0.4 }}>{selectedNote.date}</span>
                </div>
                <MarkdownPreview content={selectedNote.content} theme={theme} />
              </div>
            ) : (
              <div className="flex items-center justify-center h-48">
                <p className="text-sm" style={{ color: theme.textSec, opacity: 0.3 }}>
                  选择一篇笔记开始阅读
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/* ==================== Contact Page ==================== */

function TypingText({ text, className, style, delay = 0, cursorColor = '#333' }: { text: string; className?: string; style?: React.CSSProperties; delay?: number; cursorColor?: string }) {
  const [visible, setVisible] = useState(0)
  useEffect(() => {
    const startTimer = setTimeout(() => {
      let i = 0
      const timer = setInterval(() => {
        i++
        setVisible(i)
        if (i >= text.length) clearInterval(timer)
      }, 20)
      return () => clearInterval(timer)
    }, delay)
    return () => clearTimeout(startTimer)
  }, [text.length, delay])
  return (
    <span className={className} style={style}>
      {text.slice(0, visible)}
      {visible < text.length && (
        <span
          className="inline-block w-2 h-[1.2em] align-text-bottom"
          style={{ backgroundColor: cursorColor, marginLeft: '1px', animation: 'blink 1s step-end infinite' }}
        />
      )}
    </span>
  )
}

function ContactPage({ theme, onNavigate: _onNavigate }: { theme: Theme; onNavigate: (s: Section) => void }) {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-16 sm:py-24 md:py-32">
      <SectionTitle theme={theme}>联系</SectionTitle>

      <div
        className="grid grid-cols-1 sm:grid-cols-2 gap-8 md:gap-12 mt-8"
        style={{ animation: 'fade-up 0.6s ease-out both', animationDelay: '150ms' }}
      >
        <div className="space-y-5 max-w-md" style={{ color: theme.textSec }}>
          <p className="text-base leading-relaxed">
            如果你想聊聊技术、合作想法，或者只是想打个招呼，欢迎联系。
          </p>
        </div>

        <div className="space-y-8">
          {[
            { label: '邮箱', value: 'decoy.elevate399@passinbox.com', href: 'mailto:decoy.elevate399@passinbox.com' },
            { label: 'GitHub', value: 'github.com/Ethan-decoy', href: 'https://github.com/Ethan-decoy' },
          ].map((item) => (
            <div key={item.label}>
              <p className="text-xs font-semibold tracking-wider uppercase mb-2" style={{ color: theme.textSec, opacity: 0.5 }}>
                {item.label}
              </p>
              <a
                href={item.href}
                className="text-base leading-relaxed transition-all duration-200 ease-out"
                style={{ color: theme.accent, fontFamily: "'JetBrains Mono', 'Fira Code', Menlo, Consolas, monospace" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = theme.accentHover
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = theme.accent
                }}
              >
                <TypingText text={item.value} cursorColor={theme.accent} />
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ==================== Footer ==================== */

function Footer({ theme, onNavigate }: { theme: Theme; onNavigate: (s: Section) => void }) {
  return (
    <footer className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-8" style={{ borderTop: `1px solid ${theme.borderLight}` }}>
      <div className="flex justify-between items-center">
        <p className="text-xs tracking-wide" style={{ color: theme.textSec }}>
          &copy; 2026 Ethan C.
        </p>
        <a
          className="text-xs font-medium transition-all duration-200 ease-out cursor-pointer"
          style={{ color: theme.textSec }}
          onClick={() => onNavigate('contact')}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = theme.accent
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = theme.textSec
          }}
        >
          联系
        </a>
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
      <Footer theme={theme} onNavigate={navigate} />
    </div>
  )
}

export default App
