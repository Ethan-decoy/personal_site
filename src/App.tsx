function App() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* PC 优先布局：默认是大屏样式，小屏用 max- 前缀调整 */}
      <main className="max-w-6xl mx-auto px-12 max-sm:px-4 py-16">
        <h1 className="text-5xl max-sm:text-2xl font-bold mb-6">
          Hello World
        </h1>
        <p className="text-xl max-sm:text-base text-gray-400 mb-12">
          个人网站正在建设中，基于 Tailwind CSS 实现 PC 优先的响应式设计。
        </p>

        {/* 测试网格：PC 3 列 → 平板 2 列 → 手机 1 列 */}
        <div className="grid grid-cols-3 max-lg:grid-cols-2 max-sm:grid-cols-1 gap-6">
          {['React 19', 'TypeScript', 'Tailwind CSS'].map((tech) => (
            <div
              key={tech}
              className="rounded-xl border border-gray-800 bg-gray-900/50 p-6 text-center"
            >
              <span className="text-lg font-medium text-blue-400">{tech}</span>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

export default App
