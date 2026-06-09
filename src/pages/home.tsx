import { useState } from 'react'
import { type Section, type Theme } from '../themes'

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

export default function HomePage({ theme, onNavigate }: { theme: Theme; onNavigate: (s: Section) => void }) {
  const [secondLineVisible, setSecondLineVisible] = useState(false)
  return (
    <div className="min-h-screen flex flex-col justify-center relative overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 w-full relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-8 md:gap-12 items-start">
          <div className="space-y-10">
            <div className="flex items-center gap-3" style={{ animation: 'fade-up 0.6s ease-out both', animationDelay: '0ms' }}>
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping" style={{ backgroundColor: theme.accent }} />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full" style={{ backgroundColor: theme.accent }} />
              </span>
              <p className="text-xs font-semibold tracking-[0.2em] uppercase" style={{ color: theme.accent }}>正在学习 ROS2</p>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-[1.05]" style={{ color: theme.text, animation: 'fade-up 0.6s ease-out both', animationDelay: '100ms' }}>
              我是 Ethan C.<br />
              <span className="font-normal" style={{ color: theme.textSec }}>R&amp;D / 探索者.</span>
            </h1>

            <div className="space-y-3 max-w-md" style={{ animation: 'fade-up 0.6s ease-out both', animationDelay: '250ms' }}>
              <p className="text-lg leading-relaxed" style={{ color: theme.textSec }}>在这里记录我的探索与思考。</p>
              <p className="text-base leading-relaxed cursor-default select-none" onMouseEnter={() => setSecondLineVisible(true)} onMouseLeave={() => setSecondLineVisible(false)} style={{ color: theme.textSec, opacity: secondLineVisible ? 0.7 : 0, transition: 'opacity 0.5s ease-out' }}>
                我相信好的工具应该隐形，让你专注于真正重要的事情。
              </p>
            </div>

            <div className="h-px w-16" style={{ backgroundColor: theme.border, animation: 'fade-in 0.6s ease-out both', animationDelay: '400ms' }} />

            <div className="space-y-6" style={{ animation: 'fade-up 0.6s ease-out both', animationDelay: '500ms' }}>
              <blockquote className="text-sm italic max-w-sm" style={{ color: theme.textSec }}>"先做人民需要的工程师，再做自己时间的主人。"</blockquote>
              <button className="px-6 py-3 text-sm font-medium text-white rounded-xl transition-all duration-200 ease-out shadow-sm" style={{ backgroundColor: theme.accent }} onClick={() => onNavigate('about')} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = theme.accentHover; e.currentTarget.style.transform = 'translateY(-1px)' }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = theme.accent; e.currentTarget.style.transform = 'translateY(0)' }}>了解我</button>
            </div>
          </div>

          <div className="hidden md:flex items-center justify-center pt-8" style={{ animation: 'fade-up 0.8s ease-out both', animationDelay: '300ms' }}>
            <SmileyAvatar theme={theme} />
          </div>
        </div>
      </div>
    </div>
  )
}
