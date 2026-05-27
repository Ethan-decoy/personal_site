/* ==================== Notes Tree Builder ==================== */
/*
 * 自动扫描 src/notes/ 目录下的 .md 文件，构建分类树。
 *
 * 用法：在 src/notes/ 下创建分类子目录，放入 .md 文件。
 * 每个文件需包含 frontmatter：
 *
 *   ---
 *   title: 笔记标题
 *   date: YYYY-MM-DD
 *   order: 数字（可选，用于自定义排序）
 *   ---
 *
 * 约定：
 * - `_index.md` 作为目录的索引页（README），点击该目录时展示索引内容。
 * - `_index.md` 不显示在子列表中。
 * - 文件名采用 snake_case，展示名由 frontmatter title 决定。
 */

export const modules = import.meta.glob('./**/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>

export function parseFrontmatter(raw: string) {
  const m = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/)
  if (!m) return { title: '', date: '', order: undefined as number | undefined }
  const fm = Object.fromEntries(
    m[1].split('\n').map((l) => {
      const idx = l.indexOf(':')
      return idx === -1 ? [l.trim(), ''] : [l.slice(0, idx).trim(), l.slice(idx + 1).trim()]
    })
  )
  const order = fm.order !== undefined ? Number(fm.order) : undefined
  return { title: fm.title || '', date: fm.date || '', order: Number.isNaN(order) ? undefined : order }
}

/* ---- 索引文件映射 ---- */
// 将每个目录映射到其 _index.md 内容
export const indexMap: Record<string, { title: string; content: string }> = {}

/* ---- 树形结构 ---- */
export interface NoteEntry {
  title: string
  date: string
  order?: number
  file: string
}

export interface TreeNode {
  key: string
  title: string
  children: NoteEntry[]
  isLeaf: boolean // true = 单文件（无子目录）
}

function buildTree(): TreeNode[] {
  const groups: Record<string, { title: string; children: NoteEntry[] }> = {}

  for (const [file, raw] of Object.entries(modules)) {
    // 跳过 _index.md，它们单独处理
    if (file.endsWith('/_index.md')) {
      const dir = file.replace(/\/_index\.md$/, '')
      const fm = parseFrontmatter(raw)
      indexMap[dir] = { title: fm.title, content: raw }
      continue
    }

    const parts = file.replace(/^\.\//, '').split('/')
    const catParts = parts.length > 1 ? parts.slice(0, -1) : ['other']
    const fm = parseFrontmatter(raw)

    const catKey = catParts.join(' > ')
    if (!groups[catKey]) groups[catKey] = { title: catParts.join(' > '), children: [] }
    groups[catKey].children.push({
      title: fm.title,
      date: fm.date,
      order: fm.order,
      file,
    })
  }

  // 排序：优先按 order，其次按 date，最后按 title
  for (const g of Object.values(groups)) {
    g.children.sort((a, b) => {
      if (a.order !== undefined && b.order !== undefined) return a.order - b.order
      if (a.order !== undefined) return -1
      if (b.order !== undefined) return 1
      if (a.date && b.date) return b.date.localeCompare(a.date)
      return a.title.localeCompare(b.title)
    })
  }

  return Object.entries(groups)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, g]) => ({ key, title: g.title, children: g.children, isLeaf: false }))
}

export const treeData = buildTree()

/* ---- 搜索 ---- */
export interface SearchResult {
  title: string
  date: string
  file: string
  category: string
}

export function searchNotes(query: string): SearchResult[] {
  if (!query.trim()) return []
  const q = query.toLowerCase().trim()
  const results: SearchResult[] = []

  for (const [file, raw] of Object.entries(modules)) {
    if (file.endsWith('/_index.md')) continue
    const fm = parseFrontmatter(raw)
    // 标题匹配
    const titleMatch = fm.title.toLowerCase().includes(q)
    // 内容匹配（搜索前 500 字符）
    const bodyMatch = raw.toLowerCase().includes(q)

    if (titleMatch || bodyMatch) {
      const parts = file.replace(/^\.\//, '').split('/')
      const category = parts.length > 1 ? parts.slice(0, -1).join(' > ') : 'other'
      results.push({ title: fm.title, date: fm.date, file, category })
    }
  }

  // 标题匹配优先
  results.sort((a, b) => {
    const aTitle = a.title.toLowerCase().includes(q)
    const bTitle = b.title.toLowerCase().includes(q)
    if (aTitle && !bTitle) return -1
    if (!aTitle && bTitle) return 1
    return a.title.localeCompare(b.title)
  })

  return results
}

/* ---- 自动补全建议 ---- */
export function getSuggestions(query: string): string[] {
  if (!query.trim()) return []
  const q = query.toLowerCase().trim()
  const suggestions: string[] = []

  for (const [file, raw] of Object.entries(modules)) {
    if (file.endsWith('/_index.md')) continue
    const fm = parseFrontmatter(raw)
    // 模糊匹配：检查 query 的字符是否按顺序出现在标题中
    const title = fm.title.toLowerCase()
    let qi = 0
    for (let ti = 0; ti < title.length && qi < q.length; ti++) {
      if (title[ti] === q[qi]) qi++
    }
    if (qi === q.length) {
      suggestions.push(fm.title)
    }
  }

  return suggestions.slice(0, 10)
}
