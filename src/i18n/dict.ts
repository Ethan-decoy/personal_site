export type Locale = "zh" | "en";

export type DictKey = keyof typeof dict;

/* ---- Shared values (edited once, referenced everywhere) ---- */
const SHARED = {
	currentFocus: { zh: "正在学习线性代数", en: "Learning Linear Algebra" },
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
	"about.life": { zh: "生活切片", en: "Life slices" },
	"about.life.learner": { zh: "费曼式学习者", en: "Feynman-style learner" },
	"about.life.learner.d": {
		zh: "讲给别人听之前，自己先假装讲一遍。",
		en: "Before I understand something, I try to explain it to someone else first.",
	},
	"about.life.google": {
		zh: "Google 工程思维",
		en: "Google engineering mindset",
	},
	"about.life.google.d": {
		zh: "相信简单可扩展的解决方案，无论写代码还是生活。",
		en: "Believe in simple, scalable solutions — whether writing code or living life.",
	},
	"about.life.racing": { zh: "模拟竞速", en: "Sim racing" },
	"about.life.racing.d": {
		zh: "更好的走线，更快的入弯。",
		en: "Better racing lines, faster corner entries.",
	},
	"about.life.ad": { zh: "单排 AD", en: "Solo queue ADC" },
	"about.life.ad.d": { zh: "...", en: "..." },
	"about.life.communism": { zh: "共产主义", en: "Communism" },
	"about.life.communism.d": {
		zh: "相信劳动的价值。",
		en: "Believe in the value of labor.",
	},
	"about.life.walking": { zh: "城市漫步", en: "City walking" },
	"about.life.walking.d": {
		zh: "散步是整理思绪的最佳方式。",
		en: "Walking is the best way to sort out thoughts.",
	},

	"about.location": { zh: "位置", en: "Location" },
	"about.location.v": { zh: "中国", en: "China" },
	"about.language": { zh: "语言", en: "Language" },
	"about.language.v": {
		zh: "中文（母语），English（B1）",
		en: "Chinese (native), English (B1)",
	},
	"about.mbti": { zh: "MBTI", en: "MBTI" },
	"about.current": { zh: "当前", en: "Currently" },
	"about.current.v": SHARED.currentFocus,

	// MBTI dimensions
	"mbti.I": { zh: "内向", en: "Introverted" },
	"mbti.I.left": { zh: "外向", en: "Extroverted" },
	"mbti.I.right": { zh: "内向", en: "Introverted" },
	"mbti.I.d": {
		zh: "往往更喜欢较少但深入和有意义的社交互动，通常更喜欢安静的环境。",
		en: "Tends to prefer fewer but deeper and more meaningful social interactions, often preferring quieter environments.",
	},
	"mbti.N": { zh: "天马行空", en: "Imaginative" },
	"mbti.N.left": { zh: "天马行空", en: "Imaginative" },
	"mbti.N.right": { zh: "求真务实", en: "Practical" },
	"mbti.N.d": {
		zh: "将独创性视若珍宝，热衷于探寻那些隐藏在表象之下的深层含义，以及看似遥远却充满希望的可能性。",
		en: "Cherishes originality and loves exploring the deeper meanings hidden beneath the surface, along with possibilities that may seem distant yet full of hope.",
	},
	"mbti.T": { zh: "理性思考", en: "Rational" },
	"mbti.T.left": { zh: "理性思考", en: "Rational" },
	"mbti.T.right": { zh: "情感细腻", en: "Empathetic" },
	"mbti.T.d": {
		zh: "注重客观性和合理性，通常不考虑情感，只考虑逻辑。往往认为效率比社会和谐更重要。",
		en: "Values objectivity and rationality, often prioritizing logic over emotions. Tends to value efficiency over social harmony.",
	},
	"mbti.J": { zh: "运筹帷幄", en: "Decisive" },
	"mbti.J.left": { zh: "运筹帷幄", en: "Decisive" },
	"mbti.J.right": { zh: "随机应变", en: "Spontaneous" },
	"mbti.J.d": {
		zh: "将明确性、可预测性以及事情的圆满解决奉为圭臬。",
		en: "Values clarity, predictability, and the thorough completion of tasks.",
	},
	"mbti.T2": { zh: "情绪易波动", en: "Turbulent" },
	"mbti.T2.left": { zh: "自信果断", en: "Assertive" },
	"mbti.T2.right": { zh: "情绪易波动", en: "Turbulent" },
	"mbti.T2.d": {
		zh: "对压力敏感。在情绪上有一种紧迫感，往往以成功为导向，追求完美，渴望进步。",
		en: "Sensitive to stress. Has a sense of emotional urgency, often success-oriented, perfectionistic, and eager to improve.",
	},
	"about.mbti.footer": {
		zh: "连续三年测评均为 INTJ · 未采用大五人格（自测置信度低）",
		en: "Rated INTJ for three consecutive years · Did not adopt Big Five (low self-assessed confidence)",
	},

	// About - values
	"about.values": { zh: "价值观", en: "Values" },
	"about.values.root": { zh: "追根溯源", en: "Root cause thinking" },
	"about.values.root.d": {
		zh: "从根本上讲是什么问题导致的？",
		en: "What is the root cause of this problem?",
	},
	"about.values.energy": { zh: "高能效比", en: "Energy efficiency" },
	"about.values.energy.d": {
		zh: "不要浪费彼此的时间。",
		en: "Don't waste each other's time.",
	},
	"about.values.resilience": { zh: "坚韧毅力", en: "Resilience" },
	"about.values.resilience.d": {
		zh: "意志会带我杀出重围。",
		en: "Willpower will carry me through.",
	},
	"about.values.excellence": { zh: "追求卓越", en: "Pursuit of excellence" },
	"about.values.excellence.d": {
		zh: "完美主义是把双刃剑。",
		en: "Perfectionism is a double-edged sword.",
	},
	"about.values.learning": { zh: "终身学习", en: "Lifelong learning" },
	"about.values.learning.d": {
		zh: "保持好奇，持续迭代。",
		en: "Stay curious, iterate constantly.",
	},
	"about.values.independence": { zh: "独立自主", en: "Independence" },
	"about.values.independence.d": {
		zh: "更倾向独立高效地完成任务。",
		en: "Prefer to complete tasks independently and efficiently.",
	},

	// About - interpersonal
	"about.interpersonal": { zh: "人际关系", en: "Interpersonal dynamics" },
	"about.interpersonal.pros": { zh: "优", en: "Strengths" },
	"about.interpersonal.cons": { zh: "劣", en: "Weaknesses" },
	"about.rel.calm": { zh: "冷静", en: "Calm" },
	"about.rel.calm.d": { zh: "等会，别急。", en: "Hold on, no rush." },
	"about.rel.deep": { zh: "深入交流", en: "Deep engagement" },
	"about.rel.deep.d": {
		zh: "很有意义，能再跟我说说吗？",
		en: "That sounds meaningful — can you tell me more?",
	},
	"about.rel.partner": { zh: "合伙人责任制", en: "Partner responsibility" },
	"about.rel.partner.d": {
		zh: "信守承诺。提供坦率、真诚的建议，提供实际的帮助实现共同目标。",
		en: "Keep promises. Provide candid, honest advice and practical help toward shared goals.",
	},
	"about.rel.growth": { zh: "激励成长", en: "Growth-driven" },
	"about.rel.growth.d": {
		zh: "无法理解停滞不前。",
		en: "Cannot understand standing still.",
	},
	"about.rel.distant": { zh: "情感疏离", en: "Emotional detachment" },
	"about.rel.distant.d": {
		zh: "流于表面的关心会让你觉得温暖吗？",
		en: "Would you feel warmth from surface-level concern?",
	},
	"about.rel.control": { zh: "压力与强控", en: "Pressure & control" },
	"about.rel.control.d": {
		zh: "直接批评，忽视情感，追求按自己方式行事，会无意中压制他人的想法与自发性。",
		en: "Direct criticism, dismissing emotions, and pushing one's own way can inadvertently suppress others' ideas and spontaneity.",
	},
	"about.rel.impatient": { zh: "缺乏耐心", en: "Impatience" },
	"about.rel.impatient.d": {
		zh: "当他人处理事情慢一点或更情绪化时，容易变得急躁并引发紧张。",
		en: "Easily becomes impatient when others work slowly or are more emotional, creating tension.",
	},
	"about.rel.isolation": { zh: "自我隔离", en: "Self-isolation" },
	"about.rel.isolation.d": {
		zh: "当压力大时，会选择独处，他人无法靠近或提供帮助。",
		en: "Under stress, tends to withdraw into solitude, making it hard for others to connect or help.",
	},

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
	"about.exp.d1": {
		zh: "负责 3D-AOI 工业视觉软件的点云处理模块开发",
		en: "Developed point cloud processing module for 3D-AOI industrial vision software",
	},
	"about.exp.d2": {
		zh: "使用 C++/OpenCV/Eigen 实现相位解包裹与点云重建算法",
		en: "Implemented phase unwrapping and point cloud reconstruction algorithms using C++/OpenCV/Eigen",
	},
	"about.exp.d3": {
		zh: "基于 Qt Widgets 构建上位机界面",
		en: "Built host computer UI using Qt Widgets",
	},

	"about.skills": { zh: "能力", en: "Skills" },
	"about.skills.algo": { zh: "算法", en: "Algorithms" },
	"about.skills.algo.0": { zh: "3D 重建", en: "3D Reconstruction" },
	"about.skills.algo.1": { zh: "相位解包裹", en: "Phase Unwrapping" },
	"about.skills.dev": { zh: "开发", en: "Development" },
	"about.skills.eng": { zh: "工程", en: "Engineering" },
	"about.skills.eng.1": { zh: "系统设计", en: "System Design" },

	"about.cta": {
		zh: "想要进一步了解我的技术栈与项目经验？",
		en: "Want to learn more about my tech stack and project experience?",
	},
	"about.cta.btn": { zh: "联系我", en: "Contact me" },

	// Projects
	"projects.title": { zh: "项目", en: "Projects" },
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
