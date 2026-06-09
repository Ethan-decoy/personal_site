import { useState, useEffect, type ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import rehypeSlug from 'rehype-slug'
import hljs from 'highlight.js/lib/core'
import { highlight as tsHighlight } from './highlighter'
import ts from 'highlight.js/lib/languages/typescript'
import bash from 'highlight.js/lib/languages/bash'
import json from 'highlight.js/lib/languages/json'
import xml from 'highlight.js/lib/languages/xml'
import css from 'highlight.js/lib/languages/css'
import yaml from 'highlight.js/lib/languages/yaml'
import markdown from 'highlight.js/lib/languages/markdown'
import python from 'highlight.js/lib/languages/python'
import rust from 'highlight.js/lib/languages/rust'
import cpp from 'highlight.js/lib/languages/cpp'
import java from 'highlight.js/lib/languages/java'
import sql from 'highlight.js/lib/languages/sql'
import go from 'highlight.js/lib/languages/go'
import ruby from 'highlight.js/lib/languages/ruby'
import swift from 'highlight.js/lib/languages/swift'
import kotlin from 'highlight.js/lib/languages/kotlin'
import shell from 'highlight.js/lib/languages/shell'
import { modules } from './notes'

/* ---- highlight.js language registrations ---- */
hljs.registerLanguage('typescript', ts)
hljs.registerLanguage('ts', ts)
hljs.registerLanguage('javascript', ts)
hljs.registerLanguage('js', ts)
hljs.registerLanguage('bash', bash)
hljs.registerLanguage('sh', shell)
hljs.registerLanguage('shell', shell)
hljs.registerLanguage('json', json)
hljs.registerLanguage('xml', xml)
hljs.registerLanguage('html', xml)
hljs.registerLanguage('css', css)
hljs.registerLanguage('yaml', yaml)
hljs.registerLanguage('yml', yaml)
hljs.registerLanguage('markdown', markdown)
hljs.registerLanguage('md', markdown)
hljs.registerLanguage('python', python)
hljs.registerLanguage('py', python)
hljs.registerLanguage('rust', rust)
hljs.registerLanguage('rs', rust)
hljs.registerLanguage('cpp', cpp)
hljs.registerLanguage('c++', cpp)
hljs.registerLanguage('c', cpp)
hljs.registerLanguage('java', java)
hljs.registerLanguage('sql', sql)
hljs.registerLanguage('go', go)
hljs.registerLanguage('ruby', ruby)
hljs.registerLanguage('swift', swift)
hljs.registerLanguage('kotlin', kotlin)

/* ---- Code highlighter themes ---- */
const HLJS_THEMES = {
  light: {
    bg: '#F5F0EB',
    text: '#2D2A24',
    comment: '#8C8378',
    keyword: '#8B5A7C',
    string: '#5B7A3A',
    number: '#B85A2E',
    function: '#3A6B8C',
    class_: '#8C6B3A',
    type: '#8C6B3A',
    builtIn: '#A03A5A',
    variable: '#2D2A24',
    templateVar: '#A03A5A',
    attr: '#B85A2E',
    meta: '#8C8378',
    metaKeyword: '#8B5A7C',
    metaString: '#5B7A3A',
    punctuation: '#6B6358',
    operator: '#6B6358',
    bullet: '#3A8C6B',
    link: '#3A6B8C',
    deletion: '#A03A5A',
    addition: '#5B7A3A',
    border: 'rgba(45, 36, 24, 0.12)',
    langBar: 'rgba(45, 36, 24, 0.35)',
  },
  dark: {
    bg: '#1E1E2E',
    text: '#CDD6F4',
    comment: '#585B70',
    keyword: '#CBA6F7',
    string: '#A6E3A1',
    number: '#FAB387',
    function: '#89B4FA',
    class_: '#F9E2AF',
    type: '#F9E2AF',
    builtIn: '#F38BA8',
    variable: '#CDD6F4',
    templateVar: '#F38BA8',
    attr: '#FAB387',
    meta: '#585B70',
    metaKeyword: '#CBA6F7',
    metaString: '#A6E3A1',
    punctuation: '#9399B2',
    operator: '#9399B2',
    bullet: '#89DCEB',
    link: '#89B4FA',
    deletion: '#F38BA8',
    addition: '#A6E3A1',
    border: 'rgba(255,255,255,0.06)',
    langBar: 'rgba(255,255,255,0.35)',
  },
}

export function useHljsTheme(isDark: boolean) {
  const t = isDark ? HLJS_THEMES.dark : HLJS_THEMES.light
  useEffect(() => {
    const id = 'hljs-theme-catppuccin'
    const old = document.getElementById(id)
    if (old) old.remove()
    const style = document.createElement('style')
    style.id = id
    style.textContent = `
      .hljs-theme-catppuccin {
        color: ${t.text} !important;
        background: ${t.bg} !important;
        border: 1px solid ${t.border} !important;
        box-shadow: 0 1px 3px rgba(0,0,0,0.08) !important;
        margin: 1rem 0 !important;
        overflow: hidden;
      }
      .hljs-theme-catppuccin pre {
        color: ${t.text} !important;
        background: transparent !important;
        font-family: 'JetBrains Mono', 'Fira Code', Menlo, Consolas, monospace !important;
        font-size: 0.875rem !important;
        line-height: 1.7 !important;
        tab-size: 2 !important;
      }
      .hljs-theme-catppuccin code { color: ${t.text} !important; background: transparent !important; }
      .hljs-theme-catppuccin .hljs-comment, .hljs-theme-catppuccin .hljs-quote { color: ${t.comment} !important; font-style: italic !important; }
      .hljs-theme-catppuccin .hljs-keyword, .hljs-theme-catppuccin .hljs-selector-tag { color: ${t.keyword} !important; }
      .hljs-theme-catppuccin .hljs-string, .hljs-theme-catppuccin .hljs-template-tag { color: ${t.string} !important; }
      .hljs-theme-catppuccin .hljs-number, .hljs-theme-catppuccin .hljs-literal { color: ${t.number} !important; }
      .hljs-theme-catppuccin .hljs-title.function_, .hljs-theme-catppuccin .hljs-title.function_.invoke { color: ${t.function} !important; }
      .hljs-theme-catppuccin .hljs-title.class_ { color: ${t.class_} !important; }
      .hljs-theme-catppuccin .hljs-type { color: ${t.type} !important; }
      .hljs-theme-catppuccin .hljs-built_in, .hljs-theme-catppuccin .hljs-builtin-name { color: ${t.builtIn} !important; }
      .hljs-theme-catppuccin .hljs-function { color: ${t.function} !important; }
      .hljs-theme-catppuccin .hljs-variable { color: ${t.variable} !important; }
      .hljs-theme-catppuccin .hljs-template-variable { color: ${t.templateVar} !important; }
      .hljs-theme-catppuccin .hljs-attr, .hljs-theme-catppuccin .hljs-attribute { color: ${t.attr} !important; }
      .hljs-theme-catppuccin .hljs-meta { color: ${t.meta} !important; }
      .hljs-theme-catppuccin .hljs-meta .hljs-string { color: ${t.metaString} !important; }
      .hljs-theme-catppuccin .hljs-meta .hljs-keyword { color: ${t.metaKeyword} !important; }
      .hljs-theme-catppuccin .hljs-operator, .hljs-theme-catppuccin .hljs-punctuation { color: ${t.punctuation} !important; }
      .hljs-theme-catppuccin .hljs-bullet, .hljs-theme-catppuccin .hljs-link { color: ${t.bullet} !important; }
      .hljs-theme-catppuccin .hljs-emphasis { font-style: italic !important; }
      .hljs-theme-catppuccin .hljs-strong { font-weight: 600 !important; }
      .hljs-theme-catppuccin .hljs-deletion { color: ${t.deletion} !important; }
      .hljs-theme-catppuccin .hljs-addition { color: ${t.addition} !important; }
    `
    document.head.appendChild(style)
    return () => { style.remove() }
  }, [isDark])
}

/* ---- remark plugin: CJK emphasis ---- */
function remarkCJKEmphasis() {
  return (tree: any) => {
    for (const node of tree.children ?? []) {
      processEmphasis(node)
    }
  }
}

function processEmphasis(node: any) {
  const children = node.children
  if (!children || !Array.isArray(children) || children.length === 0) return

  const newChildren: any[] = []
  for (let i = 0; i < children.length; i++) {
    const child = children[i]

    if (child.type === 'text' && typeof child.value === 'string') {
      let rest = child.value
      let processed = false

      while (rest.length > 0) {
        const strongPos = rest.indexOf('**')
        let emPos = -1
        for (let j = 0; j < rest.length - 1; j++) {
          if (rest[j] === '*' && rest[j + 1] !== '*') { emPos = j; break }
        }
        if (emPos < 0 && rest.length > 0 && rest[rest.length - 1] === '*') emPos = rest.length - 1

        if (strongPos >= 0 && (emPos < 0 || strongPos <= emPos)) {
          const closePos = rest.indexOf('**', strongPos + 2)
          if (closePos < 0) break
          if (strongPos > 0) newChildren.push({ type: 'text', value: rest.slice(0, strongPos) })
          newChildren.push({
            type: 'strong',
            children: [{ type: 'text', value: rest.slice(strongPos + 2, closePos) }],
          })
          rest = rest.slice(closePos + 2)
          processed = true
        } else if (emPos >= 0) {
          let closePos = -1
          for (let j = emPos + 1; j < rest.length; j++) {
            if (rest[j] === '*' && (j + 1 >= rest.length || rest[j + 1] !== '*')) {
              closePos = j; break
            }
          }
          if (closePos < 0) break
          if (emPos > 0) newChildren.push({ type: 'text', value: rest.slice(0, emPos) })
          newChildren.push({
            type: 'emphasis',
            children: [{ type: 'text', value: rest.slice(emPos + 1, closePos) }],
          })
          rest = rest.slice(closePos + 1)
          processed = true
        } else {
          break
        }
      }

      if (processed) {
        if (rest.length > 0) newChildren.push({ type: 'text', value: rest })
      } else {
        newChildren.push(child)
      }
    } else {
      newChildren.push(child)
      processEmphasis(child)
    }
  }
  node.children = newChildren
}

/* ---- Markdown frontmatter strip ---- */
export function parseMarkdownBody(raw: string) {
  raw = raw.replace(/\r\n/g, '\n')
  const m = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/)
  return m ? m[2].trim() : raw.trim()
}

