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
	"home.name": { zh: "Ethan C.", en: "Ethan C." },
	"home.role": {
		zh: "图像算法工程师",
		en: "Image Algorithm Engineer",
	},
	"home.focusLabel": { zh: "方向", en: "FOCUS" },
	"home.focus": {
		zh: "工业视觉 · 三维测量",
		en: "Industrial Vision · 3D Measurement",
	},
	"home.nowLabel": { zh: "近况", en: "NOW" },

	// About - view switcher
	"about.view.work": { zh: "工作", en: "Work" },
	"about.view.personal": { zh: "生活", en: "Personal" },
	"about.title": { zh: "关于", en: "About" },

	// About - personal
	"about.personal.index": { zh: "生活索引", en: "Life index" },
	"about.personal.tab.beliefs": { zh: "相信", en: "Beliefs" },
	"about.personal.tab.recent": { zh: "近来", en: "Lately" },
	"about.personal.tab.entertainment": { zh: "娱乐", en: "Leisure" },
	"about.personal.entertainment.index": {
		zh: "娱乐索引",
		en: "Leisure index",
	},
	"about.personal.tab.playing": { zh: "在玩", en: "Playing" },
	"about.personal.tab.watching": { zh: "在看", en: "Watching" },
	"about.personal.tab.listening": { zh: "在听", en: "Listening" },
	"about.personal.back": { zh: "返回", en: "Back" },
	"about.personal.recent.label": { zh: "近来记录", en: "Recent notes" },
	"about.personal.recent.wish": {
		zh: "已经到了该认真看待这些愿望的年纪。",
		en: "I have reached the age when these wishes deserve to be taken seriously.",
	},
	"about.personal.recent.cat": { zh: "爱猫", en: "Beloved cat" },
	"about.personal.recent.cat.alt": {
		zh: "一只灰猫端坐着望向镜头，画面底部露出红色椅背",
		en: "A grey cat sits facing the camera, with the top of a red chair visible below.",
	},
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
	"about.personal.inspiration.caption": {
		zh: "为人民服务",
		en: "为人民服务",
	},
	"about.favorites.series": { zh: "剧集", en: "Series" },
	"about.favorites.music": { zh: "音乐", en: "Music" },
	"about.favorites.series.modernFamily": {
		zh: "剧集《Modern Family》海报",
		en: "Poster for Modern Family",
	},
	"about.favorites.series.modernFamily.title": {
		zh: "Modern Family",
		en: "Modern Family",
	},
	"about.favorites.song.homeToMama": {
		zh: "Justin Bieber 与 Cody Simpson《Home to Mama》歌曲封面",
		en: "Cover for Home to Mama by Justin Bieber and Cody Simpson",
	},
	"about.favorites.song.homeToMama.title": {
		zh: "Home to Mama",
		en: "Home to Mama",
	},
	"about.favorites.song.homeToMama.artist": {
		zh: "Justin Bieber · Cody Simpson",
		en: "Justin Bieber · Cody Simpson",
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
	"about.work.kicker": {
		zh: "3D 视觉研发",
		en: "3D Vision R&D",
	},
	"about.work.positioning": {
		zh: "从数学推导、算法实现到实机验证与产品集成，专注于将三维视觉方法转化为稳定、可落地的工程系统。",
		en: "Working from mathematical derivation and algorithm implementation through machine validation and product integration, focused on turning 3D vision methods into stable, production-ready engineering systems.",
	},
	"about.work.quickView": { zh: "履历索引", en: "Profile sections" },
	"about.work.scopeNote": {
		zh: "部分项目受保密约束，页面仅描述本人职责与可公开的技术范围。",
		en: "Some projects are confidential; this page only describes my responsibilities and publicly shareable technical scope.",
	},

	"about.exp": { zh: "工程经历", en: "Experience" },
	"about.exp.role": { zh: "图像算法工程师", en: "Image Algorithm Engineer" },
	"about.exp.company": {
		zh: "VCTA",
		en: "VCTA",
	},
	"about.exp.period": { zh: "2025 — 至今", en: "2025 — Present" },
	"about.exp.d0": {
		zh: "主导工业 AOI 宽量程三维测量方案升级，针对工作范围扩展后的精度与稳定性问题，完成技术方案、标定链路、C++/CUDA 重建、实机验证与产品集成。",
		en: "Led an industrial AOI wide-range 3D measurement upgrade focused on accuracy and stability after extending the working range, spanning technical design, calibration, C++/CUDA reconstruction, machine validation, and product integration.",
	},
	"about.skills": { zh: "技术能力", en: "Technical Skills" },
	"about.skills.lang": { zh: "核心语言", en: "Core Language" },
	"about.skills.libs": { zh: "工程工具", en: "Engineering Stack" },
	"about.skills.domains": { zh: "专业方向", en: "Domains" },
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
		zh: "技术交流、合作想法，或只是简单打个招呼，都欢迎来信。",
		en: "Technical conversations, collaboration ideas, or simply saying hello are all welcome.",
	},
	"contact.email": { zh: "邮箱", en: "Email" },
	"contact.github": { zh: "GitHub", en: "GitHub" },

	// Footer
	"footer.contact": { zh: "联系", en: "Contact" },

	// Language toggle
	"lang.zh": { zh: "中文", en: "中文" },
	"lang.en": { zh: "英文", en: "English" },
};
