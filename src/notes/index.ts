/* ==================== Notes Tree Builder ==================== */
/*
 * 自动扫描 src/notes/ 目录下的 .md 文件，构建分类树。
 *
 * 用法：在 src/notes/ 下创建分类子目录（如 frontend/），放入 .md 文件。
 * 每个文件需包含 frontmatter：
 *
 *   ---
 *   title: 笔记标题
 *   date: YYYY-MM-DD
 *   ---
 *
 * 目录名即为分类名，文件名不用于展示（仅用于排序 fallback）。
 */

const modules = import.meta.glob('./**/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>

function parseFrontmatter(raw: string) {
  const m = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/)
  if (!m) return { title: '', date: '' }
  const fm = Object.fromEntries(
    m[1].split('\n').map((l) => l.split(/:\s*/).map((s) => s.trim()))
  )
  return { title: fm.title || '', date: fm.date || '' }
}

function buildTree() {
  const groups: Record<string, { title: string; children: { title: string; date: string; file: string }[] }> = {}

  for (const [file, raw] of Object.entries(modules)) {
    const parts = file.replace(/^\.\//, '').split('/')
    const cat = parts.length > 1 ? parts[0] : 'other'
    const fm = parseFrontmatter(raw)

    if (!groups[cat]) groups[cat] = { title: cat.toUpperCase(), children: [] }
    groups[cat].children.push({ title: fm.title, date: fm.date, file })
  }

  for (const g of Object.values(groups)) {
    g.children.sort((a, b) => (b.date || '').localeCompare(a.date || ''))
  }

  return Object.entries(groups)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, g]) => ({ key, ...g }))
}

export const treeData = buildTree()