/* ---- GitHub-style callout detection ---- */
function makeCallouts(isDark: boolean): Record<string, { label: string; border: string; bg: string; icon: string }> {
  const alpha = isDark ? 0.15 : 0.08
  return {
    '!NOTE': { label: 'Note', border: isDark ? '#58A6D0' : '#3B82F6', bg: `rgba(59,130,246,${alpha})`, icon: 'ℹ️' },
    '!TIP': { label: 'Tip', border: isDark ? '#5CC9A7' : '#10B981', bg: `rgba(16,185,129,${alpha})`, icon: '💡' },
    '!IMPORTANT': { label: 'Important', border: isDark ? '#A78BFA' : '#8B5CF6', bg: `rgba(139,92,246,${alpha})`, icon: '❗' },
    '!WARNING': { label: 'Warning', border: isDark ? '#FBBF24' : '#F59E0B', bg: `rgba(245,158,11,${alpha})`, icon: '⚠️' },
    '!CAUTION': { label: 'Caution', border: isDark ? '#F87171' : '#EF4444', bg: `rgba(239,68,68,${alpha})`, icon: '🚨' },
  }
}

function extractText(node: ReactNode): string {
  if (typeof node === 'string') return node
  if (Array.isArray(node)) return node.map(extractText).join('')
  if (node && typeof node === 'object' && 'props' in node) return extractText((node as { props: { children?: ReactNode } }).props.children)
  return ''
}

