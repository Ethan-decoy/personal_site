const themes = {
	ocean: {
		light: {
			name: "日光工程手稿",
			bg: "#E5EEF5",
			bgDeep: "#D9E4EC",
			bgCard: "#E0E9F0",
			text: "#172436",
			textSec: "#546577",
			accent: "#2F5D7C",
			accentHover: "#244A65",
			accentLight: "rgba(47, 93, 124, 0.09)",
			border: "rgba(23, 36, 54, 0.12)",
			borderLight: "rgba(23, 36, 54, 0.06)",
		},
		dark: {
			name: "石墨深海",
			bg: "#111820",
			bgDeep: "#18222C",
			bgCard: "#151E27",
			text: "#D8DEE5",
			textSec: "#ADB9C4",
			accent: "#8CBBD2",
			accentHover: "#A4CADB",
			accentLight: "rgba(140, 187, 210, 0.10)",
			border: "rgba(216, 222, 229, 0.12)",
			borderLight: "rgba(216, 222, 229, 0.06)",
		},
	},
	contact: {
		light: {
			name: "雾墨落款",
			bg: "#F2F0EA",
			bgDeep: "#E9E6DE",
			bgCard: "#ECE9E2",
			text: "#1B1D1B",
			textSec: "#696B66",
			accent: "#304039",
			accentHover: "#22312B",
			accentLight: "rgba(48, 64, 57, 0.08)",
			border: "rgba(27, 29, 27, 0.13)",
			borderLight: "rgba(27, 29, 27, 0.07)",
		},
		dark: {
			name: "夜墨落款",
			bg: "#111311",
			bgDeep: "#181B18",
			bgCard: "#171917",
			text: "#E7E5DF",
			textSec: "#999B96",
			accent: "#C3CDC7",
			accentHover: "#DCE3DF",
			accentLight: "rgba(195, 205, 199, 0.09)",
			border: "rgba(231, 229, 223, 0.12)",
			borderLight: "rgba(231, 229, 223, 0.06)",
		},
	},
	sage: {
		light: {
			name: "青瓷米白",
			bg: "#F7F4EC",
			bgDeep: "#E8EFEA",
			bgCard: "#F0F5F1",
			text: "#182820",
			textSec: "#53685F",
			accent: "#3F7465",
			accentHover: "#315C50",
			accentLight: "rgba(63, 116, 101, 0.10)",
			border: "rgba(24, 40, 32, 0.12)",
			borderLight: "rgba(24, 40, 32, 0.07)",
		},
		dark: {
			name: "青瓷暗色",
			bg: "#111815",
			bgDeep: "#19231F",
			bgCard: "#15201C",
			text: "#E2E9E4",
			textSec: "#91A49A",
			accent: "#7FB69F",
			accentHover: "#9CC9B7",
			accentLight: "rgba(127, 182, 159, 0.11)",
			border: "rgba(226, 233, 228, 0.10)",
			borderLight: "rgba(226, 233, 228, 0.05)",
		},
	},
	github: {
		light: {
			name: "GitHub Light",
			bg: "#FFFFFF",
			bgDeep: "#F6F8FA",
			bgCard: "#FFFFFF",
			text: "#24292F",
			textSec: "#57606A",
			accent: "#24292F",
			accentHover: "#000000",
			accentLight: "rgba(36, 41, 47, 0.06)",
			border: "rgba(31, 35, 40, 0.15)",
			borderLight: "rgba(31, 35, 40, 0.10)",
		},
		dark: {
			name: "GitHub Dark",
			bg: "#0D1117",
			bgDeep: "#161B22",
			bgCard: "#161B22",
			text: "#F0F6FC",
			textSec: "#8B949E",
			accent: "#F0F6FC",
			accentHover: "#FFFFFF",
			accentLight: "rgba(240, 246, 252, 0.08)",
			border: "rgba(240, 246, 252, 0.14)",
			borderLight: "rgba(240, 246, 252, 0.10)",
		},
	},
};

export type ThemeMode = "light" | "dark";
export type ThemeKey = keyof typeof themes;
export type Section = "home" | "about" | "projects" | "notes" | "contact";
export type Theme = (typeof themes)[ThemeKey]["light"];

export function getTheme(key: ThemeKey, mode: ThemeMode = "light"): Theme {
	return themes[key][mode];
}

const aboutPersonalTheme: Record<ThemeMode, Theme> = {
	light: {
		name: "暖灰生活纸",
		bg: "#F7F1E8",
		bgDeep: "#EEE4D8",
		bgCard: "#F3EBE1",
		text: "#2A2521",
		textSec: "#6D625A",
		accent: "#915444",
		accentHover: "#774033",
		accentLight: "rgba(145, 84, 68, 0.10)",
		border: "rgba(42, 37, 33, 0.13)",
		borderLight: "rgba(42, 37, 33, 0.07)",
	},
	dark: {
		name: "暮色生活页",
		bg: "#171412",
		bgDeep: "#211B18",
		bgCard: "#1D1916",
		text: "#ECE3D8",
		textSec: "#A99A8E",
		accent: "#D08A72",
		accentHover: "#E0A18D",
		accentLight: "rgba(208, 138, 114, 0.12)",
		border: "rgba(236, 227, 216, 0.12)",
		borderLight: "rgba(236, 227, 216, 0.06)",
	},
};

const aboutWorkTheme: Record<ThemeMode, Theme> = {
	light: {
		name: "冷灰工作纸",
		bg: "#F4F6F7",
		bgDeep: "#E9EEF1",
		bgCard: "#F1F4F5",
		text: "#18232B",
		textSec: "#586873",
		accent: "#345E72",
		accentHover: "#274B5D",
		accentLight: "rgba(52, 94, 114, 0.09)",
		border: "rgba(24, 35, 43, 0.13)",
		borderLight: "rgba(24, 35, 43, 0.07)",
	},
	dark: {
		name: "冷钢石墨",
		bg: "#15191B",
		bgDeep: "#20262A",
		bgCard: "#1A1F22",
		text: "#E7EAEB",
		textSec: "#9AA5AA",
		accent: "#8EA8B3",
		accentHover: "#ADC0C7",
		accentLight: "rgba(142, 168, 179, 0.12)",
		border: "rgba(231, 234, 235, 0.14)",
		borderLight: "rgba(231, 234, 235, 0.07)",
	},
};

export function getAboutTheme(
	view: "personal" | "work",
	mode: ThemeMode = "light",
): Theme {
	if (view === "work") return aboutWorkTheme[mode];
	return aboutPersonalTheme[mode];
}
