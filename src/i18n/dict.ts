export type Locale = "zh" | "en";

export type DictKey = keyof typeof dict;

/* ---- Shared values (edited once, referenced everywhere) ---- */
const SHARED = {
	currentFocus: {
		zh: "正在撰写 C++ 笔记",
		en: "Writing C++ Notes",
	},
};

export const dict = {
	// NavBar
	"nav.home": { zh: "首页", en: "Home" },
	"nav.about": { zh: "关于", en: "About" },
	"nav.projects": { zh: "项目", en: "Projects" },
	"nav.notes": { zh: "笔记", en: "Notes" },
	"nav.contact": { zh: "联系", en: "Contact" },

	// Home
	"home.status": SHARED.currentFocus,
	"home.greeting": { zh: "我是 Ethan C.", en: "I'm Ethan C." },
	"home.subtitle": { zh: "R&D / 探索者.", en: "R&D / Explorer." },
	"home.desc": {
		zh: "在这里记录我的探索与思考。",
		en: "I document my explorations and reflections here.",
	},
	"home.hidden": {
		zh: "我相信好的工具应该隐形，让你专注于真正重要的事情。",
		en: "I believe good tools should be invisible, letting you focus on what truly matters.",
	},
	"home.motto": {
		zh: '"先做人民需要的工程师，再做自己时间的主人。"',
		en: '"Be the engineer people need before being the master of your own time."',
	},
	"home.cta": { zh: "了解我", en: "Know me" },

	// About - view switcher
	"about.view.work": { zh: "工作", en: "Work" },
	"about.view.personal": { zh: "生活", en: "Personal" },
	"about.title": { zh: "关于", en: "About" },

	// About - personal
	"about.personal.principle.commonGoal": {
		zh: "我们可以完全不同，但必须真正朝着共同目标前进。",
		en: "We can be completely different, but we must genuinely move toward a shared goal.",
	},
	"about.personal.principle.reliability": {
		zh: "可靠比耀眼更重要。",
		en: "Reliability matters more than standing out.",
	},
	"about.personal.principle.responsibility": {
		zh: "接受一个位置，也就承担与之相应的责任。",
		en: "Accepting a position means taking on the responsibilities that come with it.",
	},
	"about.personal.principle.excellence": {
		zh: "他人的优秀，值得欣赏、学习，也能成为更高水平的参照。",
		en: "The excellence of others is worth appreciating and learning from; it can also serve as a higher benchmark.",
	},
	"about.personal.principle.legacy": {
		zh: "人活着应当创造价值、承担责任、留下影响。",
		en: "To live is to create value, shoulder responsibility, and leave an impact.",
	},
	"about.personal.principle.support": {
		zh: "独立不等于拒绝帮助；接受帮助也不等于交出责任。",
		en: "Independence does not mean refusing help; accepting help does not mean giving up responsibility.",
	},
	"about.personal.principle.effort": {
		zh: "尽力意味着对行动负责，但不意味着结果必然如愿。",
		en: "Doing our best means taking responsibility for our actions; it does not mean the outcome will necessarily go our way.",
	},
	"about.personal.principle.pause": {
		zh: "暂时停下，不等于放弃方向。",
		en: "A temporary pause is not the same as abandoning the path forward.",
	},
	"about.personal.values.title": {
		zh: "个人价值观",
		en: "Personal values",
	},
	"about.personal.group.together": {
		zh: "与人同行",
		en: "Working with others",
	},
	"about.personal.group.contribution": {
		zh: "承担与贡献",
		en: "Responsibility & contribution",
	},
	"about.personal.group.growth": {
		zh: "边界与成长",
		en: "Limits & growth",
	},
	"about.personal.inspiration.alt": {
		zh: "钱学森与袁隆平的线描画",
		en: "Line-art portrait of Qian Xuesen and Yuan Longping",
	},
	"about.personal.inspiration.caption": {
		zh: "为人民服务",
		en: "为人民服务",
	},
	"about.favorites": { zh: "喜欢", en: "Favorites" },
	"about.favorites.movies": { zh: "电影", en: "Films" },
	"about.favorites.music": { zh: "音乐", en: "Music" },
	"about.favorites.movie.pursuit": {
		zh: "电影《当幸福来敲门》海报",
		en: "Poster for The Pursuit of Happyness",
	},
	"about.favorites.movie.pursuit.title": {
		zh: "当幸福来敲门",
		en: "The Pursuit of Happyness",
	},
	"about.favorites.song.ferrari": {
		zh: "Bebe Rexha《Ferrari》歌曲封面",
		en: "Cover for Ferrari by Bebe Rexha",
	},
	"about.favorites.song.ferrari.title": {
		zh: "Ferrari",
		en: "Ferrari",
	},
	"about.favorites.song.ferrari.artist": {
		zh: "Bebe Rexha",
		en: "Bebe Rexha",
	},
	"about.life": { zh: "兴趣与实践", en: "Interests & pursuits" },
	"about.life.lifelongLearner": {
		zh: "终身学习者",
		en: "Lifelong learner",
	},
	"about.life.lifelongLearner.d": {
		zh: "愿意改变，就是好事。",
		en: "Being willing to change is a good thing.",
	},
	"about.life.racing": { zh: "模拟竞速", en: "Sim racing" },
	"about.life.racing.d": {
		zh: "更好的走线，更快的入弯。",
		en: "Better racing lines, faster corner entries.",
	},
	"about.life.personalDev": { zh: "个人开发", en: "Personal projects" },
	"about.life.personalDev.d": {
		zh: "把零散的想法做成可以运行、可以持续改进的东西。",
		en: "Turning rough ideas into working things that can keep evolving.",
	},
	"about.life.walking": { zh: "城市漫步", en: "City walking" },
	"about.life.walking.d": {
		zh: "散步是整理思绪的最佳方式。",
		en: "Walking is the best way to sort out thoughts.",
	},

	"about.location": { zh: "位置", en: "Location" },
	"about.location.v": { zh: "中国大陆", en: "Mainland China" },
	"about.language": { zh: "语言", en: "Language" },
	"about.language.v": {
		zh: "中文（母语），English（B1）",
		en: "Chinese (native), English (B1)",
	},

	"about.current": { zh: "当前", en: "Currently" },
	"about.current.v": SHARED.currentFocus,

	// About - work
	"about.bio": { zh: "简介", en: "Bio" },
	"about.bio.p1": {
		zh: "图像算法工程师，专注于 3D-AOI 工业视觉与点云处理。",
		en: "Image algorithm engineer specializing in 3D-AOI industrial vision and point cloud processing.",
	},
	"about.bio.p2": {
		zh: "擅长从数学推导到 C++ 实现的全链路开发，并在实际产线中验证算法的稳定性与精度。",
		en: "Skilled in full-chain development from mathematical derivation to C++ implementation, validating algorithm stability and accuracy in real production lines.",
	},

	"about.exp": { zh: "经验", en: "Experience" },
	"about.exp.role": { zh: "图像算法工程师", en: "Image Algorithm Engineer" },
	"about.exp.company": {
		zh: "深圳市振华兴智能",
		en: "Shenzhen Zhenhuaxing Intelligent",
	},
	"about.exp.period": { zh: "2025 — 至今", en: "2025 — Present" },
	"about.exp.d0": {
		zh: "主导工业 AOI 宽量程三维测量算法升级，完成技术方案、标定链路、C++/CUDA 重建、实机验证与产品集成，解决既有方案在扩展工作范围后的精度与稳定性问题。",
		en: "Led the upgrade of a wide-range 3D measurement algorithm for industrial AOI, delivering the technical design, calibration pipeline, C++/CUDA reconstruction, machine validation, and product integration while resolving accuracy and stability issues after the working range was extended.",
	},
	"about.exp.d1": {
		zh: "独立负责点云构建模块：结构光、理论推导及实现、工程调试",
		en: "Independently responsible for point cloud construction module: structured light, theoretical derivation and implementation, engineering debugging",
	},
	"about.exp.d2": {
		zh: "基于 Qt Widgets 构建上位机界面",
		en: "Built host computer UI using Qt Widgets",
	},

	"about.skills": { zh: "能力", en: "Skills" },
	"about.skills.lang": { zh: "编程语言", en: "Languages" },
	"about.skills.libs": { zh: "框架与库", en: "Frameworks & Libraries" },
	"about.skills.domains": { zh: "涉及领域", en: "Domains" },
	"about.skills.domains.0": { zh: "机器视觉", en: "Machine Vision" },
	"about.skills.domains.1": {
		zh: "点云重建",
		en: "Point Cloud Reconstruction",
	},
	"about.skills.domains.2": { zh: "图像预处理", en: "Image Preprocessing" },
	"about.skills.domains.3": {
		zh: "相位测量轮廓术",
		en: "Phase Measurement Profilometry",
	},

	"about.cta": {
		zh: "想要进一步了解我的技术栈与项目经验？",
		en: "Want to learn more about my tech stack and project experience?",
	},
	"about.cta.btn": { zh: "联系我", en: "Contact me" },

	// Projects
	"projects.title": { zh: "项目", en: "Projects" },
	"projects.activity.eyebrow": { zh: "GitHub 活动", en: "GitHub activity" },
	"projects.activity.contribution": { zh: "次贡献", en: "contribution" },
	"projects.activity.contributions": { zh: "次贡献", en: "contributions" },
	"projects.activity.none": { zh: "无贡献", en: "No contributions" },
	"projects.activity.open": { zh: "查看 GitHub", en: "View GitHub" },
	"projects.activity.scrollHint": {
		zh: "左右滑动查看全年",
		en: "Scroll horizontally to explore the year",
	},
	"projects.empty": {
		zh: "目前还没有公开的开源项目仓库。",
		en: "No public open-source repositories yet.",
	},
	"projects.hint": {
		zh: "尚未整理为公开仓库，后续收录后会在此更新。",
		en: "Not yet organized into public repos — will be updated as they're published.",
	},

	// Contact
	"contact.title": { zh: "联系", en: "Contact" },
	"contact.desc": {
		zh: "如果你想聊聊技术、合作想法，或者只是想打个招呼，欢迎联系。",
		en: "If you'd like to chat about tech, collaboration ideas, or just say hello, feel free to reach out.",
	},
	"contact.email": { zh: "邮箱", en: "Email" },
	"contact.github": { zh: "GitHub", en: "GitHub" },

	// Footer
	"footer.contact": { zh: "联系", en: "Contact" },

	// Language toggle
	"lang.zh": { zh: "中文", en: "中文" },
	"lang.en": { zh: "英文", en: "English" },
};