function Callout({ children, isDark, ...rest }: { children?: ReactNode; isDark: boolean } & Record<string, unknown>) {
  const text = extractText(children)
  const firstLine = text.trim().split('\n')[0].trim()
  const callout = makeCallouts(isDark)[firstLine]

  if (callout) {
    const childArray = Array.isArray(children) ? children : [children]
    const [, ...restChildren] = childArray
    return (
      <div style={{ borderLeft: `3px solid ${callout.border}`, backgroundColor: callout.bg, borderRadius: '0 8px 8px 0', padding: '12px 16px', margin: '1em 0' }} {...rest}>
        <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: 4, color: callout.border }}>
          {callout.icon} {callout.label}
        </div>
        {restChildren}
      </div>
    )
  }

  return <blockquote {...rest}>{children}</blockquote>
}

/* ---- Code block with async tree-sitter highlighting ---- */
function CodeBlock({ className, children, isDark }: { className?: string; children?: ReactNode; isDark: boolean }) {
  const match = /language-(\w+)/.exec(className || '')
  const lang = match ? match[1] : ''

  if (!className) {
    return <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.875rem', padding: '0.15em 0.4em', backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', borderRadius: '4px' }}>{children}</code>
  }

  const value = typeof children === 'string' ? children : ''

  if (!lang) {
    return (
      <div className="hljs-theme-catppuccin" style={{ borderRadius: '12px' }}>
        <pre style={{ margin: 0, padding: '1rem 1.25rem' }}><code>{children}</code></pre>
      </div>
    )
  }

  return <AsyncCodeBlock lang={lang} value={value} className={className} isDark={isDark} />
}

