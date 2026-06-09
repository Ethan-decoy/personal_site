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

/* ---- Catppuccin Mocha theme injection ---- */
export function useHljsTheme() {
  useEffect(() => {
    const id = 'hljs-theme-catppuccin'
    if (document.getElementById(id)) return
    const style = document.createElement('style')
    style.id = id
    style.textContent = `
      .hljs-theme-catppuccin {
        color: #CDD6F4 !important;
        background: #1E1E2E !important;
        border: 1px solid rgba(120,120,130,0.15) !important;
        box-shadow: 0 1px 3px rgba(0,0,0,0.08) !important;
        margin: 1rem 0 !important;
        overflow: hidden;
      }
      .hljs-theme-catppuccin pre {
        color: #CDD6F4 !important;
        background: transparent !important;
        font-family: 'JetBrains Mono', 'Fira Code', Menlo, Consolas, monospace !important;
        font-size: 0.875rem !important;
        line-height: 1.7 !important;
        tab-size: 2 !important;
      }
      .hljs-theme-catppuccin code { color: #CDD6F4 !important; background: transparent !important; }
      .hljs-theme-catppuccin .hljs-comment, .hljs-theme-catppuccin .hljs-quote { color: #585B70 !important; font-style: italic !important; }
      .hljs-theme-catppuccin .hljs-keyword, .hljs-theme-catppuccin .hljs-selector-tag { color: #CBA6F7 !important; }
      .hljs-theme-catppuccin .hljs-string, .hljs-theme-catppuccin .hljs-template-tag { color: #A6E3A1 !important; }
      .hljs-theme-catppuccin .hljs-number, .hljs-theme-catppuccin .hljs-literal { color: #FAB387 !important; }
      .hljs-theme-catppuccin .hljs-title.function_, .hljs-theme-catppuccin .hljs-title.function_.invoke { color: #89B4FA !important; }
      .hljs-theme-catppuccin .hljs-title.class_ { color: #F9E2AF !important; }
      .hljs-theme-catppuccin .hljs-type { color: #F9E2AF !important; }
      .hljs-theme-catppuccin .hljs-built_in, .hljs-theme-catppuccin .hljs-builtin-name { color: #F38BA8 !important; }
      .hljs-theme-catppuccin .hljs-function { color: #89B4FA !important; }
      .hljs-theme-catppuccin .hljs-variable { color: #CDD6F4 !important; }
      .hljs-theme-catppuccin .hljs-template-variable { color: #F38BA8 !important; }
      .hljs-theme-catppuccin .hljs-attr, .hljs-theme-catppuccin .hljs-attribute { color: #FAB387 !important; }
      .hljs-theme-catppuccin .hljs-meta { color: #585B70 !important; }
      .hljs-theme-catppuccin .hljs-meta .hljs-string { color: #A6E3A1 !important; }
      .hljs-theme-catppuccin .hljs-meta .hljs-keyword { color: #CBA6F7 !important; }
      .hljs-theme-catppuccin .hljs-operator, .hljs-theme-catppuccin .hljs-punctuation { color: #9399B2 !important; }
      .hljs-theme-catppuccin .hljs-bullet, .hljs-theme-catppuccin .hljs-link { color: #89DCEB !important; }
      .hljs-theme-catppuccin .hljs-emphasis { font-style: italic !important; }
      .hljs-theme-catppuccin .hljs-strong { font-weight: 600 !important; }
      .hljs-theme-catppuccin .hljs-deletion { color: #F38BA8 !important; }
      .hljs-theme-catppuccin .hljs-addition { color: #A6E3A1 !important; }
    `
    document.head.appendChild(style)
    return () => { style.remove() }
  }, [])
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
const CALLOUTS: Record<string, { label: string; border: string; bg: string; icon: string }> = {
  '!NOTE': { label: 'Note', border: '#3B82F6', bg: 'rgba(59,130,246,0.06)', icon: 'ℹ️' },
  '!TIP': { label: 'Tip', border: '#10B981', bg: 'rgba(16,185,129,0.06)', icon: '💡' },
  '!IMPORTANT': { label: 'Important', border: '#8B5CF6', bg: 'rgba(139,92,246,0.06)', icon: '❗' },
  '!WARNING': { label: 'Warning', border: '#F59E0B', bg: 'rgba(245,158,11,0.06)', icon: '⚠️' },
  '!CAUTION': { label: 'Caution', border: '#EF4444', bg: 'rgba(239,68,68,0.06)', icon: '🚨' },
}

function extractText(node: ReactNode): string {
  if (typeof node === 'string') return node
  if (Array.isArray(node)) return node.map(extractText).join('')
  if (node && typeof node === 'object' && 'props' in node) return extractText((node as { props: { children?: ReactNode } }).props.children)
  return ''
}

function Callout({ children, ...rest }: { children?: ReactNode } & Record<string, unknown>) {
  const text = extractText(children)
  const firstLine = text.trim().split('\n')[0].trim()
  const callout = CALLOUTS[firstLine]

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
function CodeBlock({ className, children }: { className?: string; children?: ReactNode }) {
  const match = /language-(\w+)/.exec(className || '')
  const lang = match ? match[1] : ''

  if (!className) {
    return <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.875rem', padding: '0.15em 0.4em' }}>{children}</code>
  }

  const value = typeof children === 'string' ? children : ''

  if (!lang) {
    return (
      <div className="hljs-theme-catppuccin" style={{ borderRadius: '12px' }}>
        <pre style={{ margin: 0, padding: '1rem 1.25rem' }}><code>{children}</code></pre>
      </div>
    )
  }

  return <AsyncCodeBlock lang={lang} value={value} className={className} />
}

function AsyncCodeBlock({ lang, value, className }: { lang: string; value: string; className: string }) {
  const [html, setHtml] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    tsHighlight(value, lang).then(result => {
      if (!cancelled && result) setHtml(result)
    })
    return () => { cancelled = true }
  }, [value, lang])

  const hljsHtml = hljs.highlight(value, { language: lang, ignoreIllegals: true }).value

  return (
    <div className="hljs-theme-catppuccin" style={{ borderRadius: '12px' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0.5rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.06)',
        fontSize: '0.7rem', fontFamily: "'JetBrains Mono', monospace",
        color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.05em',
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

export function MarkdownPreview({ content, theme }: { content: string; theme: ThemeColors }) {
  useHljsTheme()

  const proseThemeMap: Record<string, string> = {
    '浅棕米白': 'earth',
    '深蓝黑': 'ocean',
    '浅青绿': 'sage',
    '黑': 'black',
  }
  const proseTheme = proseThemeMap[theme.name] || 'earth'

  const termVars = {
    '--term-border': theme.accent + '33',
    '--term-bg': theme.accent + '14',
    '--term-text': theme.accent,
  } as React.CSSProperties

  return (
    <div
      className={`w-full prose prose-${proseTheme} prose-headings:tracking-tight prose-a:no-underline hover:prose-a:underline`}
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
          blockquote: (props) => <Callout {...props} />,
          code: (props) => <CodeBlock {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
