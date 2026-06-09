import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { type Section, type Theme } from '../themes'
import { SectionTitle, Tag } from '../components'

type AboutView = 'personal' | 'work'

/* ==================== About View Switcher ==================== */

function ViewSwitcher({ view, theme, onSelect }: { view: AboutView; theme: Theme; onSelect: (v: AboutView) => void }) {
  const [open, setOpen] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const views: { key: AboutView; label: string }[] = [
    { key: 'work', label: '工作' },
    { key: 'personal', label: '生活' },
  ]
  const current = views.find((v) => v.key === view)!

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      const target = e.target as Node
      if (!wrapperRef.current?.contains(target) && !panelRef.current?.contains(target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const [rect, setRect] = useState<DOMRect | null>(null)
  useEffect(() => { if (!open || !btnRef.current) return; setRect(btnRef.current.getBoundingClientRect()) }, [open])

  const dropdown = open ? (
    <div ref={panelRef} style={{ position: 'fixed', top: rect ? `${rect.bottom + 6}px` : 0, left: rect ? `${rect.left}px` : 0, minWidth: rect ? `${rect.width}px` : 'auto', zIndex: 100, animation: 'fade-up 150ms ease-out both', backgroundColor: theme.bg, border: `1px solid ${theme.border}`, borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', padding: '4px' }}>
      {views.map((v) => (
        <button key={v.key} onClick={() => { onSelect(v.key); setOpen(false) }} className="w-full text-left px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ease-out" style={{ color: view === v.key ? theme.accent : theme.textSec, backgroundColor: view === v.key ? theme.accentLight : 'transparent' }}>{v.label}</button>
      ))}
    </div>
  ) : null

  return (
    <div ref={wrapperRef} className="mb-3" style={{ width: 'fit-content' }}>
      <button ref={btnRef} onClick={() => setOpen((v) => !v)} className="px-4 py-2 text-sm font-medium rounded-xl cursor-pointer transition-all duration-200 ease-out flex items-center gap-2" style={{ color: theme.text, backgroundColor: theme.bg, borderColor: open ? theme.accent : theme.border, borderWidth: '1px', borderStyle: 'solid', boxShadow: open ? `0 4px 12px ${theme.border}` : '0 1px 2px rgba(0,0,0,0.05)', transform: open ? 'translateY(-1px)' : 'none' }}>
        {current.label}
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ transition: 'transform 200ms ease-out', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', color: theme.textSec }}><path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      {open && createPortal(dropdown, document.body)}
    </div>
  )
}

export default function AboutPage({ theme, onNavigate, aboutView }: { theme: Theme; onNavigate: (s: Section, sub?: AboutView) => void; aboutView?: AboutView }) {
  const view = aboutView ?? 'work'
  const [valuesExpanded, setValuesExpanded] = useState(false)
  const [valuesContentOpen, setValuesContentOpen] = useState(false)
  const [valuesHovered, setValuesHovered] = useState(false)
  const [hoveredDimension, setHoveredDimension] = useState<string | null>(null)
  const [blindspotsExpanded, setBlindspotsExpanded] = useState(false)
  const [blindspotsContentOpen, setBlindspotsContentOpen] = useState(false)
  const [blindspotsHovered, setBlindspotsHovered] = useState(false)
  const [hoveredRelTrait, setHoveredRelTrait] = useState<string | null>(null)

  const values = [
    { title: '追根溯源', desc: '从根本上讲是什么问题导致的？' },
    { title: '高能效比', desc: '不要浪费彼此的时间。' },
    { title: '坚韧毅力', desc: '意志会带我杀出重围。' },
    { title: '追求卓越', desc: '完美主义是把双刃剑。' },
    { title: '终身学习', desc: '保持好奇，持续迭代。' },
    { title: '独立自主', desc: '更倾向独立高效地完成任务。' },
  ]

  const toggleValues = () => {
    if (!valuesExpanded) { setValuesExpanded(true); setTimeout(() => setValuesContentOpen(true), 100) }
    else { setValuesContentOpen(false); setTimeout(() => setValuesExpanded(false), 300) }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-16 sm:py-24 md:py-32">
      <div style={{ animation: 'fade-up 0.6s ease-out both', animationDelay: '0ms' }}>
        <SectionTitle theme={theme}>关于</SectionTitle>
        <ViewSwitcher view={view} theme={theme} onSelect={(v) => onNavigate('about', v)} />
      </div>

      {view === 'personal' && (
        <div key="personal" style={{ animation: 'fade-up 0.6s ease-out both', animationDelay: '150ms' }}>
          <div className="flex flex-col md:flex-row gap-8 md:gap-12">
            <div className="w-full md:flex-[2]">
              <div className="mb-6 md:mb-8 rounded-2xl overflow-hidden" style={{ border: `1px solid ${theme.borderLight}`, aspectRatio: '16/9', backgroundColor: theme.bgDeep }}>
                <img src={`${import.meta.env.BASE_URL}assets/qian_xuesen_yuan_longping_style.jpg`} alt="" className="w-full h-full object-cover" loading="lazy" decoding="async" style={{ objectPosition: 'center 30%' }} />
              </div>
              <h3 className="text-sm font-semibold tracking-wider uppercase mb-5" style={{ color: theme.text }}>生活切片</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                {[
                  { title: '费曼式学习者', desc: '讲给别人听之前，自己先假装讲一遍。' },
                  { title: 'Google 工程思维', desc: '相信简单可扩展的解决方案，无论写代码还是生活。' },
                  { title: '模拟竞速', desc: '更好的走线，更快的入弯。' },
                  { title: '单排 AD', desc: '...' },
                  { title: '共产主义', desc: '相信劳动的价值。' },
                  { title: '城市漫步', desc: '散步是整理思绪的最佳方式。' },
                ].map((item) => (
                  <div key={item.title} className="p-5 rounded-2xl" style={{ backgroundColor: theme.bgDeep, border: `1px solid ${theme.borderLight}` }}>
                    <p className="text-sm font-semibold mb-1" style={{ color: theme.text }}>{item.title}</p>
                    <p className="text-sm" style={{ color: theme.textSec }}>{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="w-full md:flex-1">
              <div className="space-y-6 mb-12" style={{ color: theme.textSec }}>
                {[{ label: '位置', value: '中国' }, { label: '语言', value: '中文（母语），English（B1）' }, { label: 'MBTI', value: 'INTJ-T' }, { label: '当前', value: '学习 ROS2' }].map((item) => (
                  <div key={item.label}><p className="text-xs tracking-wider uppercase mb-1" style={{ color: theme.text }}>{item.label}</p><p className="text-sm">{item.value}</p></div>
                ))}
              </div>

              <div className="mb-4">
                <h3 className="text-sm font-semibold tracking-wider uppercase mb-5" style={{ color: theme.text }}>MBTI</h3>
                <div className="space-y-4">
                  {[
                    { key: 'I', label: '内向', pct: 86, left: '外向', right: '内向', color: '#5A7A82', desc: '往往更喜欢较少但深入和有意义的社交互动，通常更喜欢安静的环境。' },
                    { key: 'N', label: '天马行空', pct: 58, left: '天马行空', right: '求真务实', color: '#B8944F', desc: '将独创性视若珍宝，热衷于探寻那些隐藏在表象之下的深层含义，以及看似遥远却充满希望的可能性。' },
                    { key: 'T', label: '理性思考', pct: 85, left: '理性思考', right: '情感细腻', color: '#5E8268', desc: '注重客观性和合理性，通常不考虑情感，只考虑逻辑。往往认为效率比社会和谐更重要。' },
                    { key: 'J', label: '运筹帷幄', pct: 71, left: '运筹帷幄', right: '随机应变', color: '#7B6B8B', desc: '将明确性、可预测性以及事情的圆满解决奉为圭臬。' },
                    { key: 'T2', label: '情绪易波动', pct: 51, left: '自信果断', right: '情绪易波动', color: '#A06060', desc: '对压力敏感。在情绪上有一种紧迫感，往往以成功为导向，追求完美，渴望进步。' },
                  ].map((d) => (
                    <div key={d.key} className="relative cursor-pointer" onMouseEnter={() => setHoveredDimension(d.key)} onMouseLeave={() => setHoveredDimension(null)}>
                      <p className="text-center text-xs font-medium mb-1.5" style={{ color: hoveredDimension === d.key ? d.color : `${d.color}cc` }}>{d.pct}% {d.label}</p>
                      <div className="relative h-2 rounded-full overflow-hidden" style={{ backgroundColor: theme.border }}>
                        <div className="absolute left-0 top-0 h-full rounded-full" style={{ width: `${d.pct}%`, backgroundColor: d.color, filter: hoveredDimension === d.key ? 'none' : 'brightness(0.8)', transition: 'filter 0.25s ease-out' }} />
                      </div>
                      <div className="flex justify-between mt-1"><span className="text-xs" style={{ color: theme.textSec, opacity: 0.5 }}>{d.left}</span><span className="text-xs" style={{ color: theme.textSec, opacity: 0.5 }}>{d.right}</span></div>
                      <div className="absolute md:left-[calc(100%+20px)] md:top-0 left-0 top-full mt-2 w-72 max-w-full rounded-xl p-5 pointer-events-none z-10" style={{ backgroundColor: theme.bgDeep, border: `1px solid ${theme.border}`, boxShadow: '0 4px 16px rgba(0,0,0,0.06)', opacity: hoveredDimension === d.key ? 1 : 0, transform: hoveredDimension === d.key ? 'translateX(0)' : 'translateX(-8px)', transition: 'opacity 0.25s ease-out, transform 0.25s ease-out' }}>
                        <p className="text-xs font-medium mb-2" style={{ color: d.color }}>{d.label}</p>
                        <p className="text-sm leading-relaxed" style={{ color: theme.textSec }}>{d.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] mt-4 text-center" style={{ color: theme.textSec, opacity: 0.4 }}>连续三年测评均为 INTJ · 未采用大五人格（自测置信度低）</p>
              </div>
            </div>
          </div>

          <div className="mt-12">
            <div className="rounded-2xl cursor-pointer select-none transition-all duration-200 ease-out" onClick={toggleValues} style={{ backgroundColor: theme.bgDeep, border: `1px solid ${valuesHovered || valuesExpanded ? theme.border : theme.borderLight}`, boxShadow: valuesExpanded ? '0 2px 8px rgba(0,0,0,0.04)' : 'none' }} onMouseEnter={() => setValuesHovered(true)} onMouseLeave={() => setValuesHovered(false)}>
              <div className="flex items-center justify-between px-3 py-3 sm:px-5 sm:py-4">
                <span className="text-sm font-semibold tracking-wider uppercase" style={{ color: theme.text }}>价值观</span>
                <svg className="w-4 h-4 transition-transform duration-300 ease-out" style={{ transform: valuesExpanded ? 'rotate(180deg)' : 'rotate(0deg)', color: theme.textSec }} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 6l4 4 4-4" /></svg>
              </div>
              <div className="overflow-hidden" style={{ transition: 'max-height 0.7s ease-out', maxHeight: valuesContentOpen ? '600px' : '0px' }}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 px-3 pb-3 sm:px-5 sm:pb-5">
                  {values.map((v) => (<div key={v.title} className="p-4 rounded-xl" style={{ backgroundColor: theme.bgCard || theme.bg, border: `1px solid ${theme.borderLight}` }}><p className="text-sm font-semibold mb-1" style={{ color: theme.text }}>{v.title}</p><p className="text-sm" style={{ color: theme.textSec }}>{v.desc}</p></div>))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12">
            <div className="rounded-2xl cursor-pointer select-none transition-all duration-200 ease-out" onClick={() => { if (!blindspotsExpanded) { setBlindspotsExpanded(true); setTimeout(() => setBlindspotsContentOpen(true), 100) } else { setBlindspotsContentOpen(false); setTimeout(() => setBlindspotsExpanded(false), 300) } }} style={{ backgroundColor: theme.bgDeep, border: `1px solid ${blindspotsHovered || blindspotsExpanded ? theme.border : theme.borderLight}`, boxShadow: blindspotsExpanded ? '0 2px 8px rgba(0,0,0,0.04)' : 'none' }} onMouseEnter={() => setBlindspotsHovered(true)} onMouseLeave={() => setBlindspotsHovered(false)}>
              <div className="flex items-center justify-between px-3 py-3 sm:px-5 sm:py-4">
                <span className="text-sm font-semibold tracking-wider uppercase" style={{ color: theme.text }}>人际关系</span>
                <svg className="w-4 h-4 transition-transform duration-300 ease-out" style={{ transform: blindspotsExpanded ? 'rotate(180deg)' : 'rotate(0deg)', color: theme.textSec }} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 6l4 4 4-4" /></svg>
              </div>
              <div className="overflow-hidden" style={{ transition: 'max-height 0.7s ease-out', maxHeight: blindspotsContentOpen ? '1000px' : '0px' }}>
                <div className="grid grid-cols-1 gap-3 md:gap-4 px-3 pb-3 sm:px-5 sm:pb-5">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-1"><span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: '#5E8268' }} /><p className="text-xs tracking-wider uppercase" style={{ color: theme.text }}>优</p></div>
                    {[{ title: '冷静', detail: '等会，别急。' }, { title: '深入交流', detail: '很有意义，能再跟我说说吗？' }, { title: '合伙人责任制', detail: '信守承诺。提供坦率、真诚的建议，提供实际的帮助实现共同目标。' }, { title: '激励成长', detail: '无法理解停滞不前。' }].map((item) => (
                      <div key={item.title} className="p-4 rounded-xl cursor-pointer" style={{ backgroundColor: 'rgba(94, 130, 104, 0.06)', borderTop: `1px solid ${hoveredRelTrait === item.title ? 'rgba(94, 130, 104, 0.3)' : 'rgba(94, 130, 104, 0.12)'}`, borderRight: `1px solid ${hoveredRelTrait === item.title ? 'rgba(94, 130, 104, 0.3)' : 'rgba(94, 130, 104, 0.12)'}`, borderBottom: `1px solid ${hoveredRelTrait === item.title ? 'rgba(94, 130, 104, 0.3)' : 'rgba(94, 130, 104, 0.12)'}`, borderLeft: `4px solid rgba(94, 130, 104, 0.5)`, transition: 'border-color 0.2s ease-out' }} onMouseEnter={() => setHoveredRelTrait(item.title)} onMouseLeave={() => setHoveredRelTrait(null)} onClick={(e) => { e.stopPropagation(); setHoveredRelTrait(hoveredRelTrait === item.title ? null : item.title) }}>
                        <p className="text-sm font-semibold" style={{ color: theme.text }}>{item.title}</p>
                        <div className="overflow-hidden" style={{ transition: 'max-height 0.5s ease-out, opacity 0.4s ease-out', maxHeight: hoveredRelTrait === item.title ? '100px' : '0px', opacity: hoveredRelTrait === item.title ? 1 : 0 }}>
                          <p className="text-sm leading-relaxed pt-2" style={{ color: theme.textSec }}>{item.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-1"><span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: '#A06060' }} /><p className="text-xs tracking-wider uppercase" style={{ color: theme.text }}>劣</p></div>
                    {[{ title: '情感疏离', detail: '流于表面的关心会让你觉得温暖吗？' }, { title: '压力与强控', detail: '直接批评，忽视情感，追求按自己方式行事，会无意中压制他人的想法与自发性。' }, { title: '缺乏耐心', detail: '当他人处理事情慢一点或更情绪化时，容易变得急躁并引发紧张。' }, { title: '自我隔离', detail: '当压力大时，会选择独处，他人无法靠近或提供帮助。' }].map((item) => (
                      <div key={item.title} className="p-4 rounded-xl cursor-pointer" style={{ backgroundColor: 'rgba(160, 96, 96, 0.06)', borderTop: `1px solid ${hoveredRelTrait === item.title ? 'rgba(160, 96, 96, 0.3)' : 'rgba(160, 96, 96, 0.12)'}`, borderRight: `1px solid ${hoveredRelTrait === item.title ? 'rgba(160, 96, 96, 0.3)' : 'rgba(160, 96, 96, 0.12)'}`, borderBottom: `1px solid ${hoveredRelTrait === item.title ? 'rgba(160, 96, 96, 0.3)' : 'rgba(160, 96, 96, 0.12)'}`, borderLeft: `4px solid rgba(160, 96, 96, 0.5)`, transition: 'border-color 0.2s ease-out' }} onMouseEnter={() => setHoveredRelTrait(item.title)} onMouseLeave={() => setHoveredRelTrait(null)} onClick={(e) => { e.stopPropagation(); setHoveredRelTrait(hoveredRelTrait === item.title ? null : item.title) }}>
                        <p className="text-sm font-semibold" style={{ color: theme.text }}>{item.title}</p>
                        <div className="overflow-hidden" style={{ transition: 'max-height 0.5s ease-out, opacity 0.4s ease-out', maxHeight: hoveredRelTrait === item.title ? '100px' : '0px', opacity: hoveredRelTrait === item.title ? 1 : 0 }}>
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

      {view === 'work' && (
        <div key="work" style={{ animation: 'fade-up 0.6s ease-out both', animationDelay: '150ms' }}>
          <div className="space-y-16">
            <div>
              <h3 className="text-sm font-semibold tracking-wider uppercase mb-5" style={{ color: theme.text }}>简介</h3>
              <div className="max-w-prose space-y-4" style={{ color: theme.textSec }}>
                <p className="text-lg leading-relaxed">图像算法工程师，专注于 3D-AOI 工业视觉与点云处理。</p>
                <p className="leading-relaxed">擅长从数学推导到 C++ 实现的全链路开发，并在实际产线中验证算法的稳定性与精度。</p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold tracking-wider uppercase mb-5" style={{ color: theme.text }}>经验</h3>
              <div className="space-y-4">
                {[{ role: '图像算法工程师', company: '深圳市振华兴智能', period: '2025 — 至今', details: ['负责 3D-AOI 工业视觉软件的点云处理模块开发', '使用 C++/OpenCV/Eigen 实现相位解包裹与点云重建算法', '基于 Qt Widgets 构建上位机界面'] }].map((exp) => (
                  <div key={exp.role} className="p-6 rounded-2xl border" style={{ backgroundColor: theme.bgDeep, borderColor: theme.border }}>
                    <div className="flex items-start justify-between mb-2">
                      <div><p className="text-base font-semibold" style={{ color: theme.text }}>{exp.role}</p><p className="text-sm" style={{ color: theme.textSec }}>{exp.company}</p></div>
                      <span className="text-xs font-mono" style={{ color: theme.textSec }}>{exp.period}</span>
                    </div>
                    <ul className="mt-3 space-y-1.5" style={{ color: theme.textSec }}>{exp.details.map((d) => (<li key={d} className="text-sm leading-relaxed list-disc list-inside">{d}</li>))}</ul>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold tracking-wider uppercase mb-5" style={{ color: theme.text }}>能力</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                {[{ label: '算法', items: ['3D 重建', '相位解包裹', 'OpenCV', 'Eigen'] }, { label: '开发', items: ['C++', 'Python', 'Qt Widgets'] }, { label: '工程', items: ['Git', '系统设计'] }].map((cat) => (
                  <div key={cat.label} className="p-5 rounded-2xl" style={{ backgroundColor: theme.bgDeep, border: `1px solid ${theme.borderLight}` }}>
                    <p className="text-xs tracking-wider uppercase mb-3" style={{ color: theme.text }}>{cat.label}</p>
                    <div className="flex flex-wrap gap-2">{cat.items.map((t) => (<Tag key={t} theme={theme}>{t}</Tag>))}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-6 rounded-2xl" style={{ backgroundColor: theme.bgDeep, border: `1px solid ${theme.border}` }}>
              <p className="text-sm" style={{ color: theme.textSec }}>想要进一步了解我的技术栈与项目经验？</p>
              <button className="px-5 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ease-out" style={{ color: theme.accent, border: `1px solid ${theme.border}` }} onClick={() => onNavigate('contact')} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = theme.accentLight }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}>联系我</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