function AsyncCodeBlock({ lang, value, className, isDark }: { lang: string; value: string; className: string; isDark: boolean }) {
  const [html, setHtml] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    tsHighlight(value, lang).then(result => {
      if (!cancelled && result) setHtml(result)
    })
    return () => { cancelled = true }
  }, [value, lang])

  const hljsHtml = hljs.highlight(value, { language: lang, ignoreIllegals: true }).value
  const t = isDark ? HLJS_THEMES.dark : HLJS_THEMES.light

  return (
    <div className="hljs-theme-catppuccin" style={{ borderRadius: '12px' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0.5rem 1.25rem', borderBottom: `1px solid ${t.border}`,
        fontSize: '0.7rem', fontFamily: "'JetBrains Mono', monospace",
        color: t.langBar, textTransform: 'uppercase', letterSpacing: '0.05em',
      }}>
        <span>{lang}</span>
      </div>
      <pre className={className} style={{ margin: 0, padding: '1rem 1.25rem' }}>
        <span dangerouslySetInnerHTML={{ __html: html || hljsHtml }} />
      </pre>
    </div>
  )
}

/* ---- Main renderer ---- */
export interface ThemeColors {
  name: string
  accent: string
}

export function MarkdownPreview({ content, theme, isDark }: { content: string; theme: ThemeColors; isDark?: boolean }) {
  const dark = isDark ?? false
  useHljsTheme(dark)

  const proseThemeMap: Record<string, string> = {
    '浅棕米白': 'earth', '深棕暗色': 'earth',
    '深蓝黑': 'ocean', '深海暗蓝': 'ocean',
    '浅青绿': 'sage', '暗青墨绿': 'sage',
    '黑': 'black', '极夜黑': 'black',
  }
  const proseTheme = proseThemeMap[theme.name] || 'earth'

  const termVars = {
    '--term-border': theme.accent + (dark ? '40' : '33'),
    '--term-bg': theme.accent + (dark ? '20' : '14'),
    '--term-text': theme.accent,
  } as React.CSSProperties

  return (
    <div
      className={`w-full prose prose-${proseTheme}${dark ? ' dark' : ''} prose-headings:tracking-tight prose-a:no-underline hover:prose-a:underline`}
      style={termVars}
    >
      <style>{`
        .prose-${proseTheme} { max-width: none !important; }
        .prose-${proseTheme} code::before,
        .prose-${proseTheme} code::after {
          content: '' !important;
        }
        .prose-${proseTheme} kbd {
          display: inline-block;
          font-family: inherit;
          font-weight: 500;
          font-size: 0.88em;
          letter-spacing: 0.02em;
          padding: 0.12em 0.45em;
          border-radius: 6px;
          border: 1px solid var(--term-border);
          background: var(--term-bg);
          color: var(--term-text);
          vertical-align: baseline;
          transition: background 0.2s ease-out;
        }
      `}</style>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkCJKEmphasis]}
        rehypePlugins={[rehypeRaw, rehypeSlug]}
        components={{
          a: ({ href, children }) => {
            if (!href) return <span>{children}</span>
            if (href.startsWith('http')) {
              return <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>
            }
            const [path, anchor] = href.replace(/^\.\/?/, '').split('#')
            const noteFile = `./${path.replace(/\.md$/, '')}.md`
            if (modules[noteFile]) {
              const isWiki = noteFile === './wiki.md'
              return (
                <a
                  href="javascript:void(0)"
                  onClick={(e) => {
                    e.preventDefault()
                    window.dispatchEvent(new CustomEvent('note:open', { detail: { file: noteFile, anchor: anchor || null } }))
                  }}
                  className={`inline-flex items-center gap-0.5 ${isWiki ? 'font-medium' : ''}`}
                  style={isWiki ? { color: theme.accent } : undefined}
                >
                  {children}
                  {isWiki && (
                    <svg className="inline-block flex-shrink-0" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  )}
                </a>
              )
            }
            return <a href={href}>{children}</a>
          },
          blockquote: (props) => <Callout {...props} isDark={dark} />,
          code: (props) => <CodeBlock {...props} isDark={dark} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
